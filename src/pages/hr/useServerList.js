import { useState, useEffect, useRef, useCallback } from 'react';
import { apiError } from '../../services/apiHelpers';

/**
 * Server-side paginated list with debounced search and filters.
 * `fetcher(params)` must return the axios promise of a paginated endpoint.
 * Empty-string and null filter values are not sent.
 */
export function useServerList(fetcher, initialFilters = {}, { limit = 10, debounceMs = 400, enabled = true } = {}) {
  const [data, setData] = useState({ items: [], meta: null, loading: enabled, error: '' });
  const [query, setQuery] = useState({ page: 1, q: '', filters: initialFilters, nonce: 0 });
  const [searchInput, setSearchInput] = useState('');
  const fetcherRef = useRef(fetcher);
  const timerRef = useRef(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const params = { page: query.page, limit };
    if (query.q) params.q = query.q;
    Object.entries(query.filters).forEach(([key, value]) => {
      if (value !== '' && value != null) params[key] = value;
    });
    fetcherRef.current(params)
      .then((res) => {
        if (!cancelled) setData({ items: res.data?.data || [], meta: res.data?.meta || null, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setData((d) => ({ ...d, loading: false, error: apiError(err, 'Failed to load') }));
      });
    return () => { cancelled = true; };
  }, [query, limit, enabled]);

  const markLoading = () => setData((d) => ({ ...d, loading: true, error: '' }));

  const setSearch = useCallback((value) => {
    setSearchInput(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setData((d) => ({ ...d, loading: true, error: '' }));
      setQuery((q) => ({ ...q, q: value.trim(), page: 1 }));
    }, debounceMs);
  }, [debounceMs]);

  const setPage = useCallback((page) => {
    setData((d) => ({ ...d, loading: true }));
    setQuery((q) => ({ ...q, page }));
  }, []);

  const setFilters = useCallback((filters) => {
    setData((d) => ({ ...d, loading: true, error: '' }));
    setQuery((q) => ({ ...q, filters, page: 1 }));
  }, []);

  const reload = useCallback(() => {
    setData((d) => ({ ...d, error: '' }));
    setQuery((q) => ({ ...q, nonce: q.nonce + 1 }));
  }, []);

  const hardReload = () => {
    markLoading();
    setQuery((q) => ({ ...q, nonce: q.nonce + 1 }));
  };

  return {
    items: data.items,
    meta: data.meta,
    loading: data.loading,
    error: data.error,
    page: query.page,
    search: searchInput,
    activeSearch: query.q,
    filters: query.filters,
    params: { q: query.q, ...query.filters },
    setSearch,
    setPage,
    setFilters,
    reload,
    hardReload,
  };
}
