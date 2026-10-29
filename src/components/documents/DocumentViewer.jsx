import { useEffect, useState } from 'react';
import { FiFileText, FiPaperclip, FiDownload, FiInfo } from 'react-icons/fi';
import Drawer from '../ui/Drawer';
import Badge from '../ui/Badge';
import { documentService } from '../../services/documents.service';
import { apiError, unwrap } from '../../services/apiHelpers';
import { displayDate, displayDateTime, formatFileSize, personName } from './fileHelpers';
import { ACCESS_LABEL, STATUS_LABEL, isUploader } from './documentUtils';

const LOG_STYLE = {
  'CHECKED-OUT': { color: '#DC2626', bg: '#FEF2F2' },
  VIEWED: { color: '#334155', bg: '#F1F5F9' },
  DOWNLOADED: { color: '#1D4ED8', bg: '#EFF6FF' },
  'CHECKED-IN': { color: '#10B981', bg: '#D1FAE5' },
};

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>{children}</div>
    </div>
  );
}

const centered = { color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: 24 };

function ViewerPanel({ docId, config, actions, userId, onAction, onClose, notify }) {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('details');
  const [revisions, setRevisions] = useState(null);
  const [log, setLog] = useState(null);

  useEffect(() => {
    let cancelled = false;
    documentService.get(docId)
      .then((res) => { if (!cancelled) setDoc(unwrap(res)); })
      .catch((err) => { if (!cancelled) setError(apiError(err, 'Failed to load document')); });
    return () => { cancelled = true; };
  }, [docId]);

  const openTab = async (key) => {
    setTab(key);
    try {
      if (key === 'history' && revisions === null) {
        setRevisions(unwrap(await documentService.revisions(docId)) || []);
      }
      if (key === 'log' && log === null) {
        const res = await documentService.accessLog(docId, { limit: 50 });
        setLog({ rows: res.data.data || [], total: res.data.meta?.total ?? (res.data.data || []).length });
      }
    } catch (err) {
      notify(apiError(err, 'Failed to load history'), 'error');
      if (key === 'history') setRevisions([]);
      else setLog({ rows: [], total: 0 });
    }
  };

  const file = doc?.currentFileId && typeof doc.currentFileId === 'object' ? doc.currentFileId : null;
  const waitingOnOthers = doc && config.variant === 'controlled' && doc.status === 'under_review' && isUploader(doc, userId);
  const tabs = [
    { key: 'details', label: 'Document Details' },
    { key: 'history', label: 'Revision History' },
    { key: 'log', label: 'Access Log' },
  ];

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={doc?.title || 'Document'}
      subtitle={doc ? `${doc.category || '—'} • ${doc.version || 'V1.0'}` : ''}
      width="560px"
    >
      {error ? (
        <div style={{ padding: 16, borderRadius: 8, backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: '0.85rem' }}>{error}</div>
      ) : !doc ? (
        <div style={centered}>Loading…</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '0 0 16px', borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiFileText size={18} color="#1D4ED8" />
              <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
              <Badge status={STATUS_LABEL[doc.status] || doc.status} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {actions(doc).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => onAction(action.key, doc)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, backgroundColor: '#fff', color: action.color || '#334155', fontSize: '0.813rem', fontWeight: 500, cursor: 'pointer' }}
                  >
                    <Icon size={14} /> {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {waitingOnOthers && (
            <div style={{ display: 'flex', gap: 8, padding: 12, borderRadius: 8, backgroundColor: '#FFF7ED', color: '#9A3412', fontSize: '0.813rem', marginBottom: 16 }}>
              <FiInfo size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>You uploaded this document, so someone else must approve it. You cannot approve your own upload.</span>
            </div>
          )}

          {config.viewTabs && (
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => openTab(t.key)}
                  style={{
                    flex: 1, padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    borderBottom: tab === t.key ? '2px solid #1D4ED8' : '2px solid transparent',
                    color: tab === t.key ? '#1D4ED8' : '#64748B', fontSize: '0.875rem', fontWeight: tab === t.key ? 600 : 500,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Field label="DOCUMENT NAME">{doc.title}</Field>
                <Field label="DOCUMENT CATEGORY">{doc.category || '—'}</Field>
                <Field label="DOC NO">{doc.docNo}</Field>
                <Field label="VERSION">{doc.version || '—'}</Field>
                <Field label="UPLOADED BY">{personName(doc.uploadedBy)}</Field>
                <Field label="ACCESS LEVEL">{ACCESS_LABEL[doc.accessLevel] || doc.accessLevel}</Field>
                {doc.accessLevel === 'assigned' && (
                  <Field label="ASSIGNED TO">
                    {Array.isArray(doc.assignedTo) && doc.assignedTo.length
                      ? doc.assignedTo.map((e) => (typeof e === 'object' ? e.fullName : e)).join(', ')
                      : 'Nobody yet'}
                  </Field>
                )}
                <Field label="DATE UPLOADED">{displayDate(doc.createdAt)}</Field>
                <Field label="LAST MODIFIED">{displayDate(doc.updatedAt)}</Field>
                <Field label="DEPARTMENT">{doc.departmentId?.name || '—'}</Field>
                <Field label="STATUS">{STATUS_LABEL[doc.status] || doc.status}</Field>
                {doc.status === 'checked_out' && <Field label="CHECKED OUT BY">{personName(doc.checkedOutBy)}</Field>}
              </div>
              <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>DESCRIPTION</div>
                <div style={{ fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{doc.description || 'No description provided.'}</div>
              </div>
              {file && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>ATTACHED DOCUMENTS</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#334155' }}>
                      <FiPaperclip size={14} color="#64748B" /> {file.originalName} ({formatFileSize(file.sizeBytes)})
                    </span>
                    <button type="button" className="icon-btn" title="Download" onClick={() => onAction('download', doc)}>
                      <FiDownload size={15} color="#2563EB" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {revisions === null ? <div style={centered}>Loading…</div> : revisions.length === 0 ? (
                <div style={centered}>No revision history yet.</div>
              ) : (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Revision timeline ({revisions.length})</div>
                  {revisions.map((revision) => (
                    <div key={revision._id} style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: 4 }}>REV {revision.revisionNo}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{displayDate(revision.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500, marginBottom: 4 }}>{revision.note || 'No note'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {revision.versionLabel} • Changed by: <span style={{ color: '#334155' }}>{personName(revision.changedBy)}</span>
                        {revision.fileId?.originalName ? ` • ${revision.fileId.originalName}` : ''}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {log === null ? <div style={centered}>Loading…</div> : log.rows.length === 0 ? (
                <div style={centered}>No access log entries yet.</div>
              ) : (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>System interaction logs ({log.total})</div>
                  {log.rows.map((entry) => {
                    const style = LOG_STYLE[entry.action] || LOG_STYLE.VIEWED;
                    return (
                      <div key={entry._id} style={{ padding: 14, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: style.color, backgroundColor: style.bg, padding: '3px 8px', borderRadius: 4 }}>{entry.action}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{displayDateTime(entry.at)}</span>
                        </div>
                        <div style={{ fontSize: '0.813rem', color: '#64748B' }}>User: <span style={{ color: '#0F172A', fontWeight: 500 }}>{personName(entry.userId)}</span></div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

/** Mounted only while a document is open, keyed per document, so each open starts clean. */
export default function DocumentViewer({ docId, refreshToken = 0, ...rest }) {
  if (!docId) return null;
  return <ViewerPanel key={`${docId}-${refreshToken}`} docId={docId} {...rest} />;
}
