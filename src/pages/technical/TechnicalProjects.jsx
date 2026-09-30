import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiEdit2, FiPause, FiAlertTriangle, FiCheck, FiShare2 } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import Drawer from '../../components/ui/Drawer';
import FileUpload from '../../components/ui/FileUpload';
import { mockProjects } from '../../data/mockTechnical';

const ITEMS_PER_PAGE = 10;

const statusColors = {
  'At Risk': { bg: '#FEF3C7', color: '#D97706' },
  'In Progress': { bg: '#DBEAFE', color: '#1D4ED8' },
  'On Hold': { bg: '#FED7AA', color: '#EA580C' },
  'Completed': { bg: '#D1FAE5', color: '#059669' },
  'Delayed': { bg: '#FEE2E2', color: '#DC2626' },
};

function StatusBadge({ status }) {
  const c = statusColors[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
}

function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = {
    'Completed': [
      { label: 'Export Report', icon: <FiDownload size={13} />, action: 'Export' },
      { label: 'Share Progress', icon: <FiShare2 size={13} />, action: 'Share' },
    ],
    'On Hold': [
      { label: 'Edit Project', icon: <FiEdit2 size={13} />, action: 'Edit' },
      { label: 'Resume', icon: <FiCheck size={13} />, action: 'Resume' },
    ],
    'In Progress': [
      { label: 'Edit Project', icon: <FiEdit2 size={13} />, action: 'Edit' },
      { label: 'Put on Hold', icon: <FiPause size={13} />, action: 'Hold' },
      { label: 'Mark At Risk', icon: <FiAlertTriangle size={13} />, action: 'AtRisk' },
      { label: 'Completed', icon: <FiCheck size={13} color="#10B981" />, action: 'Complete', color: '#10B981' },
    ],
    'At Risk': [
      { label: 'Edit Project', icon: <FiEdit2 size={13} />, action: 'Edit' },
      { label: 'Put on Hold', icon: <FiPause size={13} />, action: 'Hold' },
      { label: 'In Progress', icon: <FiCheck size={13} />, action: 'Progress' },
      { label: 'Share Progress', icon: <FiShare2 size={13} />, action: 'Share' },
    ],
    'Delayed': [
      { label: 'Update Timeline', icon: <FiEdit2 size={13} />, action: 'Timeline' },
      { label: 'Share Progress', icon: <FiShare2 size={13} />, action: 'Share' },
    ],
  };

  const menuItems = items[row.status] || items['In Progress'];
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px' }}>
          <div style={{ padding: '4px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Menu {row.status}</div>
          {menuItems.map((item) => (
            <div key={item.action} onClick={() => { onAction(item.action, row); setOpen(false); }}
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color || '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              className="menu-item-hover">
              {item.icon} {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewProjectDrawer({ isOpen, onClose, onSubmit }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Add New Project" width="520px">
      <p style={{ margin: '-10px 0 16px 0', fontSize: '0.85rem', color: '#64748B' }}>Create a new technical project and assign the key delivery information</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <FormField label="PROJECT NAME" required><Input placeholder="e.g. Chevron Wellhead Upgrade" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="CLIENT" required><Select><option>Chevron Nigeria</option><option>NLNG</option><option>TotalEnergies</option></Select></FormField>
          <FormField label="CLIENT EMAIL" required><Input type="email" placeholder="client@company.com" /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="PROJECT TYPE" required><Select><option>EPCIC</option><option>Maintenance</option><option>Construction</option></Select></FormField>
          <FormField label="CONTRACT TYPE" required><Select><option>Lump Sum</option><option>Reimbursable</option><option>Unit Rate</option></Select></FormField>
        </div>
        <FormField label="LOCATION" required><Input placeholder="e.g. Bonny Island, Rivers" /></FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="START DATE" required><Input type="date" /></FormField>
          <FormField label="PLANNED COMPLETION" required><Input type="date" /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="APPROVED BUDGET" required><Input type="number" defaultValue="100000000" /></FormField>
          <FormField label="CURRENCY" required><Select><option>NGN</option><option>USD</option></Select></FormField>
        </div>
        <FormField label="PROJECT DESCRIPTION & SCOPE" required>
          <textarea rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }} placeholder="Add project description..." />
        </FormField>
        <FormField label="ADD TEAM MEMBERS" required>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>Assign key personnel to this project</div>
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', backgroundColor: '#F8FAFC', fontSize: '0.85rem', color: '#94A3B8', textAlign: 'center' }}>
            No team members have been assigned yet
          </div>
          <button style={{ marginTop: '8px', background: 'none', border: 'none', color: '#1D4ED8', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>+ Team Member</button>
        </FormField>
        <FormField label="ATTACH DOCUMENT (OPTIONAL)"><FileUpload onFileSelect={() => {}} /></FormField>
      </div>
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={onSubmit} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>Add Project</button>
      </div>
    </Drawer>
  );
}

export default function TechnicalProjects() {
  const navigate = useNavigate();
  const [data] = useState(mockProjects);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || item.client.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'id', label: 'PROJECT ID', render: (val) => <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{val}</span> },
    { key: 'name', label: 'PROJECT NAME', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'client', label: 'CLIENT' },
    { key: 'manager', label: 'PROJECT MANAGER' },
    { key: 'budget', label: 'BUDGET' },
    {
      key: 'progress', label: 'PROGRESS',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', minWidth: '60px' }}>
            <div style={{ width: `${val}%`, height: '100%', backgroundColor: '#1D4ED8', borderRadius: '3px' }} />
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>{val}%</span>
        </div>
      )
    },
    { key: 'endDate', label: 'END DATE' },
    { key: 'status', label: 'STATUS', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View" onClick={() => navigate('/technical/projects/PGSL-26-001')}><FiEye size={15} /></button>
          <RowMenu row={row} onAction={(action) => showToast(`${action} applied`, 'success')} />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Projects</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Portfolio of all company projects — execution, progress, cost, resources</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'ACTIVE PROJECTS', value: '24', sub: '+3 this month', bg: '#DBEAFE' },
          { title: 'PROJECTS ON SCHEDULE', value: '18', sub: '75% of active projects', bg: '#D1FAE5' },
          { title: 'BUDGET UTILIZATION', value: '482M / ₦615M', sub: '78% utilized', bg: '#EDE9FE' },
          { title: 'DELAYED PROJECTS', value: '6', sub: 'Require attention', bg: '#FEF3C7' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: stat.bg }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search Project ID, Project name..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" onClick={() => setNewDrawerOpen(true)} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> New Project
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={paginated} selectable selectedIds={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map((_, i) => i))}
          keyField="id" emptyMessage="No projects found."
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <NewProjectDrawer isOpen={newDrawerOpen} onClose={() => setNewDrawerOpen(false)} onSubmit={() => { showToast('Project created successfully', 'success'); setNewDrawerOpen(false); }} />
    </div>
  );
}
