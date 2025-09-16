"use client";

import { useState } from "react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { TransactionTable } from "./TransactionTable";

const KNOWN_TOKENS = {
  USDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
  "Show All Other Tokens": "debug",
};

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

interface CsvDataAll extends CsvData {
  type: "inbound" | "outbound";
}

function downloadCsv(data: CsvData[], filename: string) {
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
      formatAmount(row.amount),
      row.from,
      row.to,
    ];
    csvContent += csvRow.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function downloadAllCsv(data: CsvDataAll[], filename: string) {
  const headers = [
    "date",
    "version",
    "transactionHash",
    "amount",
    "from",
    "to",
    "type",
  ];
  let csvContent = headers.join(",") + "\n";

  data.forEach((row) => {
    const csvRow = [
      row.date,
      row.version,
      row.transactionHash,
      formatAmount(row.amount),
      row.from,
      row.to,
      row.type,
    ];
    csvContent += csvRow.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function TransactionExporter({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: thirtyDaysAgo,
      endDate: now,
    };
  });
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inboundTxs, setInboundTxs] = useState<CsvData[]>([]);
  const [outboundTxs, setOutboundTxs] = useState<CsvData[]>([]);
  const [fetchCompleted, setFetchCompleted] = useState(false);
  const [selectedToken, setSelectedToken] = useState(KNOWN_TOKENS.USDT);
  const [filter, setFilter] = useState<"all" | "inbound" | "outbound">("all");

  const handleDateChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  const handleFetch = async () => {
    setIsFetching(true);
    setError(null);
    setInboundTxs([]);
    setOutboundTxs([]);
    setFetchCompleted(false);

    try {
      const response = await fetch("/api/fetch-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }

      const { inbound, outbound } = await response.json();
      setInboundTxs(inbound);
      setOutboundTxs(outbound);
    } catch (error: unknown) {
      console.error("Failed to fetch and export transactions:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsFetching(false);
      setFetchCompleted(true);
    }
  };

  const handleDownloadAll = () => {
    const allTxs = [
      ...inboundTxs.map((tx) => ({ ...tx, type: "inbound" as const })),
      ...outboundTxs.map((tx) => ({ ...tx, type: "outbound" as const })),
    ];
    downloadAllCsv(allTxs, `all-transactions-${walletAddress.slice(0, 8)}.csv`);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">
          Transaction Analysis
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Select token type and date range to fetch transaction history
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="space-y-8">
          {/* Token Selection Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Select Token Type
            </label>
            <div className="flex flex-wrap gap-3">
              {Object.entries(KNOWN_TOKENS).map(([name, assetType]) => (
                <div key={assetType}>
                  <input
                    type="radio"
                    id={assetType}
                    name="token-select"
                    value={assetType}
                    checked={selectedToken === assetType}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={assetType}
                    className={`cursor-pointer inline-block px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 ${
                      selectedToken === assetType
                        ? "bg-blue-600 text-white shadow-lg transform scale-105"
                        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-300"
                    }`}
                  >
                    {name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range Section */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Select Date Range
            </h4>
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>

          {/* Action Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 text-center">
            <button
              onClick={handleFetch}
              disabled={isFetching || !walletAddress}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:scale-100"
            >
              {isFetching ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Fetching Transactions...
                </div>
              ) : (
                "Fetch Transactions"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-6 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error occurred
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {fetchCompleted && !isFetching && !error && (
        <div className="mx-6 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Scan Complete
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Found {inboundTxs.length + outboundTxs.length} transactions (
                  {inboundTxs.length} inbound, {outboundTxs.length} outbound)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {fetchCompleted && !error && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            {/* Filter Controls */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 mb-6">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Transaction Results
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filter === "all"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-300"
                    }`}
                  >
                    All ({inboundTxs.length + outboundTxs.length})
                  </button>
                  <button
                    onClick={() => setFilter("inbound")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filter === "inbound"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-green-50 border border-gray-300"
                    }`}
                  >
                    Inbound ({inboundTxs.length})
                  </button>
                  <button
                    onClick={() => setFilter("outbound")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filter === "outbound"
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-red-50 border border-gray-300"
                    }`}
                  >
                    Outbound ({outboundTxs.length})
                  </button>
                </div>
              </div>

              {(inboundTxs.length > 0 || outboundTxs.length > 0) && (
                <div className="flex justify-end lg:justify-start">
                  <button
                    onClick={handleDownloadAll}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download All
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Transaction Tables */}
            <div className="space-y-6">
              {(filter === "all" || filter === "inbound") && (
                <TransactionTable
                  title="Inbound Transactions"
                  transactions={inboundTxs}
                  onDownload={() =>
                    downloadCsv(
                      inboundTxs,
                      `inbound-transactions-${walletAddress.slice(0, 8)}.csv`
                    )
                  }
                />
              )}
              {(filter === "all" || filter === "outbound") && (
                <TransactionTable
                  title="Outbound Transactions"
                  transactions={outboundTxs}
                  onDownload={() =>
                    downloadCsv(
                      outboundTxs,
                      `outbound-transactions-${walletAddress.slice(0, 8)}.csv`
                    )
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
