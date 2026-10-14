import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounced } from './financeUtils';

const PAGE_SIZE = 10;

/**
 * Server-paginated list wired to a finance slice (see store/finance/createFinanceSlice):
 * debounced search (`q`), filters, page, stat tiles and `reload()`.
 *   const list = useFinanceList(invoicesSlice, { initialFilters: { status: '' }, fixed: { receivableOnly: true } });
 * `fixed` params are always sent; empty filter values are not.
 */
export function useFinanceList(slice, { initialFilters = {}, fixed, enabled = true, withStats = true } = {}) {
  const dispatch = useDispatch();
  const state = useSelector((s) => s[slice.key]);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const search = useDebounced(searchText.trim(), 400);
  const [filters, setFilters] = useState(initialFilters);
  const fixedKey = JSON.stringify(fixed || {});

  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE, ...JSON.parse(fixedKey) };
    if (search) p.q = search;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value != null) p[key] = value;
    });
    return p;
  }, [page, search, filters, fixedKey]);

  useEffect(() => {
    if (enabled) dispatch(slice.fetchList(params));
  }, [dispatch, slice, params, enabled]);

  useEffect(() => {
    if (enabled && withStats) dispatch(slice.fetchStats());
  }, [dispatch, slice, enabled, withStats]);

  const reload = useCallback(() => {
    dispatch(slice.fetchList(params));
    if (withStats) dispatch(slice.fetchStats());
  }, [dispatch, slice, params, withStats]);

  const applyFilters = useCallback((next) => {
    setFilters(next);
    setPage(1);
  }, []);

  const onSearch = useCallback((value) => {
    setSearchText(value);
    setPage(1);
  }, []);

  return {
    items: state.items,
    meta: state.meta,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    statsLoading: state.statsLoading,
    statsError: state.statsError,
    page,
    setPage,
    searchText,
    onSearch,
    filters,
    applyFilters,
    params,
    reload,
  };
}

/** Runs a slice action thunk and returns `{ ok, data, error, details }`. */
export function useRunAction(slice) {
  const dispatch = useDispatch();
  return useCallback(async (method, ...args) => {
    const result = await dispatch(slice.runAction({ method, args }));
    if (result.meta.requestStatus === 'fulfilled') return { ok: true, data: result.payload };
    return { ok: false, error: result.payload?.message || 'The action failed', details: result.payload?.details || [], payload: result.payload };
  }, [dispatch, slice]);
}
