import { useEffect, useRef, useState } from 'react';
import { FiPaperclip, FiUploadCloud, FiX, FiDownload, FiTrash2 } from 'react-icons/fi';
import { apiError } from '../../../services/apiHelpers';
import { formatDateTime, uploadStagedFiles } from './financeUtils';
import { SimpleTable, Skeleton } from './FinanceUi';

const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.dwg';
const sizeText = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`);

function DropZone({ onFiles, disabled }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const pick = (list) => {
    const files = Array.from(list || []);
    if (files.length) onFiles(files);
    if (input.current) input.current.value = '';
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && input.current?.click()}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) input.current?.click(); }}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) pick(e.dataTransfer.files); }}
      style={{
        border: `1.5px dashed ${over ? '#1D4ED8' : '#CBD5E1'}`, borderRadius: 8, padding: '18px 12px', textAlign: 'center',
        background: over ? '#EFF6FF' : '#FAFAFA', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      <input ref={input} type="file" multiple accept={ACCEPT} onChange={(e) => pick(e.target.files)} style={{ display: 'none' }} />
      <FiUploadCloud size={20} color="#475569" />
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', marginTop: 4 }}>Drop file here or click to browse</div>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF, DOCX, XLSX, DWG, PNG, up to 50MB</div>
    </div>
  );
}

/**
 * "Attach documents (optional)" for a form that has no record yet: collects files, shows them with a remove
 * cross. After the record is created the caller uploads them with `uploadStagedFiles`.
 */
export function AttachField({ files, onChange, disabled }) {
  const [problem, setProblem] = useState('');
  const add = (picked) => {
    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setProblem(`${tooBig.name} is larger than 50MB.`);
      return;
    }
    setProblem('');
    onChange([...files, ...picked]);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <DropZone onFiles={add} disabled={disabled} />
      {problem && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{problem}</span>}
      {files.map((file, i) => (
        <div key={`${file.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem' }}>
          <FiPaperclip size={14} color="#64748B" />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name} ({sizeText(file.size)})</span>
          <button type="button" aria-label={`Remove ${file.name}`} disabled={disabled} onClick={() => onChange(files.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex' }}>
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** The "Document uploads" panel of a View drawer: list, download, add and (when allowed) remove. Mount with `key={id}`. */
export function DocumentUploads({ api, id, canEdit = false }) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => api.attachments(id)
    .then((res) => setState({ items: res.data?.data || [], loading: false, error: '' }))
    .catch((err) => setState({ items: [], loading: false, error: apiError(err, 'Could not load documents') }));

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
    setBusy(false);
  };

  const download = async (item) => {
    try {
      const res = await api.downloadAttachment(id, item._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      setMessage(apiError(err, 'Download failed'));
    }
  };

  const remove = async (item) => {
    setBusy(true);
    setMessage('');
    try {
      await api.removeAttachment(id, item._id);
    } catch (err) {
      setMessage(apiError(err, 'Could not remove the document'));
    }
    await load();
    setBusy(false);
  };

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Document uploads</div>
      {state.loading && <Skeleton height={24} />}
      {state.error && <span style={{ fontSize: '0.8rem', color: '#991B1B' }}>{state.error}</span>}
      {!state.loading && !state.error && state.items.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No documents attached.</span>}
      {state.items.map((item) => (
        <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #F1F5F9', paddingTop: 8, fontSize: '0.82rem' }}>
          <FiPaperclip size={14} color="#64748B" />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.originalName}</span>
          <button type="button" aria-label={`Download ${item.originalName}`} onClick={() => download(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', display: 'flex' }}><FiDownload size={15} /></button>
          {canEdit && (
            <button type="button" aria-label={`Remove ${item.originalName}`} disabled={busy} onClick={() => remove(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex' }}><FiTrash2 size={15} /></button>
          )}
        </div>
      ))}
      {canEdit && <DropZone onFiles={upload} disabled={busy} />}
      {message && <span style={{ fontSize: '0.78rem', color: '#991B1B' }}>{message}</span>}
    </div>
  );
}

/** History / Timeline / Audit trail / Approval history of a record. Mount with `key={id}`. */
export function HistoryList({ api, id, empty = 'No history recorded yet.' }) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    let cancelled = false;
    api.history(id)
      .then((res) => { if (!cancelled) setState({ items: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ items: [], loading: false, error: apiError(err, 'Could not load history') }); });
    return () => { cancelled = true; };
  }, [api, id]);

  if (state.loading) return <Skeleton height={60} />;
  if (state.error) return <span style={{ fontSize: '0.82rem', color: '#991B1B' }}>{state.error}</span>;
  return (
    <SimpleTable
      empty={empty}
      columns={[
        { key: 'occurredAt', label: 'Date', render: (r) => formatDateTime(r.occurredAt) },
        { key: 'label', label: 'Activity', render: (r) => r.label },
        { key: 'actorName', label: 'Performed by' },
      ]}
      rows={state.items}
    />
  );
}
