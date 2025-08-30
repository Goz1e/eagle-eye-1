'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface WalletReportData {
  summary: {
    totalWallets: number;
    totalPortfolioValue: number;
    totalTransactionCount: number;
    averageGasUsed: number;
    gasSavingsUSD: number;
    activeWalletCount: number;
    averageBalanceUSD: number;
    totalVolumeUSD: number;
  };
  wallets: Array<{
    walletAddress: string;
    totalVolumeUSD: number;
    transactionCount: number;
    lastUpdated: string;
    netFlow: number;
    gasMetrics: {
      totalGasUsed: number;
      averageGasPerTx: number;
      totalGasCost: number;
      gasEfficiency: number;
      costSavingsVsEthereum: number;
    };
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export default function ReportViewPage() {
  const params = useParams();
  const reportId = params.id as string;
  
  const [reportData, setReportData] = useState<WalletReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId);
    }
  }, [reportId]);

  const fetchReport = async (id: string) => {
    try {
      setLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/reports/generate?id=${id}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const data = await response.json();
      setReportData(data.report.walletData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Failed to Load Report
          </h2>
          <p className="text-slate-600 mb-4">
            {error || 'The requested report could not be found or loaded.'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Wallet Analysis Report
              </h1>
              <p className="text-slate-600 mt-2">
                Report ID: {reportId}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={() => {
                  const csv = JSON.stringify(reportData, null, 2);
                  const blob = new Blob([csv], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `report-${reportId}.json`;
                  a.click();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Wallets</h3>
            <p className="text-2xl font-bold text-slate-900">{reportData.summary.totalWallets}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Volume</h3>
            <p className="text-2xl font-bold text-slate-900">${reportData.summary.totalVolumeUSD.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Transactions</h3>
            <p className="text-2xl font-bold text-slate-900">{reportData.summary.totalTransactionCount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Portfolio Value</h3>
            <p className="text-2xl font-bold text-slate-900">${reportData.summary.totalPortfolioValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Wallet Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Wallet Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Address</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Volume (USD)</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Transactions</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-600">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {reportData.wallets.map((wallet, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">
                        {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                      </code>
                    </td>
                    <td className="py-3 px-4">${wallet.totalVolumeUSD.toLocaleString()}</td>
                    <td className="py-3 px-4">{wallet.transactionCount.toLocaleString()}</td>
                    <td className="py-3 px-4">{new Date(wallet.lastUpdated).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insights */}
        {reportData.insights.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Insights</h2>
            <div className="space-y-4">
              {reportData.insights.map((insight, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-slate-900">{insight.title}</h3>
                  <p className="text-slate-600">{insight.description}</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium
                    ${insight.impact === 'high' ? 'bg-red-100 text-red-800' : 
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {insight.impact} impact
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}