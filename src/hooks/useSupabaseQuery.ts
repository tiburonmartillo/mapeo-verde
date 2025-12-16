import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para queries de Supabase con caché y manejo de errores
 */
export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    cacheTime?: number;
    fallback?: T;
  } = {}
) {
  const {
    enabled = true,
    refetchOnMount = false,
    cacheTime = 5 * 60 * 1000, // 5 minutos
    fallback,
  } = options;

  const [data, setData] = useState<T | undefined>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      if (fallback !== undefined) {
        setData(fallback);
      }
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, fallback]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refetchOnMount]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

