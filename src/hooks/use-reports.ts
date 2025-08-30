'use client'

import { useState, useCallback } from 'react'

// Types for reports
export interface ReportParameters {
  addresses: string[]
  tokenTypes: string[]
  dateRange: {
    days: number
  }
  [key: string]: unknown
}

export interface Report {
  id: string
  title: string
  description: string
  walletData: Record<string, unknown>
  parameters: ReportParameters
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdBy: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    email: string
    name: string
  }
}

export interface CreateReportRequest {
  title: string
  description: string
  walletData: Record<string, unknown>
  parameters: ReportParameters
  createdBy: string
}

export interface CreateReportResponse {
  success: boolean
  data: Report
}

export interface GetReportsResponse {
  success: boolean
  data: Report[]
}

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async (filters?: {
    userId?: string
    status?: string
  }): Promise<Report[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.userId) params.append('userId', filters.userId)
      if (filters?.status) params.append('status', filters.status)

      const url = `/api/reports${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: GetReportsResponse = await response.json()
      
      if (data.success) {
        setReports(data.data)
        return data.data
      } else {
        throw new Error('Failed to fetch reports')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createReport = useCallback(async (reportData: CreateReportRequest): Promise<Report> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CreateReportResponse = await response.json()
      
      if (data.success) {
        setReports(prev => [data.data, ...prev])
        return data.data
      } else {
        throw new Error('Failed to create report')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateReport = useCallback(async (id: string, updates: Partial<Report>): Promise<Report> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CreateReportResponse = await response.json()
      
      if (data.success) {
        setReports(prev => prev.map(report => 
          report.id === id ? { ...report, ...updates, updatedAt: data.data.updatedAt } : report
        ))
        return data.data
      } else {
        throw new Error('Failed to update report')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setReports(prev => prev.filter(report => report.id !== id))
      } else {
        throw new Error('Failed to delete report')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    reports,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    isLoading,
    error,
    clearError,
  }
}
