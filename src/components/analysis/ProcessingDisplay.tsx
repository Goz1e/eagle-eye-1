'use client';

import { AnalysisProgress } from '@/hooks/use-wallet-analysis';

interface ProcessingDisplayProps {
  progress: AnalysisProgress;
  totalWallets: number;
}

export function ProcessingDisplay({ progress, totalWallets }: ProcessingDisplayProps) {
  const percentage = totalWallets > 0 ? (progress.currentWallet / totalWallets) * 100 : 0;
  const processingTimeSeconds = Math.floor(progress.processingTime / 1000);
  const estimatedTimeRemaining = totalWallets > 0 
    ? Math.ceil((progress.processingTime / progress.currentWallet) * (totalWallets - progress.currentWallet) / 1000)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        🔄 Analysis in Progress
      </h2>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Processing wallets...
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {progress.currentWallet} / {totalWallets}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {percentage.toFixed(1)}% Complete
          </span>
        </div>
      </div>

      {/* Current Wallet Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              Current Wallet
            </h3>
            <p className="text-blue-800 dark:text-blue-200 font-mono text-sm">
              {progress.currentWalletAddress || 'Initializing...'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progress.currentWallet}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              of {totalWallets}
            </div>
          </div>
        </div>
      </div>

      {/* Processing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {processingTimeSeconds}s
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Time
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {progress.cacheHits}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Cache Hits
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {progress.cacheMisses}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            Cache Misses
          </div>
        </div>
      </div>

      {/* Time Estimates */}
      {estimatedTimeRemaining > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-200 text-sm">
              Estimated time remaining: {estimatedTimeRemaining} seconds
            </span>
          </div>
        </div>
      )}

      {/* Processing Tips */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          💡 Processing Tips
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Analysis time depends on wallet activity and network conditions</li>
          <li>• Cached results load much faster than fresh analysis</li>
          <li>• Large wallets with many transactions may take longer</li>
          <li>• You can safely navigate away - results will be saved</li>
        </ul>
      </div>
    </div>
  );
}
