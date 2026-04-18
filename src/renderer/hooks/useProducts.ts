import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@services/db';

export function useProducts() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await productsApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createProduct = useCallback(async (data: ICreateProductData) => {
    const p = await productsApi.create(data);
    setProducts((prev) =>
      [...prev, p].sort((a, b) => a.name.localeCompare(b.name)),
    );
    return p;
  }, []);

  const updateProduct = useCallback(
    async (id: number, data: IUpdateProductData) => {
      const p = await productsApi.update(id, data);
      setProducts((prev) => prev.map((x) => (x.id === id ? p : x)));
      return p;
    },
    [],
  );

  const deleteProduct = useCallback(async (id: number) => {
    await productsApi.delete(id);
    setProducts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return {
    products,
    loading,
    error,
    reload: load,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
