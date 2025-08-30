import { NextRequest, NextResponse } from 'next/server';
import { WalletAnalyzer } from '@/lib/aggregator';
import { ReportProcessor } from '@/lib/report-processor';
import { prisma } from '@/lib/db';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await AuthService.authenticateRequest(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { walletAddresses, analysisConfig } = await request.json();

    if (!walletAddresses || !Array.isArray(walletAddresses) || walletAddresses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid wallet addresses provided' },
        { status: 400 }
      );
    }

    // Validate wallet addresses (Aptos addresses are 66 characters: 0x + 64 hex chars)
    const validAddresses = walletAddresses.filter((address: string) => 
      /^0x[a-fA-F0-9]{64}$/.test(address)
    );

    if (validAddresses.length === 0) {
      return NextResponse.json(
        { error: 'No valid Aptos addresses provided' },
        { status: 400 }
      );
    }

    // Run wallet analysis
    const walletAnalyzer = new WalletAnalyzer();
    const analysisResults = await walletAnalyzer.analyzeMultipleWallets(
      validAddresses,
      analysisConfig?.tokenTypes || [],
      analysisConfig?.dateRange || {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      }
    );

    // Generate comprehensive report
    const reportData = ReportProcessor.generateWalletReport(
      analysisResults,
      analysisConfig
    );

    // Save report to database
    const savedReport = await prisma.report.create({
      data: {
        title: `Wallet Analysis Report - ${new Date().toLocaleDateString()}`,
        description: `Analysis of ${validAddresses.length} wallet(s)`,
        walletData: reportData as any, // Prisma Json type
        parameters: analysisConfig as any,
        status: 'COMPLETED',
        createdBy: authResult.user.id
      }
    });

    return NextResponse.json({
      success: true,
      reportId: savedReport.id,
      reportData,
      message: `Report generated successfully for ${validAddresses.length} wallet(s)`
    });

  } catch (error) {
    console.error('Error generating report:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await AuthService.authenticateRequest(request);
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Retrieve report from database
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this report
    if (report.createdBy !== authResult.user.id && authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error retrieving report:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
