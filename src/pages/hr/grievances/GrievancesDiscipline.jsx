import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiEye, FiMoreVertical,
  FiCheck, FiX, FiPlus, FiAlertCircle, FiEdit2, FiMessageSquare,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { Input, FormField, Select, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import {
  fetchCases, fetchCaseStats, createCase, updateCase,
  startReview, resolveCase, closeCase, addNote,
  selectCases, selectCasesMeta, selectCasesLoading,
  selectCaseStats, selectCasesError, clearGrievanceError,
} from '../../../store/hr/grievanceSlice';
import { employeeService } from '../../../services/hr.service';

const ITEMS_PER_PAGE = 10;

const SEVERITY_STYLES = {
  high:   { color: '#DC2626', bg: '#FEF2F2' },
  medium: { color: '#EA580C', bg: '#FFF7ED' },
  low:    { color: '#2563EB', bg: '#EFF6FF' },
};

const STAT_COLORS = [
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#FFEDD5', color: '#C2410C' },
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#F3F4F6', color: '#374151' },
];

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: i === 1 ? '70%' : '55%' }} />
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

  const status = row.status;
  const menuItems = [];
  if (status === 'open') menuItems.push({ label: 'Start Review', icon: FiCheck, color: '#1D4ED8', action: 'startReview' });
  if (status === 'under_review') menuItems.push({ label: 'Resolve Case', icon: FiCheck, color: '#10B981', action: 'resolve' });
  if (status === 'resolved') menuItems.push({ label: 'Close Case', icon: FiX, color: '#64748B', action: 'close' });
  if (status !== 'closed') {
    menuItems.push({ label: 'Add Note', icon: FiMessageSquare, color: '#334155', action: 'addNote' });
    if (status !== 'resolved') menuItems.push({ label: 'Edit', icon: FiEdit2, color: '#334155', action: 'edit' });
  }

  if (!menuItems.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#fff',
          borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
          padding: '6px 0', zIndex: 50, width: 180 }}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} onClick={() => { onAction(item.action, row); setOpen(false); }}
                className="menu-item-hover"
                style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color,
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

// ─── Create / Edit Case Drawer ────────────────────────────────────────────────
function CaseDrawer({ isOpen, onClose, editItem, employees, onSaved }) {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(editItem ? {
        category:         editItem.category || 'disciplinary',
        caseType:         editItem.caseType || '',
        severity:         editItem.severity || 'medium',
        incidentDate:     editItem.incidentDate?.slice(0, 10) || '',
        caseTitle:        editItem.caseTitle || '',
        description:      editItem.description || '',
        employeeId:       editItem.employeeId?._id || editItem.employeeId || '',
        assignedOfficerId:editItem.assignedOfficerId?._id || editItem.assignedOfficerId || '',
      } : {
        category: 'disciplinary', caseType: '', severity: 'medium',
        incidentDate: '', caseTitle: '', description: '', employeeId: '', assignedOfficerId: '',
      });
    }
  }, [isOpen, editItem]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.employeeId || !form.caseType || !form.incidentDate || !form.caseTitle) {
      addToast('Employee, case type, incident date, and title are required', 'error'); return;
    }
    setSaving(true);
    try {
      if (editItem?._id) {
        await dispatch(updateCase({ id: editItem._id, data: form })).unwrap();
        addToast('Case updated', 'success');
      } else {
        await dispatch(createCase(form)).unwrap();
        addToast('Case created', 'success');
      }
      onSaved();
    } catch (err) {
      addToast(err?.message || 'Failed to save case', 'error');
    } finally {
      setSaving(false);
    }
  };

  const empOptions = employees.map(e => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }));
  empOptions.unshift({ value: '', label: 'Select employee…' });

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={editItem?._id ? 'Edit Case' : 'Log Disciplinary Case'} width="520px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editItem?._id ? 'Save Changes' : 'Log Case')}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="EMPLOYEE *">
          <Select value={form.employeeId || ''} onChange={v => set('employeeId', v)} options={empOptions} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="CATEGORY *">
            <Select value={form.category || 'disciplinary'} onChange={v => set('category', v)}
              options={[{ value: 'disciplinary', label: 'Disciplinary' }, { value: 'grievance', label: 'Grievance' }]} />
          </FormField>
          <FormField label="SEVERITY *">
            <Select value={form.severity || 'medium'} onChange={v => set('severity', v)}
              options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          </FormField>
        </div>
        <FormField label="CASE TYPE *">
          <Input value={form.caseType || ''} onChange={e => set('caseType', e.target.value)} placeholder="e.g. Attendance violation" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="CASE TITLE *">
            <Input value={form.caseTitle || ''} onChange={e => set('caseTitle', e.target.value)} />
          </FormField>
          <FormField label="INCIDENT DATE *">
            <Input type="date" value={form.incidentDate || ''} onChange={e => set('incidentDate', e.target.value)} />
          </FormField>
        </div>
        <FormField label="ASSIGNED OFFICER">
          <Select value={form.assignedOfficerId || ''} onChange={v => set('assignedOfficerId', v)} options={empOptions} />
        </FormField>
        <FormField label="DESCRIPTION">
          <Textarea rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────
