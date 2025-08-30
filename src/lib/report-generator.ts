import { WalletAnalysisResult, WalletAnalysisReport, AnalysisParams } from '@/hooks/use-wallet-analysis';

export class ReportGenerator {
  static generateWalletReport(
    analysisResults: any[],
    parameters: AnalysisParams
  ): WalletAnalysisReport {
    const wallets = this.generateWalletCards(analysisResults);
    const summary = this.generateSummary(wallets, parameters);
    const charts = this.generateChartData(wallets);
    const insights = this.generateInsights(wallets, summary);
    const recommendations = this.generateRecommendations(wallets, insights);

    return {
      summary,
      wallets,
      charts,
      insights,
      recommendations,
    };
  }

  private static generateSummary(
    wallets: WalletAnalysisResult[],
    parameters: AnalysisParams
  ): WalletAnalysisReport['summary'] {
    const totalWallets = wallets.length;
    const totalVolume = wallets.reduce((sum, wallet) => {
      const deposits = parseFloat(wallet.summary.totalDeposits) || 0;
      const withdrawals = parseFloat(wallet.summary.totalWithdrawals) || 0;
      return sum + deposits + withdrawals;
    }, 0);

    const totalVolumeUSD = totalVolume * 8.5; // Approximate APT to USD conversion
    const totalTransactions = wallets.reduce((sum, wallet) => sum + wallet.summary.totalTransactions, 0);

    return {
      totalWallets,
      totalVolume,
      totalVolumeUSD,
      totalTransactions,
      analysisDate: new Date(),
      dateRange: parameters.dateRange,
    };
  }

