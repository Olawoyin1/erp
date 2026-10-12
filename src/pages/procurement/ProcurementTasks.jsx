import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical,
  FiEdit, FiCheck, FiX, FiCheckCircle, FiPaperclip, FiDownloadCloud, FiClock,
  FiAlertTriangle, FiGrid, FiList
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockProcurementTasks } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;

const taskStatusStyles = {
  'To Do':       { bg: '#F1F5F9', color: '#475569' },
  'In Progress': { bg: '#E0F2FE', color: '#0284C7' },
  'Done':        { bg: '#DCFCE7', color: '#16A34A' },
  'Overdue':     { bg: '#FEE2E2', color: '#DC2626' }
};

const priorityStyles = {
  'Hot':    { bg: '#FEE2E2', color: '#DC2626' },
  'High':   { bg: '#FEE2E2', color: '#DC2626' },
  'Medium': { bg: '#FEF3C7', color: '#D97706' },
  'Low':    { bg: '#E0F2FE', color: '#0284C7' }
};

export default function ProcurementTasks() {
  const [data, setData] = useState(mockProcurementTasks);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [assignModal, setAssignModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef();
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Form states
  const [assignForm, setAssignForm] = useState({
    taskName: 'Review RFQ submissions',
    taskId: 'PRO-TSK-001',
    assignedOfficer: 'Chinonso Eze',
    startDate: '',
    targetDueDate: '',
    relatedTo: 'RFQ-2026-031',
    priority: 'High',
    taskDescription: '',
    documents: [
      { name: 'RFQ_2026_031_Steel_Supply.pdf', size: '18MB' },
      { name: 'RFQ_Bid_Submission_Guidelines.pdf', size: '8MB' }
    ]
  });

  // Top Metrics matching screenshot
  const totalTasks = 128;
  const inProgressTasks = 32;
  const dueThisWeek = 65;
  const overdueTasks = 25;

  const filtered = data.filter(t => {
    const q = search.toLowerCase();
    return !q ||
      t.taskId.toLowerCase().includes(q) ||
      t.task.toLowerCase().includes(q) ||
      t.assignedTo.toLowerCase().includes(q) ||
      t.relatedTo.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleAssignSubmit = () => {
    const created = {
      taskId: assignForm.taskId || `PRO-TSK-0${data.length + 1}`,
      task: assignForm.taskName,
      assignedTo: assignForm.assignedOfficer,
      relatedTo: assignForm.relatedTo,
      priority: assignForm.priority,
      dueDate: assignForm.targetDueDate || '28/05/25',
      startDate: assignForm.startDate || '12/02/25',
      status: 'To Do',
      description: assignForm.taskDescription || 'Assigned task for procurement follow-up.',
      documents: assignForm.documents
    };

    setData([created, ...data]);
    setAssignModal(false);
    showToast('Task assigned successfully', 'success');
  };

  const handleEditSave = () => {
    if (!editItem) return;
    setData(data.map(t => t.taskId === editItem.taskId ? editItem : t));
    setEditItem(null);
    showToast('Task updated successfully', 'success');
  };

  const columns = [
    {
      key: 'taskId',
      label: 'TASK ID',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'task',
      label: 'TASK',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'assignedTo',
      label: 'ASSIGNED TO',
      render: (v) => <span style={{ color: '#334155' }}>{v}</span>
    },
    {
      key: 'relatedTo',
      label: 'RELATED TO',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'priority',
      label: 'PRIORITY',
      render: (v) => {
        const style = priorityStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
        return (
          <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '3px 12px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 500
          }}>
            {v}
          </span>
        );
      }
    },
    {
      key: 'dueDate',
      label: 'DUE DATE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = taskStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
        return (
          <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '4px 14px',
            borderRadius: '14px',
            fontSize: '0.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            {v}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setViewItem(row)}
            title="View Task Details"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>

          {row.status !== 'Done' && (
            <div style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                onClick={() => setActiveMenuId(activeMenuId === row.taskId ? null : row.taskId)}
                style={{ color: '#64748B', cursor: 'pointer' }}
              >
                <FiMoreVertical size={16} />
              </button>

              {activeMenuId === row.taskId && (
                <div
                  ref={menuRef}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '4px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    border: '1px solid #E2E8F0',
                    padding: '6px 0',
                    zIndex: 60,
                    width: '160px',
                    textAlign: 'left'
                  }}
                >
                  <div
                    onClick={() => { setEditItem(row); setActiveMenuId(null); }}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiEdit size={14} color="#64748B" /> Edit Task
                  </div>
                  <div
                    onClick={() => {
                      setData(data.map(t => t.taskId === row.taskId ? { ...t, status: 'Done' } : t));
                      setActiveMenuId(null);
                      showToast('Task marked as Done', 'success');
                    }}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiCheck size={14} color="#16A34A" /> Mark as Done
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks — Procurement</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track and manage procurement activities assigned to team members
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Import / Export active', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiUpload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Metric Cards matching screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL TASKS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{totalTasks}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>All assigned activities</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>IN PROGRESS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{inProgressTasks}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Currently being worked on</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <FiClock size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>DUE THIS WEEK</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{dueThisWeek}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Upcoming deadlines</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <FiClock size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>OVERDUE TASKS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{overdueTasks}</div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px' }}>Past due date</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <FiAlertTriangle size={18} />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <FiSearch size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search tasks..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.813rem',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Filters applied', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiFilter size={15} /> Filter
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting task list...', 'success')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiDownload size={15} /> Export
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setAssignModal(true)}
              style={{
                backgroundColor: '#1E3A8A',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FiPlus size={16} /> Task
            </button>
            <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
              <button style={{ border: 'none', background: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#1E3A8A' }}>
                <FiList size={16} />
              </button>
              <button style={{ border: 'none', background: 'transparent', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#64748B' }}>
                <FiGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={columns}
            data={paginated}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.taskId))}
            keyField="taskId"
            emptyMessage="No tasks found."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── ASSIGN TASK MODAL ── */}
      <Modal
        isOpen={assignModal}
        onClose={() => setAssignModal(false)}
        title="Assign Task"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="TASK NAME *" required>
            <Input
              value={assignForm.taskName}
              onChange={(e) => setAssignForm({ ...assignForm, taskName: e.target.value })}
              placeholder="e.g Review RFQ submissions"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="TASK ID *" required>
              <Input
                value={assignForm.taskId}
                onChange={(e) => setAssignForm({ ...assignForm, taskId: e.target.value })}
              />
            </FormField>

            <FormField label="ASSIGNED OFFICER *" required>
              <select
                className="form-input"
                value={assignForm.assignedOfficer}
                onChange={(e) => setAssignForm({ ...assignForm, assignedOfficer: e.target.value })}
              >
                {['Chinonso Eze', 'Femi Adeyemi', 'Zainab Mohammed', 'Tolu Afolabi', 'Kelechi Okafor'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="START DATE">
              <Input
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                placeholder="DD/MM/YY"
              />
            </FormField>
            <FormField label="TARGET DUE DATE">
              <Input
                value={assignForm.targetDueDate}
                onChange={(e) => setAssignForm({ ...assignForm, targetDueDate: e.target.value })}
                placeholder="DD/MM/YY"
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="RELATED TO *">
              <Input
                value={assignForm.relatedTo}
                onChange={(e) => setAssignForm({ ...assignForm, relatedTo: e.target.value })}
                placeholder="e.g. RFQ-2026-031"
              />
            </FormField>

            <FormField label="PRIORITY *" required>
              <select
                className="form-input"
                value={assignForm.priority}
                onChange={(e) => setAssignForm({ ...assignForm, priority: e.target.value })}
              >
                {['High', 'Medium', 'Low', 'Hot'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="TASK DESCRIPTION">
            <textarea
              className="form-input"
              rows={3}
              value={assignForm.taskDescription}
              onChange={(e) => setAssignForm({ ...assignForm, taskDescription: e.target.value })}
              placeholder="Insert notes on deliverables..."
            />
          </FormField>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
              ATTACH DOCUMENTS
            </label>
            <div
              style={{
                border: '1.5px dashed #CBD5E1', borderRadius: '8px', padding: '20px',
                textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer'
              }}
              onClick={() => showToast('Attachment dialog ready', 'info')}
            >
              <FiUpload size={22} color="#64748B" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Drop file here or click to browse</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG. up to 50MB</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
            <button className="btn btn-secondary" onClick={() => setAssignModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAssignSubmit}
              style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '6px' }}
            >
              Assign Task
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT TASK MODAL ── */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Edit Task"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField label="TASK NAME *" required>
              <Input
                value={editItem.task}
                onChange={(e) => setEditItem({ ...editItem, task: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="TASK ID *">
                <Input value={editItem.taskId} disabled />
              </FormField>

              <FormField label="ASSIGNED OFFICER *" required>
                <Input
                  value={editItem.assignedTo}
                  onChange={(e) => setEditItem({ ...editItem, assignedTo: e.target.value })}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="RELATED TO *">
                <Input
                  value={editItem.relatedTo}
                  onChange={(e) => setEditItem({ ...editItem, relatedTo: e.target.value })}
                />
              </FormField>

              <FormField label="PRIORITY *" required>
                <select
                  className="form-input"
                  value={editItem.priority}
                  onChange={(e) => setEditItem({ ...editItem, priority: e.target.value })}
                >
                  {['High', 'Medium', 'Low', 'Hot'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="START DATE">
                <Input
                  value={editItem.startDate || ''}
                  onChange={(e) => setEditItem({ ...editItem, startDate: e.target.value })}
                />
              </FormField>
              <FormField label="TARGET DUE DATE">
                <Input
                  value={editItem.dueDate}
                  onChange={(e) => setEditItem({ ...editItem, dueDate: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="TASK DESCRIPTION">
              <textarea
                className="form-input"
                rows={3}
                value={editItem.description || ''}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
              <button className="btn btn-secondary" onClick={() => setEditItem(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditSave}
                style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '6px' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── VIEW TASK DETAILS MODAL ── */}
      {viewItem && (
        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title=""
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {viewItem.task}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {viewItem.assignedTo} • {viewItem.taskId}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { setEditItem(viewItem); setViewItem(null); }}
                  style={{
                    backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0',
                    padding: '8px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <FiEdit size={14} /> Edit Task
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
                <span>Status:</span>
                <span style={{
                  backgroundColor: taskStatusStyles[viewItem.status]?.bg || '#F1F5F9',
                  color: taskStatusStyles[viewItem.status]?.color || '#64748B',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  {viewItem.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
                <span>Priority:</span>
                <span style={{
                  backgroundColor: priorityStyles[viewItem.priority]?.bg || '#F1F5F9',
                  color: priorityStyles[viewItem.priority]?.color || '#64748B',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  {viewItem.priority}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>TASK NAME</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.task}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>TASK ID</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.taskId}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ASSIGNED OFFICER</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.assignedTo}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>RELATED TO</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.relatedTo}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>START DATE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.startDate || '12/02/25'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>TARGET DUE DATE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.dueDate}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                TASK DESCRIPTION
              </div>
              <p style={{ margin: 0, fontSize: '0.813rem', color: '#334155', lineHeight: 1.5 }}>
                {viewItem.description || 'Review vendor quotations and prepare recommendation for evaluation.'}
              </p>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                ATTACHED DOCUMENTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  { name: 'RFQ_2026_031_Steel_Supply.pdf' },
                  { name: 'RFQ_Bid_Submission_Guidelines.pdf' }
                ]).map((doc, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#334155' }}>
                      <FiPaperclip size={14} color="#64748B" />
                      <span>{doc.name}</span>
                    </div>
                    <button className="icon-btn" onClick={() => showToast(`Downloading ${doc.name}`, 'success')}>
                      <FiDownloadCloud size={15} color="#2563EB" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
