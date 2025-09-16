import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import \* as fs from "fs";

const config = new AptosConfig({ network: Network.MAINNET });
const aptos = new Aptos(config);

/\*\*

- The structure for our CSV data.
  \*/
  interface CsvData {
  date: string;
  version: string;
  transactionHash: string;
  amount: string;
  from: string;
  to: string;
  }

/\*\*

- Parses raw Aptos transactions to extract transfer-related information.
- @param transactions An array of transactions from the Aptos SDK.
- @param sourceAccount The account address we are filtering for, to correctly identify "from" and "to".
- @returns A list of parsed transfer data ready for CSV export.
  \*/
  function parseTransactionData(
  transactions: any[],
  sourceAccount: string
  ): { inbound: CsvData[]; outbound: CsvData[] } {
  const inbound: CsvData[] = [];
  const outbound: CsvData[] = [];

for (const tx of transactions) {
const date = new Date(parseInt(tx.timestamp) / 1000).toISOString();
let amount = "0";
let from = tx.sender || "";
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

    // Sort into inbound or outbound
    if (from.toLowerCase() !== sourceAccount.toLowerCase()) {
      transactionData.to = sourceAccount; // Correctly set our account as the recipient
      inbound.push(transactionData);
    } else {
      outbound.push(transactionData);
    }

}

return { inbound, outbound };
}

/\*\*

- Saves the parsed transaction data into a CSV file.
- @param data The array of data to save.
- @param filename The name of the file to save.
  \*/
  function saveToCsv(data: CsvData[], filename: string) {
  const headers = [
  "date",
  "version",
  "transactionHash",
  "amount",
  "from",
  "to",
  ];
  let csvContent = headers.join(",") + "\n";

data.forEach((row) => {
const csvRow = [
row.date,
row.version,
row.transactionHash,
row.amount,
row.from,
row.to,
];
csvContent += csvRow.join(",") + "\n";
});

fs.writeFileSync(filename, csvContent);
console.log(`Successfully saved ${data.length} transactions to ${filename}`);
}

/\*\*

- Main function to fetch, parse, and save transactions.
  \*/
  async function getLatestTransactions() {
  const accountAddress =
  "0x86e2e7e782703e28363181ea2210979785eac8f6eb63252c188d145e34b460d0";
  const targetTransactionCount = 2000;
  const batchSize = 100; // The max limit per API request
  let allTransactions: any[] = [];
  let offset = 0;

try {
console.log(
`Fetching latest ${targetTransactionCount} transactions for account ${accountAddress}...`
);

    while (allTransactions.length < targetTransactionCount) {
      console.log(
        `Fetching batch of ${batchSize} transactions at offset ${offset}...`
      );

      const transactions = await aptos.getAccountTransactions({
        accountAddress,
        options: {
          limit: batchSize,
          offset: offset,
        },
      });

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
    }

    console.log(`Fetched ${allTransactions.length} raw transactions in total.`);

    const { inbound, outbound } = parseTransactionData(
      allTransactions,
      accountAddress
    );

    console.log(
      `Parsed ${inbound.length} INBOUND and ${outbound.length} OUTBOUND transactions.`
    );

    // Save INBOUND transactions
    const inboundFilename = `inbound_${
      inbound.length
    }_transfers_${accountAddress.slice(0, 8)}.csv`;
    saveToCsv(inbound, inboundFilename);

    // Save OUTBOUND transactions
    const outboundFilename = `outbound_${
      outbound.length
    }_transfers_${accountAddress.slice(0, 8)}.csv`;
    saveToCsv(outbound, outboundFilename);

} catch (error) {
console.error("An error occurred:", error);
}
}

getLatestTransactions();
