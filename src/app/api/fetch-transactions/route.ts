import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { NextResponse } from "next/server";

const config = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(config);

interface CsvData {
  date: string;
  version: string;
  transactionHash: string;
  amount: string;
  from: string;
  to: string;
}

function parseTransactionData(
  transactions: any[],
  sourceAccount: string
): { inbound: CsvData[]; outbound: CsvData[] } {
  const inbound: CsvData[] = [];
  const outbound: CsvData[] = [];

  for (const tx of transactions) {
    const date = new Date(parseInt((tx as any).timestamp) / 1000).toISOString();
    let amount = "0";
    const from = tx.sender || "";
    let to = "";

    // Simplified logic to find amount and recipient
    if (tx.events && Array.isArray(tx.events)) {
      for (const event of tx.events) {
        if (event.data?.amount) amount = event.data.amount;
        if (event.data?.store) to = event.data.store;
      }
    }
    if (!to && tx.payload?.arguments?.[1]) {
      const recipientArg = tx.payload.arguments[1];
      if (typeof recipientArg === "string" && recipientArg.startsWith("0x")) {
        to = recipientArg;
      }
    }

    const transactionData: CsvData = {
      date,
      version: tx.version || "",
      transactionHash: tx.hash || "",
      amount,
      from,
      to,
    };

    if (from.toLowerCase() !== sourceAccount.toLowerCase()) {
      transactionData.to = sourceAccount;
      inbound.push(transactionData);
    } else {
      outbound.push(transactionData);
    }
  }

  return { inbound, outbound };
}

export async function POST(request: Request) {
  try {
    const { walletAddress, startDate, endDate } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    let allTransactions: any[] = [];
    let offset = 0;
    const batchSize = 100;
    const LOOKAHEAD_LIMIT = 3;
    let consecutiveOldBatches = 0;

    while (true) {
      console.log(
        `Fetching batch of ${batchSize} transactions at offset ${offset}...`
      );

      const transactions = await aptos.getAccountTransactions({
        accountAddress: walletAddress,
        options: {
          limit: batchSize,
          offset: offset,
        },
      });

      console.log(`Received ${transactions.length} transactions from API`);

      if (transactions.length === 0) {
        console.log("No more transactions found. Stopping.");
        break; // Exit loop if API returns no more transactions
      }

      allTransactions = allTransactions.concat(transactions);
      offset += transactions.length;

      // If we got fewer transactions than the batch size, we are at the end
      if (transactions.length < batchSize) {
        console.log("Reached the last of the account's transactions.");
        break;
      }

      // Robust date checking with lookahead
      const newestTxDate = new Date(
        parseInt((transactions[0] as any).timestamp) / 1000
      );
      const oldestTxDate = new Date(
        parseInt((transactions[transactions.length - 1] as any).timestamp) /
          1000
      );
      console.log(
        `Batch date range: ${oldestTxDate.toISOString()} to ${newestTxDate.toISOString()}, Start date: ${new Date(
          startDate
        ).toISOString()}`
      );

      if (newestTxDate < new Date(startDate)) {
        consecutiveOldBatches++;
        console.log(
          `Batch ${consecutiveOldBatches}/${LOOKAHEAD_LIMIT} is older than start date`
        );

        if (consecutiveOldBatches >= LOOKAHEAD_LIMIT) {
          console.log(
            "Reached transactions older than start date after lookahead. Stopping."
          );
          break;
        }
      } else {
        consecutiveOldBatches = 0; // Reset counter if we find newer transactions
      }
    }

    console.log(`Fetched ${allTransactions.length} raw transactions in total.`);

    const dateFilteredTransactions = allTransactions.filter((tx) => {
      const txDate = new Date(parseInt((tx as any).timestamp) / 1000);
      return txDate >= new Date(startDate) && txDate <= new Date(endDate);
    });

    console.log(
      `After date filtering: ${dateFilteredTransactions.length} transactions`
    );

    const { inbound, outbound } = parseTransactionData(
      dateFilteredTransactions,
      walletAddress
    );

    console.log(
      `Parsed ${inbound.length} INBOUND and ${outbound.length} OUTBOUND transactions.`
    );

    return NextResponse.json({ inbound, outbound });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
