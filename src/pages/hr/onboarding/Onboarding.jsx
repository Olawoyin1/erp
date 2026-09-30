import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiMoreVertical, FiCheck, FiUpload, FiX } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockOnboarding } from '../../../data/mockOnboarding';

const ITEMS_PER_PAGE = 10;

function OnboardingDrawer({ isOpen, onClose, record }) {
  const [activeTab, setActiveTab] = useState('checklist');

  if (!record) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="View onboarding details"
      width="500px"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '600', color: '#64748B' }}>
          {record.name.charAt(0)}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{record.name}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
            {record.id} • {record.completion}% Complete
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748B', marginRight: '8px' }}>Status:</span>
        <Badge status={record.status} />
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
        {['checklist', 'documents', 'safety'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === tab ? '#1D4ED8' : '#64748B',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.9rem',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'checklist' ? 'Onboarding Checklist' : tab === 'documents' ? 'Documents Registry' : 'Safety Check'}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'checklist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Onboarding Checklist Compliance
            </h4>
            {record.checklist.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: '#334155' }}>{item.task}</span>
                {item.completed ? (
                  <FiCheck size={16} color="#10B981" />
                ) : (
                  <FiX size={16} color="#94A3B8" />
                )}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Document Uploads
            </h4>
            {record.documents.map((doc, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 500 }}>{doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Type: {doc.type}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {doc.status !== 'Verified' && (
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                      Verify
                    </button>
                  )}
                  <Badge status={doc.status === 'Verified' ? 'Verified' : 'Pending'} />
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'safety' && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
            No safety checks required for this stage.
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default function Onboarding() {
  const [data, setData] = useState(mockOnboarding);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || item.position.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((e) => e.id));
  };

  const openDrawer = (record) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  const columns = [
    { key: 'id', label: 'EMPLOYEE ID', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{val}</span> },
    { key: 'name', label: 'EMPLOYEE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'position', label: 'POSITION' },
    { key: 'department', label: 'DEPARTMENT' },
    { key: 'dateJoined', label: 'DATE JOINED' },
    { key: 'status', label: 'ONBOARDING STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => openDrawer(row)} title="View Onboarding">
            <FiEye size={15} />
          </button>
          <button className="icon-btn" title="More Options">
            <FiMoreVertical size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Onboarding</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage employee induction, documentation, and readiness before deployment
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'COMPLETED', value: '12', subtitle: 'Employees who completed onboarding', color: '#10B981', bg: '#D1FAE5' },
          { title: 'IN PROGRESS', value: '6', subtitle: 'Employees currently undergoing onboarding', color: '#3B82F6', bg: '#DBEAFE' },
          { title: 'PENDING ONBOARDING', value: '3', subtitle: 'Employees yet to complete onboarding', color: '#F59E0B', bg: '#FEF3C7' },
          { title: 'READY FOR DEPLOYMENT', value: '4', subtitle: 'Employees approved for deployment', color: '#8B5CF6', bg: '#EDE9FE' }
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
              placeholder="Search employee id, name, position..."
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
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No onboarding records found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <OnboardingDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} record={selectedRecord} />
    </div>
  );
}
