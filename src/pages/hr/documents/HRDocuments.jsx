import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiEye, FiMoreVertical, FiEdit2,
  FiCheck, FiX, FiArchive, FiRefreshCw, FiUnlock, FiFileText, FiPlus, FiAlertCircle, FiLock,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { documentService } from '../../../services/documents.service';

const ITEMS_PER_PAGE = 10;

// Map API status values to display
const STATUS_LABEL = {
  draft:        'Draft',
  under_review: 'Under Review',
  approved:     'Approved',
  checked_out:  'Checked Out',
  archived:     'Archived',
};

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: i === 1 ? '80%' : '55%' }} />
        </td>
      ))}
    </tr>
  );
}

function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const s = row.status;
  const items = [];
  if (s === 'draft') {
    items.push({ label: 'Edit Metadata', icon: FiEdit2, action: 'edit' });
    items.push({ label: 'Submit for Review', icon: FiUpload, action: 'submit' });
  }
  if (s === 'under_review') {
    items.push({ label: 'Approve', icon: FiCheck, color: '#10B981', action: 'approve' });
    items.push({ label: 'Reject', icon: FiX, color: '#DC2626', action: 'reject' });
  }
  if (s === 'approved') {
    items.push({ label: 'Download', icon: FiDownload, action: 'download' });
    items.push({ label: 'Check Out', icon: FiUnlock, action: 'checkout' });
    items.push({ label: 'Archive', icon: FiArchive, action: 'archive' });
  }
  if (s === 'checked_out') {
    items.push({ label: 'Download', icon: FiDownload, action: 'download' });
    items.push({ label: 'Check In', icon: FiLock, action: 'checkin' });
    items.push({ label: 'Upload New Version', icon: FiUpload, action: 'uploadVersion' });
  }
  if (s === 'archived') {
    items.push({ label: 'Restore', icon: FiRefreshCw, action: 'restore' });
  }

  if (!items.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#fff',
          borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
          padding: '6px 0', zIndex: 50, width: 190 }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} onClick={() => { onAction(item.action, row); setOpen(false); }}
                className="menu-item-hover"
                style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color || '#334155',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon size={13} /> {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) setReason(''); }, [isOpen]);
  const handleConfirm = async () => { setSaving(true); await onConfirm(reason); setSaving(false); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Document" width="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="REASON (OPTIONAL)">
          <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this document is being rejected…" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={handleConfirm} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Upload / Edit Document Drawer ────────────────────────────────────────────
function DocumentFormDrawer({ isOpen, mode, initialData, onClose, onSaved }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({});
  const fileRef = useRef();

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setForm(initialData && mode === 'edit' ? {
        title: initialData.title || '',
        category: initialData.category || '',
        accessLevel: initialData.accessLevel || 'all_staff',
        description: initialData.description || '',
      } : { title: '', category: '', accessLevel: 'all_staff', description: '' });
    }
  }, [isOpen, mode, initialData]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (mode !== 'edit' && !file) { addToast('Please select a file', 'error'); return; }
    if (!form.title) { addToast('Document title is required', 'error'); return; }
    setSaving(true);
    try {
      if (mode === 'edit') {
        await documentService.update(initialData._id, form);
        addToast('Document updated', 'success');
      } else {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', form.title);
        fd.append('module', 'hr');
        if (form.category) fd.append('category', form.category);
        fd.append('accessLevel', form.accessLevel || 'all_staff');
        if (form.description) fd.append('description', form.description);
        await documentService.create(fd);
        addToast('Document uploaded', 'success');
      }
      onSaved();
    } catch (err) {
      addToast(err?.response?.data?.error?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'edit' ? 'Edit Document' : 'Upload HR Document';
  const subtitle = mode === 'edit' ? '' : 'Upload HR forms for employee and workforce processes';

  const footer = (
    <>
      <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
      <button onClick={handleSave} disabled={saving}
        style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : (mode === 'edit' ? 'Save Changes' : 'Upload File')}
      </button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} width="520px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="DOCUMENT TITLE *">
          <Input value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="e.g. Employee Onboarding Checklist" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="CATEGORY">
            <Select value={form.category || ''} onChange={v => set('category', v)}
              options={[
                { value: '', label: 'Select…' }, { value: 'Policy', label: 'Policy' },
                { value: 'Procedure', label: 'Procedure' }, { value: 'Employee Records', label: 'Employee Records' },
                { value: 'Onboarding', label: 'Onboarding' }, { value: 'Recruitment', label: 'Recruitment' },
                { value: 'Deployment', label: 'Deployment' }, { value: 'Training', label: 'Training' },
              ]} />
          </FormField>
          <FormField label="ACCESS LEVEL">
            <Select value={form.accessLevel || 'all_staff'} onChange={v => set('accessLevel', v)}
              options={[{ value: 'all_staff', label: 'All Staff' }, { value: 'department', label: 'Department' }]} />
          </FormField>
        </div>
        <FormField label="DESCRIPTION">
          <Textarea rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Optional description…" />
        </FormField>
        {mode !== 'edit' && (
          <FormField label="FILE *">
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: '1px dashed #CBD5E1', borderRadius: 8, padding: 24, textAlign: 'center',
                backgroundColor: '#F8FAFC', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <FiUpload size={20} color="#64748B" />
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                {file ? file.name : 'Drop file here or click to browse'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG — up to 50 MB</div>
            </div>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0] || null)} />
          </FormField>
        )}
      </div>
    </Drawer>
  );
}

