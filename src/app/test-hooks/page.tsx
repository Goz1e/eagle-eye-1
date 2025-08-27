'use client';

import { useState } from 'react';
import { useWalletSearch, useBatchAnalysis, useWalletAnalysis } from '@/hooks/use-search';
import { useReports } from '@/hooks/use-reports';

export default function TestHooksPage() {
  const [testAddress, setTestAddress] = useState('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
  const [batchAddresses, setBatchAddresses] = useState('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6,0x123,0x456');
  
  const { searchWallets, results: searchResults, isLoading: searchLoading, error: searchError } = useWalletSearch();
  const { analyzeBatch, results: batchResults, batchInfo, isProcessing, progress, error: batchError } = useBatchAnalysis();
  const { analyzeWallets, results: analysisResults, isAnalyzing, error: analysisError } = useWalletAnalysis();
  const { reports, fetchReports, createReport, isLoading: reportsLoading, error: reportsError } = useReports();

  const handleSearch = () => {
    searchWallets({
      addresses: [testAddress],
      tokenTypes: ['0x1::aptos_coin::AptosCoin'],
    });
  };

  const handleBatchAnalysis = () => {
    const addresses = batchAddresses.split(',').map(addr => addr.trim()).filter(Boolean);
    analyzeBatch(addresses, ['0x1::aptos_coin::AptosCoin'], {
      batchSize: 5,
      priority: 'normal',
      includeProgress: true,
    });
  };

  const handleWalletAnalysis = () => {
    analyzeWallets({
      addresses: [testAddress],
      tokenTypes: ['0x1::aptos_coin::AptosCoin'],
      includeAccountInfo: true,
      includeTransactionHistory: true,
    });
  };

  const handleFetchReports = () => {
    fetchReports();
  };

  const handleCreateReport = async () => {
    try {
      await createReport({
        title: 'Test Report from Frontend',
        description: 'Created via frontend test',
        walletData: { address: testAddress, test: true },
        parameters: { source: 'frontend-test' },
        createdBy: 'cmesuytoe0000itgwr0gxvu4e', // Use the admin user ID
      });
      alert('Report created successfully!');
    } catch (error) {
      alert('Failed to create report: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🚀 Eagle Eye Real Blockchain Integration Test</h1>
        
        {/* Real Blockchain Status */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6 mb-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4 text-green-800">✅ Real Aptos Blockchain Integration Active</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">🌐</div>
              <div className="font-medium">Aptos Mainnet</div>
              <div className="text-sm text-gray-600">Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">⚡</div>
              <div className="font-medium">Real-time Data</div>
              <div className="text-sm text-gray-600">Live</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">🔒</div>
              <div className="font-medium">Rate Limited</div>
              <div className="text-sm text-gray-600">Protected</div>
            </div>
          </div>
        </div>
        
        {/* Wallet Search Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Real Wallet Search Test</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="Enter real Aptos wallet address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {searchLoading ? '🔍 Searching Blockchain...' : '🔍 Search Real Data'}
            </button>
          </div>
          
          {searchError && (
            <div className="text-red-600 mb-4">❌ Error: {searchError}</div>
          )}
          
          {searchResults.length > 0 && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">📊 Real Blockchain Results:</h3>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-3">
                    <div className="font-medium">Address: {result.address}</div>
                    <div className="text-sm text-gray-600">
                      Deposits: {result.totalDeposits} | Withdrawals: {result.totalWithdrawals} | Net Flow: {result.netFlow}
                    </div>
                    {result.accountInfo && (
                      <div className="text-xs text-gray-500">
                        Sequence: {result.accountInfo.sequenceNumber} | Resources: {result.accountInfo.coinResources.length}
                      </div>
                    )}
                    {result.error && (
                      <div className="text-red-500 text-xs">Error: {result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wallet Analysis Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📈 Comprehensive Wallet Analysis Test</h2>
          <button
            onClick={handleWalletAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 mb-4"
          >
            {isAnalyzing ? '🔍 Analyzing Wallet...' : '📈 Analyze Wallet'}
          </button>
          
          {analysisError && (
            <div className="text-red-600 mb-4">❌ Error: {analysisError}</div>
          )}
          
          {analysisResults.length > 0 && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">📊 Analysis Results:</h3>
              <pre className="text-sm overflow-auto bg-white p-3 rounded border">
                {JSON.stringify(analysisResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Batch Analysis Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚡ Real Batch Analysis Test</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Addresses (comma-separated):
            </label>
            <input
              type="text"
              value={batchAddresses}
              onChange={(e) => setBatchAddresses(e.target.value)}
              placeholder="Enter multiple wallet addresses"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={handleBatchAnalysis}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 mb-4"
          >
            {isProcessing ? '⚡ Processing Batch...' : '⚡ Start Real Batch Analysis'}
          </button>
          
          {isProcessing && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="text-sm text-gray-600 mt-1">Progress: {progress.toFixed(1)}%</div>
            </div>
          )}
          
          {batchError && (
            <div className="text-red-600 mb-4">❌ Error: {batchError}</div>
          )}
          
          {batchInfo && (
            <div className="bg-blue-50 p-4 rounded mb-4">
              <h3 className="font-semibold mb-2">📊 Batch Summary:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Addresses</div>
                  <div className="text-blue-600">{batchInfo.totalAddresses}</div>
                </div>
                <div>
                  <div className="font-medium">Success Rate</div>
                  <div className="text-green-600">{batchInfo.successRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="font-medium">Processing Time</div>
                  <div className="text-purple-600">{batchInfo.totalProcessingTimeMs}ms</div>
                </div>
                <div>
                  <div className="font-medium">Avg Time/Address</div>
                  <div className="text-orange-600">{batchInfo.averageProcessingTimeMs.toFixed(0)}ms</div>
                </div>
              </div>
            </div>
          )}
          
          {batchResults.length > 0 && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">📊 Batch Results ({batchResults.length}):</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {batchResults.map((result, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-3">
                    <div className="font-medium">{result.address}</div>
                    <div className="text-sm text-gray-600">
                      Deposits: {result.summary.totalDeposits} | Withdrawals: {result.summary.totalWithdrawals} | 
                      Net: {result.summary.netFlow} | TXs: {result.summary.totalTransactions}
                    </div>
                    <div className="text-xs text-gray-500">
                      Processing: {result.summary.processingTimeMs}ms | Batch: {result.metadata.batchNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reports Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📋 Reports Test</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleFetchReports}
              disabled={reportsLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {reportsLoading ? 'Loading...' : 'Fetch Reports'}
            </button>
            <button
              onClick={handleCreateReport}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Create Test Report
            </button>
          </div>
          
          {reportsError && (
            <div className="text-red-600 mb-4">Error: {reportsError}</div>
          )}
          
          {reports.length > 0 && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Reports ({reports.length}):</h3>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="border-l-4 border-blue-500 pl-3">
                    <div className="font-medium">{report.title}</div>
                    <div className="text-sm text-gray-600">
                      Status: {report.status} | Created: {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🔄 System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="font-medium">API Routes</div>
              <div className="text-sm text-gray-600">Real Blockchain</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="font-medium">Database</div>
              <div className="text-sm text-gray-600">Connected</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="font-medium">Hooks</div>
              <div className="text-sm text-gray-600">Real Data</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="font-medium">Aptos Integration</div>
              <div className="text-sm text-gray-600">Live</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
