import { useState, useCallback } from 'react';

export interface Report {
  id: string;
  title: string;
  description?: string;
  walletData: any;
  parameters: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface CreateReportData {
  title: string;
  description?: string;
  walletData: any;
  parameters: any;
  createdBy: string;
}

export interface UpdateReportData {
  id: string;
  title?: string;
  description?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (userId?: string, status?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (status) params.append('status', status);

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createReport = useCallback(async (reportData: CreateReportData) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to create report');
      }

      const data = await response.json();
      if (data.success) {
        setReports(prev => [data.data, ...prev]);
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report');
      throw err;
    }
  }, []);

  const updateReport = useCallback(async (updateData: UpdateReportData) => {
    try {
      const response = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      const data = await response.json();
      if (data.success) {
        setReports(prev => 
          prev.map(report => 
            report.id === updateData.id ? { ...report, ...updateData } : report
          )
        );
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
      throw err;
    }
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/reports?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      const data = await response.json();
      if (data.success) {
        setReports(prev => prev.filter(report => report.id !== id));
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
      throw err;
    }
  }, []);

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    clearError: () => setError(null),
  };
}
