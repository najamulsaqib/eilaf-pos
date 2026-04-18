import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@services/db';

const FALLBACK_PAGE_SIZE = 39;

export function useProductsCatalog(init?: {
  orderBy?: 'default' | 'top_selling';
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(
    init?.pageSize ?? FALLBACK_PAGE_SIZE,
  );
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [orderBy, setOrderBy] = useState<'default' | 'top_selling'>(
    init?.orderBy ?? 'top_selling',
  );
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [products, setProducts] = useState<IProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadKey, setLoadKey] = useState(0);

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  // Reset to first page whenever filters or page size change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, category, orderBy, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await productsApi.catalog({
        page,
        pageSize,
        search: debouncedSearch,
        category,
        orderBy,
      });
      setProducts(result.products);
      setTotal(result.total);
      setAllCategories(result.allCategories);
      setLoadKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, category, orderBy]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    products,
    total,
    allCategories,
    loading,
    loadKey,
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    search,
    setSearch,
    category,
    setCategory,
    orderBy,
    setOrderBy,
    reload: load,
  };
}
