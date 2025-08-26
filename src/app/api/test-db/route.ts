import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Count existing records
    const userCount = await prisma.user.count();
    const reportCount = await prisma.report.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      stats: {
        users: userCount,
        reports: reportCount,
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
