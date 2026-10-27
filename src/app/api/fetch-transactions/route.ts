
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDEXER_URL =
  process.env.APTOS_INDEXER_URL ??
  "https://api.mainnet.aptoslabs.com/v1/graphql";

const FULLNODE_URL =
  process.env.APTOS_FULLNODE_URL ??
  "https://api.mainnet.aptoslabs.com/v1";

const ARCHIVE_URL =
  process.env.APTOS_ARCHIVE_URL ??
  "https://archive.mainnet.aptoslabs.com/v1";

const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const HASH_BATCH_SIZE = 3;
const HASH_RETRIES = 3;
const HASH_BATCH_PAUSE_MS = 500;

interface FungibleAssetActivity {
  transaction_version: string | number;
  event_index?: number;
  owner_address: string;
  asset_type: string;
  amount: string | number;
  type: string;
  transaction_timestamp: string;
  storage_id?: string;
  entry_function_id_str?: string | null;
  is_gas_fee?: boolean;
}

interface ActivityPage {
  fungible_asset_activities: FungibleAssetActivity[];
}

interface ActivityRow {
  transactionVersion: string;
  transactionHash: string;
  timestamp: string;
  direction: "inbound" | "outbound";
  walletAddress: string;
  counterparty: string;
  assetType: string;
  amount: string;
  activityType: string;
  entryFunction: string | null;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const WALLET_ACTIVITIES_QUERY = `
  query WalletActivities(
    $owner: String!
    $limit: Int!
    $offset: Int!
  ) {
    fungible_asset_activities(
      where: { owner_address: { _eq: $owner } }
      order_by: [
        { transaction_version: desc }
        { event_index: desc }
      ]
      limit: $limit
      offset: $offset
    ) {
      transaction_version
      event_index
      owner_address
      asset_type
      amount
      type
      transaction_timestamp
      storage_id
      entry_function_id_str
      is_gas_fee
    }
  }
`;

const ACTIVITIES_BY_VERSION_QUERY = `
  query ActivitiesByVersion($versions: [bigint!]!) {
    fungible_asset_activities(
      where: { transaction_version: { _in: $versions } }
      order_by: [
        { transaction_version: desc }
        { event_index: asc }
      ]
    ) {
      transaction_version
      event_index
      owner_address
      asset_type
      amount
      type
      transaction_timestamp
      storage_id
      entry_function_id_str
      is_gas_fee
    }
  }
`;

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(INDEXER_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok) {
    throw new Error(
      `Aptos Indexer HTTP ${response.status}: ${JSON.stringify(body)}`,
    );
  }

