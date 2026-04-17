import { useState, useEffect, useCallback } from 'react';
import { billsApi } from '@services/db';

export function useBills(initialPageSize = 20) {
  const [bills, setBills] = useState<IBill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ITodayStats>({ count: 0, revenue: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, todayStats] = await Promise.all([
        billsApi.list({ page, pageSize }),
        billsApi.todayStats(),
      ]);
      setBills(data.bills);
      setTotal(data.total);
      setStats(todayStats);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  return {
    bills,
    total,
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    loading,
    stats,
    reload: load,
  };
}
