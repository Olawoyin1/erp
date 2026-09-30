import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockHSETasks } from '../../data/mockHSE';

const ITEMS_PER_PAGE = 10;

export default function HSETasks() {
  const [data] = useState(mockHSETasks);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.task.toLowerCase().includes(q) || item.assignedTo.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'id', label: 'TASK ID', render: (val) => <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{val}</span> },
    { key: 'task', label: 'TASK', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    {
      key: 'priority', label: 'PRIORITY',
      render: (val) => {
        const color = val === 'High' || val === 'Hot' ? '#DC2626' : val === 'Medium' ? '#EA580C' : '#2563EB';
        return <span style={{ color, fontWeight: 500, fontSize: '0.85rem' }}>{val}</span>;
      }
    },
    { key: 'dueDate', label: 'DUE DATE' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn"><FiEye size={15} /></button>
          <button className="icon-btn"><FiMoreVertical size={15} /></button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks- HSE</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>HSE workstream tasks and follow-ups</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'TOTAL TASKS', value: '128', subtitle: 'All assigned activities', bg: '#EFF6FF' },
          { title: 'IN PROGRESS', value: '32', subtitle: 'Currently being worked on', bg: '#D1FAE5' },
          { title: 'DUE THIS WEEK', value: '65', subtitle: 'Upcoming deadlines', bg: '#F5F3FF' },
          { title: 'OVERDUE TASKS', value: '25', subtitle: 'Past due date', bg: '#FEF2F2' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: stat.bg }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search tasks..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> Task
            </button>
          </div>
        </div>
        <DataTable columns={columns} data={paginated} selectable selectedIds={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
          keyField="id" emptyMessage="No tasks found."
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
