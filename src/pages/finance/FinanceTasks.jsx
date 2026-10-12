import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiEdit2, FiCheck, FiX, FiCalendar, FiUser
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockFinanceTasks } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const TEAM_MEMBERS = ['Nafisat Abubakar', 'Tunde Fashola', 'Aisha Bello', 'Mary Johnson', 'Samuel Ayobami', 'Naomi Cole'];

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px'
        }}>
          {items.map((it, idx) => (
            <div
              key={idx}
              onClick={() => { it.onClick(); setOpen(false); }}
              style={{
                padding: '8px 14px', fontSize: '0.813rem', color: it.danger ? '#DC2626' : '#334155',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = it.danger ? '#FEE2E2' : '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              {it.icon} {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinanceTasks() {
  const [data, setData] = useState(mockFinanceTasks);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const { toast, showToast, hideToast } = useToast();

  const [viewTask, setViewTask] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    assignedTo: 'Nafisat Abubakar',
    dueDate: new Date().toISOString().slice(0, 10),
    priority: 'Medium',
    description: ''
  });

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.title.toLowerCase().includes(q) || item.assignedTo.toLowerCase().includes(q) || item.taskId.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((item) => item.id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title) {
      showToast('Please enter task title', 'error');
      return;
    }
    const newTask = {
      id: Date.now(),
      taskId: `FTSK-00${data.length + 1}`,
      ...form,
      status: 'Pending'
    };
    setData([newTask, ...data]);
    showToast('Task assigned successfully', 'success');
    setCreateModal(false);
  };

  const columns = [
    {
      key: 'taskId',
      label: 'TASK ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewTask(row)}
        >
          {val}
        </span>
      )
    },
    {
      key: 'title',
      label: 'DELIVERABLE / TASK',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    {
      key: 'priority',
      label: 'PRIORITY',
      render: (val) => {
        let color = '#334155';
        if (val === 'High') color = '#DC2626';
        if (val === 'Medium') color = '#EA580C';
        if (val === 'Low') color = '#2563EB';
        return <span style={{ color, fontWeight: 600 }}>{val}</span>;
      }
    },
    { key: 'dueDate', label: 'DUE DATE' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewTask(row)} title="View Task Details">
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Details',
                onClick: () => setViewTask(row)
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Mark Completed',
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Completed' } : d));
                  showToast('Task marked as completed', 'success');
                }
              },
              {
                icon: <FiX size={14} />,
                label: 'Delete Task',
                danger: true,
                onClick: () => {
                  setData(data.filter(d => d.id !== row.id));
                  showToast('Task removed', 'info');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Finance & Accounting Tasks
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Coordinate month-end closing steps, reconciliations, tax deadlines, and statutory audits
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting deliverables schedule...', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setCreateModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
            }}
          >
            <FiPlus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search deliverables, assignees..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          <div className="table-toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting schedule...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No finance tasks found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: VIEW TASK ─── */}
      <Drawer
        isOpen={!!viewTask}
        onClose={() => setViewTask(null)}
        title={viewTask ? `${viewTask.taskId}` : ''}
        subtitle="Finance deliverable deadline & assignment specification"
        width="480px"
        footer={(
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={() => setViewTask(null)}
          >
            Close
          </button>
        )}
      >
        {viewTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                {viewTask.title}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <Badge status={viewTask.status} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Assigned To:</strong> {viewTask.assignedTo}</div>
              <div><strong style={{ color: '#64748B' }}>Priority:</strong> {viewTask.priority}</div>
              <div><strong style={{ color: '#64748B' }}>Target Completion:</strong> {viewTask.dueDate}</div>
            </div>

            <div>
              <strong style={{ fontSize: '0.813rem', color: '#64748B', display: 'block', marginBottom: '6px' }}>Task Scope</strong>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', fontSize: '0.813rem', color: '#1E293B', lineHeight: 1.5, border: '1px solid #E2E8F0' }}>
                {viewTask.description || 'Deliverable according to finance monthly schedule.'}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: New Task */}
      {createModal && (
        <Modal
          isOpen={true}
          onClose={() => setCreateModal(false)}
          title="Assign Finance Task"
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <FormField label="Deliverable Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Reconcile Zenith Bank June Statement"
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Assigned Personnel">
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Priority">
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </FormField>
            </div>

            <FormField label="Target Due Date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Detailed Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', fontFamily: 'var(--font)' }}
                placeholder="Specify requirements, files, or dependencies..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                Assign Task
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