function AddNoteModal({ isOpen, caseItem, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (isOpen) setNote(''); }, [isOpen]);

  const handleSave = async () => {
    if (!note.trim()) { addToast('Note text is required', 'error'); return; }
    setSaving(true);
    try {
      await dispatch(addNote({ id: caseItem._id, note })).unwrap();
      addToast('Note added', 'success');
      onSaved();
    } catch (err) {
      addToast(err?.message || 'Failed to add note', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Internal Note" width="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="NOTE">
          <Textarea rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Add context or progress notes…" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrievancesDiscipline() {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const items        = useSelector(selectCases);
  const meta         = useSelector(selectCasesMeta);
  const loading      = useSelector(selectCasesLoading);
  const stats        = useSelector(selectCaseStats);
  const apiError     = useSelector(selectCasesError);

  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const [caseDrawerOpen, setCaseDrawerOpen] = useState(false);
  const [editCase, setEditCase]             = useState(null);
  const [noteModal, setNoteModal]           = useState(null);
  const [employees, setEmployees]           = useState([]);

  const debounceRef = useRef(null);

  const load = useCallback((p, q) => {
    dispatch(fetchCases({ page: p, limit: ITEMS_PER_PAGE, ...(q ? { q } : {}) }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCaseStats());
    load(1, '');
    // Preload employees for form pickers
    employeeService.list({ limit: 200 }).then(r => setEmployees(r.data.data || [])).catch(() => {});
  }, [dispatch, load]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, val), 400);
  };

  const handlePageChange = (p) => { setPage(p); load(p, search); };

  const handleAction = async (action, row) => {
    try {
      if (action === 'startReview') {
        await dispatch(startReview(row._id)).unwrap();
        addToast('Case moved to Under Review', 'success');
      } else if (action === 'resolve') {
        await dispatch(resolveCase(row._id)).unwrap();
        addToast('Case resolved', 'success');
      } else if (action === 'close') {
        await dispatch(closeCase(row._id)).unwrap();
        addToast('Case closed', 'success');
      } else if (action === 'edit') {
        setEditCase(row);
        setCaseDrawerOpen(true);
      } else if (action === 'addNote') {
        setNoteModal(row);
      }
    } catch (err) {
      addToast(err?.message || 'Action failed', 'error');
    }
  };

  const openCreate = () => { setEditCase(null); setCaseDrawerOpen(true); };

  const STAT_KEYS = [
    { key: 'open',         label: 'OPEN CASES',           subtitle: 'Current active cases' },
    { key: 'under_review', label: 'UNDER REVIEW',          subtitle: 'Cases being investigated' },
    { key: 'resolved',     label: 'RESOLVED CASES',        subtitle: 'Closed and resolved cases' },
    { key: 'closed',       label: 'CLOSED CASES',          subtitle: 'Fully closed records' },
  ];

  const getStatValue = (key) => {
    if (!stats?.length) return '—';
    const found = stats.find(s => s.key === key);
    return found ? found.value : 0;
  };

  const columns = [
    { key: 'caseId', label: 'CASE NO', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{v}</span> },
    {
      key: 'employeeId', label: 'EMPLOYEE',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v?.fullName || '—'}</span>
    },
    { key: 'category', label: 'CATEGORY', render: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) || '—' },
    { key: 'caseType', label: 'CASE TYPE' },
    {
      key: 'severity', label: 'SEVERITY',
      render: (v) => {
        const s = SEVERITY_STYLES[v?.toLowerCase()] || {};
        return (
          <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
            {v?.charAt(0).toUpperCase() + v?.slice(1)}
          </span>
        );
      }
    },
    { key: 'incidentDate', label: 'INCIDENT DATE', render: (v) => v?.slice(0, 10) || '—' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View Details"><FiEye size={15} /></button>
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Grievances &amp; Discipline</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track employee complaints, investigations, disciplinary actions, and case resolutions
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"
          style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FiPlus size={14} /> Log Case
        </button>
      </div>

      {apiError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem' }}>
          <FiAlertCircle size={16} /> {apiError.message}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {STAT_KEYS.map((s, i) => (
          <div key={s.key} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{s.label}</span>
              <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: STAT_COLORS[i].bg }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{getStatValue(s.key)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search employee, case type…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
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
            emptyMessage="No cases found."
          />
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      <CaseDrawer
        isOpen={caseDrawerOpen}
        onClose={() => { setCaseDrawerOpen(false); setEditCase(null); }}
        editItem={editCase}
        employees={employees}
        onSaved={() => { setCaseDrawerOpen(false); setEditCase(null); load(page, search); dispatch(fetchCaseStats()); }}
      />

      <AddNoteModal
        isOpen={!!noteModal}
        caseItem={noteModal}
        onClose={() => setNoteModal(null)}
        onSaved={() => setNoteModal(null)}
      />
    </div>
  );
}
