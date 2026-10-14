import { useEffect, useState } from 'react';
import { apiError } from '../../../services/apiHelpers';

/** Loads one record through `api.get(id)`; reloads when `refreshKey` changes. `loading` is true until the current id has answered. */
export function useRecord(api, id, refreshKey = 0) {
  const [state, setState] = useState({ id: null, record: null, error: '' });
  useEffect(() => {
    let cancelled = false;
    api.get(id)
      .then((res) => { if (!cancelled) setState({ id, record: res.data?.data || null, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ id, record: null, error: apiError(err, 'Could not load the record') }); });
    return () => { cancelled = true; };
  }, [api, id, refreshKey]);
  return { record: state.record, error: state.id === id ? state.error : '', loading: state.id !== id };
}
