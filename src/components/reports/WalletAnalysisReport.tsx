'use client';

import { useState } from 'react';
import { WalletAnalysisReport as ReportData, AnalysisParams } from '@/hooks/use-wallet-analysis';
import { ReportGenerator } from '@/lib/report-generator';

interface WalletAnalysisReportProps {
  results: any;
  parameters: AnalysisParams;
}

export function WalletAnalysisReport({ results, parameters }: WalletAnalysisReportProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'wallets' | 'charts' | 'insights'>('summary');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Transform results to our report format if needed
  const reportData = results.wallets ? results : ReportGenerator.generateWalletReport(results, parameters);

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csvContent = ReportGenerator.exportToCSV(reportData.wallets);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eagle-eye-analysis-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else if (format === 'json') {
      const jsonContent = ReportGenerator.exportToJSON(reportData.wallets);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eagle-eye-analysis-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAPT = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(4)} APT`;
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      {/* Report Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🦅 Eagle Eye Analysis Report
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Generated on {formatDate(new Date())} • {reportData.wallets?.length || 0} wallets analyzed
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Date Range: {formatDate(parameters.dateRange.startDate)} - {formatDate(parameters.dateRange.endDate)}
            </p>
          </div>
          
          {/* Export Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📄 Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-8">
          {[
            { id: 'summary', label: '📊 Summary', icon: '📊' },
            { id: 'wallets', label: '👛 Wallets', icon: '👛' },
            { id: 'charts', label: '📈 Charts', icon: '📈' },
            { id: 'insights', label: '💡 Insights', icon: '💡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.wallets?.length || 0}
                </div>
                <div className="text-blue-800 dark:text-blue-200 font-medium">
                  Wallets Analyzed
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatAPT(reportData.summary?.totalVolume || 0)}
                </div>
                <div className="text-green-800 dark:text-green-200 font-medium">
                  Total Volume
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatUSD(reportData.summary?.totalVolumeUSD || 0)}
                </div>
                <div className="text-purple-800 dark:text-purple-200 font-medium">
                  Volume (USD)
                </div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {reportData.summary?.totalTransactions || 0}
                </div>
                <div className="text-orange-800 dark:text-orange-200 font-medium">
                  Total Transactions
                </div>
              </div>
            </div>

            {/* Analysis Parameters */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Analysis Parameters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Token Types:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {parameters.tokenTypes.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Gas Metrics:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {parameters.includeGasMetrics ? 'Included' : 'Excluded'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Trading Stats:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {parameters.includeTradingStats ? 'Included' : 'Excluded'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">USD Conversions:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {parameters.includeUSDConversions ? 'Included' : 'Excluded'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallets' && (
          <div className="space-y-6">
            {reportData.wallets?.map((wallet: any, index: number) => (
              <div
                key={wallet.address}
                className={`border rounded-lg p-6 transition-all cursor-pointer ${
                  selectedWallet === wallet.address
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setSelectedWallet(selectedWallet === wallet.address ? null : wallet.address)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Wallet {index + 1}
                    </h3>
                    <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                      {wallet.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatAPT(parseFloat(wallet.summary.totalDeposits) + parseFloat(wallet.summary.totalWithdrawals))}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total Volume
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatAPT(wallet.summary.totalDeposits)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Deposits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {formatAPT(wallet.summary.totalWithdrawals)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Withdrawals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {wallet.summary.totalTransactions}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
                  </div>
                </div>

                {selectedWallet === wallet.address && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Net Flow:</span>
                        <span className={`ml-2 font-semibold ${
                          parseFloat(wallet.summary.netFlow) >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatAPT(wallet.summary.netFlow)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Activity:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {wallet.activity.hasActivity ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Last Activity:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {wallet.activity.lastActivity ? formatDate(new Date(wallet.activity.lastActivity)) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Processing Time:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {wallet.summary.processingTimeMs}ms
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Charts Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Interactive charts and visualizations will be available in the next update
              </p>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Key Insights */}
            {reportData.insights && reportData.insights.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                  🔍 Key Insights
                </h3>
                <ul className="space-y-2">
                  {reportData.insights.map((insight: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-blue-800 dark:text-blue-200">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {reportData.recommendations && reportData.recommendations.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
                  💡 Recommendations
                </h3>
                <ul className="space-y-2">
                  {reportData.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-green-800 dark:text-green-200">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analysis Notes */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📝 Analysis Notes
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>• Analysis performed using Eagle Eye's advanced blockchain analytics engine</p>
                <p>• Results include real-time data from Aptos mainnet</p>
                <p>• Cache optimization reduces analysis time for previously analyzed wallets</p>
                <p>• All monetary values are approximate and subject to market fluctuations</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
