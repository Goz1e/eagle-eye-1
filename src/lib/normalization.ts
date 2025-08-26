import { cache, CACHE_NAMESPACES, buildCacheKey } from './cache';

// ============================================================================
// MICROUNIT CONVERSION
// ============================================================================

export function convertMicroUnits(amount: string, tokenType: string): number {
  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;

    // Get token decimals
    const decimals = getTokenDecimals(tokenType);
    return numAmount / Math.pow(10, decimals);
  } catch (error) {
    console.error('Microunit conversion failed:', error);
    return 0;
  }
}

function getTokenDecimals(tokenType: string): number {
  // Common token decimals
  const tokenDecimals: Record<string, number> = {
    '0x1::aptos_coin::AptosCoin': 8, // APT
    '0x1::coin::Coin<0x1::usd_coin::USDCoin>': 6, // USDC
    '0x1::coin::Coin<0x1::tether::Tether>': 6, // USDT
    '0x1::coin::Coin<0x1::wrapped_eth::WrappedETH>': 18, // WETH
    '0x1::coin::Coin<0x1::wrapped_btc::WrappedBTC>': 8, // WBTC
  };

  return tokenDecimals[tokenType] || 8; // Default to 8 decimals
}

// ============================================================================
// TIMESTAMP NORMALIZATION
// ============================================================================

export function normalizeTimestamp(timestamp: unknown): Date {
  try {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    if (typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    if (typeof timestamp === 'number') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    // Fallback to current time
    return new Date();
  } catch (error) {
    console.error('Timestamp normalization failed:', error);
    return new Date();
  }
}

// ============================================================================
// TRANSACTION VALIDATION
// ============================================================================

export function validateTransaction(transaction: unknown): boolean {
  try {
    const tx = transaction as { 
      version?: unknown; 
      hash?: unknown; 
      sender?: unknown; 
      amount?: unknown; 
      timestamp?: unknown 
    };
    
    // Check required fields
    if (!tx.version || !tx.hash || !tx.sender) {
      return false;
    }
    
    // Check for valid amounts
    if (tx.amount !== undefined && tx.amount !== null) {
      const amount = parseFloat(tx.amount.toString());
      if (isNaN(amount) || amount < 0) {
        return false;
      }
    }
    
    // Check for valid timestamps
    if (tx.timestamp) {
      const timestamp = normalizeTimestamp(tx.timestamp);
      if (isNaN(timestamp.getTime())) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Transaction validation failed:', error);
    return false;
  }
}

// ============================================================================
// CURRENCY CONVERSION
// ============================================================================

export async function convertToUSD(amount: number, tokenType: string): Promise<number> {
  try {
    const symbol = getTokenSymbol(tokenType);
    if (symbol === 'USDT' || symbol === 'USDC') {
      return amount; // Already in USD
    }
    
    // Get price from cache
    const cacheKey = buildCacheKey(CACHE_NAMESPACES.PRICE_DATA, symbol);
    const cachedPrice = await cache.get<number>(cacheKey);
    
    if (cachedPrice) {
      return amount * cachedPrice;
    }
    
    // Fallback to mock prices for development
    if (process.env.NODE_ENV === 'development') {
      const mockPrices: Record<string, number> = {
        'APT': 8.50,
        'WETH': 2800.00,
        'WBTC': 45000.00,
      };
      
      const mockPrice = mockPrices[symbol];
      if (mockPrice) {
        return amount * mockPrice;
      }
    }
    
    console.warn(`No price data available for ${symbol}, returning original amount`);
    return amount;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return amount;
  }
}

function getTokenSymbol(tokenType: string): string {
  // Extract symbol from token type
  if (tokenType.includes('aptos_coin')) return 'APT';
  if (tokenType.includes('usd_coin')) return 'USDC';
  if (tokenType.includes('tether')) return 'USDT';
  if (tokenType.includes('wrapped_eth')) return 'WETH';
  if (tokenType.includes('wrapped_btc')) return 'WBTC';
  
  return 'UNKNOWN';
}
