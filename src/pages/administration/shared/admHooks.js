import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../../../services/apiHelpers';
import { adminLookupService } from '../../../services/admin.service';

const lookupCache = new Map();

/**
 * Dropdown data from `GET /administration/lookups` (administration permissions only). `sections` is a stable array
 * of section names. The last answer is shown at once on the next visit and refreshed in the background.
 * `me` is the signed-in person (`employeeId`, `fullName`, `position`, `departmentName`).
 */
export function useAdminLookups(sections, enabled = true) {
  const key = sections.join(',');
  const [state, setState] = useState({ key: null, data: null, error: '' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    adminLookupService.get(key)
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
