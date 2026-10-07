import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiMoreVertical, FiCheck, FiUpload, FiX, FiUser, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockOnboarding } from '../../../data/mockOnboarding';

const ITEMS_PER_PAGE = 10;

function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getActions = (status) => {
    if (status === 'Pending') return [{ label: 'Start Onboarding', icon: <FiCheckCircle size={13} /> }];
    if (status === 'In Progress') return [{ label: 'Mark Complete', icon: <FiCheck size={13} color="#10B981" /> }];
    if (status === 'Completed') return [{ label: 'Ready for Deployment', icon: <FiCheck size={13} color="#10B981" /> }];
    return [];
  };

  const actions = getActions(row.status);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px',
          whiteSpace: 'nowrap'
        }}>
          {actions.map((a) => (
            <div
              key={a.label}
              onClick={() => { onAction(a.label, row); setOpen(false); }}
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {a.icon} {a.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OnboardingDrawer({ record, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState('checklist');

  useEffect(() => { setActiveTab('checklist'); }, [record]);

  if (!record) return null;

  const isCompleted = record.status === 'Completed';
  const completion = record.completion ?? 60;

  return (
    <Drawer isOpen={!!record} onClose={onClose} width="520px">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
          <FiUser size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{record.name}</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.813rem', color: '#64748B' }}>
            {record.id} • {completion}% Complete
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
          <Badge status={record.status} />
        </div>
        {isCompleted && (
          <button
            onClick={() => onAction('Ready for Deployment', record)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', fontSize: '0.813rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiCheck size={14} /> Ready for Deployment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
        {[
          { key: 'checklist', label: 'Onboarding Checklist' },
          { key: 'documents', label: 'Documents Registry' },
          { key: 'safety', label: 'Safety Check' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === tab.key ? '#1D4ED8' : '#64748B',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'checklist' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Onboarding Checklist Compliance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(record.checklist || [
              { task: 'General yard safety training', completed: true },
              { task: 'Medical clearance verification', completed: false },
              { task: 'Equipment Allocation', completed: true },
              { task: 'PPE usage protocols', completed: true },
            ]).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>{item.task}</span>
                {item.completed
                  ? <FiCheck size={16} color="#10B981" />
                  : <FiX size={16} color="#94A3B8" />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Document Uploads
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(record.documents || [
              { name: 'International_Passport_Chidi_Eze.pdf', type: 'Passport', status: 'Verified' },
              { name: 'Opito_bioset.pdf', type: 'Certificate', status: 'Verified' },
              { name: 'Birth_Certificate_Chidi_Eze.pdf', type: 'Certificate', status: 'Pending Verification' },
              { name: 'Birth_Certificate_Adewale_Okonkow.pdf', type: 'Certificate', status: 'Pending Verification' },
            ]).map((doc, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Type: {doc.type}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {doc.status !== 'Verified' && (
                    <button style={{ padding: '4px 10px', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '4px', backgroundColor: '#FFFFFF', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                      Verify
                    </button>
                  )}
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: '12px',
                    backgroundColor: doc.status === 'Verified' ? '#D1FAE5' : '#FEF3C7',
                    color: doc.status === 'Verified' ? '#065F46' : '#92400E',
                  }}>
                    {doc.status === 'Verified' ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Safety & Compliance Check
          </div>

          {/* HSE certification verified card */}
          <div style={{ padding: '16px', border: '1px solid #D1FAE5', borderRadius: '8px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <FiCheck size={13} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065F46' }}>OPITO / NEBOSH  HSE Certification Check Verified</div>
              <div style={{ fontSize: '0.813rem', color: '#047857', marginTop: '4px' }}>Self-matching mobilization criteria for offshore yard entry clearance</div>
            </div>
          </div>

          {/* Risk details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
            {[
              { label: 'PROJECT RISK CATEGORY:', value: 'High (Offshore Operation Phase)', valueColor: '#0F172A' },
              { label: 'CRITICAL SURVIVAL CERTIFICATION', value: 'PASSED CLEARED', valueColor: '#10B981' },
              { label: 'MEDICAL FITNESS CLEARANCE', value: 'PASSED VALID', valueColor: '#10B981' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                <span style={{ fontSize: '0.813rem', fontWeight: 600, color: item.valueColor }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Site reminder */}
          <div style={{ padding: '16px', border: '1px solid #FED7AA', borderRadius: '8px', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <FiAlertTriangle size={16} color="#EA580C" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.813rem', fontWeight: 700, color: '#EA580C', marginBottom: '4px' }}>PROJECT SITE REMINDER</div>
              <div style={{ fontSize: '0.813rem', color: '#9A3412', lineHeight: '1.4' }}>
                Safety briefing module must be refreshed on-site every 14 days during offshore installation. System logs will flash expired certificates
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function Onboarding() {
  const [data, setData] = useState(mockOnboarding);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewRecord, setViewRecord] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || item.position.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAction = (action, row) => {
    let newStatus = row.status;
    let newCompletion = row.completion ?? 60;

    if (action === 'Start Onboarding') { newStatus = 'In Progress'; newCompletion = 30; }
    if (action === 'Mark Complete') { newStatus = 'Completed'; newCompletion = 100; }
    if (action === 'Ready for Deployment') { newStatus = 'Completed'; newCompletion = 100; }

    setData((prev) => prev.map((d) => d.id === row.id && d.name === row.name ? { ...d, status: newStatus, completion: newCompletion } : d));

    const messages = {
      'Start Onboarding': 'Onboarding started successfully',
      'Mark Complete': 'Employee marked as completed',
      'Ready for Deployment': 'Employee successfully marked ready for deployment',
    };
    showToast(messages[action] || `${action} completed`, 'success');

    // update the view drawer record if open
    if (viewRecord && viewRecord.id === row.id && viewRecord.name === row.name) {
      setViewRecord((prev) => ({ ...prev, status: newStatus, completion: newCompletion }));
    }
  };

  const columns = [
    { key: 'id', label: 'EMPLOYEE ID', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{val}</span> },
    { key: 'name', label: 'EMPLOYEE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'position', label: 'POSITION' },
    { key: 'department', label: 'DEPARTMENT', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    { key: 'dateJoined', label: 'DATE JOINED' },
    { key: 'status', label: 'ONBOARDING STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewRecord(row)} title="View Onboarding">
            <FiEye size={15} />
          </button>
          <RowMenu row={row} onAction={handleAction} />
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
          { title: 'COMPLETED', value: data.filter(d => d.status === 'Completed').length, subtitle: 'Employees who completed onboarding', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle size={14} color="#10B981" /> },
          { title: 'IN PROGRESS', value: data.filter(d => d.status === 'In Progress').length, subtitle: 'Employees currently undergoing onboarding', color: '#3B82F6', bg: '#DBEAFE', icon: <FiUser size={14} color="#3B82F6" /> },
          { title: 'PENDING ONBOARDING', value: data.filter(d => d.status === 'Pending').length, subtitle: 'Employees yet to complete onboarding', color: '#F59E0B', bg: '#FEF3C7', icon: <FiAlertTriangle size={14} color="#F59E0B" /> },
          { title: 'READY FOR DEPLOYMENT', value: 4, subtitle: 'Employees approved for deployment', color: '#8B5CF6', bg: '#EDE9FE', icon: <FiCheck size={14} color="#8B5CF6" /> }
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
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
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
          keyField="id"
          emptyMessage="No onboarding records found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <OnboardingDrawer record={viewRecord} onClose={() => setViewRecord(null)} onAction={handleAction} />
    </div>
  );
}
