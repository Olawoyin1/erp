import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiEdit2, FiUpload, FiList, FiEdit } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockTasks } from '../../../data/mockTasks';

const ITEMS_PER_PAGE = 10;

export default function Tasks() {
  const [data, setData] = useState(mockTasks);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [viewTask, setViewTask] = useState(null);
  const [formMode, setFormMode] = useState(null); // 'assign', 'edit'
  const [formTask, setFormTask] = useState(null);

  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.task.toLowerCase().includes(q) || item.assignedTo.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'id', label: 'TASK ID', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    { key: 'task', label: 'TASK', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    { key: 'relatedTo', label: 'RELATED TO', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    {
      key: 'priority',
      label: 'PRIORITY',
      render: (val) => {
        let color = '#334155';
        if (val === 'High' || val === 'Hot') color = '#DC2626';
        if (val === 'Medium') color = '#EA580C';
        if (val === 'Low') color = '#2563EB';
        return <span style={{ color }}>{val}</span>;
      }
    },
    { key: 'dueDate', label: 'DUE DATE' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewTask(row)}>
            <FiEye size={15} />
          </button>
          <RowMenu row={row} onAction={(action, r) => {
            if (action === 'Edit') { setFormMode('edit'); setFormTask(r); }
          }} />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks — Human Resources</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Operational tasks across HR functions
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'TOTAL TASKS', value: '128', subtitle: 'All assigned activities', bg: '#EFF6FF' },
          { title: 'IN PROGRESS', value: '32', subtitle: 'Currently being worked on', bg: '#D1FAE5' },
          { title: 'DUE THIS WEEK', value: '65', subtitle: 'Upcoming deadlines', bg: '#FDF4FF' },
          { title: 'OVERDUE TASKS', value: '25', subtitle: 'Past due date', bg: '#FEF2F2' }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {/* Icon placeholder */}
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search tasks..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            <button onClick={() => { setFormMode('assign'); setFormTask(null); }} className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> Task
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
          keyField="id"
          emptyMessage="No tasks found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <TaskFormDrawer
        isOpen={!!formMode}
        mode={formMode}
        initialData={formTask}
        onClose={() => { setFormMode(null); setFormTask(null); }}
        onSave={(form) => {
          showToast(`Task ${formMode === 'edit' ? 'updated' : 'assigned'} successfully`, 'success');
          setFormMode(null); setFormTask(null);
        }}
      />
      <ViewTaskDrawer
        task={viewTask}
        onClose={() => setViewTask(null)}
        onEdit={(t) => { setFormMode('edit'); setFormTask(t); setViewTask(null); }}
      />
    </div>
  );
}

function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAction = (actionName) => {
    onAction(actionName, row);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '150px'
        }}>
          <div onClick={() => handleAction('Edit')} style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <FiEdit2 size={13} /> Edit Task
          </div>
        </div>
      )}
    </div>
  );
}

function TaskFormDrawer({ isOpen, onClose, mode, initialData, onSave }) {
  const [form, setForm] = useState({ taskName: '', taskId: '', assignedOfficer: '', relatedTo: '', priority: '', startDate: '', targetDueDate: '', description: '' });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setForm({
        taskName: initialData.task || '',
        taskId: initialData.id || '',
        assignedOfficer: initialData.assignedTo || '',
        relatedTo: initialData.relatedTo || '',
        priority: initialData.priority || 'Medium',
        startDate: '12/02/25',
        targetDueDate: initialData.dueDate || '',
        description: ''
      });
    } else {
      setForm({ taskName: '', taskId: 'HR-TSK-002', assignedOfficer: '', relatedTo: '', priority: '', startDate: '', targetDueDate: '', description: '' });
    }
  }, [initialData, mode, isOpen]);

  const title = mode === 'edit' ? 'Edit Task' : 'Assign Task';
  const submitText = mode === 'edit' ? 'Save Changes' : 'Assign Task';

  const footer = (
    <>
      <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
      <button onClick={() => onSave(form)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#1D4ED8', color: '#FFFFFF', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{submitText}</button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} width="480px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="TASK NAME" required>
          <Input value={form.taskName} onChange={e => setForm({...form, taskName: e.target.value})} placeholder="Prepare New Employee Onboarding" />
        </FormField>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="TASK ID">
            <Input value={form.taskId} disabled style={{ backgroundColor: '#F1F5F9' }} />
          </FormField>
          <FormField label="ASSIGNED OFFICER" required>
            <Select value={form.assignedOfficer} onChange={e => setForm({...form, assignedOfficer: e.target.value})} options={['Nafisat Abubakar', 'Zainab Mohammed']} placeholder="Select" />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="RELATED TO (OPTIONAL)">
            <Select value={form.relatedTo} onChange={e => setForm({...form, relatedTo: e.target.value})} options={['Employee Onboarding', 'Employee Records', 'Attendance', 'Staff Induction']} placeholder="Select" />
          </FormField>
          <FormField label="PRIORITY" required>
            <Select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} options={['High', 'Medium', 'Low', 'Hot']} />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="START DATE">
            <DatePicker value={form.startDate} onChange={e => setForm({...form, startDate: e })} placeholder="DD/MM/YY" />
          </FormField>
          <FormField label="TARGET DUE DATE">
            <DatePicker value={form.targetDueDate} onChange={e => setForm({...form, targetDueDate: e })} placeholder="DD/MM/YY" />
          </FormField>
        </div>

        <FormField label="TASK DESCRIPTION">
          <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Insert notes on deliverables..." rows={4} />
        </FormField>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>ATTACH DOCUMENTS</div>
          <div style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiUpload size={20} color="#64748B" />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Drop file here or click to browse</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG. up to 50MB</div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function ViewTaskDrawer({ task, onClose, onEdit }) {
  if (!task) return null;

  return (
    <Drawer isOpen={!!task} onClose={onClose} width="560px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: '#EFF6FF', borderRadius: '6px', color: '#2563EB', display: 'flex' }}>
            <FiList size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{task.task}</h2>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Priority:</span>
              <span style={{ fontSize: '0.75rem', color: task.priority === 'High' ? '#DC2626' : task.priority === 'Low' ? '#2563EB' : '#EA580C', backgroundColor: task.priority === 'High' ? '#FEF2F2' : task.priority === 'Low' ? '#EFF6FF' : '#FFF7ED', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{task.priority}</span>
            </div>
            <div style={{ fontSize: '0.813rem', color: '#64748B', marginTop: '4px' }}>
              {task.assignedTo} • {task.id}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
          <Badge status={task.status} />
        </div>
        <button
          onClick={() => { onClose(); onEdit(task); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.813rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <FiEdit size={14} /> Edit Task
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <InfoItem label="TASK NAME" value={task.task} />
          <InfoItem label="TASK ID" value={task.id} />
          <InfoItem label="ASSIGNED OFFICER" value={task.assignedTo} />
          <InfoItem label="RELATED TO" value={task.relatedTo} />
          <InfoItem label="PRIORITY" value={task.priority} />
          <InfoItem label="START DATE" value="12/02/25" />
          <InfoItem label="TARGET DUE DATE" value={task.dueDate} />
          <InfoItem label="STATUS" value={<Badge status={task.status} />} />
        </div>

        <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>TASK DESCRIPTION</div>
          <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: '1.5' }}>
            Complete the employee onboarding checklist and ensure all required documents are received before the employee's start date.
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
