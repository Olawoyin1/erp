import { useState } from 'react';
import { FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { Textarea } from '../../../components/ui/FormField';
import { apiError } from '../../../services/apiHelpers';
import { formatDate, formatDateTime, uploadStagedFiles } from '../../procurement/shared/procUtils';
import { useFetched } from '../../procurement/shared/procHooks';
import { DropZone } from '../../procurement/shared/ProcExtras';
import { DataState, FormError, PrimaryButton, SecondaryButton } from '../../procurement/shared/ProcUi';
import { INTERACTION_TONES, PRIORITY_TONES, RELATIONSHIP_TONES, STAGE_TONES, stageLabel } from './bizUtils';

const TONES = {
  green: { bg: '#DCFCE7', fg: '#166534' },
  blue: { bg: '#DBEAFE', fg: '#1E40AF' },
  sky: { bg: '#E0F2FE', fg: '#0369A1' },
  amber: { bg: '#FEF3C7', fg: '#92400E' },
  red: { bg: '#FEE2E2', fg: '#991B1B' },
  purple: { bg: '#EDE9FE', fg: '#5B21B6' },
  slate: { bg: '#F1F5F9', fg: '#475569' },
};

export function Pill({ tone = 'slate', children }) {
  const t = TONES[tone] || TONES.slate;
  return (
    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: t.bg, color: t.fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

export function StageBadge({ kind, stage }) {
  return <Pill tone={STAGE_TONES[kind]?.[stage] || 'slate'}>{stageLabel(kind, stage)}</Pill>;
}

export const PriorityBadge = ({ priority }) => <Pill tone={PRIORITY_TONES[priority] || 'slate'}>{priority || '—'}</Pill>;
export const RelationshipBadge = ({ value }) => <Pill tone={RELATIONSHIP_TONES[value] || 'slate'}>{value || '—'}</Pill>;
export const InteractionBadge = ({ type }) => <Pill tone={INTERACTION_TONES[type] || 'slate'}>{type || '—'}</Pill>;

export function ProbabilityBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const color = pct >= 80 ? '#16A34A' : pct >= 50 ? '#2563EB' : pct >= 20 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden', minWidth: 50 }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color, minWidth: 30 }}>{pct}%</span>
    </div>
  );
}

/** A column heading that sorts the server list: shows the arrow of the current sort and flips it on click. */
export function SortLabel({ label, field, filters, onChange }) {
  const active = filters.sort === field;
  const arrow = active ? (filters.order === 'asc' ? '↑' : '↓') : '↕';
  return (
    <button
      type="button"
      onClick={() => onChange(field, active && filters.order === 'desc' ? 'asc' : 'desc')}
      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', textTransform: 'inherit', letterSpacing: 'inherit', cursor: 'pointer', display: 'inline-flex', gap: 4 }}
    >
      {label}<span style={{ opacity: active ? 1 : 0.5 }}>{arrow}</span>
    </button>
  );
}

/** Name and a muted second line, as the table cells of the designs show them. */
export function TwoLine({ primary, secondary }) {
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#0F172A' }}>{primary || '—'}</div>
      {secondary && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{secondary}</div>}
    </div>
  );
}

