'use client';

import { useState, useCallback } from 'react';

interface AnalysisGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onUseExample: (example: ExampleUseCase) => void;
}

interface ExampleUseCase {
  name: string;
  description: string;
  addresses: string[];
  timeRange: '7d' | '30d' | '90d';
  analysisType: 'quick' | 'detailed' | 'comprehensive';
  tokenSelection: 'all' | 'apt-only' | 'stablecoins';
}

const EXAMPLE_USE_CASES: ExampleUseCase[] = [
  {
    name: 'DeFi Portfolio Check',
    description: 'Quick overview of your DeFi wallet activity and token balances',
    addresses: ['0x1234567890abcdef1234567890abcdef12345678'],
    timeRange: '30d',
    analysisType: 'quick',
    tokenSelection: 'all',
  },
  {
    name: 'Trading Pattern Analysis',
    description: 'Detailed analysis of trading patterns and gas optimization',
    addresses: ['0xabcdef1234567890abcdef1234567890abcdef12'],
    timeRange: '90d',
    analysisType: 'detailed',
    tokenSelection: 'stablecoins',
  },
  {
    name: 'Multi-Wallet Investigation',
    description: 'Comprehensive analysis of multiple related wallets',
    addresses: [
      '0x11111111111111111111111111111111111111111111',
      '0x22222222222222222222222222222222222222222222',
      '0x33333333333333333333333333333333333333333333',
    ],
    timeRange: '7d',
    analysisType: 'comprehensive',
    tokenSelection: 'all',
  },
];

export function AnalysisGuide({ isOpen, onClose, onUseExample }: AnalysisGuideProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'tips'>('overview');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUseExample = useCallback((example: ExampleUseCase) => {
    onUseExample(example);
    onClose();
  }, [onUseExample, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎓 Eagle Eye Analysis Guide
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Learn how to get the most out of your wallet analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['overview', 'examples', 'tips'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'overview' && '📚 Overview'}
              {tab === 'examples' && '💡 Examples'}
              {tab === 'tips' && '💎 Pro Tips'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Welcome to Eagle Eye Analysis
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  Eagle Eye provides comprehensive blockchain analytics for Aptos wallets. Our platform helps you understand 
                  transaction patterns, token movements, and wallet behavior with professional-grade insights.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl mb-2">🔍</div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Real-time Data</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Access live blockchain data with instant updates
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-1">Smart Analytics</h4>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      AI-powered insights and pattern recognition
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl mb-2">🚀</div>
                    <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-1">Professional Reports</h4>
                    <p className="text-sm text-purple-800 dark:text-purple-300">
                      Export-ready reports for stakeholders
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  How It Works
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Input Wallet Addresses</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Enter one or multiple Aptos wallet addresses. You can paste them directly or use our validation tools.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Configure Analysis</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Choose time range, analysis depth, and token coverage. Smart defaults are applied for optimal results.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Get Insights</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Receive comprehensive analysis with visualizations, metrics, and actionable insights.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Example Use Cases
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started quickly with these pre-configured analysis templates. Click any example to load it into your analysis.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXAMPLE_USE_CASES.map((example, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                      onClick={() => handleUseExample(example)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{example.name}</h4>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium">
                          Use This →
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {example.description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {example.addresses.length} wallet{example.addresses.length !== 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {example.timeRange}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {example.analysisType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 dark:text-yellow-400 text-xl">💡</div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      Pro Tip: Start Simple
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Begin with a single wallet and quick analysis to understand the platform. Once comfortable, 
                      expand to multiple wallets and comprehensive analysis for deeper insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Pro Tips for Better Analysis
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      🎯 Choose the Right Time Range
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• <strong>7 days:</strong> Recent activity and quick overview</li>
                      <li>• <strong>30 days:</strong> Monthly patterns and trends</li>
                      <li>• <strong>90 days:</strong> Quarterly analysis and seasonal patterns</li>
                      <li>• <strong>Custom:</strong> Specific events or investigation periods</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                      🚀 Optimize Analysis Depth
                    </h4>
                    <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                      <li>• <strong>Quick:</strong> Basic metrics and overview (fastest)</li>
                      <li>• <strong>Detailed:</strong> Comprehensive analysis with charts (balanced)</li>
                      <li>• <strong>Comprehensive:</strong> Full analysis with advanced metrics (most thorough)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                      💎 Token Selection Strategy
                    </h4>
                    <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                      <li>• <strong>APT Only:</strong> Focus on native token activity</li>
                      <li>• <strong>Stablecoins:</strong> Trading and DeFi analysis</li>
                      <li>• <strong>All Tokens:</strong> Complete portfolio overview</li>
                      <li>• <strong>Custom:</strong> Specific token investigation</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                      🔍 Multi-Wallet Analysis
                    </h4>
                    <ul className="text-sm text-indigo-800 dark:text-indigo-300 space-y-1">
                      <li>• Group related wallets for comprehensive analysis</li>
                      <li>• Compare activity patterns across multiple addresses</li>
                      <li>• Identify cross-wallet transaction flows</li>
                      <li>• Use batch processing for efficiency</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Need more help? Check out our <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">documentation</a>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}
