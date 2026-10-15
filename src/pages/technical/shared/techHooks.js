import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiError } from '../../../services/apiHelpers';
import { selectCurrentUser } from '../../../store/authSlice';
import { technicalLookupService, wbsService } from '../../../services/technical.service';
import { downloadFile, saveRowsCsv, useDebounced } from '../../procurement/shared/procUtils';

export { useRunAction, useRecord, useFetched, useSelection } from '../../procurement/shared/procHooks';

export const PAGE_SIZE = 10;

export const useDebouncedValue = useDebounced;

/**
 * Server-paginated Technical list wired to a slice (store/technical/createTechSlice): debounced search (sent as `q`),
 * filters, page, stat tiles and `reload()`. `fixed` params (for example `{ projectId }`) are always sent and also scope
 * the stat tiles; empty filter values are not sent.
 */
export function useTechList(slice, { initialFilters = {}, fixed, enabled = true, withStats = true, sort } = {}) {
  const dispatch = useDispatch();
  const state = useSelector((s) => s[slice.key]);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const q = useDebounced(searchText.trim(), 400);
  const [filters, setFilters] = useState(initialFilters);
  const fixedKey = JSON.stringify(fixed || {});
  const sortKey = JSON.stringify(sort || {});

  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE, ...JSON.parse(sortKey), ...JSON.parse(fixedKey) };
    if (q) p.q = q;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value != null) p[key] = value;
    });
    return p;
  }, [page, q, filters, fixedKey, sortKey]);

  const statsParams = useMemo(() => JSON.parse(fixedKey), [fixedKey]);

  useEffect(() => {
    if (enabled) dispatch(slice.fetchList(params));
  }, [dispatch, slice, params, enabled]);

  useEffect(() => {
    if (enabled && withStats) dispatch(slice.fetchStats(statsParams));
  }, [dispatch, slice, enabled, withStats, statsParams]);

  const reload = useCallback(() => {
    dispatch(slice.fetchList(params));
    if (withStats) dispatch(slice.fetchStats(statsParams));
  }, [dispatch, slice, params, withStats, statsParams]);

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

/**
 * The Export button of a list. Ticked rows are written client-side; otherwise the server export for the current
 * search and filters is downloaded. `run()` resolves with an error message or null.
 */
export function useTechExport(request, list, selection, columns, fallbackName) {
  const [exporting, setExporting] = useState(false);
  const run = useCallback(async () => {
    setExporting(true);
    let message = null;
    if (selection && selection.ids.length > 0) {
      saveRowsCsv(list.items.filter((row) => selection.ids.includes(row._id)), columns, fallbackName);
    } else {
      message = await downloadFile(() => request({ ...list.exportParams, format: 'csv' }), fallbackName);
    }
    setExporting(false);
    return message;
  }, [request, list.exportParams, list.items, selection, columns, fallbackName]);
  return { exporting, run, selectedCount: selection ? selection.ids.length : 0 };
}

/** The signed-in person as an employee: `{ id, name, position }`; `id` is '' when the account has no employee record. */
export function useMyEmployee() {
  const user = useSelector(selectCurrentUser);
  const employee = user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId : null;
  const id = (employee ? employee._id : user?.employeeId) || '';
  const name = employee?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '';
  return { id, name, position: employee?.position || '' };
}

/** A project's work activities as `{ value, label }` options for the "Linked WBS activity" pickers. */
export function useProjectActivities(projectId) {
  const [state, setState] = useState({ projectId: null, rows: [], error: '' });
  useEffect(() => {
    if (!projectId) return undefined;
    let cancelled = false;
    wbsService.list(projectId, {})
      .then((res) => { if (!cancelled) setState({ projectId, rows: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setState({ projectId, rows: [], error: apiError(err, 'Could not load the project activities') }); });
    return () => { cancelled = true; };
  }, [projectId]);
  const rows = state.projectId === projectId ? state.rows : [];
  return {
    rows,
    options: rows.map((a) => ({ value: a._id, label: `${a.activityName} (WBS ${a.wbsCode})` })),
    error: state.projectId === projectId ? state.error : '',
    loading: Boolean(projectId) && state.projectId !== projectId,
  };
}

const lookupCache = new Map();

/**
 * Dropdown data from `GET /technical/lookups` (Technical permissions only). `sections` is a stable array of section
 * names. The last answer is shown at once on the next visit and refreshed in the background.
 */
export function useTechLookups(sections, enabled = true) {
  const key = sections.join(',');
  const [state, setState] = useState({ key: null, data: null, error: '' });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    technicalLookupService.get(key)
      .then((res) => {
        const data = res.data?.data || {};
        lookupCache.set(key, data);
        if (!cancelled) setState({ key, data, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState({ key, data: null, error: apiError(err, 'Could not load the form options') });
      });
    return () => { cancelled = true; };
  }, [key, enabled]);

  const data = state.key === key && state.data ? state.data : lookupCache.get(key) || null;
  return { lookups: data || {}, loading: enabled && !data && !(state.key === key && state.error), error: state.key === key ? state.error : '' };
}
