import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma, ReportStatus } from '../../../../prisma/generated/client'

interface CreateReportRequest {
  title: string
  description: string
  walletData: Prisma.InputJsonValue
  parameters: Prisma.InputJsonValue
  createdBy: string
}

interface UpdateReportRequest {
  id: string
  title?: string
  description?: string
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateReportRequest = await request.json()
    const { title, description, walletData, parameters, createdBy } = body

    if (!title || !walletData || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const report = await prisma.report.create({
      data: {
        title,
        description,
        walletData: walletData,
        parameters: parameters,
        status: 'COMPLETED',
        createdBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: Prisma.ReportWhereInput = {}
    if (userId) where.createdBy = userId
    if (status) where.status = status as ReportStatus

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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: reports,
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateReportRequest = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID required' },
        { status: 400 }
      )
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID required' },
        { status: 400 }
      )
    }

    await prisma.report.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