  if (body.errors?.length) {
    throw new Error(
      `Aptos Indexer GraphQL error: ${body.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }

  if (!body.data) {
    throw new Error("Aptos Indexer returned no data.");
  }

  return body.data;
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

function normalizeVersion(version: string | number): string {
  return String(version);
}

/**
 * Keep amounts as strings. Converting large on-chain integer amounts to
 * JavaScript numbers can lose precision.
 */
export function normalizeAmount(amount: string | number): string {
  const value = String(amount).trim().replace(/,/g, "");

  if (!/^-?\d+$/.test(value)) {
    throw new Error(`Invalid raw token amount returned by Indexer: ${value}`);
  }

  return value;
}

function isWithdraw(activity: FungibleAssetActivity): boolean {
  return activity.type.toLowerCase().includes("withdraw");
}

function isDeposit(activity: FungibleAssetActivity): boolean {
  return activity.type.toLowerCase().includes("deposit");
}

async function fetchWalletActivities(
  walletAddress: string,
): Promise<FungibleAssetActivity[]> {
  const activities: FungibleAssetActivity[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await graphqlRequest<ActivityPage>(
      WALLET_ACTIVITIES_QUERY,
      {
        owner: walletAddress,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      },
    );

    const rows = data.fungible_asset_activities ?? [];
    activities.push(...rows);

    if (rows.length < PAGE_SIZE) {
      return activities;
    }
  }

  throw new Error(
    `Reached the pagination limit of ${MAX_PAGES} pages. Narrow the date range or increase MAX_PAGES.`,
  );
}

async function fetchActivitiesForVersions(
  versions: string[],
): Promise<FungibleAssetActivity[]> {
  if (versions.length === 0) {
    return [];
  }

  const data = await graphqlRequest<ActivityPage>(
    ACTIVITIES_BY_VERSION_QUERY,
    { versions },
  );

  return data.fungible_asset_activities ?? [];
}
const APTOS_KEY = process.env.APTOS_KEY ?? ""

async function fetchHashFromEndpoint(
  endpoint: string,
  version: string,
): Promise<string> {
  const response = await fetch(
    `${endpoint}/transactions/by_version/${encodeURIComponent(version)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: APTOS_KEY? { Accept: "application/json", Authorization: `Bearer ${APTOS_KEY}` } :{ Accept: "application/json" },
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`HTTP ${response.status}: ${details}`);
  }

  const transaction = (await response.json()) as {
    version?: string;
    hash?: unknown;
  };

  if (typeof transaction.hash !== "string" || !transaction.hash) {
    throw new Error(
      `No transaction hash returned for version ${version}.`,
    );
  }

  return transaction.hash;
}

async function fetchTransactionHash(version: string): Promise<string> {
  try {
    return await fetchHashFromEndpoint(FULLNODE_URL, version);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    // Older transactions may no longer be available on the standard fullnode.
    if (
      message.includes("HTTP 410") ||
      message.includes("version_pruned")
    ) {
      return fetchHashFromEndpoint(ARCHIVE_URL, version);
    }

    throw error;
  }
}

async function fetchTransactionHashes(
  versions: string[],
): Promise<Map<string, string>> {
  const hashes = new Map<string, string>();
  const failures: Array<{ version: string; error: string }> = [];

  const uniqueVersions = [...new Set(versions)];

  for (
    let i = 0;
    i < uniqueVersions.length;
    i += HASH_BATCH_SIZE
  ) {
    const batch = uniqueVersions.slice(i, i + HASH_BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (version) => {
        let lastError: unknown;

        for (let attempt = 1; attempt <= HASH_RETRIES; attempt++) {
          try {
            const hash = await fetchTransactionHash(version);
            return { version, hash };
          } catch (error) {
            lastError = error;

            // Back off before retrying
            if (attempt < HASH_RETRIES) {
              await new Promise((resolve) =>
                setTimeout(resolve, 300 * attempt),
              );
            }
          }
        }

        throw lastError instanceof Error
          ? lastError
          : new Error(String(lastError));
      }),
    );

    results.forEach((result, index) => {
      const version = batch[index];

      if (result.status === "fulfilled") {
        hashes.set(result.value.version, result.value.hash);
      } else {
        const message =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);

        failures.push({ version, error: message });

        console.error(
          `Hash lookup failed for version ${version}:`,
          message,
        );
      }
    });

    // Pause between batches to respect rate limits
    if (i + HASH_BATCH_SIZE < uniqueVersions.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, HASH_BATCH_PAUSE_MS),
      );
    }
  }

  // If some hashes could not be retrieved, we log the failures but continue.
  if (failures.length > 0) {
    console.error(
      `Unable to retrieve ${failures.length} transaction hash(es): ` +
        failures
          .map(({ version, error }) => `${version}: ${error}`)
          .join(" | "),
    );
  }

  return hashes;
}

