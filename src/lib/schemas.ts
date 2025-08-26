import { z } from 'zod';

/**
 * Zod validation schemas for Eagle Eye
 * Provides client and server-side validation for all data types
 */

/**
 * Aptos wallet address validation
 * Validates that the address follows Aptos format (0x followed by 64 hex characters)
 */
export const aptosAddressSchema = z
  .string()
  .min(66, 'Address must be 66 characters long (0x + 64 hex chars)')
  .max(66, 'Address must be 66 characters long (0x + 64 hex chars)')
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Aptos address format. Must be 0x followed by 64 hexadecimal characters')
  .transform((val) => val.toLowerCase()); // Normalize to lowercase

/**
 * Date range validation schema
 * Ensures start date is before end date and dates are not in the future
 */
export const dateRangeSchema = z.object({
  start: z
    .string()
    .datetime('Start date must be a valid ISO 8601 datetime string')
    .refine(
      (date) => new Date(date) <= new Date(),
      'Start date cannot be in the future'
    ),
  end: z
    .string()
    .datetime('End date must be a valid ISO 8601 datetime string')
    .refine(
      (date) => new Date(date) <= new Date(),
      'End date cannot be in the future'
    ),
  timezone: z
    .string()
    .regex(
      /^[A-Za-z_]+(?:\/[A-Za-z_]+)*$/,
      'Invalid timezone format. Use IANA timezone identifier (e.g., America/New_York)'
    )
    .optional(),
  granularity: z
    .enum(['hour', 'day', 'week', 'month', 'quarter', 'year'])
    .optional()
    .default('day'),
}).refine(
  (data) => new Date(data.start) < new Date(data.end),
  {
    message: 'Start date must be before end date',
    path: ['start'], // This will show the error on the start field
  }
);

/**
 * Token type validation schema
 * Validates token type identifiers and ensures they follow Aptos format
 */
export const tokenTypeSchema = z
  .string()
  .min(1, 'Token type cannot be empty')
  .regex(
    /^0x[a-fA-F0-9]{1,64}::[a-zA-Z][a-zA-Z0-9_]*::[a-zA-Z][a-zA-Z0-9_]*$/,
    'Invalid token type format. Must follow pattern: 0x{address}::{module}::{name}'
  )
  .transform((val) => val.toLowerCase()); // Normalize to lowercase

/**
 * Supported token categories
 */
export const tokenCategorySchema = z.enum(['native', 'stablecoin', 'defi', 'nft', 'other']);

/**
 * Supported token schema
 * Validates token information for the platform
 */
export const supportedTokenSchema = z.object({
  tokenType: tokenTypeSchema,
  symbol: z
    .string()
    .min(1, 'Token symbol cannot be empty')
    .max(10, 'Token symbol cannot exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Token symbol must contain only uppercase letters and numbers'),
  name: z
    .string()
    .min(1, 'Token name cannot be empty')
    .max(100, 'Token name cannot exceed 100 characters'),
  isActive: z.boolean(),
  priority: z
    .number()
    .int('Priority must be an integer')
    .min(1, 'Priority must be at least 1')
    .max(100, 'Priority cannot exceed 100'),
  category: tokenCategorySchema,
  logoUrl: z
    .string()
    .url('Logo URL must be a valid URL')
    .optional(),
  websiteUrl: z
    .string()
    .url('Website URL must be a valid URL')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  addedAt: z.string().datetime('Added date must be a valid ISO 8601 datetime string'),
  lastUpdated: z.string().datetime('Last updated date must be a valid ISO 8601 datetime string'),
});

/**
 * Report request priority levels
 */
export const reportPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);

/**
 * Report format options
 */
export const reportFormatSchema = z.enum(['json', 'csv', 'pdf']);

/**
 * Report request schema
 * Validates wallet report generation requests
 */
