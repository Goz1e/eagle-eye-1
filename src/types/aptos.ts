/**
 * Aptos blockchain transaction interface
 * Represents a complete transaction on the Aptos blockchain
 */
export interface AptosTransaction {
  /** Unique transaction hash/version */
  version: string;
  /** Transaction hash */
  hash: string;
  /** Block height where transaction was included */
  blockHeight: string;
  /** Timestamp when transaction was executed */
  timestamp: string;
  /** Transaction sender address */
  sender: string;
  /** Transaction sequence number for the sender */
  sequenceNumber: string;
  /** Maximum gas amount for the transaction */
  maxGasAmount: string;
  /** Gas unit price */
  gasUnitPrice: string;
  /** Gas used by the transaction */
  gasUsed: string;
  /** Transaction status: success, failure, or pending */
  status: 'success' | 'failure' | 'pending';
  /** Transaction payload details */
  payload: TransactionPayload;
  /** Events emitted during transaction execution */
  events: CoinEvent[];
  /** Transaction signature */
  signature: TransactionSignature;
  /** Transaction expiration timestamp */
  expirationTimestampSecs: string;
}

/**
 * Transaction payload interface
 * Defines the type and data of the transaction
 */
export interface TransactionPayload {
  /** Type of transaction */
  type: 'entry_function_payload' | 'script_payload' | 'module_bundle_payload';
  /** Function identifier for entry function calls */
  function?: string;
  /** Type arguments for generic functions */
  typeArguments?: string[];
  /** Function arguments */
  arguments?: (string | number | boolean)[];
  /** Script bytecode for script payloads */
  code?: string;
  /** Module bytecode for module bundle payloads */
  modules?: string[];
}

/**
 * Transaction signature interface
 * Contains the cryptographic proof of transaction authorization
 */
export interface TransactionSignature {
  /** Type of signature (e.g., ed25519_signature) */
  type: string;
  /** Public key of the signer */
  publicKey: string;
  /** Signature value */
  signature: string;
}

/**
 * Coin event interface
 * Represents deposit/withdraw events for tokens
 */
export interface CoinEvent {
  /** Unique event sequence number */
  sequenceNumber: string;
  /** Event type identifier */
  type: string;
  /** Event data containing coin information */
  data: CoinEventData;
  /** Event key for indexing */
  key: string;
  /** GUID (globally unique identifier) */
  guid: string;
}

/**
 * Coin event data interface
 * Contains the actual coin transfer information
 */
export interface CoinEventData {
  /** Amount of tokens transferred */
  amount: string;
  /** Token type (e.g., 0x1::aptos_coin::AptosCoin) */
  coinType: string;
  /** Counterparty address (sender or receiver) */
  counterparty: string;
  /** Event type: deposit or withdraw */
  eventType: 'deposit' | 'withdraw';
}

/**
 * Token metadata interface
 * Contains information about a specific token type
 */
export interface TokenMetadata {
  /** Full token type identifier */
  tokenType: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Number of decimal places */
  decimals: number;
  /** Token description */
  description?: string;
  /** Token logo URL */
  logoUrl?: string;
  /** Token website URL */
  websiteUrl?: string;
  /** Token creator address */
  creatorAddress?: string;
  /** Token supply information */
  supply?: {
    /** Total supply */
    total: string;
    /** Circulating supply */
    circulating: string;
    /** Maximum supply (if applicable) */
    max?: string;
  };
}

/**
 * Wallet information interface
 * Contains comprehensive wallet details and balances
 */
export interface WalletInfo {
  /** Wallet address */
  address: string;
  /** Account sequence number */
  sequenceNumber: string;
  /** Account authentication key */
  authenticationKey: string;
  /** Account creation timestamp */
  createdAtTimestamp: string;
  /** Account creation transaction version */
  createdAtVersion: string;
  /** Current account balance in APT */
  aptBalance: string;
  /** Token balances for this wallet */
  tokenBalances: TokenBalance[];
  /** Account resource information */
  resources: AccountResource[];
  /** Account modules (if it's a contract account) */
  modules: AccountModule[];
}

/**
 * Token balance interface
 * Represents the balance of a specific token for a wallet
 */
export interface TokenBalance {
  /** Token type identifier */
  tokenType: string;
  /** Current balance amount */
  amount: string;
  /** Token metadata */
  metadata: TokenMetadata;
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Account resource interface
 * Represents a resource stored in an account
 */
export interface AccountResource {
  /** Resource type identifier */
  type: string;
  /** Resource data */
  data: Record<string, unknown>;
  /** Resource version */
  version: string;
}

/**
 * Account module interface
 * Represents a module deployed by an account
 */
export interface AccountModule {
  /** Module name */
  name: string;
  /** Module bytecode */
  bytecode: string;
  /** Module version */
  version: string;
  /** Module dependencies */
  dependencies: string[];
}

/**
 * Transaction summary interface
 * Provides a high-level overview of transaction activity
 */
export interface TransactionSummary {
  /** Total number of transactions */
  totalTransactions: number;
  /** Number of successful transactions */
  successfulTransactions: number;
  /** Number of failed transactions */
  failedTransactions: number;
  /** Total gas used across all transactions */
  totalGasUsed: string;
  /** Total fees paid */
  totalFees: string;
  /** First transaction timestamp */
  firstTransaction: string;
  /** Last transaction timestamp */
  lastTransaction: string;
  /** Transaction types breakdown */
  transactionTypes: Record<string, number>;
  /** Most active counterparties */
  topCounterparties: Array<{
    address: string;
    transactionCount: number;
    totalVolume: string;
  }>;
}
