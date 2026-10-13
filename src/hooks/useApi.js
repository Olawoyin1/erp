import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../services/apiHelpers';

/**
 * Loads data for a panel. `fetcher()` returns an axios promise; `deps` are the serialisable inputs that
 * should trigger a new request (a filter, a page). Returns `{ data, error, loading, reload, setData }`:
 * `data` keeps the last result while a new one loads, `loading` is true until the current request settles.
 */
export function useApi(fetcher, deps = []) {
  const [reloads, setReloads] = useState(0);
  const key = `${JSON.stringify(deps)}#${reloads}`;
  const [result, setResult] = useState({ key: null, data: null, error: '' });

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((res) => {
        if (!cancelled) setResult({ key, data: res.data, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setResult((prev) => ({ key, data: prev.data, error: apiError(err, 'Could not load this section') }));
      });
    return () => {
      cancelled = true;
    };
    // `fetcher` is rebuilt on every render; `key` already encodes everything that should refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setReloads((n) => n + 1), []);
  const setData = useCallback((updater) => setResult((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater })), []);

  return { data: result.data, error: result.key === key ? result.error : '', loading: result.key !== key, reload, setData };
}
