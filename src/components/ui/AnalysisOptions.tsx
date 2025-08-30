'use client';

interface AnalysisOptionsProps {
  options: {
    includeGasMetrics: boolean;
    includeTradingStats: boolean;
    includeUSDConversions: boolean;
  };
  onChange: (options: Partial<AnalysisOptionsProps['options']>) => void;
}

export function AnalysisOptions({ options, onChange }: AnalysisOptionsProps) {
  const handleOptionChange = (key: keyof typeof options, value: boolean) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        ⚙️ Analysis Options
      </h3>

      <div className="space-y-4">
        {/* Gas Metrics Option */}
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeGasMetrics}
            onChange={(e) => handleOptionChange('includeGasMetrics', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg mr-2">⛽</span>
              <span className="font-medium text-gray-900 dark:text-white">
                Include Gas Metrics
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track gas consumption and transaction costs for each wallet
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Provides insights into wallet efficiency and transaction patterns
            </div>
          </div>
        </label>

        {/* Trading Stats Option */}
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeTradingStats}
            onChange={(e) => handleOptionChange('includeTradingStats', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg mr-2">📊</span>
              <span className="font-medium text-gray-900 dark:text-white">
                Include Trading Statistics
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analyze trading frequency, volume patterns, and market activity
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Helps identify active traders and market participants
            </div>
          </div>
        </label>

        {/* USD Conversions Option */}
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.includeUSDConversions}
            onChange={(e) => handleOptionChange('includeUSDConversions', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-lg mr-2">💱</span>
              <span className="font-medium text-gray-900 dark:text-white">
                Include USD Conversions
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Convert all token amounts to USD for easier comparison and reporting
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Uses real-time exchange rates for accurate financial analysis
            </div>
          </div>
        </label>
      </div>

      {/* Performance Impact Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Performance Note</p>
            <p>
              Enabling additional analysis options may increase processing time but provides more comprehensive insights. 
              Gas metrics and trading stats are particularly useful for DeFi analysis and risk assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Settings */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          💡 Recommended Settings
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>• <strong>Basic Analysis:</strong> APT only, minimal options</p>
          <p>• <strong>DeFi Analysis:</strong> Include gas metrics and trading stats</p>
          <p>• <strong>Financial Reporting:</strong> Enable USD conversions</p>
          <p>• <strong>Comprehensive:</strong> All options enabled for full insights</p>
        </div>
      </div>
    </div>
  );
}
