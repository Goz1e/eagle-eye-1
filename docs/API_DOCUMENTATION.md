# Eagle Eye API Documentation

## Overview

The Eagle Eye API provides comprehensive blockchain analytics and reporting capabilities for the Aptos blockchain. Built with Next.js 14 App Router, it features robust rate limiting, validation, error handling, and caching mechanisms.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API is open for development. In production, implement JWT or API key authentication.

## Rate Limiting

- **Wallet Events**: 50 requests per minute
- **Wallet Transactions**: 50 requests per minute  
- **Wallet Balance**: 100 requests per minute
- **Prices**: 200 requests per minute (GET), 100 requests per minute (POST)
- **Reports**: 20 requests per minute (POST), 100 requests per minute (GET)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  },
  "timestamp": "2024-08-25T14:00:00.000Z"
}
```

## Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `INTERNAL_SERVER_ERROR`: Unexpected server error
- `WALLET_EVENTS_ERROR`: Wallet events fetch failed
- `WALLET_TRANSACTIONS_ERROR`: Wallet transactions analysis failed
- `WALLET_BALANCE_ERROR`: Wallet balance fetch failed
- `PRICES_FETCH_ERROR`: Token prices fetch failed
- `REPORT_CREATION_ERROR`: Report creation failed
- `REPORT_NOT_FOUND`: Report not found
- `REPORT_GENERATION_FAILED`: Report generation failed

---

## 1. Wallet Events API

### Endpoint
```
POST /api/wallet/events
```

### Description
Fetches deposit and withdraw events for multiple wallets and token types within a specified date range.

### Request Body
```json
{
  "walletAddresses": ["0x123...", "0x456..."],
  "tokenTypes": ["0x1::aptos_coin::AptosCoin", "0x1::coin::Coin<0x1::usdt::USDT>"],
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-08-25T23:59:59.999Z",
  "limit": 100
}
```

### Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalWallets": 2,
      "totalTokenTypes": 2,
      "totalDepositEvents": 15,
      "totalWithdrawEvents": 8,
      "totalEvents": 23,
      "successfulRequests": 2,
      "failedRequests": 0
    },
    "results": [
      {
        "walletAddress": "0x123...",
        "tokenType": "0x1::aptos_coin::AptosCoin",
        "depositEvents": {
          "count": 10,
          "events": [...]
        },
        "withdrawEvents": {
          "count": 5,
          "events": [...]
        },
        "totalEvents": 15
      }
    ],
    "pagination": {
      "limit": 100,
      "totalResults": 2,
      "hasMore": false
    }
  },
  "message": "Wallet events fetched successfully",
  "meta": {
    "requestId": "req_1234567890_abc123",
    "processingTime": 150,
    "dateRange": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-08-25T23:59:59.999Z"
    }
  },
  "timestamp": "2024-08-25T14:00:00.000Z"
}
```

---

## 2. Wallet Transactions API

### Endpoint
```
POST /api/wallet/transactions
```

### Description
Analyzes transaction counts, gas usage, and calculates fee savings compared to Ethereum.

### Request Body
```json
{
  "walletAddresses": ["0x123...", "0x456..."],
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-08-25T23:59:59.999Z"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalWallets": 2,
      "totalTransactions": 150,
      "totalGasUsed": 150000,
      "totalAptosCost": 0.00015,
      "totalEthereumCost": 0.003,
      "totalSavings": 0.00285,
      "averageSavingsPerWallet": 0.001425,
      "successfulRequests": 2,
      "failedRequests": 0
    },
    "results": [
      {
        "walletAddress": "0x123...",
        "transactionCount": 75,
        "gasUsage": {
          "totalGas": 75000,
          "averageGasPerTx": 1000,
          "estimatedCost": 0.000075
        },
        "ethereumComparison": {
          "ethereumGasUsage": 1575000,
          "ethereumCost": 0.0015,
          "costSavings": 0.001425,
          "savingsPercentage": 95.0
        },
        "accountInfo": {
          "sequenceNumber": "12345",
          "hasCoinResources": true,
          "hasTokenResources": false
        }
      }
    ],
    "analysis": {
      "costEfficiency": {
        "aptosCostPerTx": 0.000001,
        "ethereumCostPerTx": 0.00002,
        "costSavingsPerTx": 0.000019
      },
      "gasEfficiency": {
        "aptosGasPerTx": 1000,
        "ethereumGasPerTx": 21000,
        "gasSavingsPerTx": 20000
      }
    }
  },
  "message": "Wallet transactions analyzed successfully",
  "meta": {
    "requestId": "req_1234567890_abc123",
    "processingTime": 200,
    "dateRange": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-08-25T23:59:59.999Z"
    }
  },
  "timestamp": "2024-08-25T14:00:00.000Z"
}
```

---

## 3. Wallet Balance API

### Endpoint
```
POST /api/wallet/balance
```

### Description
Fetches current and historical balance snapshots for multiple wallets and tokens.

### Request Body
```json
{
  "walletAddresses": ["0x123...", "0x456..."],
  "tokenTypes": ["0x1::aptos_coin::AptosCoin", "0x1::coin::Coin<0x1::usdt::USDT>"],
  "includeHistory": true
}
```

### Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalWallets": 2,
      "successfulRequests": 2,
      "failedRequests": 0,
      "totalCoins": 3,
      "totalTokens": 2,
      "totalBalance": 1250.75,
      "averageBalancePerWallet": 625.375
    },
    "results": [
      {
        "walletAddress": "0x123...",
        "accountInfo": {
          "sequenceNumber": "12345",
          "authenticationKey": "0xabc..."
        },
        "balances": {
          "coins": [
            {
              "tokenType": "0x1::aptos_coin::AptosCoin",
              "symbol": "APT",
              "balance": "1000.5",
              "balanceRaw": "100050000000",
              "decimals": 8,
              "isNative": true
            }
          ],
          "tokens": [
            {
              "tokenType": "0x1::coin::Coin<0x1::usdt::USDT>",
              "symbol": "USDT",
              "balance": "250.25",
              "balanceRaw": "250250000",
              "decimals": 6,
              "tokenId": "0x1::usdt::USDT",
              "properties": {}
            }
          ],
          "total": 2
        },
        "summary": {
          "totalCoinBalance": 1000.5,
          "totalTokenBalance": 250.25,
          "uniqueTokens": 2
        },
        "historicalData": [
          {
            "date": "2024-08-24",
            "balance": 1245.30,
            "change": -5.45
          }
        ],
        "balanceAnalysis": {
          "trend": "decreasing",
          "averageChange": -2.725,
          "volatility": 15.25,
          "maxBalance": 1280.50,
          "minBalance": 1200.00
        }
      }
    ],
    "metadata": {
      "requestedTokenTypes": ["0x1::aptos_coin::AptosCoin", "0x1::coin::Coin<0x1::usdt::USDT>"],
      "includeHistory": true,
      "timestamp": "2024-08-25T14:00:00.000Z"
    }
  },
  "message": "Wallet balances fetched successfully",
  "meta": {
    "requestId": "req_1234567890_abc123",
    "processingTime": 300
  },
  "timestamp": "2024-08-25T14:00:00.000Z"
}
```

---

## 4. Prices API

### Endpoint
```
GET /api/prices
```

### Description
Fetches current token prices from DefiLlama with caching and fallback to mock data.

### Response
```json
{
  "success": true,
  "data": {
    "prices": {
      "APT": 8.50,
      "USDT": 1.00,
      "USDC": 1.00,
      "BTC": 45000.00,
      "ETH": 2800.00
    },
    "totalTokens": 5,
    "source": "DefiLlama + Fallback",
    "lastUpdated": "2024-08-25T14:00:00.000Z"
  },
  "message": "Token prices fetched successfully",
  "meta": {
    "requestId": "req_1234567890_abc123",
    "processingTime": 150
  },
  "timestamp": "2024-08-25T14:00:00.000Z"
}
```

### Endpoint
```
POST /api/prices
```

### Description
Fetches prices for specific tokens.

### Request Body
```json
{
  "tokens": ["APT", "USDT", "BTC"]
}
```

### Endpoint
```
DELETE /api/prices
```

### Description
Clears the price cache.

---

## 5. Reports API

### Endpoint
```
POST /api/reports
```

### Description
Creates a new report generation request.

### Request Body
```json
{
  "title": "Monthly Portfolio Analysis",
  "description": "Comprehensive analysis of wallet portfolio for August 2024",
  "walletAddresses": ["0x123...", "0x456..."],
  "tokenTypes": ["0x1::aptos_coin::AptosCoin", "0x1::coin::Coin<0x1::usdt::USDT>"],
  "startDate": "2024-08-01T00:00:00.000Z",
  "endDate": "2024-08-31T23:59:59.999Z",
  "format": "pdf",
  "priority": "medium"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "reportId": "report_1732540800000_abc123",
    "status": "pending",
    "estimatedProcessingTime": 15000,
    "report": {
      "id": "report_1732540800000_abc123",
      "title": "Monthly Portfolio Analysis",
      "status": "pending",
      "createdAt": "2024-08-25T14:00:00.000Z",
      "priority": "medium",
      "format": "pdf"
    }
  },
  "message": "Report creation initiated successfully",
  "meta": {
    "requestId": "req_1234567890_abc123",
    "processingTime": 50,
    "estimatedCompletion": "2024-08-25T14:00:15.000Z"
  },
  "timestamp": "2024-08-25T14:00:00.000Z"
}
```

### Endpoint
```
GET /api/reports
```

### Description
Retrieves a list of reports with optional filtering.

### Query Parameters
- `status`: Filter by status (pending, completed, failed)
- `priority`: Filter by priority (low, medium, high)
- `format`: Filter by format (pdf, csv, json)
- `limit`: Number of reports per page (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

### Endpoint
```
GET /api/reports/{reportId}
```

### Description
Retrieves a specific report by ID.

---

## CORS Support

All endpoints support CORS for local development:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Max-Age: 86400
```

## Response Compression

Large responses are automatically compressed for optimal performance.

## Logging

All API requests and responses are logged with:
- Request ID for tracking
- Processing time
- Client IP address
- User agent
- Request/response data size

## Development Notes

- The API uses mock data for historical balances and some calculations
- Report generation is simulated with background job processing
- Price fetching falls back to mock data if DefiLlama is unavailable
- All endpoints include comprehensive error handling and validation

## Testing

Test the API endpoints using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

Example curl command:
```bash
curl -X POST http://localhost:3000/api/wallet/events \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddresses": ["0x123..."],
    "tokenTypes": ["0x1::aptos_coin::AptosCoin"],
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-08-25T23:59:59.999Z"
  }'
```
