'use client';

import { useState } from 'react';

interface TokenSelectorProps {
  selectedTokens: string[];
  onChange: (tokens: string[]) => void;
}

const AVAILABLE_TOKENS = [
  {
    id: '0x1::aptos_coin::AptosCoin',
    symbol: 'APT',
    name: 'Aptos Coin',
    description: 'Native APT token',
    icon: '🪙',
  },
  {
    id: '0x1::coin::Coin<0x1::aptos_coin::AptosCoin>',
    symbol: 'APT (Wrapped)',
    name: 'Wrapped Aptos Coin',
    description: 'Wrapped APT token',
    icon: '📦',
  },
  {
    id: '0x1::coin::Coin<0x1::usdt::USDT>',
    symbol: 'USDT',
    name: 'Tether USD',
    description: 'USD-pegged stablecoin',
    icon: '💵',
  },
  {
    id: '0x1::coin::Coin<0x1::usdc::USDC>',
    symbol: 'USDC',
    name: 'USD Coin',
    description: 'USD-pegged stablecoin',
    icon: '🪙',
  },
  {
    id: '0x1::coin::Coin<0x1::btc::BTC>',
    symbol: 'BTC',
    name: 'Bitcoin',
    description: 'Wrapped Bitcoin',
    icon: '₿',
  },
  {
    id: '0x1::coin::Coin<0x1::eth::ETH>',
    symbol: 'ETH',
    name: 'Ethereum',
    description: 'Wrapped Ethereum',
    icon: 'Ξ',
  },
];

export function TokenSelector({ selectedTokens, onChange }: TokenSelectorProps) {
  const [showAll, setShowAll] = useState(false);

  const handleTokenToggle = (tokenId: string) => {
    if (selectedTokens.includes(tokenId)) {
      onChange(selectedTokens.filter(id => id !== tokenId));
    } else {
      onChange([...selectedTokens, tokenId]);
    }
  };

  const handleSelectAll = () => {
    onChange(AVAILABLE_TOKENS.map(token => token.id));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const handleQuickSelect = (tokens: string[]) => {
    onChange(tokens);
  };

  const displayedTokens = showAll ? AVAILABLE_TOKENS : AVAILABLE_TOKENS.slice(0, 4);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        🪙 Token Selection
      </h3>

      {/* Quick Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleQuickSelect(['0x1::aptos_coin::AptosCoin'])}
          className="px-3 py-2 text-sm font-medium bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg transition-colors"
        >
          APT Only
        </button>
        <button
          onClick={() => handleQuickSelect(['0x1::aptos_coin::AptosCoin', '0x1::coin::Coin<0x1::usdt::USDT>', '0x1::coin::Coin<0x1::usdc::USDC>'])}
          className="px-3 py-2 text-sm font-medium bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg transition-colors"
        >
          APT + Stablecoins
        </button>
        <button
          onClick={handleSelectAll}
          className="px-3 py-2 text-sm font-medium bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-lg transition-colors"
        >
          All Tokens
        </button>
        <button
          onClick={handleDeselectAll}
          className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Token List */}
      <div className="space-y-2">
        {displayedTokens.map((token) => {
          const isSelected = selectedTokens.includes(token.id);
          
          return (
            <label
              key={token.id}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleTokenToggle(token.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{token.icon}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {token.symbol}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {token.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {token.description}
                    </p>
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Show More/Less Toggle */}
      {AVAILABLE_TOKENS.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {showAll ? 'Show Less' : `Show ${AVAILABLE_TOKENS.length - 4} More Tokens`}
        </button>
      )}

      {/* Selected Tokens Summary */}
      {selectedTokens.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Selected:</span> {selectedTokens.length} token(s)
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedTokens.map((tokenId) => {
              const token = AVAILABLE_TOKENS.find(t => t.id === tokenId);
              return (
                <span
                  key={tokenId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                >
                  {token?.icon} {token?.symbol}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Warning for No Selection */}
      {selectedTokens.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-200 text-sm">
              Please select at least one token for analysis
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
