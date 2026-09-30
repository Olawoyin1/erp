import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { Input } from '../../components/ui/FormField';

const mockTasks = [
  { id: 'TSK-001', project: 'Chevron Wellhead Upgrade', task: 'Review Structural Drawings', activity: 'Structural Design', assignedTo: 'Chinonso Eze', priority: 'High', dueDate: '28/05/25', status: 'To Do' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Prepare Pipe Routing', activity: 'Piping Design', assignedTo: 'Femi Adeyemi', priority: 'Medium', dueDate: '28/05/25', status: 'To Do' },
  { id: 'TSK-001', project: 'TotalEnergies Earthing Installation', task: 'Issue RFQ to Vendors', activity: 'Material Procurement', assignedTo: 'Zainab Mohammed', priority: 'Medium', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Inspect Equipment Delivery', activity: 'Material Procurement', assignedTo: 'Tolu Afolabi', priority: 'High', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Install Control Valves', activity: 'Mechanical Installation', assignedTo: 'Kelechi Okafor', priority: 'Low', dueDate: '28/05/25', status: 'In Progress' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Verify Safety Compliance', activity: 'Mechanical Installation', assignedTo: 'Amira Bello', priority: 'High', dueDate: '28/05/25', status: 'Done' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Final Quality Inspection', activity: 'Client Inspection', assignedTo: 'Ifeoma Nwosu', priority: 'High', dueDate: '28/05/25', status: 'Done' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Final Quality Inspection', activity: 'Client Inspection', assignedTo: 'Sadiq Yusuf', priority: 'Low', dueDate: '28/05/25', status: 'Done' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Final Quality Inspection', activity: 'Client Inspection', assignedTo: 'Olamide Adeshina', priority: 'High', dueDate: '28/05/25', status: 'Overdue' },
  { id: 'TSK-001', project: 'NLNG Gas Pipeline Maintenance', task: 'Final Quality Inspection', activity: 'Client Inspection', assignedTo: 'Fatimah Ibrahim', priority: 'Medium', dueDate: '28/05/25', status: 'Overdue' },
];

function StatusPill({ status }) {
  const colors = {
    'To Do': { bg: '#F1F5F9', color: '#64748B' },
    'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Done': { bg: '#D1FAE5', color: '#059669' },
    'Overdue': { bg: '#FEE2E2', color: '#DC2626' },
  };
  const c = colors[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
}

export default function TechnicalTasks() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 10;
  
  const filtered = mockTasks.filter(d => !search || d.task.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);

  const columns = [
    { key: 'id', label: 'TASK ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'project', label: 'PROJECT NAME', render: v => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'task', label: 'TASK', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'activity', label: 'LINKED ACTIVITY', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    { key: 'priority', label: 'PRIORITY', render: v => {
      const colors = { 'High': '#EF4444', 'Medium': '#F59E0B', 'Low': '#3B82F6' };
      return <span style={{ color: colors[v] || '#64748B', backgroundColor: v === 'High' ? '#FEE2E2' : v === 'Medium' ? '#FEF3C7' : '#DBEAFE', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{v}</span>;
    }},
    { key: 'dueDate', label: 'DUE DATE' },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: () => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
        <button className="icon-btn"><FiEye size={14} /></button>
        <button className="icon-btn"><FiMoreVertical size={14} /></button>
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks - Technical</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Monitor task assignments, progress, and completion across all projects</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'TOTAL TASKS', value: '128', sub: 'All assigned activities', color: '#DBEAFE' },
          { label: 'DUE THIS WEEK', value: '65', sub: 'Upcoming deadlines', color: '#F3E8FF' },
          { label: 'COMPLETED', value: '32', sub: 'Successfully delivered', color: '#D1FAE5' },
          { label: 'OVERDUE TASKS', value: '25', sub: 'Past due date', color: '#FEE2E2' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{s.label}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: s.color }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> Task</button>
          </div>
        </div>
        <DataTable columns={columns} data={paginated} selectable keyField="task" emptyMessage="No tasks found." />
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length/ITEMS) || 1} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
