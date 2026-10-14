import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiDownload, FiEye, FiPlus, FiFileText, FiTrash2, FiUnlock } from 'react-icons/fi';
import DataTable from '../ui/DataTable';
import Pagination from '../ui/Pagination';
import Badge from '../ui/Badge';
import Drawer from '../ui/Drawer';
import Modal from '../ui/Modal';
import RowMenu from '../ui/RowMenu';
import Toast from '../ui/Toast';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import { documentService } from '../../services/documents.service';
import { apiError, unwrap } from '../../services/apiHelpers';
import { usePermission } from '../../hooks/usePermission';
import { selectCurrentUser } from '../../store/authSlice';
import { fetchDocuments, fetchDocumentStats, selectModuleDocuments } from '../../store/documents/documentsSlice';
import { blobErrorMessage, displayDate, openDownloadUrl, personName, saveBlob } from './fileHelpers';
import { MODULE_LABEL, STATUS_LABEL, documentActions, isUploader } from './documentUtils';
import DocumentForm from './DocumentForm';
import DocumentViewer from './DocumentViewer';

const PAGE_SIZE = 10;
const EMPTY = { items: [], meta: null, stats: [], loading: true, error: '' };

const STAT_TILES = [
  { key: 'total_documents', label: 'TOTAL DOCUMENTS' },
  { key: 'under_review', label: 'UNDER REVIEW' },
  { key: 'approved', label: 'APPROVED' },
  { key: 'archived', label: 'ARCHIVED' },
];

const DEFAULTS = {
  variant: 'controlled',
  columns: ['docNo', 'title', 'category', 'version', 'uploadedBy', 'status', 'updatedAt'],
  actionStyle: 'menu',
  viewTabs: true,
  showStats: false,
  canUpload: true,
  filterable: true,
  categories: [],
  uploadTitle: 'Upload Document',
  uploadSubtitle: '',
  uploadSubmitLabel: 'Upload Document',
  searchPlaceholder: 'Search by Doc title, Category...',
  emptyMessage: 'No documents found.',
  deleteLabel: 'Delete File',
};

const outlineButton = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' };

