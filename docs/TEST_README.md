# 🦅 Eagle Eye Test Suite

This document explains how to test Eagle Eye's core wallet analysis functionality using the comprehensive test suite we've created.

## 🚀 Quick Start

1. **Navigate to the test page**: Visit `/test` in your browser
2. **Use sample data**: Click "Load Samples" to populate with test wallet addresses
3. **Run analysis**: Click "Analyze Wallet" or "Analyze Batch" to test functionality

## 📍 Test Routes

### 1. Single Wallet Analysis
- **Route**: `/api/test/wallet-analysis`
- **Method**: `POST`
- **Input**: `{ "walletAddress": "0x..." }`
- **Features**:
  - Real-time wallet activity analysis
  - USDT transaction tracking over last 30 days
  - Gas efficiency metrics
  - Trading statistics
  - Rebate calculations (0.01% of volume)

### 2. Batch Wallet Analysis
- **Route**: `/api/test/batch-analysis`
- **Method**: `POST`
- **Input**: `{ "walletAddresses": ["0x...", "0x..."] }`
- **Features**:
  - Process up to 10 wallet addresses simultaneously
  - Progress tracking and monitoring
  - Aggregated metrics across wallets
  - Individual wallet results

## 🧪 Testing Scenarios

### Single Wallet Testing
1. **Valid Address**: Enter a real Aptos wallet address
2. **Invalid Format**: Test with malformed addresses
3. **Empty Input**: Test validation error handling
4. **Rate Limiting**: Test API rate limit handling

### Batch Testing
1. **Multiple Addresses**: Test with 3-5 wallet addresses
2. **Progress Tracking**: Monitor batch processing progress
3. **Error Handling**: Test with invalid addresses in batch
4. **Performance**: Test processing time for different batch sizes

## 📊 Expected Results

### Single Wallet Analysis Returns:
```json
{
  "success": true,
  "walletAddress": "0x...",
  "analysis": {
    "netFlow": 1500.50,
    "totalVolume": 50000.00,
    "totalVolumeUSD": 50000.00,
    "transactionCount": 25,
    "gasMetrics": {
      "totalGasUsed": 0.005,
      "gasEfficiency": 0.85,
      "costSavingsVsEthereum": 12.50
    },
    "tradingStats": {
      "totalTrades": 25,
      "averageTradeSize": 2000.00,
      "tradeFrequency": 0.83
    },
    "rebateAmount": 5.00
  }
}
```

### Batch Analysis Returns:
```json
{
  "success": true,
  "batchSize": 3,
  "aggregatedMetrics": {
    "totalVolumeUSD": 150000.00,
    "totalTransactions": 75,
    "totalRebates": 15.00,
    "averageNetFlow": 500.00
  },
  "individualResults": [
    {
      "walletAddress": "0x...",
      "totalVolumeUSD": 50000.00,
      "transactionCount": 25,
      "rebateAmount": 5.00
    }
  ]
}
```

## 🔧 Technical Details

### Dependencies Used
- **Wallet Analyzer**: Core analysis engine from `/src/lib/aggregator.ts`
- **Batch Processor**: Simple batch processing from `/src/lib/simple-batch.ts`
- **Normalization**: Data conversion utilities from `/src/lib/normalization.ts`
- **Aptos Client**: Blockchain data fetching from `/src/lib/aptos-client.ts`

### Error Handling
- **Input Validation**: Aptos address format validation
- **API Errors**: Rate limiting, timeouts, and network issues
- **User Feedback**: Clear error messages and status updates

### Performance Features
- **Caching**: Built-in caching for repeated requests
- **Progress Tracking**: Real-time batch processing updates
- **Concurrency**: Configurable batch processing limits

## 🎯 Test Cases

### 1. **Basic Functionality**
- ✅ Single wallet analysis
- ✅ Batch wallet analysis
- ✅ Input validation
- ✅ Error handling

### 2. **Edge Cases**
- ✅ Empty input validation
- ✅ Invalid address format
- ✅ Maximum batch size limits
- ✅ Network error handling

### 3. **Performance**
- ✅ Response time monitoring
- ✅ Memory usage during batch processing
- ✅ Cache hit rate tracking

### 4. **User Experience**
- ✅ Loading states
- ✅ Progress indicators
- ✅ Clear result display
- ✅ Sample data loading

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed with `pnpm install`
2. **API Errors**: Check console for detailed error messages
3. **Slow Performance**: Monitor batch size and reduce if needed
4. **Rate Limiting**: Wait between requests if hitting API limits

### Debug Mode

Enable detailed logging by checking the browser console and server logs for:
- API request/response details
- Processing time metrics
- Cache hit/miss information
- Error stack traces

## 🔮 Future Enhancements

- **Real-time Updates**: WebSocket integration for live data
- **Advanced Metrics**: More sophisticated trading analysis
- **Export Functionality**: CSV/PDF report generation
- **Historical Data**: Extended time range analysis
- **Multi-token Support**: Analysis across different tokens

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify API endpoint availability
3. Test with sample wallet addresses first
4. Review the build logs for compilation issues

---

**Happy Testing! 🧪✨**

Your Eagle Eye test suite is now ready to validate the core wallet analysis functionality from API to UI.
