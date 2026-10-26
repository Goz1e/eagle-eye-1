
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDEXER_URL =
  process.env.APTOS_INDEXER_URL ??
  "https://api.mainnet.aptoslabs.com/v1/graphql";

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

interface GraphQLError {
  message: string;
}

interface FungibleActivity {
  amount: string | number | null;
  asset_type: string;
  event_index: string | number;
  owner_address: string;
  transaction_version: string | number;
  transaction_timestamp: string;
  type: string;
  is_transaction_success: boolean | null;
  entry_function_id_str: string | null;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

interface CsvData {
  date: string;
  version: string;
  transactionHash: string;
  amount: string;
  from: string;
  to: string;
  tokenAddress: string;
  eventType: string;
}

interface ActivityPage {
  fungible_asset_activities: FungibleActivity[];
}

interface VersionPage {
  fungible_asset_activities: FungibleActivity[];
}

function normalizeAddress(address: string): string {
  const hex = address.replace(/^0x/i, "").toLowerCase();
  return `0x${hex.replace(/^0+/, "") || "0"}`;
}

function isValidAddress(address: unknown): address is string {
  return (
    typeof address === "string" &&
    /^0x[0-9a-fA-F]{1,64}$/.test(address)
  );
}

async function queryIndexer<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const response = await fetch(INDEXER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Aptos Indexer HTTP ${response.status}: ${await response.text()}`
    );
  }

  const result =
    (await response.json()) as GraphQLResponse<T>;

  if (result.errors?.length) {
    throw new Error(
      result.errors.map((error) => error.message).join("; ")
    );
  }

  if (!result.data) {
    throw new Error("Aptos Indexer returned no data");
  }

  return result.data;
}

const ACCOUNT_ACTIVITIES_QUERY = `
  query AccountActivities(
    $address: String!
    $limit: Int!
    $offset: Int!
  ) {
    fungible_asset_activities(
      where: {
        owner_address: { _eq: $address }
      }
      order_by: [
        { transaction_version: desc }
        { event_index: desc }
      ]
      limit: $limit
      offset: $offset
    ) {
      amount
      asset_type
      event_index
      owner_address
      transaction_version
      transaction_timestamp
      type
      is_transaction_success
      entry_function_id_str
    }
  }
`;

const VERSION_ACTIVITIES_QUERY = `
  query VersionActivities($versions: [bigint!]!) {
    fungible_asset_activities(
      where: {
        transaction_version: { _in: $versions }
      }
      order_by: [
        { transaction_version: desc }
        { event_index: asc }
      ]
    ) {
      amount
      asset_type
      event_index
      owner_address
      transaction_version
      transaction_timestamp
      type
      is_transaction_success
      entry_function_id_str
    }
  }
`;

function eventDirection(
  type: string
): "deposit" | "withdraw" | null {
  const normalized = type.toLowerCase();

  if (
    normalized.includes("depositevent") ||
    normalized.endsWith("::deposit")
  ) {
    return "deposit";
  }

  if (
    normalized.includes("withdrawevent") ||
    normalized.endsWith("::withdraw")
  ) {
    return "withdraw";
  }

  return null;
}

function matchesToken(
  activity: FungibleActivity,
  tokenAddress?: string
): boolean {
  if (!tokenAddress) return true;

  const filter = tokenAddress.toLowerCase();
  const assetType = activity.asset_type.toLowerCase();

  // Accept an exact asset type or a metadata address.
  // A symbol such as "USDT" is not guaranteed to be an address.
  return (
    assetType === filter ||
    normalizeAddress(assetType) === normalizeAddress(filter)
  );
}

function pairActivities(
  walletAddress: string,
  activities: FungibleActivity[],
  transactionHashes: Map<string, string>,
  tokenAddress?: string
): { inbound: CsvData[]; outbound: CsvData[] } {
  const wallet = normalizeAddress(walletAddress);
  const inbound: CsvData[] = [];
  const outbound: CsvData[] = [];

  const groups = new Map<string, FungibleActivity[]>();

  for (const activity of activities) {
    if (activity.is_transaction_success === false) continue;
    if (activity.amount == null) continue;
    if (!matchesToken(activity, tokenAddress)) continue;

    const direction = eventDirection(activity.type);
    if (!direction) continue;

    const key = [
      String(activity.transaction_version),
      activity.asset_type.toLowerCase(),
      String(activity.amount),
    ].join(":");

    const group = groups.get(key) ?? [];
    group.push(activity);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    const walletActivities = group.filter(
      (activity) =>
        normalizeAddress(activity.owner_address) === wallet
    );

    const otherActivities = group.filter(
      (activity) =>
        normalizeAddress(activity.owner_address) !== wallet
    );

    for (const own of walletActivities) {
      const direction = eventDirection(own.type);
      if (!direction) continue;

      // Match the opposite event to identify the counterparty.
      const opposite = direction === "deposit" ? "withdraw" : "deposit";

      const counterparty = otherActivities.find(
        (candidate) =>
          eventDirection(candidate.type) === opposite
      );

      const isInbound = direction === "deposit";

      // Some transactions do not expose a pairable activity.
      // Preserve the wallet activity rather than inventing an address.
      const row: CsvData = {
        date: new Date(own.transaction_timestamp).toISOString(),
        version: String(own.transaction_version),
        transactionHash:
          transactionHashes.get(String(own.transaction_version)) ?? "",
        amount: String(own.amount),
        from: isInbound
          ? counterparty?.owner_address ?? ""
          : walletAddress,
        to: isInbound
          ? walletAddress
          : counterparty?.owner_address ?? "",
        tokenAddress: own.asset_type,
        eventType: own.type,
      };

      if (isInbound) {
        inbound.push(row);
      } else {
        outbound.push(row);
      }
    }
  }

  return { inbound, outbound };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "A JSON request body is required" },
        { status: 400 }
      );
    }

    const {
      walletAddress,
      startDate,
      endDate,
      tokenAddress,
    } = body as {
      walletAddress?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      tokenAddress?: unknown;
    };

    if (!isValidAddress(walletAddress)) {
      return NextResponse.json(
        { error: "A valid Aptos wallet address is required" },
        { status: 400 }
      );
    }

    if (
      tokenAddress !== undefined &&
      (typeof tokenAddress !== "string" ||
        !isValidAddress(tokenAddress))
    ) {
      return NextResponse.json(
        {
          error:
            "tokenAddress must be an Aptos address. Use the asset metadata address or full coin type.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const start = startDate
      ? new Date(String(startDate))
      : new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const end = endDate
      ? new Date(String(endDate))
      : now;

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return NextResponse.json(
        { error: "Invalid date range" },
        { status: 400 }
      );
    }

    const activities: FungibleActivity[] = [];
    let offset = 0;
    let reachedStart = false;

    // Get the wallet's asset activities, newest first.
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await queryIndexer<ActivityPage>(
        ACCOUNT_ACTIVITIES_QUERY,
        {
          address: walletAddress,
          limit: PAGE_SIZE,
          offset,
        }
      );

      const rows = data.fungible_asset_activities;

      if (rows.length === 0) break;

      for (const row of rows) {
        const timestamp = new Date(row.transaction_timestamp);

        if (Number.isNaN(timestamp.getTime())) continue;

        // Results are newest-first, so older pages can be skipped.
        if (timestamp < start) {
          reachedStart = true;
          continue;
        }

        if (timestamp <= end) {
          activities.push(row);
        }
      }

      offset += rows.length;

      if (rows.length < PAGE_SIZE || reachedStart) break;
    }

    // Fetch all activities for the relevant transaction versions.
    // These allow us to match wallet deposits/withdrawals to
    // counterparties in the same transaction.
    const versions = [
      ...new Set(
        activities.map((activity) =>
          String(activity.transaction_version)
        )
      ),
    ];

    const allActivities: FungibleActivity[] = [];

    for (let i = 0; i < versions.length; i += 50) {
      const versionBatch = versions.slice(i, i + 50);

      const data = await queryIndexer<VersionPage>(
        VERSION_ACTIVITIES_QUERY,
        { versions: versionBatch }
      );

      allActivities.push(...data.fungible_asset_activities);
    }

    // A transaction hash is not stored in fungible_asset_activities.
    // Fetch transaction details through the v4 SDK for the versions.
    // Hash lookup failures do not prevent CSV export.
    const { Aptos, AptosConfig, Network } = await import(
      "@aptos-labs/ts-sdk"
    );

    const aptos = new Aptos(
      new AptosConfig({ network: Network.MAINNET })
    );

    const transactionHashes = new Map<string, string>();

    const uniqueVersions = [
      ...new Set(
        allActivities.map((activity) =>
          String(activity.transaction_version)
        )
      ),
    ];

    // Keep concurrent requests bounded.
    for (let i = 0; i < uniqueVersions.length; i += 10) {
      const versionBatch = uniqueVersions.slice(i, i + 10);

      const results = await Promise.allSettled(
        versionBatch.map(async (version) => {
          const transaction = await aptos.getTransactionByVersion({
            ledgerVersion: version as any,
          });

          return {
            version,
            hash:
              "hash" in transaction &&
              typeof transaction.hash === "string"
                ? transaction.hash
                : "",
          };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.hash) {
          transactionHashes.set(
            result.value.version,
            result.value.hash
          );
        }
      }
    }

    const { inbound, outbound } = pairActivities(
      walletAddress,
      allActivities,
      transactionHashes,
      tokenAddress as string | undefined
    );

    // Apply the date range to paired activities too.
    const inRange = (row: CsvData) => {
      const date = new Date(row.date);
      return date >= start && date <= end;
    };

    const filteredInbound = inbound.filter(inRange);
    const filteredOutbound = outbound.filter(inRange);

    return NextResponse.json({
      inbound: filteredInbound,
      outbound: filteredOutbound,
      debug: {
        network: "mainnet",
        walletAddress,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        walletActivitiesFound: activities.length,
        transactionVersionsFound: versions.length,
        allActivitiesFetched: allActivities.length,
        inboundCount: filteredInbound.length,
        outboundCount: filteredOutbound.length,
        truncated: offset >= PAGE_SIZE * MAX_PAGES,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error";

    console.error("Aptos transaction export failed:", error);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