  private static generateWalletCards(analysisResults: any[]): WalletAnalysisResult[] {
    return analysisResults.map(result => {
      if (result.error) {
        return {
          address: result.address,
          summary: {
            totalDeposits: '0',
            totalWithdrawals: '0',
            netFlow: '0',
            totalTransactions: 0,
            processingTimeMs: 0,
          },
          events: { deposits: 0, withdrawals: 0, total: 0 },
          activity: { hasActivity: false, lastActivity: null },
          metadata: {
            analyzedAt: new Date().toISOString(),
            tokenType: '0x1::aptos_coin::AptosCoin',
            dataSource: 'Aptos Mainnet',
            cacheStatus: 'error',
          },
        };
      }

      // Transform the raw analysis result to our standard format
      const wallet = result.wallets?.[0] || result;
      
      return {
        address: wallet.walletAddress || result.address,
        summary: {
          totalDeposits: wallet.totalDeposits?.toString() || '0',
          totalWithdrawals: wallet.totalWithdrawals?.toString() || '0',
          netFlow: wallet.netFlow?.toString() || '0',
          totalTransactions: wallet.transactionCount || 0,
          processingTimeMs: wallet.processingTime || 0,
        },
        events: {
          deposits: wallet.deposits?.length || 0,
          withdrawals: wallet.withdrawals?.length || 0,
          total: (wallet.deposits?.length || 0) + (wallet.withdrawals?.length || 0),
        },
        activity: {
          hasActivity: (wallet.deposits?.length || 0) + (wallet.withdrawals?.length || 0) > 0,
          lastActivity: wallet.lastUpdated?.toISOString() || null,
        },
        accountInfo: wallet.accountInfo,
        recentTransactions: [
          ...(wallet.deposits?.slice(0, 5) || []),
          ...(wallet.withdrawals?.slice(0, 5) || []),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        metadata: {
          analyzedAt: new Date().toISOString(),
          tokenType: '0x1::aptos_coin::AptosCoin',
          dataSource: 'Aptos Mainnet',
          cacheStatus: 'real_time',
        },
      };
    });
  }

  private static generateChartData(wallets: WalletAnalysisResult[]) {
    const volumeComparison = {
      labels: wallets.map(w => w.address.slice(0, 8) + '...'),
      datasets: [
        {
          label: 'Total Volume (APT)',
          data: wallets.map(w => parseFloat(w.summary.totalDeposits) + parseFloat(w.summary.totalWithdrawals)),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };

    const transactionPatterns = {
      labels: wallets.map(w => w.address.slice(0, 8) + '...'),
      datasets: [
        {
          label: 'Deposits',
          data: wallets.map(w => w.events.deposits),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
        },
        {
          label: 'Withdrawals',
          data: wallets.map(w => w.events.withdrawals),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        },
      ],
    };

    const gasAnalysis = {
      labels: wallets.map(w => w.address.slice(0, 8) + '...'),
      datasets: [
        {
          label: 'Gas Usage',
          data: wallets.map(w => w.summary.processingTimeMs / 1000), // Convert to seconds
          backgroundColor: 'rgba(168, 85, 247, 0.5)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 2,
        },
      ],
    };

    return {
      volumeComparison,
      transactionPatterns,
      gasAnalysis,
    };
  }

  private static generateInsights(wallets: WalletAnalysisResult[], summary: any): string[] {
    const insights: string[] = [];

    // Volume insights
    const avgVolume = summary.totalVolume / summary.totalWallets;
    const highVolumeWallets = wallets.filter(w => 
      parseFloat(w.summary.totalDeposits) + parseFloat(w.summary.totalWithdrawals) > avgVolume * 2
    );
    
    if (highVolumeWallets.length > 0) {
      insights.push(`${highVolumeWallets.length} wallet(s) show significantly higher volume than average (${(avgVolume * 2).toFixed(2)} APT)`);
    }

    // Activity insights
    const activeWallets = wallets.filter(w => w.activity.hasActivity);
    const inactiveWallets = wallets.filter(w => !w.activity.hasActivity);
    
    if (inactiveWallets.length > 0) {
      insights.push(`${inactiveWallets.length} wallet(s) show no activity in the selected time period`);
    }

    if (activeWallets.length > 0) {
      const avgTransactions = activeWallets.reduce((sum, w) => sum + w.summary.totalTransactions, 0) / activeWallets.length;
      insights.push(`Active wallets average ${avgTransactions.toFixed(1)} transactions per wallet`);
    }

    // Transaction pattern insights
    const depositHeavyWallets = wallets.filter(w => 
      parseFloat(w.summary.totalDeposits) > parseFloat(w.summary.totalWithdrawals) * 2
    );
    
    if (depositHeavyWallets.length > 0) {
      insights.push(`${depositHeavyWallets.length} wallet(s) show deposit-heavy behavior (2x more deposits than withdrawals)`);
    }

    const withdrawalHeavyWallets = wallets.filter(w => 
      parseFloat(w.summary.totalWithdrawals) > parseFloat(w.summary.totalDeposits) * 2
    );
    
    if (withdrawalHeavyWallets.length > 0) {
      insights.push(`${withdrawalHeavyWallets.length} wallet(s) show withdrawal-heavy behavior (2x more withdrawals than deposits)`);
    }

    return insights;
  }

  private static generateRecommendations(wallets: WalletAnalysisResult[], insights: string[]): string[] {
    const recommendations: string[] = [];

    // Based on insights, generate actionable recommendations
    if (insights.some(insight => insight.includes('no activity'))) {
      recommendations.push('Consider expanding the date range for inactive wallets to capture historical activity');
    }

    if (insights.some(insight => insight.includes('deposit-heavy'))) {
      recommendations.push('Deposit-heavy wallets may indicate accumulation behavior - monitor for potential large movements');
    }

    if (insights.some(insight => insight.includes('withdrawal-heavy'))) {
      recommendations.push('Withdrawal-heavy wallets may indicate distribution behavior - consider risk assessment');
    }

    // General recommendations
    if (wallets.length > 5) {
      recommendations.push('Large wallet sets benefit from batch processing - consider scheduling regular analysis');
    }

    recommendations.push('Set up alerts for unusual transaction patterns or volume spikes');
    recommendations.push('Regular analysis helps identify emerging trends and risk patterns');

    return recommendations;
  }

  static exportToCSV(wallets: WalletAnalysisResult[]): string {
    const headers = [
      'Address',
      'Total Deposits (APT)',
      'Total Withdrawals (APT)',
      'Net Flow (APT)',
      'Total Transactions',
      'Processing Time (ms)',
      'Has Activity',
      'Last Activity',
      'Analyzed At',
    ];

    const rows = wallets.map(wallet => [
      wallet.address,
      wallet.summary.totalDeposits,
      wallet.summary.totalWithdrawals,
      wallet.summary.netFlow,
      wallet.summary.totalTransactions,
      wallet.summary.processingTimeMs,
      wallet.activity.hasActivity ? 'Yes' : 'No',
      wallet.activity.lastActivity || 'N/A',
      wallet.metadata.analyzedAt,
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  static exportToJSON(wallets: WalletAnalysisResult[]): string {
    return JSON.stringify(wallets, null, 2);
  }
}