function SkeletonRows({ columns }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {Array.from({ length: 6 }).map((_, row) => (
          <tr key={row}>
            {Array.from({ length: columns }).map((__, cell) => (
              <td key={cell} style={{ padding: '12px 16px' }}>
                <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: cell === 1 ? '80%' : '55%' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * One documents page for any module. `variant` picks the design:
 *  - controlled: full review / approval / check-out workflow (HR, Admin Documents)
 *  - library:    simple documents with replace / download / delete and a category (Procurement)
 *  - plain:      simple documents, name + file only, download / retrieve (HSE, QMS)
 *  - register:   read-only register of controlled documents across modules (EDMS)
 */
export default function ModuleDocuments({ module, title, subtitle, config: pageConfig }) {
  const config = { ...DEFAULTS, ...pageConfig };
  const key = module || 'register';
  const dispatch = useDispatch();
  const entry = useSelector(selectModuleDocuments(key)) || EMPTY;
  const user = useSelector(selectCurrentUser);
  const userId = user?._id || user?.id;

  const canCreate = usePermission('core.document.create');
  const canExport = usePermission('core.document.export');
  const canView = usePermission('core.document.view');
  const canApprove = usePermission('core.document.approve');
  const canReject = usePermission('core.document.reject');
  const canUpdate = usePermission('core.document.update');
  const canCheckout = usePermission('core.document.checkout');
  const canCheckin = usePermission('core.document.checkin');
  const canArchive = usePermission('core.document.archive');
  const canRestore = usePermission('core.document.restore');
  const canDelete = usePermission('core.document.delete');
  const permissionMap = {
    'core.document.view': canView,
    'core.document.approve': canApprove,
    'core.document.reject': canReject,
    'core.document.update': canUpdate,
    'core.document.checkout': canCheckout,
    'core.document.checkin': canCheckin,
    'core.document.archive': canArchive,
    'core.document.restore': canRestore,
    'core.document.delete': canDelete,
  };
  const can = (permission) => !!permissionMap[permission];

  const [toast, setToast] = useState(null);
  const notify = (message, type = 'success') => setToast({ message, type });

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', category: '', module: '' });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [viewVersion, setViewVersion] = useState(0);
  const [form, setForm] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const timer = useRef(null);

  const filterParams = useMemo(() => {
    const params = {};
    if (module) params.module = module;
    else if (filters.module) params.module = filters.module;
    if (config.variant === 'register') params.controlled = true;
    if (config.variant === 'library' || config.variant === 'plain') params.controlled = false;
    if (query) params.q = query;
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    return params;
  }, [module, query, filters, config.variant]);
  const listParams = useMemo(() => ({ ...filterParams, page, limit: PAGE_SIZE }), [filterParams, page]);

  useEffect(() => {
    dispatch(fetchDocuments({ key, params: listParams }));
  }, [dispatch, key, listParams]);

  useEffect(() => {
    if (config.showStats) dispatch(fetchDocumentStats({ key, module }));
  }, [dispatch, key, module, config.showStats]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const reload = () => {
    dispatch(fetchDocuments({ key, params: listParams }));
    if (config.showStats) dispatch(fetchDocumentStats({ key, module }));
    setViewVersion((v) => v + 1);
  };

  const onSearch = (text) => {
    setSearch(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setQuery(text.trim());
      setPage(1);
    }, 350);
  };

  const run = async (call, message) => {
    setBusy(true);
    try {
      await call();
      notify(message, 'success');
      reload();
      return true;
    } catch (err) {
      notify(apiError(err, 'Action failed'), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const perform = async (action, doc) => {
    switch (action) {
      case 'download':
        try {
          openDownloadUrl(unwrap(await documentService.download(doc._id))?.url);
        } catch (err) {
          notify(apiError(err, 'Failed to download document'), 'error');
        }
        return;
      case 'edit': setForm({ mode: 'edit', doc }); return;
      case 'uploadVersion':
      case 'replace': setForm({ mode: 'version', doc }); return;
      case 'reject': setReason(''); setRejecting(doc); return;
      case 'checkout': setConfirming({ action, doc }); return;
      case 'delete': setConfirming({ action, doc }); return;
      case 'approve':
        if (isUploader(doc, userId)) {
          notify('You uploaded this document, so someone else must approve it.', 'error');
          return;
        }
        await run(() => documentService.approve(doc._id), 'Document approved');
        return;
      case 'submit': await run(() => documentService.submit(doc._id), 'Document submitted for review'); return;
      case 'checkin': await run(() => documentService.checkin(doc._id), 'Document checked in'); return;
      case 'archive': await run(() => documentService.archive(doc._id), 'Document archived'); return;
      case 'restore': await run(() => documentService.restore(doc._id), 'Document restored'); return;
      default:
    }
  };

  const confirmAction = async () => {
    const { action, doc } = confirming;
    const ok = action === 'checkout'
      ? await run(() => documentService.checkout(doc._id), 'Document checked out')
      : await run(() => documentService.delete(doc._id), 'Document removed');
    if (ok) {
      setConfirming(null);
      if (action === 'delete' && viewId === doc._id) setViewId(null);
    }
  };

  const submitReject = async () => {
    if (!reason.trim()) { notify('A reason is required to reject a document', 'error'); return; }
    const ok = await run(() => documentService.reject(rejecting._id, reason.trim()), 'Document rejected');
    if (ok) setRejecting(null);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      saveBlob(await documentService.exportCsv(filterParams), `${key}-documents.csv`);
    } catch (err) {
      notify(await blobErrorMessage(err, 'Failed to export documents'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const actionsFor = (doc) => documentActions(doc, { variant: config.variant, can, userId, deleteLabel: config.deleteLabel });

  const base = (page - 1) * PAGE_SIZE;
  const columnDefs = {
    sn: { key: 'sn', label: 'S/N', render: (_, row) => <span style={{ color: '#64748B' }}>{base + entry.items.indexOf(row) + 1}</span> },
    docNo: { key: 'docNo', label: 'DOC NO', render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    title: { key: 'title', label: config.titleLabel || 'DOCUMENT TITLE', render: (v, row) => (
      <span style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span>
    ) },
    category: { key: 'category', label: 'CATEGORY', render: (v) => <span style={{ color: '#3B82F6' }}>{v || '—'}</span> },
    department: { key: 'module', label: 'DEPARTMENT', render: (v, row) => <span style={{ color: '#3B82F6' }}>{row.departmentId?.name || MODULE_LABEL[v] || v}</span> },
    version: { key: 'version', label: 'VERSION', render: (v) => v || 'V1.0' },
    uploadedBy: { key: 'uploadedBy', label: 'UPLOADED BY', render: (v) => personName(v) },
    owner: { key: 'uploadedBy', label: 'OWNER', render: (v) => personName(v) },
    status: { key: 'status', label: 'STATUS', render: (v) => <Badge status={STATUS_LABEL[v] || v} /> },
    updatedAt: { key: 'updatedAt', label: 'LAST UPDATED', render: (v) => displayDate(v) },
    lastModified: { key: 'updatedAt', label: 'LAST MODIFIED', render: (v) => displayDate(v) },
    uploadDate: { key: 'createdAt', label: 'UPLOAD DATE', render: (v) => displayDate(v) },
  };

  const actionsColumn = {
    key: 'actions',
    label: 'ACTIONS',
    align: 'right',
    render: (_, row) => {
      const items = actionsFor(row);
      if (config.actionStyle === 'inline') {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
            {items.map((item) => {
              const Icon = item.key === 'delete' ? FiTrash2 : FiDownload;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => perform(item.key, row)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: item.key === 'delete' ? '#DC2626' : '#334155' }}
                >
                  <Icon size={14} /> {item.key === 'delete' ? config.inlineDeleteLabel || 'Delete' : 'Download'}
                </button>
              );
            })}
          </div>
        );
      }
      if (config.actionStyle === 'register') {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <button className="icon-btn" title="View" onClick={() => setViewId(row._id)}><FiEye size={15} /></button>
            {can('core.document.view') && <button className="icon-btn" title="Download" onClick={() => perform('download', row)}><FiDownload size={15} /></button>}
          </div>
        );
      }
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewId(row._id)}><FiEye size={15} /></button>
          {items.length > 0 ? (
            <RowMenu items={items.map((item) => ({ label: item.label, icon: <item.icon size={13} style={{ marginRight: 8 }} />, color: item.color, action: () => perform(item.key, row) }))} />
          ) : <span style={{ width: 24 }} />}
        </div>
      );
    },
  };
  const columns = [...config.columns.map((name) => columnDefs[name]), actionsColumn];

  const filterCount = Object.values(filters).filter(Boolean).length;
  const statusOptions = [{ value: '', label: 'All statuses' }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))];
  const hasFilterControls = config.variant === 'controlled' || config.variant === 'register' || config.categories.length > 0;
  const getStat = (statKey) => entry.stats.find((s) => s.key === statKey)?.value ?? '—';
  const confirmDelete = confirming?.action === 'delete';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>{subtitle}</p>
      </div>

      {config.showStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {STAT_TILES.map((tile) => (
            <div key={tile.key} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{tile.label}</span>
                <FiFileText size={14} color="#94A3B8" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>{getStat(tile.key)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={config.searchPlaceholder} style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            {config.filterable && hasFilterControls && (
              <button type="button" className="btn btn-secondary" onClick={() => { setDraftFilters(filters); setFilterOpen(true); }} style={outlineButton}>
                <FiFilter size={14} /> Filter{filterCount ? ` (${filterCount})` : ''}
              </button>
            )}
            {canExport && (
              <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={exporting} style={outlineButton}>
                <FiDownload size={14} /> {exporting ? 'Exporting…' : 'Export'}
              </button>
            )}
            {config.canUpload && canCreate && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setForm({ mode: 'upload' })}
                style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FiPlus size={14} /> Upload Document
              </button>
            )}
          </div>
        </div>

        {entry.error ? (
          <div style={{ padding: 16, borderRadius: 8, backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>{entry.error}</span>
            <button type="button" className="btn btn-secondary" onClick={reload}>Retry</button>
          </div>
        ) : entry.loading && entry.items.length === 0 ? (
          <SkeletonRows columns={columns.length} />
        ) : (
          <DataTable columns={columns} data={entry.items} keyField="_id" emptyMessage={config.emptyMessage} />
        )}

        {entry.meta && entry.meta.total > PAGE_SIZE && (
          <Pagination currentPage={page} totalPages={entry.meta.totalPages} onPageChange={setPage} />
        )}
      </div>

      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Documents"
        width="400px"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => { setFilters({ status: '', category: '', module: '' }); setPage(1); setFilterOpen(false); }}>Clear</button>
            <button type="button" className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none' }} onClick={() => { setFilters(draftFilters); setPage(1); setFilterOpen(false); }}>Apply</button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {config.variant !== 'library' && (
            <FormField label="STATUS">
              <Select value={draftFilters.status} onChange={(e) => setDraftFilters((f) => ({ ...f, status: e.target.value }))} options={statusOptions} />
            </FormField>
          )}
          {config.categories.length > 0 && (
            <FormField label="CATEGORY">
              <Select
                value={draftFilters.category}
                onChange={(e) => setDraftFilters((f) => ({ ...f, category: e.target.value }))}
                options={[{ value: '', label: 'All categories' }, ...config.categories.map((c) => ({ value: c, label: c }))]}
              />
            </FormField>
          )}
          {config.variant === 'register' && (
            <FormField label="DEPARTMENT">
              <Select
                value={draftFilters.module}
                onChange={(e) => setDraftFilters((f) => ({ ...f, module: e.target.value }))}
                options={[{ value: '', label: 'All departments' }, ...Object.entries(MODULE_LABEL).map(([value, label]) => ({ value, label }))]}
              />
            </FormField>
          )}
        </div>
      </Drawer>

      <DocumentViewer
        docId={viewId}
        refreshToken={viewVersion}
        config={config}
        actions={actionsFor}
        userId={userId}
        onAction={perform}
        onClose={() => setViewId(null)}
        notify={notify}
      />

      <DocumentForm
        mode={form?.mode}
        doc={form?.doc}
        module={module}
        config={config}
        notify={notify}
        onClose={() => setForm(null)}
        onSaved={(message, type = 'success') => { setForm(null); notify(message, type); reload(); }}
      />

      <Modal
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject Document"
        maxWidth="440px"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setRejecting(null)}>Cancel</button>
            <button type="button" onClick={submitReject} disabled={busy} style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Rejecting…' : 'Reject'}
            </button>
          </>
        )}
      >
        <FormField label="REASON" required>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this document is being rejected…" maxLength={2000} />
        </FormField>
      </Modal>

      <Modal
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        title={confirmDelete ? config.deleteConfirmTitle || 'Delete Document?' : 'Check out this file?'}
        maxWidth="440px"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(null)}>Cancel</button>
            <button
              type="button"
              onClick={confirmAction}
              disabled={busy}
              style={{ padding: '8px 20px', backgroundColor: confirmDelete ? '#DC2626' : '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {confirmDelete ? <FiTrash2 size={14} /> : <FiUnlock size={14} />}
              {busy ? 'Working…' : confirmDelete ? config.deleteConfirmButton || 'Delete Document' : 'Check Out File'}
            </button>
          </>
        )}
      >
        <p style={{ margin: 0, color: '#475569' }}>
          {confirmDelete
            ? `This permanently removes the document, its file and its revision history from the ${title} list. This cannot be undone.`
            : 'Checking out this document will lock it for editing while you work on a new version. Other users can still view and download the current version.'}
        </p>
        <p style={{ margin: '12px 0 0', fontWeight: 600, color: '#0F172A' }}>
          {confirming?.doc.docNo} {confirming?.doc.title}
        </p>
      </Modal>
    </div>
  );
}
