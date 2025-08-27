import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createReportSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  walletData: z.any(),
  parameters: z.any(),
  createdBy: z.string(),
});

const updateReportSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, walletData, parameters, createdBy } = createReportSchema.parse(body);

    const report = await prisma.report.create({
      data: {
        title,
        description,
        walletData,
        parameters,
        createdBy,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {};
    if (userId) where.createdBy = userId;
    if (status) where.status = status;

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = updateReportSchema.parse(body);

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID required' },
        { status: 400 }
      );
    }

    await prisma.report.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
