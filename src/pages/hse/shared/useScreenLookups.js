import { useCallback, useEffect, useState } from 'react';
import { apiError } from '../../../services/apiHelpers';
import { hseLookupService } from '../../../services/hse.service';
import { qualityLookupService } from '../../../services/quality.service';

const cache = new Map();

function makeHook(prefix, service) {
  /**
   * Dropdown data for a screen (employees, departments, locations, ...). `sections` is a stable array of section names.
   * The last answer is shown at once on the next visit and refreshed in the background.
   */
  return function useLookups(sections, enabled = true) {
    const key = `${prefix}:${sections.join(',')}`;
    const [state, setState] = useState({ key: null, data: null, error: '' });
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
      if (!enabled) return undefined;
      let cancelled = false;
      service.get(sections.join(','))
        .then((res) => {
          const data = res.data?.data || {};
          cache.set(key, data);
          if (!cancelled) setState({ key, data, error: '' });
        })
        .catch((err) => {
          if (!cancelled) setState({ key, data: null, error: apiError(err, 'Could not load the form options') });
        });
      return () => { cancelled = true; };
      // `sections` is identified by `key`.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, enabled, nonce]);

    const refresh = useCallback(() => setNonce((n) => n + 1), []);
    const data = state.key === key && state.data ? state.data : cache.get(key) || null;
    return { lookups: data || {}, loading: enabled && !data && !(state.key === key && state.error), error: state.key === key ? state.error : '', refresh };
  };
}

export const useHseLookups = makeHook('hse', hseLookupService);
export const useQualityLookups = makeHook('quality', qualityLookupService);
