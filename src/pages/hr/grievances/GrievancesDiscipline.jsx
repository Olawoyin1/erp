import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiUpload, FiEye, FiMoreVertical, FiCheck } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockGrievance } from '../../../data/mockGrievance';

const ITEMS_PER_PAGE = 10;

function RowMenu({ row, onResolve }) {
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
          <div style={{ padding: '4px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Menu Under Review</div>
          <div onClick={() => { onResolve(); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiCheck size={13} /> Mark as Resolved
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrievancesDiscipline() {
  const [data, setData] = useState(mockGrievance);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.employee.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'id', label: 'CASE NO' },
    { key: 'employee', label: 'EMPLOYEE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'category', label: 'CATEGORY' },
    { key: 'type', label: 'CASE TYPE' },
    {
      key: 'severity',
      label: 'SEVERITY',
      render: (val) => {
        let color = '#334155';
        if (val === 'High') color = '#DC2626';
        if (val === 'Medium') color = '#EA580C';
        if (val === 'Low') color = '#2563EB';
        return <span style={{ color }}>{val}</span>;
      }
    },
    { key: 'dateReported', label: 'DATE REPORTED' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View Details">
            <FiEye size={15} />
          </button>
          {row.status !== 'Resolved' && (
             <RowMenu row={row} onResolve={() => showToast('Case resolved', 'success')} />
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Grievances & Discipline</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track employee complaints, investigations, disciplinary actions, and case resolutions
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'OPEN CASES', value: '2', subtitle: 'Current active cases', bg: '#D1FAE5' },
          { title: 'UNDER REVIEW', value: '1', subtitle: 'Cases being investigated', bg: '#FFEDD5' },
          { title: 'RESOLVED CASES', value: '3', subtitle: 'Closed and resolved cases', bg: '#D1FAE5' },
          { title: 'DISCIPLINARY ACTIONS', value: '8', subtitle: 'Active disciplinary records', bg: '#DBEAFE' }
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
              placeholder="Search employee, location..."
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
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              Log Disciplinary Case
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
          emptyMessage="No cases found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
