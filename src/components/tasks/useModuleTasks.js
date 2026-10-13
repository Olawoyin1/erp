import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleTasks, fetchModuleTaskStats, selectModuleTasks, setBoard } from '../../store/tasks/tasksSlice';

export const PAGE_SIZE = 10;

const EMPTY = {
  items: [],
  meta: null,
  board: { todo: [], in_progress: [], done: [] },
  stats: [],
  loading: true,
  error: '',
};

/**
 * Server-driven task data for one module (list, kanban board, stat tiles) held in the `moduleTasks`
 * slice, plus the page's search / filter / sort / pagination controls. Every control change resets to page 1.
 */
export function useModuleTasks(module, view) {
  const dispatch = useDispatch();
  const entry = useSelector(selectModuleTasks(module)) || EMPTY;

  const [search, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFiltersState] = useState({ priority: '', status: '' });
  const [sort, setSort] = useState({ field: 'dueDate', order: 'asc' });
  const [page, setPage] = useState(1);
  const timer = useRef(null);

  const setSearch = (text) => {
    setSearchText(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQuery(text.trim());
      setPage(1);
    }, 350);
  };

  const setFilters = (next) => {
    setFiltersState(next);
    setPage(1);
  };

  const toggleSort = (field) => {
    setSort((current) => (current.field === field ? { field, order: current.order === 'asc' ? 'desc' : 'asc' } : { field, order: 'asc' }));
    setPage(1);
  };

  const buildParams = useCallback(() => {
    const params = {};
    if (query) params.q = query;
    if (filters.priority) params.priority = filters.priority;
    if (filters.status === 'overdue') params.overdue = true;
    return params;
  }, [query, filters]);

  const listArgs = useMemo(() => {
    if (view === 'board') return { module, view, params: buildParams() };
    const params = { ...buildParams(), page, limit: PAGE_SIZE, sort: sort.field, order: sort.order };
    if (filters.status && filters.status !== 'overdue') params.status = filters.status;
    return { module, view, params };
  }, [module, view, buildParams, page, sort, filters.status]);

  useEffect(() => {
    dispatch(fetchModuleTasks(listArgs));
  }, [dispatch, listArgs]);

  useEffect(() => {
    dispatch(fetchModuleTaskStats(module));
  }, [dispatch, module]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const reload = useCallback(
    () => Promise.all([dispatch(fetchModuleTasks(listArgs)), dispatch(fetchModuleTaskStats(module))]),
    [dispatch, listArgs, module],
  );

  const updateBoard = useCallback((board) => dispatch(setBoard({ module, board })), [dispatch, module]);

  return {
    items: entry.items,
    meta: entry.meta,
    board: entry.board,
    stats: entry.stats,
    loading: entry.loading,
    error: entry.error,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    toggleSort,
    reload,
    buildParams,
    setBoard: updateBoard,
  };
}
