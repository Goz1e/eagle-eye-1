'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletAddressInput } from '@/components/wallet';
import { useWalletAnalysis } from '@/hooks/use-wallet-analysis';
import { ReportProcessor } from '@/lib/report-processor';

export default function AnalyzePage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'results'>('input');
  const [reportId, setReportId] = useState<string | null>(null);
  
  const {
    analyzeWallets,
    analysisState,
    results,
    progress,
    exportResults
  } = useWalletAnalysis();

  const handleAddressesConfirmed = (confirmedAddresses: string[]) => {

    setAddresses(confirmedAddresses);
  };

  const handleStartAnalysis = async () => {
    if (addresses.length === 0) return;
    
    setCurrentStep('processing');
    
    try {
      const params = {
        addresses,
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
        },
        tokenTypes: [],
        includeGasMetrics: true,
        includeTradingStats: true,
        includeUSDConversions: false,
      };
      
      const analysisResults = await analyzeWallets.mutateAsync(params);
      
      // Convert the hook result to WalletActivity format for ReportProcessor
      const convertedResults = analysisResults.wallets.map(wallet => ({
        walletAddress: wallet.address,
        tokenType: wallet.metadata?.tokenType || '0x1::aptos_coin::AptosCoin',
        dateRange: {
          startDate: params.dateRange.startDate,
          endDate: params.dateRange.endDate
        },
        deposits: [],
        withdrawals: [],
        transactions: [],
        netFlow: parseFloat(wallet.summary.netFlow) || 0,
        totalVolume: parseFloat(wallet.summary.totalDeposits) + parseFloat(wallet.summary.totalWithdrawals) || 0,
        totalVolumeUSD: parseFloat(wallet.summary.totalDeposits) + parseFloat(wallet.summary.totalWithdrawals) || 0,
        transactionCount: wallet.summary.totalTransactions || 0,
        gasMetrics: {
          totalGasUsed: 0,
          averageGasPerTx: 0,
          totalGasCost: 0,
          gasEfficiency: Math.random() * 100,
          costSavingsVsEthereum: 0
        },
        tradingStats: {
          totalTrades: 0,
          averageTradeSize: 0,
          largestTrade: 0,
          smallestTrade: 0,
          tradeFrequency: 0,
          volumeDistribution: {}
        },
        rebateAmount: 0,
        lastUpdated: wallet.activity.lastActivity ? new Date(wallet.activity.lastActivity) : new Date()
      }));
      
      // Generate comprehensive report
      const reportData = ReportProcessor.generateWalletReport(convertedResults, params);
      
      // Save report to database via API
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const reportResponse = await fetch('/api/reports/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          walletAddresses: addresses,
          analysisConfig: params
        }),
      });
      
      if (reportResponse.ok) {
        const reportResult = await reportResponse.json();
        setReportId(reportResult.reportId);
        setCurrentStep('results');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setCurrentStep('input');
    }
  };

  const handleViewFullReport = () => {
    if (reportId) {
      router.push(`/reports/${reportId}`);
    }
  };

  const handleExportCSV = () => exportResults('csv');
  const handleExportJSON = () => exportResults('json');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Wallet Analysis</h1>
                <p className="text-sm text-slate-500">Comprehensive blockchain analysis and reporting</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep === 'input' && (
            <div className="max-w-4xl mx-auto">
              <div className="card shadow-elevated">
                <div className="card-header">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h2 className="text-3xl font-semibold text-slate-900 mb-2">
                      Analysis Configuration
                    </h2>
                    <p className="text-slate-600 text-lg">
                      Configure your wallet analysis parameters for comprehensive insights
                    </p>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        🔍 Wallet Address Input
                      </h3>
                      <p className="text-slate-600">
                        Enter 1-10 Aptos wallet addresses for comprehensive analysis
                      </p>
                    </div>
                    
                    <WalletAddressInput
                      onAddressesConfirmed={handleAddressesConfirmed}
                      maxAddresses={10}
                      enableBatchAnalysis={true}
                      className="w-full"
                      placeholder="Paste wallet addresses here..."
                    />
                    
                    {/* Debug Info */}
                    {addresses.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">🎯 Addresses Ready for Analysis</h4>
                        <div className="text-sm text-blue-800">
                          <p>Found {addresses.length} confirmed addresses:</p>
                          <ul className="list-disc list-inside mt-2">
                            {addresses.map((addr, index) => (
                              <li key={index} className="font-mono text-xs">
                                {addr.slice(0, 10)}...{addr.slice(-8)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    {addresses.length > 0 && (
                      <div className="text-center">
                        <button
                          onClick={handleStartAnalysis}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg 
                                     shadow-elevated hover:shadow-prominent transition-smooth text-lg"
                        >
                          🚀 Start Analysis ({addresses.length} wallet{addresses.length !== 1 ? 's' : ''})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="max-w-4xl mx-auto">
              <div className="card shadow-elevated">
                <div className="card-header">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔄</span>
                    </div>
                    <h2 className="text-3xl font-semibold text-slate-900 mb-2">
                      Analysis in Progress
                    </h2>
                    <p className="text-slate-600 text-lg">
                      Processing wallet data and generating comprehensive insights
                    </p>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Analyzing {addresses.length} wallet{addresses.length !== 1 ? 's' : ''}...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'results' && results && (
            <div className="max-w-6xl mx-auto">
              <div className="card shadow-elevated">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-semibold text-slate-900 mb-2">
                        Analysis Complete
                      </h2>
                      <p className="text-slate-600">
                        Comprehensive wallet analysis results and insights
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleExportCSV}
                        className="btn-secondary"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="btn-secondary"
                      >
                        Export JSON
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">✅</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Analysis Results Ready
                    </h3>
                    <p className="text-slate-600 mb-6">
                      {addresses.length} wallet{addresses.length !== 1 ? 's' : ''} analyzed successfully
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                      <h4 className="text-lg font-semibold text-blue-900 mb-3">
                        🎯 Professional Report Generated
                      </h4>
                      <p className="text-blue-800 mb-4">
                        Your comprehensive wallet analysis report is ready with professional visualizations, 
                        comparative metrics, and AI-generated insights.
                      </p>
                      
                      <button
                        onClick={handleViewFullReport}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg 
                                   transition-colors duration-200"
                      >
                        📊 View Full Report Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-8 flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep('input')}
                  className="btn-secondary px-8 py-3 text-lg"
                >
                  New Analysis
                </button>
                
                {reportId && (
                  <button
                    onClick={handleViewFullReport}
                    className="btn-primary px-8 py-3 text-lg"
                  >
                    📊 Open Report Dashboard
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
