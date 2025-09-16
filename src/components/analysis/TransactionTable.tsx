"use client";

interface CsvData {
  date: string;
  version: string;
  transactionHash: string;
  amount: string;
  from: string;
  to: string;
}

function formatAmount(amountStr: string, decimals: number = 6): string {
  const amount = parseInt(amountStr, 10);
  if (isNaN(amount)) {
    return "0.00";
  }
  const formattedAmount = (amount / Math.pow(10, decimals)).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
  return formattedAmount;
}

interface TransactionTableProps {
  title: string;
  transactions: CsvData[];
  onDownload: () => void;
}

export function TransactionTable({
  title,
  transactions,
  onDownload,
}: TransactionTableProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-md font-semibold">
          {title} ({transactions.length})
        </h4>
        <button
          onClick={onDownload}
          disabled={transactions.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded-lg text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto max-h-60 border rounded-lg">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Date
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                From
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                To
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Amount
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">
                Tx Hash
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td
                    className="px-4 py-2 whitespace-nowrap font-mono text-xs"
                    title={tx.from}
                  >
                    {tx.from.slice(0, 8)}...
                  </td>
                  <td
                    className="px-4 py-2 whitespace-nowrap font-mono text-xs"
                    title={tx.to}
                  >
                    {tx.to.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {formatAmount(tx.amount)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">
                    <a
                      href={`https://explorer.aptoslabs.com/txn/${tx.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {tx.transactionHash.slice(0, 8)}...
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No transactions found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
