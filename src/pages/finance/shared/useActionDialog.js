import { useCallback, useState } from 'react';

/**
 * State for the confirm / reason dialogs of a list page.
 *   const dlg = useActionDialog(run, (message) => { refresh(); showToast(message); });
 *   dlg.open('cancel', record);            // show the dialog named 'cancel'
 *   dlg.exec('cancel', record, 'Done', reason);   // runs run('cancel', record._id, reason), closes on success
 * `dlg.dialog` is `{ kind, record }` or null; `dlg.busy` and `dlg.error` feed the modals.
 */
export function useActionDialog(run, onDone) {
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const open = useCallback((kind, record) => {
    setError('');
    setDialog({ kind, record });
  }, []);
  const close = useCallback(() => setDialog(null), []);

  const exec = useCallback(async (method, record, message, ...extra) => {
    setBusy(true);
    setError('');
    const result = await run(method, record._id, ...extra);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setDialog(null);
    onDone(message, method, record);
    return true;
  }, [run, onDone]);

  return { dialog, open, close, busy, error, exec };
}
