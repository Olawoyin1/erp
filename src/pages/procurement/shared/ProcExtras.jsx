import { useEffect, useRef, useState } from 'react';
import { FiPaperclip, FiUploadCloud, FiX, FiDownload, FiUpload } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { apiError } from '../../../services/apiHelpers';
import { formatDateTime, uploadStagedFiles, useDebounced } from './procUtils';
import { Choice, Field, FormError, PrimaryButton, SecondaryButton, Skeleton } from './ProcUi';

const MAX_BYTES = 50 * 1024 * 1024;
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.dwg';
const sizeText = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`);

export function DropZone({ onFiles, disabled, multiple = true, accept = ACCEPT, hint = 'PDF, DOCX, XLSX, DWG, PNG, up to 50MB' }) {
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
        border: `1.5px dashed ${over ? '#1D4ED8' : '#CBD5E1'}`, borderRadius: 8, padding: '20px 12px', textAlign: 'center',
        background: over ? '#EFF6FF' : '#F8FAFC', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      }}
    >
      <input ref={input} type="file" multiple={multiple} accept={accept} onChange={(e) => pick(e.target.files)} style={{ display: 'none' }} />
      <FiUploadCloud size={22} color="#64748B" />
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', marginTop: 4 }}>Drop file here or click to browse</div>
      <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{hint}</div>
    </div>
  );
}

/**
 * "Attach document (optional)" for a form that has no record yet: collects files, shows them with a remove
 * cross. After the record is created the caller uploads them with `uploadStagedFiles`.
 */
export function AttachField({ files, onChange, disabled, multiple = true, accept, hint }) {
  const [problem, setProblem] = useState('');
  const add = (picked) => {
    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setProblem(`${tooBig.name} is larger than 50MB.`);
      return;
    }
    setProblem('');
    onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <DropZone onFiles={add} disabled={disabled} multiple={multiple} accept={accept} hint={hint} />
      {problem && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{problem}</span>}
      {files.map((file, i) => (
        <div key={`${file.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: 8, fontSize: '0.813rem' }}>
          <FiPaperclip size={14} color="#64748B" />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name} ({sizeText(file.size)})</span>
          <button type="button" aria-label={`Remove ${file.name}`} disabled={disabled} onClick={() => onChange(files.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex' }}>
            <FiX size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** The "Attached documents" panel of a View modal: list, download and (when allowed) add. Mount with `key={id}`. */
export function DocumentList({ api, id, canUpload = false, title = 'Attached documents' }) {
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
    setMessage('');
    try {
      const res = await api.downloadAttachment(id, item._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      setMessage(apiError(err, 'Download failed'));
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
            {item.originalName} ({sizeText(item.sizeBytes || 0)}) <span style={{ color: '#94A3B8' }}>• {formatDateTime(item.createdAt)}</span>
          </span>
          <button type="button" aria-label={`Download ${item.originalName}`} onClick={() => download(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', display: 'flex' }}>
            <FiDownload size={16} />
          </button>
        </div>
      ))}
      {canUpload && <DropZone onFiles={upload} disabled={busy} />}
      {busy && <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Uploading…</span>}
      {message && <span style={{ fontSize: '0.78rem', color: '#991B1B' }}>{message}</span>}
    </div>
  );
}

/**
 * The page-header "Upload" button's dialog: pick a record of this page (searched on the server), drop one or more
 * files and attach them. `recordLabel(row)` builds the option text.
 */
export function AttachToRecordDialog({ api, title, recordNoun, recordLabel, listParams, onClose, onDone }) {
  const [term, setTerm] = useState('');
  const search = useDebounced(term.trim(), 300);
  const [state, setState] = useState({ rows: [], loading: true, error: '' });
  const [recordId, setRecordId] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.list({ page: 1, limit: 25, ...(listParams || {}), ...(search ? { search } : {}) })
      .then((res) => { if (!cancelled) setState({ rows: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ rows: [], loading: false, error: apiError(err, 'Could not load records') }); });
    return () => { cancelled = true; };
    // listParams is a small stable object per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, search]);

  const submit = async () => {
    if (!recordId) { setError(`Choose the ${recordNoun} to attach to.`); return; }
    if (!files.length) { setError('Choose at least one file.'); return; }
    setBusy(true);
    setError('');
    const failed = await uploadStagedFiles(api, recordId, files);
    setBusy(false);
    if (failed.length) {
      setError(`Not uploaded: ${failed.join('; ')}`);
      return;
    }
    onDone(`${files.length} document${files.length === 1 ? '' : 's'} attached`);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      subtitle={`Attach supporting documents to a ${recordNoun}`}
      maxWidth="520px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy} icon={<FiUpload size={14} />}>{busy ? 'Uploading…' : 'Upload'}</PrimaryButton>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label={recordNoun} required>
          <input
            className="form-input"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Search ${recordNoun}…`}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.85rem', marginBottom: 6 }}
          />
          <Choice
            value={recordId}
            onChange={setRecordId}
            placeholder={state.loading ? 'Loading…' : `Select a ${recordNoun}`}
            options={state.rows.map((row) => ({ value: row._id, label: recordLabel(row) }))}
            error={state.error}
          />
          {state.error && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{state.error}</span>}
        </Field>
        <Field label="Documents" required>
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </div>
    </Modal>
  );
}
