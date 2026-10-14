import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiError } from '../../../services/apiHelpers';
import { procurementLookupService } from '../../../services/procurement.service';
import { downloadFile, saveRowsCsv, useDebounced } from './procUtils';

const PAGE_SIZE = 10;

/**
 * Server-paginated list wired to a procurement slice (see store/procurement/createProcSlice):
 * debounced search, filters, page, stat tiles and `reload()`.
 *   const list = useProcList(requisitionsSlice, { initialFilters: { status: '' } });
 * `fixed` params are always sent; empty filter values are not.
 */
export function useProcList(slice, { initialFilters = {}, fixed, enabled = true, withStats = true } = {}) {
  const dispatch = useDispatch();
  const state = useSelector((s) => s[slice.key]);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const search = useDebounced(searchText.trim(), 400);
  const [filters, setFilters] = useState(initialFilters);
  const fixedKey = JSON.stringify(fixed || {});

  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE, ...JSON.parse(fixedKey) };
    if (search) p.search = search;
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

  const exportParams = useMemo(() => {
    const rest = { ...params };
    delete rest.page;
    delete rest.limit;
    return rest;
  }, [params]);

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
    exportParams,
    reload,
  };
}

/** Row selection for a list: `ids`, `toggle(id)`, `toggleAll(pageIds)`, `clear()`. */
export function useSelection() {
  const [ids, setIds] = useState([]);
  const toggle = useCallback((id) => setIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])), []);
  const toggleAll = useCallback((pageIds) => setIds((prev) => (pageIds.length > 0 && pageIds.every((id) => prev.includes(id)) ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])])), []);
  const clear = useCallback(() => setIds([]), []);
  return { ids, toggle, toggleAll, clear };
}

/** Runs a slice action thunk and returns `{ ok, data, error, details, payload }`. */
export function useRunAction(slice) {
  const dispatch = useDispatch();
  return useCallback(async (method, ...args) => {
    const result = await dispatch(slice.runAction({ method, args }));
    if (result.meta.requestStatus === 'fulfilled') return { ok: true, data: result.payload };
    return { ok: false, error: result.payload?.message || 'The action failed', details: result.payload?.details || [], payload: result.payload };
  }, [dispatch, slice]);
}

/** Loads one record through `api.get(id)`; reloads when `refreshKey` changes. `loading` is true until the current id has answered. */
export function useRecord(api, id, refreshKey = 0) {
  const [state, setState] = useState({ id: null, record: null, error: '' });
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    api.get(id)
      .then((res) => { if (!cancelled) setState({ id, record: res.data?.data || null, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ id, record: null, error: apiError(err, 'Could not load the record') }); });
    return () => { cancelled = true; };
  }, [api, id, refreshKey]);
  return { record: state.record, error: state.id === id ? state.error : '', loading: Boolean(id) && state.id !== id };
}

/** Loads a list endpoint that is not paginated (timelines, history). */
export function useFetched(loader, key, refreshKey = 0) {
  const [state, setState] = useState({ key: null, data: [], error: '' });
  useEffect(() => {
    if (key == null) return undefined;
    let cancelled = false;
    loader()
      .then((res) => { if (!cancelled) setState({ key, data: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setState({ key, data: [], error: apiError(err, 'Could not load') }); });
    return () => { cancelled = true; };
    // `loader` is rebuilt each render; the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshKey]);
  return { data: state.key === key ? state.data : [], error: state.key === key ? state.error : '', loading: key != null && state.key !== key };
}

const lookupCache = new Map();

/**
 * Dropdown data from `GET /procurement/lookups` (procurement permissions only). `sections` is a
 * stable array of section names. The last answer is shown at once on the next visit and refreshed in the
 * background, so a form never opens with stale vendors for long. `refresh()` forces a reload.
 */
export function useLookups(sections, enabled = true) {
  const key = sections.join(',');
  const [state, setState] = useState({ key: null, data: null, error: '' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    procurementLookupService.get(key)
      .then((res) => {
        const data = res.data?.data || {};
        lookupCache.set(key, data);
        if (!cancelled) setState({ key, data, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ key, data: null, error: apiError(err, 'Could not load the form options') });
      });
    return () => { cancelled = true; };
  }, [key, enabled, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const data = state.key === key && state.data ? state.data : lookupCache.get(key) || null;
  return { lookups: data || {}, loading: enabled && !data && !(state.key === key && state.error), error: state.key === key ? state.error : '', refresh };
}

/**
 * The Export button of a list. Without a selection it downloads the server CSV for the current search and filters;
 * with rows ticked it writes just those rows (`columns`: [{ label, value(row) }]). `run()` resolves with an error message or null.
 */
export function useExport(api, list, selection, columns, fallbackName) {
  const [exporting, setExporting] = useState(false);
  const run = useCallback(async () => {
    setExporting(true);
    let message = null;
    if (selection.ids.length > 0) {
      const rows = list.items.filter((row) => selection.ids.includes(row._id));
      saveRowsCsv(rows, columns, fallbackName);
    } else {
      message = await downloadFile(() => api.exportCsv(list.exportParams), fallbackName);
    }
    setExporting(false);
    return message;
  }, [api, list.exportParams, list.items, selection.ids, columns, fallbackName]);
  return { exporting, run, selectedCount: selection.ids.length };
}