const sizeText = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round((bytes || 0) / 1024))}KB`);

/**
 * The "Document" tab: file, uploaded by, date, View, with an optional drop zone and remove cross.
 * `api` is one of the bizdev services (attachments, uploadAttachment, downloadAttachment, removeAttachment).
 */
export function DocumentTable({ api, id, canUpload = false, canRemove = false }) {
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { data, error, loading } = useFetched(() => api.attachments(id), id, refresh);

  const upload = async (files) => {
    setBusy(true);
    setMessage('');
    const failed = await uploadStagedFiles(api, id, files);
    if (failed.length) setMessage(`Not uploaded: ${failed.join('; ')}`);
    setRefresh((n) => n + 1);
    setBusy(false);
  };

  const view = async (item) => {
    setMessage('');
    try {
      const res = await api.downloadAttachment(id, item._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      setMessage(apiError(err, 'The document could not be opened'));
    }
  };

  const remove = async (item) => {
    setMessage('');
    try {
      await api.removeAttachment(id, item._id);
      setRefresh((n) => n + 1);
    } catch (err) {
      setMessage(apiError(err, 'The document could not be removed'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <DataState loading={loading} error={error} empty={!data.length} emptyText="No documents attached yet.">
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
            <thead>
              <tr style={{ background: '#EEF2FF', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>DOCUMENT</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>UPLOADED BY</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>DATE</th>
                <th style={{ padding: '10px 14px' }} />
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item._id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', color: '#0F172A' }}>{item.originalName} <span style={{ color: '#94A3B8' }}>({sizeText(item.sizeBytes)})</span></td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{item.uploadedByName || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{formatDate(item.createdAt)}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => view(item)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                      <FiEye size={14} /> View
                    </button>
                    {canRemove && (
                      <button type="button" aria-label={`Remove ${item.originalName}`} onClick={() => remove(item)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', marginLeft: 8 }}>
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
      {canUpload && <DropZone onFiles={upload} disabled={busy} />}
      {busy && <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Uploading…</span>}
      {message && <span style={{ fontSize: '0.78rem', color: '#991B1B' }}>{message}</span>}
    </div>
  );
}

/** The "Activity Log" tab: the record's trail, newest first, with who did it and when. */
export function HistoryList({ api, id, refreshKey = 0 }) {
  const { data, error, loading } = useFetched(() => api.history(id), id, refreshKey);
  const rows = [...data].reverse();
  return (
    <DataState loading={loading} error={error} empty={!rows.length} emptyText="No activity recorded yet.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((row) => (
          <div key={row._id} style={{ display: 'flex', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E3A8A', marginTop: 6, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', color: '#0F172A' }}>{row.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{formatDateTime(row.occurredAt)} • {row.actorName}</div>
              {row.reason && <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>Reason: {row.reason}</div>}
            </div>
          </div>
        ))}
      </div>
    </DataState>
  );
}

/** The "Notes" tab with an "Add Note" button (when allowed). */
export function NotesPanel({ api, id, canAdd = false }) {
  const [refresh, setRefresh] = useState(0);
  const [adding, setAdding] = useState(false);
  const { data, error, loading } = useFetched(() => api.notes(id), id, refresh);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {canAdd && (
        <div>
          <SecondaryButton icon={<FiPlus size={14} />} onClick={() => setAdding(true)}>Add Note</SecondaryButton>
        </div>
      )}
      <DataState loading={loading} error={error} empty={!data.length} emptyText="No notes yet.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((note) => (
            <div key={note._id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: '0.85rem', color: '#0F172A', whiteSpace: 'pre-wrap' }}>{note.note}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 6 }}>{formatDate(note.createdAt)} • {note.authorName || '—'}</div>
            </div>
          ))}
        </div>
      </DataState>
      {adding && <AddNoteModal api={api} id={id} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); setRefresh((n) => n + 1); }} />}
    </div>
  );
}

function AddNoteModal({ api, id, onClose, onSaved }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!note.trim()) { setError('Write the note first.'); return; }
    setBusy(true);
    setError('');
    try {
      await api.addNote(id, note.trim());
      onSaved();
    } catch (err) {
      setError(apiError(err, 'The note could not be saved'));
      setBusy(false);
    }
  };
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add Note"
      maxWidth="460px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save Note'}</PrimaryButton>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note…" />
        <FormError message={error} />
      </div>
    </Modal>
  );
}

/** A small "label: value" stack used in the grey summary strips under the drawer title. */
export function Strip({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', background: '#F8FAFC', padding: '10px 14px', borderRadius: 8 }}>
      {children}
    </div>
  );
}