// ─── View Document Drawer ─────────────────────────────────────────────────────
function ViewDocumentDrawer({ doc, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState('details');
  const [revisions, setRevisions]  = useState([]);
  const [accessLog, setAccessLog]  = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setActiveTab('details');
    setRevisions([]);
    setAccessLog([]);
  }, [doc]);

  const loadTab = async (tab) => {
    setActiveTab(tab);
    if (tab === 'history' && !revisions.length) {
      setSubLoading(true);
      try {
        const r = await documentService.revisions(doc._id);
        setRevisions(r.data.data || []);
      } catch { /* ignore */ } finally { setSubLoading(false); }
    }
    if (tab === 'log' && !accessLog.length) {
      setSubLoading(true);
      try {
        const r = await documentService.accessLog(doc._id, { limit: 20 });
        setAccessLog(r.data.data || []);
      } catch { /* ignore */ } finally { setSubLoading(false); }
    }
  };

  if (!doc) return null;

  return (
    <Drawer isOpen={!!doc} onClose={onClose} title={doc.title}
      subtitle={`${doc.category || '—'} • ${doc.version || 'V1.0'}`} width="560px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
          <Badge status={STATUS_LABEL[doc.status] || doc.status} />
        </div>
        {doc.status === 'approved' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onAction('download', doc)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, backgroundColor: '#fff', color: '#334155', fontSize: '0.813rem', fontWeight: 500, cursor: 'pointer' }}>
              <FiDownload size={14} /> Download
            </button>
            <button onClick={() => onAction('checkout', doc)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, backgroundColor: '#fff', color: '#334155', fontSize: '0.813rem', fontWeight: 500, cursor: 'pointer' }}>
              <FiUnlock size={14} /> Check Out
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
        {[{ key: 'details', label: 'Document Details' }, { key: 'history', label: 'Revision History' }, { key: 'log', label: 'Access Log' }].map(tab => (
          <button key={tab.key} onClick={() => loadTab(tab.key)}
            style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === tab.key ? '#1D4ED8' : '#64748B',
              fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 600 : 500 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              ['DOCUMENT NAME',  doc.title],
              ['DOC NO',         doc.docNo || '—'],
              ['CATEGORY',       doc.category || '—'],
              ['VERSION',        doc.version || '—'],
              ['ACCESS LEVEL',   doc.accessLevel === 'all_staff' ? 'All Staff' : 'Department'],
              ['STATUS',         <Badge key="s" status={STATUS_LABEL[doc.status] || doc.status} />],
              ['LAST UPDATED',   doc.updatedAt?.slice(0, 10) || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          {doc.description && (
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>DESCRIPTION</div>
              <div style={{ padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, fontSize: '0.875rem', color: '#334155' }}>{doc.description}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subLoading ? (
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>Loading…</div>
          ) : !revisions.length ? (
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>No revision history yet.</div>
          ) : revisions.map((rev, i) => (
            <div key={i} style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: 4 }}>
                  {rev.versionLabel || `Rev ${rev.revisionNo}`}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{rev.createdAt?.slice(0, 10) || '—'}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500, marginBottom: 4 }}>{rev.note || 'Initial issue'}</div>
              <div style={{ fontSize: '0.813rem', color: '#64748B' }}>Changed by: {rev.changedBy?.fullName || rev.changedBy || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subLoading ? (
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>Loading…</div>
          ) : !accessLog.length ? (
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center', padding: 24 }}>No access log entries yet.</div>
          ) : accessLog.map((entry, i) => {
            const actionColors = {
              'CHECKED-OUT': { color: '#DC2626', bg: '#FEF2F2' },
              VIEWED:        { color: '#334155', bg: '#F1F5F9' },
              DOWNLOADED:    { color: '#1D4ED8', bg: '#EFF6FF' },
              'CHECKED-IN':  { color: '#10B981', bg: '#D1FAE5' },
            };
            const s = actionColors[entry.action] || { color: '#334155', bg: '#F1F5F9' };
            return (
              <div key={i} style={{ padding: 14, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, backgroundColor: s.bg, padding: '3px 8px', borderRadius: 4 }}>{entry.action}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{entry.at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div style={{ fontSize: '0.813rem', color: '#64748B' }}>User: <span style={{ color: '#0F172A', fontWeight: 500 }}>{entry.userId?.fullName || entry.userId || '—'}</span></div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HRDocuments() {
  const { addToast } = useToast();

  const [items, setItems]   = useState([]);
  const [stats, setStats]   = useState([]);
  const [meta, setMeta]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const [viewDoc, setViewDoc]       = useState(null);
  const [formMode, setFormMode]     = useState(null); // 'upload' | 'edit' | null
  const [formDoc, setFormDoc]       = useState(null);
  const [rejectModal, setRejectModal] = useState(null);

  const debounceRef = useRef(null);

  const load = useCallback(async (p, q) => {
    setLoading(true);
    try {
      const params = { module: 'hr', page: p, limit: ITEMS_PER_PAGE };
      if (q) params.q = q;
      const [listRes, statsRes] = await Promise.all([
        documentService.list(params),
        documentService.stats('hr'),
      ]);
      setItems(listRes.data.data || []);
      setMeta(listRes.data.meta || null);
      setStats(statsRes.data.data || []);
    } catch (err) {
      addToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(1, ''); }, [load]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, val), 400);
  };

  const handlePageChange = (p) => { setPage(p); load(p, search); };

  const handleAction = async (action, doc) => {
    try {
      if (action === 'download') {
        const r = await documentService.download(doc._id);
        const url = r.data.data?.url;
        if (url) window.open(url, '_blank');
        return;
      }
      if (action === 'edit')    { setFormMode('edit'); setFormDoc(doc); return; }
      if (action === 'reject')  { setRejectModal(doc); return; }

      if (action === 'submit')   await documentService.submit(doc._id);
      if (action === 'approve')  await documentService.approve(doc._id);
      if (action === 'checkout') await documentService.checkout(doc._id);
      if (action === 'checkin')  await documentService.checkin(doc._id);
      if (action === 'archive')  await documentService.archive(doc._id);
      if (action === 'restore')  await documentService.restore(doc._id);

      addToast('Document updated successfully', 'success');
      load(page, search);
    } catch (err) {
      addToast(err?.response?.data?.error?.message || 'Action failed', 'error');
    }
  };

  const getStatVal = (key) => stats.find(s => s.key === key)?.value ?? '—';

  const STAT_TILES = [
    { key: 'total_documents', label: 'TOTAL DOCUMENTS', subtitle: 'All HR documents' },
    { key: 'under_review',    label: 'UNDER REVIEW',    subtitle: 'Pending approval' },
    { key: 'approved',        label: 'APPROVED',         subtitle: 'Active approved docs' },
    { key: 'archived',        label: 'ARCHIVED',         subtitle: 'Archived documents' },
  ];

  const columns = [
    { key: 'docNo',    label: 'DOC NO', render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    { key: 'title',    label: 'DOCUMENT TITLE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY', render: (v) => <span style={{ color: '#3B82F6' }}>{v || '—'}</span> },
    { key: 'version',  label: 'VERSION', render: (v) => v || 'V1.0' },
    { key: 'status',   label: 'STATUS', render: (v) => <Badge status={STATUS_LABEL[v] || v} /> },
    { key: 'updatedAt', label: 'LAST UPDATED', render: (v) => v?.slice(0, 10) || '—' },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewDoc(row)}><FiEye size={15} /></button>
          <RowMenu row={row} onAction={handleAction} />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>HR Documents</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Access and manage HR forms used for employee and workforce processes
          </p>
        </div>
        <button onClick={() => { setFormMode('upload'); setFormDoc(null); }}
          className="btn btn-primary"
          style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FiPlus size={14} /> Upload Document
        </button>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {STAT_TILES.map((stat, i) => (
          <div key={stat.key} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.label}</span>
              <FiFileText size={14} color="#94A3B8" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{getStatVal(stat.key)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search by title, category…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map(e => e._id))}
            keyField="_id"
            emptyMessage="No HR documents found."
          />
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      <ViewDocumentDrawer doc={viewDoc} onClose={() => setViewDoc(null)} onAction={handleAction} />

      <DocumentFormDrawer
        isOpen={!!formMode}
        mode={formMode}
        initialData={formDoc}
        onClose={() => { setFormMode(null); setFormDoc(null); }}
        onSaved={() => { setFormMode(null); setFormDoc(null); load(page, search); }}
      />

      <RejectModal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        onConfirm={async (reason) => {
          try {
            await documentService.reject(rejectModal._id, reason);
            addToast('Document rejected', 'success');
            setRejectModal(null);
            load(page, search);
          } catch (err) {
            addToast(err?.response?.data?.error?.message || 'Failed to reject', 'error');
          }
        }}
      />
    </div>
  );
}