function pairActivities(
  walletAddress: string,
  walletActivities: FungibleAssetActivity[],
  allActivities: FungibleAssetActivity[],
  transactionHashes: Map<string, string>,
): ActivityRow[] {
  const normalizedWallet = normalizeAddress(walletAddress);

  const allByVersion = new Map<string, FungibleAssetActivity[]>();

  for (const activity of allActivities) {
    const version = normalizeVersion(activity.transaction_version);
    const group = allByVersion.get(version) ?? [];
    group.push(activity);
    allByVersion.set(version, group);
  }

  return walletActivities.map((own) => {
    const version = normalizeVersion(own.transaction_version);
    const ownAmount = normalizeAmount(own.amount);
    const ownAsset = own.asset_type;
    const ownIsWithdraw = isWithdraw(own);
    const ownIsDeposit = isDeposit(own);

    const sameTransaction = allByVersion.get(version) ?? [];

    const candidates = sameTransaction.filter((candidate) => {
      if (
        normalizeAddress(candidate.owner_address) === normalizedWallet
      ) {
        return false;
      }

      if (candidate.asset_type !== ownAsset) {
        return false;
      }

      if (normalizeAmount(candidate.amount) !== ownAmount) {
        return false;
      }

      // Match a withdrawal to a deposit, or a deposit to a withdrawal.
      if (ownIsWithdraw && isDeposit(candidate)) {
        return true;
      }

      if (ownIsDeposit && isWithdraw(candidate)) {
        return true;
      }

      return false;
    });

    const counterparty = candidates[0]?.owner_address ?? "";

    const direction: "inbound" | "outbound" = ownIsDeposit
      ? "inbound"
      : "outbound";

    return {
      transactionVersion: version,
      transactionHash: transactionHashes.get(version) ?? "",
      timestamp: own.transaction_timestamp,
      direction,
      walletAddress: own.owner_address,
      counterparty,
      assetType: own.asset_type,
      amount: normalizeAmount(ownAmount),
      activityType: own.type,
      entryFunction: own.entry_function_id_str ?? null,
    };
  });
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  // Try standard ISO format first
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) {
    return iso;
  }

  // Try common DD/MM/YYYY (or D/M/YYYY) format
  const parts = value.trim().split(/[/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      const d = new Date(year, month - 1, day);
      if (!Number.isNaN(d.getTime())) {
        return d;
      }
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      walletAddress?: unknown;
      startDate?: unknown;
      endDate?: unknown;
      tokenAddress?: unknown;
    };

    const walletAddress =
      typeof body.walletAddress === "string"
        ? body.walletAddress.trim()
        : "";

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required." },
        { status: 400 },
      );
    }

    const startDate = parseDate(body.startDate);
    const endDate = parseDate(body.endDate);

    if (body.startDate && !startDate) {
      return NextResponse.json(
        { error: "startDate is invalid." },
        { status: 400 },
      );
    }

    if (body.endDate && !endDate) {
      return NextResponse.json(
        { error: "endDate is invalid." },
        { status: 400 },
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "startDate must be earlier than or equal to endDate." },
        { status: 400 },
      );
    }

    const tokenAddress =
      typeof body.tokenAddress === "string"
        ? body.tokenAddress.trim().toLowerCase()
        : "";

    // If no dates are supplied, default to the last 60 days.
    const effectiveEndDate = endDate ?? new Date();
    const effectiveStartDate =
      startDate ??
      new Date(
        effectiveEndDate.getTime() - 60 * 24 * 60 * 60 * 1000,
      );

    // Fetch activities, then narrow them to the requested period.
    const fetchedActivities = await fetchWalletActivities(walletAddress);

    const dateFilteredActivities = fetchedActivities.filter((activity) => {
      const timestamp = new Date(activity.transaction_timestamp).getTime();

      return (
        Number.isFinite(timestamp) &&
        timestamp >= effectiveStartDate.getTime() &&
        timestamp <= effectiveEndDate.getTime()
      );
    });

    const filteredActivities = tokenAddress
      ? dateFilteredActivities.filter(
          (activity) =>
            activity.asset_type.toLowerCase() === tokenAddress,
        )
      : dateFilteredActivities;

    const versions = [
      ...new Set(
        filteredActivities.map((activity) =>
          normalizeVersion(activity.transaction_version),
        ),
      ),
    ];

    // Fetch all activities for those versions to identify counterparties.
    const allActivities = await fetchActivitiesForVersions(versions);

    // A hash is required for every returned transaction version.
    const transactionHashes = await fetchTransactionHashes(versions);

    const rows = pairActivities(
      walletAddress,
      filteredActivities,
      allActivities,
      transactionHashes,
    );

    // Transform ActivityRow[] into the CsvData format the frontend expects.
    // The frontend destructures { inbound, outbound } where each entry has:
    // { date, version, transactionHash, amount, from, to }
    const toCsvData = (row: ActivityRow) => ({
      date: row.timestamp,
      version: row.transactionVersion,
      transactionHash: row.transactionHash,
      amount: normalizeAmount(row.amount),
      from: row.direction === "outbound" ? row.walletAddress : row.counterparty,
      to: row.direction === "outbound" ? row.counterparty : row.walletAddress,
    });

    const inbound = rows
      .filter((r) => r.direction === "inbound")
      .map(toCsvData);

    const outbound = rows
      .filter((r) => r.direction === "outbound")
      .map(toCsvData);

    return NextResponse.json({
      success: true,
      walletAddress,
      filters: {
        startDate: effectiveStartDate.toISOString(),
        endDate: effectiveEndDate.toISOString(),
        tokenAddress: tokenAddress || null,
      },
      count: rows.length,
      inboundCount: inbound.length,
      outboundCount: outbound.length,
      inbound,
      outbound,
      debug: {
        fetchedActivities: fetchedActivities.length,
        dateFilteredActivities: dateFilteredActivities.length,
        filteredActivities: filteredActivities.length,
        transactionVersions: versions.length,
        activitiesForVersions: allActivities.length,
        transactionHashesRetrieved: transactionHashes.size,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("Aptos activity export failed:", message);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
