import { 
  Aptos, 
  AptosConfig, 
  Network,
  AccountData,
  MoveResource,
  UserTransactionResponse
} from '@aptos-labs/ts-sdk';
import { cache } from './cache';

// ============================================================================
// CONFIGURATION INTERFACE
// ============================================================================

export interface AptosClientConfig {
  nodeUrl: string;
  faucetUrl?: string;
  cacheTTL: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableCache: boolean;
}

// ============================================================================
// MAIN APTOS CLIENT CLASS
// ============================================================================

export class AptosClientWrapper {
  private client: Aptos;
  private config: AptosClientConfig;
  private cache = cache;

  constructor(config: AptosClientConfig) {
    this.config = config;
    
    // Create AptosConfig with the node URL
    const aptosConfig = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: config.nodeUrl,
    });
    
    this.client = new Aptos(aptosConfig);
  }

  // ============================================================================
  // ACCOUNT OPERATIONS
  // ============================================================================

  async getAccountInfo(address: string): Promise<AccountData | null> {
    try {
      const cacheKey = `account_${address}`;
      
      // Check cache first
      if (this.config.enableCache) {
        const cached = await this.cache.get<AccountData>(cacheKey);
        if (cached) return cached;
      }

      const accountData = await this.client.account.getAccountInfo({ accountAddress: address });
      
      // Cache the result
      if (this.config.enableCache) {
        await this.cache.set(cacheKey, accountData, this.config.cacheTTL);
      }
      
      return accountData;
    } catch (error) {
      console.error(`Failed to get account info for ${address}:`, error);
      return null;
    }
  }

  async getAccountResources(address: string): Promise<MoveResource[]> {
    try {
      const cacheKey = `resources_${address}`;
      
      // Check cache first
      if (this.config.enableCache) {
        const cached = await this.cache.get<MoveResource[]>(cacheKey);
        if (cached) return cached;
      }

      const resources = await this.client.account.getAccountResources({ accountAddress: address });
      
      // Cache the result
      if (this.config.enableCache) {
        await this.cache.set(cacheKey, resources, this.config.cacheTTL);
      }
      
      return resources;
    } catch (error) {
      console.error(`Failed to get account resources for ${address}:`, error);
      return [];
    }
  }

  // ============================================================================
  // COIN OPERATIONS
  // ============================================================================

  async getCoinBalance(address: string, coinType: string): Promise<string> {
    try {
      const cacheKey = `balance_${address}_${coinType}`;
      
      // Check cache first
      if (this.config.enableCache) {
        const cached = await this.cache.get<string>(cacheKey);
        if (cached) return cached;
      }

      // Use account resources to get coin balance
      const resources = await this.getAccountResources(address);
      const coinStore = resources.find(
        (resource) => resource.type === `0x1::coin::CoinStore<${coinType}>`
      );
      
      const balance = coinStore?.data ? (coinStore.data as { coin: { value: string } }).coin.value : '0';
      
      // Cache the result
      if (this.config.enableCache) {
        await this.cache.set(cacheKey, balance, this.config.cacheTTL);
      }
      
      return balance;
    } catch (error) {
      console.error(`Failed to get coin balance for ${address}:`, error);
      return '0';
    }
  }

  async getAptosCoinBalance(address: string): Promise<string> {
    return this.getCoinBalance(address, '0x1::aptos_coin::AptosCoin');
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  async getAccountTransactions(
    address: string,
    limit: number = 25,
    start?: number
  ): Promise<UserTransactionResponse[]> {
    try {
      const cacheKey = `transactions_${address}_${limit}_${start || 0}`;
      
      // Check cache first
      if (this.config.enableCache) {
        const cached = await this.cache.get<UserTransactionResponse[]>(cacheKey);
        if (cached) return cached;
      }

      const transactions = await this.client.getAccountTransactions({ 
        accountAddress: address,
        options: {
          limit
        }
      });
      
      // Filter for user transactions only
      const userTransactions = transactions.filter(
        (tx): tx is UserTransactionResponse => tx.type === 'user_transaction'
      );
      
      // Cache the result
      if (this.config.enableCache) {
        await this.cache.set(cacheKey, userTransactions, this.config.cacheTTL);
      }
      
      return userTransactions;
    } catch (error) {
      console.error(`Failed to get transactions for ${address}:`, error);
      return [];
    }
  }

  // ============================================================================
  // TOKEN OPERATIONS
  // ============================================================================

  async getAccountTokens(address: string): Promise<unknown[]> {
    try {
      const cacheKey = `tokens_${address}`;
      
      // Check cache first
      if (this.config.enableCache) {
        const cached = await this.cache.get<unknown[]>(cacheKey);
        if (cached) return cached;
      }

      // For now, return empty array as token APIs might be different
      // This would need to be implemented based on specific token standard requirements
      const tokens: unknown[] = [];
      
      // Cache the result
      if (this.config.enableCache) {
        await this.cache.set(cacheKey, tokens, this.config.cacheTTL);
      }
      
      return tokens;
    } catch (error) {
      console.error(`Failed to get tokens for ${address}:`, error);
      return [];
    }
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  async getLedgerInfo(): Promise<unknown> {
    try {
      const cacheKey = 'ledger_info';
      
      // Check cache first
      if (this.config.enableCache) {
        const cached = await this.cache.get<unknown>(cacheKey);
        if (cached) return cached;
      }

      const ledgerInfo = await this.client.getLedgerInfo();
      
      // Cache the result with shorter TTL for ledger info
      if (this.config.enableCache) {
        await this.cache.set(cacheKey, ledgerInfo, 30); // 30 seconds for ledger info
      }
      
      return ledgerInfo;
    } catch (error) {
      console.error('Failed to get ledger info:', error);
      return null;
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async batchGetAccountsInfo(addresses: string[]): Promise<(AccountData | null)[]> {
    const promises = addresses.map(address => this.getAccountInfo(address));
    return Promise.all(promises);
  }

  async batchGetAccountsResources(addresses: string[]): Promise<MoveResource[][]> {
    const promises = addresses.map(address => this.getAccountResources(address));
    return Promise.all(promises);
  }

  async batchGetAptosCoinBalances(addresses: string[]): Promise<string[]> {
    const promises = addresses.map(address => this.getAptosCoinBalance(address));
    return Promise.all(promises);
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  async getCacheStats(): Promise<{ total: number; valid: number; expired: number }> {
    return this.cache.getStats();
  }
}

// ============================================================================
// DEFAULT CLIENT INSTANCE
// ============================================================================

export const aptosClient = new AptosClientWrapper({
  nodeUrl: process.env.NEXT_PUBLIC_APTOS_NODE_URL || 'https://api.mainnet.aptoslabs.com/v1',
  cacheTTL: 300, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  enableCache: true,
});

// Factory function for creating client instances
export function createAptosClient(config?: Partial<AptosClientConfig>): AptosClientWrapper {
  return new AptosClientWrapper({
    nodeUrl: process.env.NEXT_PUBLIC_APTOS_NODE_URL || 'https://api.mainnet.aptoslabs.com/v1',
    cacheTTL: 300, // 5 minutes
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    enableCache: true,
    ...config,
  });
}