export const reportRequestSchema = z.object({
  requestId: z
    .string()
    .min(1, 'Request ID cannot be empty')
    .regex(/^req_[a-zA-Z0-9_]+$/, 'Request ID must start with "req_" and contain only alphanumeric characters and underscores'),
  walletAddress: aptosAddressSchema,
  timeRange: dateRangeSchema,
  tokenTypes: z
    .array(tokenTypeSchema)
    .min(0, 'Token types array cannot be negative')
    .max(100, 'Cannot specify more than 100 token types')
    .optional(),
  includeTransactions: z.boolean(),
  includeBalances: z.boolean(),
  includeDefiInteractions: z.boolean(),
  includeNFTs: z.boolean(),
  format: reportFormatSchema,
  priority: reportPrioritySchema,
  requestedBy: z
    .string()
    .email('Requested by must be a valid email address')
    .min(1, 'Requested by cannot be empty'),
  requestedAt: z.string().datetime('Request timestamp must be a valid ISO 8601 datetime string'),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).default('pending'),
  errorMessage: z
    .string()
    .max(1000, 'Error message cannot exceed 1000 characters')
    .optional(),
  estimatedCompletion: z
    .string()
    .datetime('Estimated completion must be a valid ISO 8601 datetime string')
    .optional(),
}).refine(
  (data) => {
    // Ensure at least one analysis type is selected
    return data.includeTransactions || data.includeBalances || data.includeDefiInteractions || data.includeNFTs;
  },
  {
    message: 'At least one analysis type must be selected (transactions, balances, DeFi interactions, or NFTs)',
    path: ['includeTransactions'],
  }
);

/**
 * Transaction status validation
 */
export const transactionStatusSchema = z.enum(['success', 'failure', 'pending']);

/**
 * Transaction payload type validation
 */
export const transactionPayloadTypeSchema = z.enum(['entry_function_payload', 'script_payload', 'module_bundle_payload']);

/**
 * Aptos transaction schema
 * Validates blockchain transaction data
 */
export const aptosTransactionSchema = z.object({
  version: z
    .string()
    .regex(/^\d+$/, 'Version must be a numeric string'),
  hash: z
    .string()
    .regex(/^0x[a-f9]{64}$/, 'Transaction hash must be 0x followed by 64 hex characters'),
  blockHeight: z
    .string()
    .regex(/^\d+$/, 'Block height must be a numeric string'),
  timestamp: z.string().datetime('Timestamp must be a valid ISO 8601 datetime string'),
  sender: aptosAddressSchema,
  sequenceNumber: z
    .string()
    .regex(/^\d+$/, 'Sequence number must be a numeric string'),
  maxGasAmount: z
    .string()
    .regex(/^\d+$/, 'Max gas amount must be a numeric string'),
  gasUnitPrice: z
    .string()
    .regex(/^\d+$/, 'Gas unit price must be a numeric string'),
  gasUsed: z
    .string()
    .regex(/^\d+$/, 'Gas used must be a numeric string'),
  status: transactionStatusSchema,
  payload: z.object({
    type: transactionPayloadTypeSchema,
    function: z.string().optional(),
    typeArguments: z.array(z.string()).optional(),
    arguments: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
    code: z.string().optional(),
    modules: z.array(z.string()).optional(),
  }),
  events: z.array(z.unknown()).default([]), // Will be validated separately
  signature: z.object({
    type: z.string().min(1, 'Signature type cannot be empty'),
    publicKey: z.string().min(1, 'Public key cannot be empty'),
    signature: z.string().min(1, 'Signature cannot be empty'),
  }),
  expirationTimestampSecs: z
    .string()
    .regex(/^\d+$/, 'Expiration timestamp must be a numeric string'),
});

/**
 * Coin event data schema
 * Validates token transfer event information
 */
export const coinEventDataSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+$/, 'Amount must be a numeric string'),
  coinType: tokenTypeSchema,
  counterparty: aptosAddressSchema,
  eventType: z.enum(['deposit', 'withdraw']),
});

/**
 * Coin event schema
 * Validates blockchain event data
 */
export const coinEventSchema = z.object({
  sequenceNumber: z
    .string()
    .regex(/^\d+$/, 'Sequence number must be a numeric string'),
  type: z.string().min(1, 'Event type cannot be empty'),
  data: coinEventDataSchema,
  key: z.string().min(1, 'Event key cannot be empty'),
  guid: z.string().min(1, 'GUID cannot be empty'),
});

/**
 * Token metadata schema
 * Validates token information and metadata
 */
