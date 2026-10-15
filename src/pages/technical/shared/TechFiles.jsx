import { useCallback, useEffect, useState } from 'react';
import { FiDownload, FiPaperclip, FiX } from 'react-icons/fi';
import { apiError } from '../../../services/apiHelpers';
import { DropZone } from '../../procurement/shared/ProcExtras';
import { Skeleton } from '../../procurement/shared/ProcUi';
import { formatDateTime, sizeText, uploadStagedFiles } from './techUtils';

/** Thumbnails of the image files attached to a record (the "Uploaded images" block of a View drawer). Mount with `key={id}`. */
export function ImageThumbs({ api, id, title = 'Uploaded images', refreshKey = 0 }) {
  const [state, setState] = useState({ key: null, items: [], error: '' });
  const key = `${id}:${refreshKey}`;

  useEffect(() => {
    let cancelled = false;
    api.attachments(id)
      .then(async (res) => {
        const images = (res.data?.data || []).filter((f) => String(f.mimeType).startsWith('image/'));
        const items = await Promise.all(images.map(async (f) => {
          try {
            const link = await api.downloadAttachment(id, f._id);
            return { ...f, url: link.data?.data?.url };
          } catch {
            return { ...f, url: '' };
          }
        }));
        if (!cancelled) setState({ key, items, error: '' });
      })
      .catch((err) => { if (!cancelled) setState({ key, items: [], error: apiError(err, 'Could not load the images') }); });
    return () => { cancelled = true; };
  }, [api, id, key]);

  const ready = state.key === key;
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
      {!ready && <Skeleton height={90} />}
      {ready && state.error && <span style={{ fontSize: '0.8rem', color: '#991B1B' }}>{state.error}</span>}
      {ready && !state.error && state.items.length === 0 && <span style={{ fontSize: '0.813rem', color: '#94A3B8' }}>No images uploaded.</span>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {ready && state.items.map((f) => (
          <figure key={f._id} style={{ margin: 0 }}>
            {f.url ? <img src={f.url} alt={f.originalName} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} /> : <div style={{ height: 110, borderRadius: 8, background: '#F1F5F9' }} />}
            <figcaption style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName} • {formatDateTime(f.createdAt)}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/**
 * The "Attached documents" panel of a View or Edit form: list, download, and (when allowed) add and remove files.
 * `api` is a service with `attachments`, `downloadAttachment` and, for editing, `uploadAttachment` and `removeAttachment`.
 * Mount with `key={id}`.
 */
export default function FilesPanel({ api, id, title = 'Attached documents', canUpload = false, canRemove = false, onChanged }) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(
    () => api.attachments(id)
      .then((res) => setState({ items: res.data?.data || [], loading: false, error: '' }))
      .catch((err) => setState({ items: [], loading: false, error: apiError(err, 'Could not load documents') })),
    [api, id],
  );

  useEffect(() => {
    let cancelled = false;
    api.attachments(id)
      .then((res) => { if (!cancelled) setState({ items: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ items: [], loading: false, error: apiError(err, 'Could not load documents') }); });
    return () => { cancelled = true; };
  }, [api, id]);

  const upload = async (files) => {
    setBusy(true);
    setMessage('');
    const failed = await uploadStagedFiles(api, id, files);
    if (failed.length) setMessage(`Not uploaded: ${failed.join('; ')}`);
    await load();
    if (onChanged) onChanged();
    setBusy(false);
  };

  const download = async (item) => {
    setMessage('');
    try {
      const res = await api.downloadAttachment(id, item._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      setMessage(apiError(err, 'Download failed'));
    }
  };

  const remove = async (item) => {
    setMessage('');
    setBusy(true);
    try {
      await api.removeAttachment(id, item._id);
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      setMessage(apiError(err, 'The document could not be removed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
      {state.loading && <Skeleton height={24} />}
      {state.error && <span style={{ fontSize: '0.8rem', color: '#991B1B' }}>{state.error}</span>}
      {!state.loading && !state.error && state.items.length === 0 && <span style={{ fontSize: '0.813rem', color: '#94A3B8' }}>No attached documents.</span>}
      {state.items.map((item) => (
        <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: '0.813rem', color: '#334155' }}>
          <FiPaperclip size={14} color="#64748B" />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.originalName} ({sizeText(item.sizeBytes)}) <span style={{ color: '#94A3B8' }}>• {item.uploadedByName ? `${item.uploadedByName}, ` : ''}{formatDateTime(item.createdAt)}</span>
          </span>
          <button type="button" aria-label={`Download ${item.originalName}`} onClick={() => download(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', display: 'flex' }}>
            <FiDownload size={16} />
          </button>
          {(typeof canRemove === 'function' ? canRemove(item) : canRemove) && (
            <button type="button" aria-label={`Remove ${item.originalName}`} disabled={busy} onClick={() => remove(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex' }}>
              <FiX size={16} />
            </button>
          )}
        </div>
      ))}
      {canUpload && <DropZone onFiles={upload} disabled={busy} />}
      {busy && <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Working…</span>}
      {message && <span style={{ fontSize: '0.78rem', color: '#991B1B' }}>{message}</span>}
    </div>
  );
}
