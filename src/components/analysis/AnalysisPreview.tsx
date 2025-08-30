'use client';

import { useState, useCallback } from 'react';
import { ProgressiveConfig, AdvancedConfig } from '../wallet/ProgressiveConfig';

interface AnalysisPreviewProps {
  addresses: string[];
  options: AnalysisOptions;
  onStartAnalysis: (addresses: string[], options: AnalysisOptions) => void;
  onModifyConfig: (config: AdvancedConfig) => void;
}

interface AnalysisOptions {
  timeRange: '7d' | '30d' | '90d' | 'custom';
  analysisType: 'quick' | 'detailed' | 'comprehensive';
  tokenSelection: 'all' | 'apt-only' | 'custom';
  customDateRange?: { start: Date; end: Date };
  customTokens?: string[];
}

export function AnalysisPreview({ 
  addresses, 
  options, 
  onStartAnalysis, 
  onModifyConfig 
}: AnalysisPreviewProps) {
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  // Calculate estimates based on configuration
  const calculateEstimates = useCallback(() => {
    let baseTime = addresses.length * 2; // 2 seconds per wallet base
    let baseCost = addresses.length * 0.001; // $0.001 per wallet base

    // Adjust for analysis type
    switch (options.analysisType) {
      case 'quick':
        baseTime *= 0.5;
        baseCost *= 0.5;
        break;
      case 'detailed':
        baseTime *= 1;
        baseCost *= 1;
        break;
      case 'comprehensive':
        baseTime *= 2;
        baseCost *= 1.5;
        break;
    }

    // Adjust for time range
    switch (options.timeRange) {
      case '7d':
        baseTime *= 0.7;
        baseCost *= 0.7;
        break;
      case '30d':
        baseTime *= 1;
        baseCost *= 1;
        break;
      case '90d':
        baseTime *= 1.3;
        baseCost *= 1.2;
        break;
      case 'custom':
        baseTime *= 1.5;
        baseCost *= 1.3;
        break;
    }

    // Adjust for token selection
    if (options.tokenSelection === 'apt-only') {
      baseTime *= 0.8;
      baseCost *= 0.8;
    } else if (options.tokenSelection === 'custom') {
      baseTime *= 1.2;
      baseCost *= 1.1;
    }

    setEstimatedTime(Math.round(baseTime));
    setEstimatedCost(Math.round(baseCost * 1000) / 1000);
  }, [addresses.length, options]);

  // Calculate estimates when component mounts or options change
  useState(() => {
    calculateEstimates();
  });

  const handleStartAnalysis = useCallback(() => {
    onStartAnalysis(addresses, options);
  }, [addresses, options, onStartAnalysis]);

  const handleAdvancedConfigSave = useCallback((config: AdvancedConfig) => {
    onModifyConfig(config);
    setShowAdvancedConfig(false);
    // Recalculate estimates after config change
    setTimeout(calculateEstimates, 100);
  }, [onModifyConfig, calculateEstimates]);

  const getAnalysisScope = () => {
    const scope = [];
    
    if (addresses.length > 0) {
      scope.push(`${addresses.length} wallet${addresses.length !== 1 ? 's' : ''}`);
    }
    
    scope.push(`${options.timeRange === '7d' ? '7 days' : options.timeRange === '30d' ? '30 days' : options.timeRange === '90d' ? '90 days' : 'custom range'}`);
    
    scope.push(`${options.analysisType} analysis`);
    
    if (options.tokenSelection === 'apt-only') {
      scope.push('APT tokens only');
    } else if (options.tokenSelection === 'custom') {
      scope.push('custom token selection');
    } else {
      scope.push('all token types');
    }
    
    return scope.join(' • ');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Analysis Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            📊 Analysis Preview
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Review your configuration before starting
          </p>
        </div>

        {/* Configuration Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Configuration Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Analysis Scope:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-xs">
                    {getAnalysisScope()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Time Range:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {options.timeRange === '7d' ? '7 Days' : 
                     options.timeRange === '30d' ? '30 Days' : 
                     options.timeRange === '90d' ? '90 Days' : 'Custom Range'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Analysis Depth:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {options.analysisType}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Token Coverage:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {options.tokenSelection === 'apt-only' ? 'APT Only' : 
                     options.tokenSelection === 'custom' ? 'Custom Selection' : 'All Tokens'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Estimates */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Estimates
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300">Estimated Time:</span>
                  <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
                    {estimatedTime}s
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <span className="text-green-700 dark:text-green-300">API Calls:</span>
                  <span className="text-lg font-bold text-green-800 dark:text-green-200">
                    ~{Math.ceil(addresses.length * 1.5)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <span className="text-purple-700 dark:text-purple-300">Data Points:</span>
                  <span className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    ~{Math.ceil(addresses.length * 25)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAdvancedConfig(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  ⚙️ Modify Configuration
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  🔄 Start Over
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* What You'll Get Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-4">
            🎯 What You'll Get
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-indigo-800 dark:text-indigo-300">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Transaction history and patterns</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Token balance analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Gas usage metrics</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Activity timeline visualization</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Risk assessment indicators</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Exportable reports (CSV, JSON)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action */}
        <div className="text-center">
          <button
            onClick={handleStartAnalysis}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
          >
            🚀 Start Analysis Now
            <svg className="ml-2 w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            Estimated completion time: {estimatedTime} seconds
          </p>
        </div>
      </div>

      {/* Advanced Configuration Modal */}
      <ProgressiveConfig
        isOpen={showAdvancedConfig}
        onClose={() => setShowAdvancedConfig(false)}
        onSave={handleAdvancedConfigSave}
        initialConfig={{
          timeRange: {
            type: options.timeRange === 'custom' ? 'custom' : 'preset',
            preset: options.timeRange === 'custom' ? undefined : options.timeRange,
            custom: options.customDateRange,
          },
          analysisDepth: {
            type: options.analysisType,
            includeGasMetrics: true,
            includeTradingStats: true,
            includeUSDConversions: true,
          },
          tokenSelection: {
            type: options.tokenSelection,
            customTokens: options.customTokens,
          },
          performance: {
            enableCaching: true,
            parallelProcessing: true,
            maxConcurrentRequests: 5,
          },
        }}
      />
    </div>
  );
}
