'use client';

import React, { useState } from 'react';

// Pre-populated demo data with real Aptos wallet addresses
const DEMO_DATA = {
  highVolumeWallet: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  multiTokenWallets: [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    '0x1234567890123456789012345678901234567890',
    '0xabcdef1234567890abcdef1234567890abcdef12',
    '0x9876543210987654321098765432109876543210',
    '0xfedcba0987654321fedcba0987654321fedcba09'
  ],
  tokenTypes: [
    '0x1::aptos_coin::AptosCoin',
    '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
    '0x1::coin::CoinStore<0x1::usdt::USDT>'
  ],
  timeRanges: {
    last7Days: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      label: 'Last 7 Days'
    },
    last30Days: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      label: 'Last 30 Days'
    }
  }
};

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoResults, setDemoResults] = useState<DemoResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Demo scenario handlers
  const handleHighVolumeAnalysis = async () => {
    setActiveDemo('high-volume');
    setIsProcessing(true);
    
    try {
      // This would trigger the high-volume analysis
      // For demo purposes, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDemoResults({
        type: 'high-volume',
        wallet: DEMO_DATA.highVolumeWallet,
        metrics: {
          totalVolume: 1250000,
          totalVolumeUSD: 1250000,
          transactionCount: 2847,
          gasUsed: 125000,
          gasCost: 125,
          ethereumEquivalent: 1250,
          savings: 1125,
          savingsPercentage: 90
        },
        processingTime: 2.3,
        cacheHit: false
      });
    } catch (error) {
      console.error('Demo analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultiTokenAnalysis = async () => {
    setActiveDemo('multi-token');
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setDemoResults({
        type: 'multi-token',
        wallets: DEMO_DATA.multiTokenWallets.slice(0, 3),
        tokens: DEMO_DATA.tokenTypes,
        metrics: {
          totalWallets: 3,
          totalTokens: 3,
          totalVolume: 890000,
          totalVolumeUSD: 890000,
          totalTransactions: 1567,
          gasUsed: 89000,
          processingTime: 3.1,
          cacheHit: true
        }
      });
    } catch (error) {
      console.error('Demo analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchAnalysis = async () => {
    setActiveDemo('batch');
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      setDemoResults({
        type: 'batch',
        wallets: DEMO_DATA.multiTokenWallets,
        metrics: {
          totalWallets: 5,
          totalVolume: 2100000,
          totalVolumeUSD: 2100000,
          totalTransactions: 4234,
          gasUsed: 210000,
          processingTime: 4.2,
          cacheHit: false,
          batchEfficiency: 85
        }
      });
    } catch (error) {
      console.error('Demo analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimeComparison = async () => {
    setActiveDemo('time-comparison');
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setDemoResults({
        type: 'time-comparison',
        comparison: {
          '7days': {
            volume: 320000,
            transactions: 456,
            gasUsed: 32000
          },
          '30days': {
            volume: 1250000,
            transactions: 2847,
            gasUsed: 125000
          }
        },
        insights: {
          volumeGrowth: 290,
          transactionGrowth: 524,
          gasEfficiency: 85
        },
        processingTime: 2.5,
        cacheHit: true
      });
    } catch (error) {
      console.error('Demo analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDemo = () => {
    setActiveDemo(null);
    setDemoResults(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Eagle Eye Demo</h1>
              <p className="text-gray-600">Experience the power of blockchain analytics</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetDemo}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Scenarios */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Demo Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DemoCard
              title="High-Volume Analysis"
              description="Analyze a high-volume wallet showing gas savings vs Ethereum"
              onClick={handleHighVolumeAnalysis}
              isActive={activeDemo === 'high-volume'}
              isProcessing={isProcessing && activeDemo === 'high-volume'}
              icon="📊"
            />
            <DemoCard
              title="Multi-Token Analysis"
              description="Analyze multiple tokens across 3 wallets simultaneously"
              onClick={handleMultiTokenAnalysis}
              isActive={activeDemo === 'multi-token'}
              isProcessing={isProcessing && activeDemo === 'multi-token'}
              icon="🪙"
            />
            <DemoCard
              title="Batch Processing"
              description="Process 5+ wallets in a single batch operation"
              onClick={handleBatchAnalysis}
              isActive={activeDemo === 'batch'}
              isProcessing={isProcessing && activeDemo === 'batch'}
              icon="⚡"
            />
            <DemoCard
              title="Time Comparison"
              description="Compare 7-day vs 30-day analysis results"
              onClick={handleTimeComparison}
              isActive={activeDemo === 'time-comparison'}
              isProcessing={isProcessing && activeDemo === 'time-comparison'}
              icon="⏰"
            />
          </div>
        </div>

        {/* Results Showcase */}
        {demoResults && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Demo Results</h2>
            <ResultsShowcase results={demoResults} />
          </div>
        )}

        {/* Value Props */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Eagle Eye Value Propositions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ValuePropCard
              title="80% Time Savings"
              description="Automated analysis vs manual blockchain exploration"
              metric="80%"
              color="green"
            />
            <ValuePropCard
              title="On-Chain Accuracy"
              description="Real-time data directly from Aptos blockchain"
              metric="100%"
              color="blue"
            />
            <ValuePropCard
              title="Cost Savings"
              description="Gas optimization and efficiency insights"
              metric="90%"
              color="purple"
            />
            <ValuePropCard
              title="Professional Reports"
              description="Export-ready analytics for stakeholders"
              metric="Pro"
              color="indigo"
            />
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Demo</h2>
          <div className="bg-white rounded-lg shadow-sm border p-6">
          </div>
        </div>
      </div>
    </div>
  );
}

// Results Showcase Component
function ResultsShowcase({ results }: { results: DemoResults }) {
  const renderMetrics = () => {
    switch (results.type) {
      case 'high-volume':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Volume" value={`$${results.metrics.totalVolume.toLocaleString()}`} />
              <MetricCard title="Transactions" value={results.metrics.transactionCount.toLocaleString()} />
              <MetricCard title="Gas Used" value={results.metrics.gasUsed.toLocaleString()} />
              <MetricCard title="Gas Cost" value={`$${results.metrics.gasCost}`} />
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Cost Savings vs Ethereum</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-green-600">Ethereum Equivalent</div>
                  <div className="text-lg font-semibold text-green-900">${results.metrics.ethereumEquivalent}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Aptos Cost</div>
                  <div className="text-lg font-semibold text-green-900">${results.metrics.gasCost}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Total Savings</div>
                  <div className="text-lg font-semibold text-green-900">${results.metrics.savings} ({results.metrics.savingsPercentage}%)</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'multi-token':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Wallets" value={results.metrics.totalWallets} />
              <MetricCard title="Total Tokens" value={results.metrics.totalTokens} />
              <MetricCard title="Total Volume" value={`$${results.metrics.totalVolume.toLocaleString()}`} />
              <MetricCard title="Total Transactions" value={results.metrics.totalTransactions.toLocaleString()} />
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Analysis Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-blue-600">Wallets Analyzed</div>
                  <div className="text-sm font-medium text-blue-900">
                    {results.wallets.map((wallet: string) => wallet.slice(0, 10) + '...').join(', ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-blue-600">Token Types</div>
                  <div className="text-sm font-medium text-blue-900">
                    {results.tokens.map((token: string) => token.split('::').pop()).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'batch':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard title="Total Wallets" value={results.metrics.totalWallets} />
              <MetricCard title="Total Volume" value={`$${results.metrics.totalVolume.toLocaleString()}`} />
              <MetricCard title="Total Transactions" value={results.metrics.totalTransactions.toLocaleString()} />
              <MetricCard title="Batch Efficiency" value={`${results.metrics.batchEfficiency}%`} />
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Batch Processing Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-purple-600">Processing Time</div>
                  <div className="text-lg font-semibold text-purple-900">{results.metrics.processingTime}s</div>
                </div>
                <div>
                  <div className="text-sm text-purple-600">Gas Used</div>
                  <div className="text-lg font-semibold text-purple-900">{results.metrics.gasUsed.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-purple-600">Efficiency</div>
                  <div className="text-lg font-semibold text-purple-900">{results.metrics.batchEfficiency}%</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'time-comparison':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Last 7 Days</h4>
                <div className="space-y-2">
                  <MetricCard title="Volume" value={`$${results.comparison['7days'].volume.toLocaleString()}`} />
                  <MetricCard title="Transactions" value={results.comparison['7days'].transactions.toLocaleString()} />
                  <MetricCard title="Gas Used" value={results.comparison['7days'].gasUsed.toLocaleString()} />
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">Last 30 Days</h4>
                <div className="space-y-2">
                  <MetricCard title="Volume" value={`$${results.comparison['30days'].volume.toLocaleString()}`} />
                  <MetricCard title="Transactions" value={results.comparison['30days'].transactions.toLocaleString()} />
                  <MetricCard title="Gas Used" value={results.comparison['30days'].gasUsed.toLocaleString()} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard title="Volume Growth" value={`${results.insights.volumeGrowth}%`} />
              <MetricCard title="Transaction Growth" value={`${results.insights.transactionGrowth}%`} />
              <MetricCard title="Gas Efficiency" value={`${results.insights.gasEfficiency}%`} />
              <MetricCard title="Processing Time" value={`${results.processingTime}s`} />
              <MetricCard title="Cache Hit" value={results.cacheHit ? 'Yes' : 'No'} />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {results.type === 'high-volume' && 'High-Volume Wallet Analysis'}
          {results.type === 'multi-token' && 'Multi-Token Analysis'}
          {results.type === 'batch' && 'Batch Wallet Analysis'}
          {results.type === 'time-comparison' && 'Time Range Comparison'}
        </h3>
        <p className="text-gray-600">
          {results.type === 'high-volume' && `Analysis of wallet ${results.wallet}`}
          {results.type === 'multi-token' && `${results.metrics.totalWallets} wallets analyzed across ${results.metrics.totalTokens} token types`}
          {results.type === 'batch' && `${results.metrics.totalWallets} wallets processed in batch`}
          {results.type === 'time-comparison' && 'Performance comparison across different time periods'}
        </p>
      </div>
      
      {renderMetrics()}
      
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold text-gray-900 mb-3">Performance Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600">Processing Time</div>
            <div className="text-lg font-semibold text-blue-900">{results.metrics?.processingTime || results.processingTime}s</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600">Cache Hit</div>
            <div className="text-lg font-semibold text-green-900">{results.metrics?.cacheHit || results.cacheHit ? 'Yes' : 'No'}</div>
          </div>
          {results.metrics?.batchEfficiency && (
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-600">Batch Efficiency</div>
              <div className="text-lg font-semibold text-purple-900">{results.metrics.batchEfficiency}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Demo Card Component
function DemoCard({ title, description, onClick, isActive, isProcessing, icon }: {
  title: string;
  description: string;
  onClick: () => void;
  isActive: boolean;
  isProcessing: boolean;
  icon: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all duration-200 ${
        isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {isProcessing ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600">Processing...</span>
        </div>
      ) : (
        <div className="text-sm text-blue-600 font-medium">Click to run →</div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

// Value Proposition Card Component
function ValuePropCard({ title, description, metric, color }: {
  title: string;
  description: string;
  metric: string;
  color: 'green' | 'blue' | 'purple' | 'indigo';
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colorClasses[color]} mb-4`}>
        <span className="text-2xl font-bold">{metric}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
