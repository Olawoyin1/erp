import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiCheck, FiEdit2, FiGrid, FiList, FiCheckSquare } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { mockAdminTasks, mockAdminTaskStats } from '../../data/mockAdmin';

const priorityStyle = {
  'High':   { bg: '#FEE2E2', color: '#DC2626' },
  'Medium': { bg: '#FEF3C7', color: '#B45309' },
  'Low':    { bg: '#F0FDF4', color: '#15803D' },
  'Hot':    { bg: '#FEE2E2', color: '#7C2D12' },
};

const statusStyle = {
  'To Do':      { bg: '#F1F5F9', color: '#475569' },
  'In Progress':{ bg: '#FEF9C3', color: '#854D0E' },
  'Done':       { bg: '#DCFCE7', color: '#15803D' },
  'Overdue':    { bg: '#FEE2E2', color: '#DC2626' },
};

function StatusPill({ status }) {
  const s = statusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>;
}

export default function AdminTasks() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = mockAdminTasks.filter(t =>
    t.task.toLowerCase().includes(search.toLowerCase()) ||
    t.assignedTo.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'TOTAL TASKS', value: mockAdminTaskStats.total, sub: 'All assigned activities', icon: '📄' },
    { label: 'IN PROGRESS', value: mockAdminTaskStats.inProgress, sub: 'Currently being worked on', icon: '📋' },
    { label: 'DUE THIS WEEK', value: mockAdminTaskStats.dueThisWeek, sub: 'Upcoming deadlines', icon: '📅' },
    { label: 'OVERDUE TASKS', value: mockAdminTaskStats.overdue, sub: 'Past due date', icon: '⚠️' },
  ];

  const menuItems = (r) => [
    { label: 'View Details', icon: <FiEye size={14} />, action: () => setSelected(r) },
    { label: 'Edit Task', icon: <FiEdit2 size={14} />, action: () => showToast(`Edit task ${r.id}`) },
    { label: 'Mark Done', icon: <FiCheck size={14} />, action: () => showToast(`Marked ${r.id} as Done`) },
  ];

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const columns = [
    { key: 'id', label: 'TASK ID', render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'task', label: 'TASK', render: (val) => <span style={{ color: '#0F172A', maxWidth: 260, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    { key: 'relatedTo', label: 'RELATED TO' },
    { key: 'priority', label: 'PRIORITY', render: (val) => <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: priorityStyle[val]?.bg || '#F1F5F9', color: priorityStyle[val]?.color || '#64748B', whiteSpace: 'nowrap' }}>{val}</span> },
    { key: 'dueDate', label: 'DUE DATE' },
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    { key: 'actions', label: 'ACTIONS', render: (_, row) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setSelected(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiEye size={16} /></button>
        <RowMenu items={menuItems(row)} />
      </div>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks — Administration</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Operational tasks across admin functions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: '30px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button onClick={() => showToast('Exporting...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> Task
          </button>
          <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            <button style={{ padding: '8px 12px', background: '#F8FAFC', border: 'none', cursor: 'pointer', color: '#64748B' }}><FiGrid size={15} /></button>
            <button style={{ padding: '8px 12px', background: '#1E3A5F', border: 'none', cursor: 'pointer', color: '#fff' }}><FiList size={15} /></button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filtered}
          selectable={true}
          selectedIds={selectedIds}
          onSelectRow={toggleSelectRow}
          onSelectAll={toggleSelectAll}
          keyField="id"
        />
        <Pagination
          currentPage={1}
          totalPages={8}
          totalItems={filtered.length}
          onPageChange={() => {}}
        />
      </div>

      {/* View Task Drawer */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''} subtitle="Task Details"
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={() => { showToast('Marked as Done!'); setSelected(null); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <FiCheck size={14} /> Mark Done
            </button>
            <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '9px 16px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              Close
            </button>
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, padding: '14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <FiCheckSquare size={20} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selected.task}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>{selected.id} · Due {selected.dueDate}</p>
              </div>
              <StatusPill status={selected.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Task ID', selected.id],
                ['Assigned To', selected.assignedTo],
                ['Related To', selected.relatedTo],
                ['Due Date', selected.dueDate],
              ].map(([label, val]) => (
                <FormField key={label} label={label}>
                  <Input value={val || ''} readOnly style={{ backgroundColor: '#F8FAFC', color: '#334155' }} />
                </FormField>
              ))}
              <div key="Priority">
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Priority</p>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: priorityStyle[selected.priority]?.bg || '#F1F5F9', color: priorityStyle[selected.priority]?.color || '#64748B' }}>{selected.priority}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* New Task Drawer */}
      <Drawer isOpen={showNew} onClose={() => setShowNew(false)} title="Create New Task" subtitle="Assign and schedule a new operational task" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="TASK TITLE" required>
            <Input placeholder="e.g. Prepare monthly admin report" />
          </FormField>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="ASSIGNED TO" required>
              <Select>
                <option>Nafisat Abubakar</option>
                <option>Emeka Okafor</option>
                <option>Tunde Bakare</option>
                <option>Aisha Mohammed</option>
              </Select>
            </FormField>
            <FormField label="DUE DATE" required>
              <Input type="date" />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="PRIORITY" required>
              <Select>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Hot</option>
              </Select>
            </FormField>
            <FormField label="STATUS">
              <Select>
                <option>To Do</option>
                <option>In Progress</option>
                <option>Done</option>
              </Select>
            </FormField>
          </div>

          <FormField label="RELATED TO (OPTIONAL)">
            <Input placeholder="e.g. Facility Maintenance, EDMS, etc..." />
          </FormField>

          <FormField label="DESCRIPTION">
            <Textarea rows={4} placeholder="Add detailed instructions or context..." />
          </FormField>
        </div>
        <div style={{ padding: '20px 0 0 0', marginTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setShowNew(false); showToast('Task created successfully!'); }}>
            Create Task
          </button>
        </div>
      </Drawer>

    </div>
  );
}