export const tokenMetadataSchema = z.object({
  tokenType: tokenTypeSchema,
  name: z.string().min(1, 'Token name cannot be empty'),
  symbol: z
    .string()
    .min(1, 'Token symbol cannot be empty')
    .max(10, 'Token symbol cannot exceed 10 characters'),
  decimals: z
    .number()
    .int('Decimals must be an integer')
    .min(0, 'Decimals cannot be negative')
    .max(18, 'Decimals cannot exceed 18'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  logoUrl: z.string().url('Logo URL must be a valid URL').optional(),
  websiteUrl: z.string().url('Website URL must be a valid URL').optional(),
  creatorAddress: aptosAddressSchema.optional(),
  supply: z.object({
    total: z.string().regex(/^\d+$/, 'Total supply must be a numeric string'),
    circulating: z.string().regex(/^\d+$/, 'Circulating supply must be a numeric string'),
    max: z.string().regex(/^\d+$/, 'Max supply must be a numeric string').optional(),
  }).optional(),
});

/**
 * Wallet info schema
 * Validates comprehensive wallet information
 */
export const walletInfoSchema = z.object({
  address: aptosAddressSchema,
  sequenceNumber: z
    .string()
    .regex(/^\d+$/, 'Sequence number must be a numeric string'),
  authenticationKey: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, 'Authentication key must be 0x followed by 64 hex characters'),
  createdAtTimestamp: z.string().datetime('Creation timestamp must be a valid ISO 8601 datetime string'),
  createdAtVersion: z
    .string()
    .regex(/^\d+$/, 'Creation version must be a numeric string'),
  aptBalance: z
    .string()
    .regex(/^\d+$/, 'Transaction hash must be a numeric string'),
  tokenBalances: z.array(z.object({
    tokenType: tokenTypeSchema,
    amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
    metadata: tokenMetadataSchema,
    lastUpdated: z.string().datetime('Last updated must be a valid ISO 8601 datetime string'),
  })),
  resources: z.array(z.object({
    type: z.string().min(1, 'Resource type cannot be empty'),
    data: z.record(z.string(), z.unknown()),
    version: z.string().regex(/^\d+$/, 'Resource version must be a numeric string'),
  })),
  modules: z.array(z.object({
    name: z.string().min(1, 'Module name cannot be empty'),
    bytecode: z.string().min(1, 'Module bytecode cannot be empty'),
    version: z.string().regex(/^\d+$/, 'Module version must be a numeric string'),
    dependencies: z.array(z.string()),
  })),
});

/**
 * API response schema
 * Generic schema for API responses
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    success: z.boolean(),
    message: z.string().optional(),
    timestamp: z.string().datetime('Timestamp must be a valid ISO 8601 datetime string').default(() => new Date().toISOString()),
    requestId: z.string().optional(),
  });

/**
 * Paginated response schema
 * Schema for paginated API responses
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number().int('Total must be an integer').min(0, 'Total cannot be negative'),
    page: z.number().int('Page must be an integer').min(1, 'Page must be at least 1'),
    limit: z.number().int('Limit must be an integer').min(1, 'Limit must be at least 1').max(1000, 'Limit cannot exceed 1000'),
    totalPages: z.number().int('Total pages must be an integer').min(0, 'Total pages cannot be negative'),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  });

/**
 * Error response schema
 * Schema for API error responses
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().min(1, 'Error code cannot be empty'),
    message: z.string().min(1, 'Error message cannot be empty'),
    details: z.unknown().optional(),
    timestamp: z.string().datetime('Timestamp must be a valid ISO 8601 datetime string').default(() => new Date().toISOString()),
    requestId: z.string().optional(),
  }),
});

/**
 * Validation error schema
 * Schema for API error responses
 */
export const validationErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.literal('VALIDATION_ERROR'),
    message: z.string().min(1, 'Validation error message cannot be empty'),
    details: z.array(z.object({
      field: z.string().min(1, 'Field name cannot be empty'),
      message: z.string().min(1, 'Field error message cannot be empty'),
      value: z.unknown().optional(),
    })),
    timestamp: z.string().datetime('Timestamp must be a valid ISO 8601 datetime string').default(() => new Date().toISOString()),
    requestId: z.string().optional(),
  }),
});

/**
 * Utility function to create a validation error response
 */
export const createValidationError = (errors: z.ZodError, requestId?: string) => ({
  success: false as const,
  error: {
    code: 'VALIDATION_ERROR' as const,
    message: 'Validation failed',
    details: errors.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.input,
    })),
    timestamp: new Date().toISOString(),
    requestId,
  },
});

/**
 * Utility function to validate and parse data with proper error handling
 */
export const validateAndParse = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  requestId?: string
): { success: true; data: T } | { success: false; error: unknown } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: createValidationError(error, requestId) };
    }
    return {
      success: false,
      error: {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred during validation',
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
    };
  }
};
