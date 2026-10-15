import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../../../services/apiHelpers';
import { bizLookupService } from '../../../services/bizdev.service';

export { useProcList as useBizList, useRunAction, useRecord, useFetched, useSelection, useExport } from '../../procurement/shared/procHooks';

const lookupCache = new Map();

/**
 * Dropdown data from `GET /clients/lookups` (open to anyone who can view a Business Development record).
 * `sections` is a stable array of names (`clients`, `officers`, `opportunities`, `tenders`). The last answer is shown
 * at once and refreshed in the background; `refresh()` forces a reload.
 */
export function useBizLookups(sections, enabled = true) {
  const key = sections.join(',');
  const [state, setState] = useState({ key: null, data: null, error: '' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    bizLookupService.get(key)
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
