import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiCheck, FiRefreshCw, FiArchive, FiX } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import Drawer from '../../components/ui/Drawer';
import FileUpload from '../../components/ui/FileUpload';
import { mockEmergencyPlans } from '../../data/mockHSE';

const ITEMS_PER_PAGE = 10;

function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px' }}>
          {row.status === 'Active' && (
            <>
              <div style={{ padding: '4px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Menu Active</div>
              <div onClick={() => { onAction('Replace', row); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiRefreshCw size={13} /> Replace Plan
              </div>
              <div onClick={() => { onAction('Archive', row); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiArchive size={13} /> Archive Plan
              </div>
              <div onClick={() => { onAction('Download', row); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiDownload size={13} /> Download Plan
              </div>
            </>
          )}
          {row.status === 'Under Review' && (
            <>
              <div style={{ padding: '4px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Menu Under Review</div>
              <div onClick={() => { onAction('MarkActive', row); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiCheck size={13} /> Mark as Active
              </div>
            </>
          )}
          {row.status === 'Archived' && (
            <>
              <div style={{ padding: '4px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Menu Archived</div>
              <div onClick={() => { onAction('Download', row); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiDownload size={13} /> Download Plan
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UploadPlanDrawer({ isOpen, onClose, onSubmit }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Upload Plan" width="480px">
      <p style={{ margin: '-10px 0 16px 0', fontSize: '0.85rem', color: '#64748B' }}>Upload an emergency response plan for employee access and operational readiness</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="PLAN ID"><Input defaultValue="ERP-001" readOnly style={{ backgroundColor: '#F8FAFC' }} /></FormField>
          <FormField label="PLAN CATEGORY" required>
            <Select><option>Fire Emergency</option><option>Oil Spill</option><option>H2S Emergency</option><option>Medevac</option></Select>
          </FormField>
        </div>
        <FormField label="PLAN NAME" required>
          <Select><option>Fire Emergency Response Plan</option><option>Oil Spill Contingency Plan</option><option>Medevac Plan</option></Select>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormField label="PLAN OWNER" required><Input placeholder="e.g. Aisha Bello" /></FormField>
          <FormField label="REVIEW DATE" required><Input type="date" /></FormField>
        </div>
        <FormField label="LOCATION" required>
          <Select><option>All Sites</option><option>Port Harcourt Site</option><option>Lagos Head Office</option><option>Warri Yard</option></Select>
        </FormField>
        <FormField label="DESCRIPTION (OPTIONAL)">
          <textarea rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }} placeholder="This plan outlines emergency response procedures..." />
        </FormField>
        <FormField label="ATTACH DOCUMENTS"><FileUpload onFileSelect={() => {}} /></FormField>
      </div>
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={onSubmit} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>Upload Plan</button>
      </div>
    </Drawer>
  );
}

function ViewPlanDrawer({ isOpen, onClose, record }) {
  if (!record) return null;
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="View Drill" width="480px">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ color: '#DC2626' }}>🚨</div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{record.planName}</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{record.id}</p>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748B', marginRight: '8px' }}>Status:</span>
        <Badge status={record.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
        {[
          ['PLAN ID', record.id], ['PLAN CATEGORY', 'Fire Emergency'],
          ['PLAN NAME', record.planName], ['PLAN OWNER', record.owner],
          ['LOCATION', record.location], ['LAST UPDATED', '02/04/27'],
          ['REVIEW DATE', record.reviewDue], ['VERSION', record.version.toUpperCase()],
          ['STATUS', record.status],
        ].map(([label, value], i) => (
          <div key={i} style={i === 8 ? { gridColumn: 'span 2' } : {}}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>DESCRIPTION</div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>Update evacuation procedures to align with the revised site emergency response protocol.</p>
      </div>
      <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>ATTACHED DOCUMENTS</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#334155' }}>📎 Fire_Emergency_Response_Plan_v2.1.pdf (25MB)</span>
          <button className="icon-btn"><FiDownload size={14} /></button>
        </div>
      </div>
    </Drawer>
  );
}

export default function EmergencyPreparedness() {
  const [data] = useState(mockEmergencyPlans);
  const [activeTab, setActiveTab] = useState('plans');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.planName.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'id', label: 'PLAN ID', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    { key: 'planName', label: 'PLAN NAME', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'location', label: 'LOCATION' },
    { key: 'reviewDue', label: 'REVIEW DUE' },
    { key: 'version', label: 'VERSION' },
    { key: 'owner', label: 'OWNER' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewRecord(row)}><FiEye size={15} /></button>
          <RowMenu row={row} onAction={(action) => showToast(`${action} applied to ${row.id}`, 'success')} />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Emergency Preparedness</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage emergency plans and maintain key emergency contact information</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
        {[{ key: 'plans', label: 'Emergency Plans' }, { key: 'contacts', label: 'Contact Register' }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent', color: activeTab === tab.key ? '#1D4ED8' : '#64748B', fontWeight: activeTab === tab.key ? 600 : 400, cursor: 'pointer', fontSize: '0.9rem' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="table-toolbar">
            <div className="table-toolbar-search">
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search Plans..." style={{ paddingLeft: '36px', width: '100%' }} />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
            </div>
            <div className="table-toolbar-actions">
              <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
              <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
              <button className="btn btn-primary" onClick={() => setUploadDrawerOpen(true)} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
                <FiPlus size={14} /> Upload Plan
              </button>
            </div>
          </div>
          <DataTable columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No emergency plans found."
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Contact Register</h3>
          <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto' }}>Emergency contact register for all sites and personnel will be displayed here.</p>
        </div>
      )}

      <UploadPlanDrawer isOpen={uploadDrawerOpen} onClose={() => setUploadDrawerOpen(false)} onSubmit={() => { showToast('Plan uploaded successfully', 'success'); setUploadDrawerOpen(false); }} />
      <ViewPlanDrawer isOpen={!!viewRecord} onClose={() => setViewRecord(null)} record={viewRecord} />
    </div>
  );
}
