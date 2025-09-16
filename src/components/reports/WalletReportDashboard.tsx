"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { WalletReportData, AnalysisInsight } from "@/lib/report-processor";
import { formatUSD, truncateAddress, formatToken } from "@/lib/utils";

interface WalletReportDashboardProps {
  reportData: WalletReportData;
  onExport?: (format: "pdf" | "csv" | "json") => void;
  onShare?: () => void;
}

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#059669",
  "#ea580c",
  "#be185d",
];

export function WalletReportDashboard({
  reportData,
  onExport,
  onShare,
}: WalletReportDashboardProps) {
  const [selectedInsight, setSelectedInsight] =
    useState<AnalysisInsight | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "wallets" | "analysis" | "insights"
  >("overview");

  const summaryMetrics = useMemo(
    () => [
      {
        title: "Total Portfolio Value",
        value: reportData.summary.totalPortfolioValue,
        change: "+12.5%",
        trend: "up" as const,
        description: "Across all analyzed wallets",
        icon: "💰",
      },
      {
        title: "Transaction Volume",
        value: reportData.summary.totalTransactionCount,
        change: `${reportData.summary.totalTransactionCount} transactions`,
        period: "Last 30 days",
        description: "Combined activity",
        icon: "📊",
      },
      {
        title: "Gas Efficiency",
        value: reportData.summary.averageGasUsed,
        comparison: "22,000x cheaper than Ethereum",
        savings: reportData.summary.gasSavingsUSD,
        description: "Cost optimization achieved",
        icon: "⚡",
      },
      {
        title: "Active Wallets",
        value: reportData.summary.activeWalletCount,
        total: reportData.summary.totalWallets,
        activity: "Recent activity within 7 days",
        description: "Wallet engagement rate",
        icon: "👥",
      },
    ],
    [reportData.summary]
  );

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return "🚀";
      case "optimization":
        return "⚡";
      case "alert":
        return "⚠️";
      case "trend":
        return "📈";
      default:
        return "💡";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Wallet Analysis Report
                </h1>
                <p className="text-sm text-slate-500">
                  Generated {reportData.generatedAt.toLocaleDateString()} •{" "}
                  {reportData.analysisPeriod}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button onClick={() => onShare?.()} className="btn-secondary">
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Share
              </button>

              <div className="relative">
                <button
                  onClick={() => onExport?.("pdf")}
                  className="btn-primary"
                >
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
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: "overview", label: "Overview", icon: "📊" },
              { key: "wallets", label: "Wallets", icon: "👛" },
              { key: "analysis", label: "Analysis", icon: "📈" },
              { key: "insights", label: "Insights", icon: "💡" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{metric.icon}</span>
                      {metric.trend && (
                        <span
                          className={`text-sm font-medium ${
                            metric.trend === "up"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {metric.trend === "up" ? "↗" : "↘"} {metric.change}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {metric.title}
                    </h3>

                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {metric.title.includes("Value") ||
                      metric.title.includes("savings")
                        ? formatUSD(metric.value)
                        : metric.value.toLocaleString()}
                    </div>

                    <p className="text-sm text-slate-600">
                      {metric.description}
                    </p>

                    {metric.period && (
                      <p className="text-xs text-slate-500 mt-1">
                        {metric.period}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Key Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Volume Comparison Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Volume Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={reportData.comparativeMetrics.volumeComparison.slice(
                        0,
                        10
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="address"
                        tickFormatter={truncateAddress}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tickFormatter={formatUSD} />
                      <Tooltip
                        labelFormatter={(label) =>
                          `Wallet: ${truncateAddress(label)}`
                        }
                        formatter={(value) => [
                          formatUSD(value as number),
                          "Volume",
                        ]}
                      />
                      <Bar dataKey="volume" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Balance Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Balance Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.comparativeMetrics.balanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, percentage }) =>
                          `${range} (${percentage.toFixed(1)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="walletCount"
                      >
                        {reportData.comparativeMetrics.balanceDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value, "Wallets"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Transaction Activity Timeline
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={reportData.timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalVolume"
                      stroke="#2563eb"
                      name="Total Volume"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="transactionCount"
                      stroke="#7c3aed"
                      name="Transactions"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="activeWallets"
                      stroke="#059669"
                      name="Active Wallets"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "wallets" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Individual Wallet Analysis
              </h2>

              {reportData.wallets.map((wallet, index) => (
                <div
                  key={wallet.walletAddress}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {truncateAddress(wallet.walletAddress)}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Balance: {formatUSD(wallet.totalVolumeUSD || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Download report"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-2m-6-4l2 2m0 0l2-2m-2 2V10"
                          />
                        </svg>
                      </button>
                      <button
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="Open report in new tab"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">
                        {wallet.transactionCount || 0}
                      </div>
                      <div className="text-sm text-slate-500">Transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">
                        {formatUSD(wallet.totalVolume || 0)}
                      </div>
                      <div className="text-sm text-slate-500">Total Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">
                        {(((wallet.transactionCount || 0) / 100) * 100).toFixed(
                          1
                        )}
                        %
                      </div>
                      <div className="text-sm text-slate-500">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">
                        {(((wallet.totalVolumeUSD || 0) / 10000) * 100).toFixed(
                          1
                        )}
                        %
                      </div>
                      <div className="text-sm text-slate-500">Risk Score</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      Recent Activity
                    </h4>
                    <div className="text-sm text-slate-500">
                      Last activity:{" "}
                      {wallet.lastUpdated
                        ? wallet.lastUpdated.toLocaleDateString()
                        : "Unknown"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Comparative Analysis
              </h2>

              {/* Gas Efficiency Comparison */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Gas Efficiency Comparison
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={reportData.comparativeMetrics.gasEfficiencyComparison}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="address"
                      tickFormatter={truncateAddress}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) =>
                        `Wallet: ${truncateAddress(label)}`
                      }
                      formatter={(value, name) => [
                        name === "efficiency"
                          ? `${value}%`
                          : formatUSD(value as number),
                        name === "efficiency"
                          ? "Efficiency"
                          : "Potential Savings",
                      ]}
                    />
                    <Bar
                      dataKey="efficiency"
                      fill="#2563eb"
                      name="Efficiency %"
                    />
                    <Bar
                      dataKey="potentialSavings"
                      fill="#059669"
                      name="Potential Savings"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "insights" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                AI-Generated Insights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-xl shadow-sm border p-6 cursor-pointer transition-all hover:shadow-md ${getPriorityColor(
                      insight.priority
                    )}`}
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {insight.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              insight.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : insight.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {insight.priority.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-slate-600 mb-3">
                          {insight.description}
                        </p>

                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-slate-700 mb-1">
                            💡 Actionable Insight:
                          </p>
                          <p className="text-sm text-slate-600">
                            {insight.actionable}
                          </p>
                        </div>

                        {insight.metric && insight.value && (
                          <div className="mt-3 text-sm text-slate-500">
                            <span className="font-medium">
                              {insight.metric}:
                            </span>{" "}
                            {insight.value}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">
                {selectedInsight.title}
              </h3>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close insight details"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-600">{selectedInsight.description}</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Recommended Action:
                </h4>
                <p className="text-blue-800">{selectedInsight.actionable}</p>
              </div>

              {selectedInsight.walletAddress && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-2">
                    Related Wallet:
                  </h4>
                  <p className="font-mono text-slate-800">
                    {selectedInsight.walletAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
