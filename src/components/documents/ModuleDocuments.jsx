import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiEye, FiMoreVertical, FiEdit2,
  FiCheck, FiX, FiArchive, FiRefreshCw, FiUnlock, FiFileText, FiPlus, FiLock,
} from 'react-icons/fi';
import DataTable from '../ui/DataTable';
import Pagination from '../ui/Pagination';
import Badge from '../ui/Badge';
import Drawer from '../ui/Drawer';
import Modal from '../ui/Modal';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import Toast, { useToast } from '../ui/Toast';
import { documentService } from '../../services/documents.service';
import { apiError } from '../../services/apiHelpers';

const ITEMS_PER_PAGE = 10;
const STATUS_LABEL = {
  draft: 'Draft', under_review: 'Under Review', approved: 'Approved',
  checked_out: 'Checked Out', archived: 'Archived',
};

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
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
  if (s === 'archived') items.push({ label: 'Restore', icon: FiRefreshCw, action: 'restore' });
  if (!items.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
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

export default function ModuleDocuments({ module, title, subtitle }) {
  const { toast, addToast, hideToast } = useToast();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewDoc, setViewDoc] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [formDoc, setFormDoc] = useState(null);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');
  const debounceRef = useRef(null);
  const fileRef = useRef();

  const load = useCallback(async (p, q) => {
    setLoading(true);
    try {
      const params = { module, page: p, limit: ITEMS_PER_PAGE };
      if (q) params.q = q;
      const [listRes, statsRes] = await Promise.all([
        documentService.list(params),
        documentService.stats(module),
      ]);
      setItems(listRes.data.data || []);
      setMeta(listRes.data.meta || null);
      setStats(statsRes.data.data || []);
    } catch {
      addToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, module]);

  useEffect(() => { load(1, ''); }, [load]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, val), 400);
  };

  const handleAction = async (action, doc) => {
    try {
      if (action === 'download') {
        const r = await documentService.download(doc._id);
        const url = r.data.data?.url;
        if (url) window.open(url, '_blank');
        return;
      }
      if (action === 'edit') { setFormMode('edit'); setFormDoc(doc); setForm({ title: doc.title || '', category: doc.category || '', accessLevel: doc.accessLevel || 'all_staff', description: doc.description || '' }); return; }
      if (action === 'reject') { setRejectModal(doc); setReason(''); return; }
      if (action === 'uploadVersion') { setFormMode('version'); setFormDoc(doc); setFile(null); return; }
      if (action === 'submit') await documentService.submit(doc._id);
      if (action === 'approve') await documentService.approve(doc._id);
      if (action === 'checkout') await documentService.checkout(doc._id);
      if (action === 'checkin') await documentService.checkin(doc._id);
      if (action === 'archive') await documentService.archive(doc._id);
      if (action === 'restore') await documentService.restore(doc._id);
      addToast('Document updated successfully', 'success');
      load(page, search);
    } catch (err) {
      addToast(apiError(err, 'Action failed'), 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (formMode === 'edit') {
        await documentService.update(formDoc._id, form);
        addToast('Document updated', 'success');
      } else if (formMode === 'version') {
        if (!file) { addToast('Please select a file', 'error'); setSaving(false); return; }
        const fd = new FormData();
        fd.append('file', file);
        await documentService.uploadVersion(formDoc._id, fd);
        addToast('New version uploaded', 'success');
      } else {
        if (!file || !form.title) { addToast('Title and file are required', 'error'); setSaving(false); return; }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', form.title);
        fd.append('module', module);
        if (form.category) fd.append('category', form.category);
        fd.append('accessLevel', form.accessLevel || 'all_staff');
        if (form.description) fd.append('description', form.description);
        await documentService.create(fd);
        addToast('Document uploaded', 'success');
      }
      setFormMode(null); setFormDoc(null); setFile(null);
      load(page, search);
    } catch (err) {
      addToast(apiError(err, 'Failed to save'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatVal = (key) => stats.find((s) => s.key === key)?.value ?? '—';
  const columns = [
    { key: 'docNo', label: 'DOC NO', render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    { key: 'title', label: 'DOCUMENT TITLE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY', render: (v) => <span style={{ color: '#3B82F6' }}>{v || '—'}</span> },
    { key: 'version', label: 'VERSION', render: (v) => v || 'V1.0' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={STATUS_LABEL[v] || v} /> },
    { key: 'updatedAt', label: 'LAST UPDATED', render: (v) => v?.slice(0, 10) || '—' },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View" onClick={() => setViewDoc(row)}><FiEye size={15} /></button>
          <RowMenu row={row} onAction={handleAction} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>{subtitle}</p>
        </div>
        <button onClick={() => { setFormMode('upload'); setFormDoc(null); setForm({ title: '', category: '', accessLevel: 'all_staff', description: '' }); setFile(null); }}
          className="btn btn-primary"
          style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FiPlus size={14} /> Upload Document
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { key: 'total_documents', label: 'TOTAL DOCUMENTS' },
          { key: 'under_review', label: 'UNDER REVIEW' },
          { key: 'approved', label: 'APPROVED' },
          { key: 'archived', label: 'ARCHIVED' },
        ].map((stat) => (
          <div key={stat.key} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.label}</span>
              <FiFileText size={14} color="#94A3B8" />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>{getStatVal(stat.key)}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by title…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
          </div>
        </div>
        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody></table>
        ) : (
          <DataTable columns={columns} data={items} selectable selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map((e) => e._id))}
            keyField="_id" emptyMessage="No documents found." />
        )}
        {meta && meta.totalPages > 1 && <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={(p) => { setPage(p); load(p, search); }} />}
      </div>

      <Drawer isOpen={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc?.title} subtitle={`${viewDoc?.category || '—'} • ${viewDoc?.version || 'V1.0'}`} width="560px">
        {viewDoc && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[['DOCUMENT NAME', viewDoc.title], ['DOC NO', viewDoc.docNo || '—'], ['CATEGORY', viewDoc.category || '—'],
              ['VERSION', viewDoc.version || '—'], ['STATUS', STATUS_LABEL[viewDoc.status] || viewDoc.status],
              ['LAST UPDATED', viewDoc.updatedAt?.slice(0, 10) || '—']].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <Drawer isOpen={!!formMode} onClose={() => setFormMode(null)}
        title={formMode === 'edit' ? 'Edit Document' : formMode === 'version' ? 'Upload New Version' : 'Upload Document'}
        width="520px"
        footer={
          <>
            <button onClick={() => setFormMode(null)} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }>
        {formMode !== 'version' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="DOCUMENT TITLE *"><Input value={form.title || ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></FormField>
            <FormField label="CATEGORY"><Input value={form.category || ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></FormField>
            <FormField label="ACCESS LEVEL">
              <Select value={form.accessLevel || 'all_staff'} onChange={(v) => setForm((f) => ({ ...f, accessLevel: v }))}
                options={[{ value: 'all_staff', label: 'All Staff' }, { value: 'department', label: 'Department' }]} />
            </FormField>
            <FormField label="DESCRIPTION"><Textarea rows={3} value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></FormField>
          </div>
        )}
        {formMode !== 'edit' && (
          <FormField label="FILE *">
            <div onClick={() => fileRef.current?.click()} style={{ border: '1px dashed #CBD5E1', borderRadius: 8, padding: 24, textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer' }}>
              <FiUpload size={20} color="#64748B" />
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 8 }}>{file ? file.name : 'Click to browse'}</div>
            </div>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0] || null)} />
          </FormField>
        )}
      </Drawer>

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Document" width="440px">
        <FormField label="REASON">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
          <button onClick={async () => {
            try {
              await documentService.reject(rejectModal._id, reason);
              addToast('Document rejected', 'success');
              setRejectModal(null);
              load(page, search);
            } catch (err) { addToast(apiError(err, 'Failed'), 'error'); }
          }} style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
        </div>
      </Modal>
    </div>
  );
}
