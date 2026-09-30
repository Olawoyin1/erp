import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiX, FiCheck } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { Input, FormField, Select } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import Drawer from '../../../components/ui/Drawer';
import FileUpload from '../../../components/ui/FileUpload';
import { mockRequests } from '../../../data/mockRequests';

const ITEMS_PER_PAGE = 10;

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
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px'
        }}>
          {/* Requester Actions */}
          <div style={{ padding: '4px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Menu Requester</div>
          <div onClick={() => handleAction('Cancel')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiX size={13} /> Cancel Request
          </div>

          <div style={{ borderTop: '1px solid #F1F5F9', margin: '4px 0' }} />

          {/* HOD Actions */}
          <div style={{ padding: '4px 14px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Approval by HOD</div>
          <div onClick={() => handleAction('Approve')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiCheck size={13} /> Approve Request
          </div>
          <div onClick={() => handleAction('Reject')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiX size={13} /> Reject Request
          </div>
        </div>
      )}
    </div>
  );
}

function RequestModal({ isOpen, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>New Request</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Submit a request for review and approval</p>
          </div>
          <button className="icon-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="REQUEST" required>
            <Input placeholder="e.g. A4 Printing Paper" />
          </FormField>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
            <FormField label="REQUEST CATEGORY" required>
              <Select>
                <option>Office Supplies</option>
                <option>IT Equipment</option>
                <option>Furniture</option>
              </Select>
            </FormField>
            <FormField label="QUANTITY" required>
              <Input type="number" defaultValue={0} />
            </FormField>
            <FormField label="UNIT" required>
              <Select>
                <option>Units</option>
                <option>Packs</option>
                <option>Boxes</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="REQUESTED BY">
              <Input defaultValue="Nafisat Abubakar" readOnly style={{ backgroundColor: '#F8FAFC' }} />
            </FormField>
            <FormField label="REQUIRED DATE" required>
              <Input type="date" />
            </FormField>
          </div>

          <FormField label="URGENCY" required>
            <Select>
              <option>Routine</option>
              <option>Urgent</option>
              <option>Critical</option>
            </Select>
          </FormField>

          <FormField label="PURPOSE" required>
            <textarea 
              rows={4} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="e.g. Current stationery stock is insufficient..."
            />
          </FormField>

          <FormField label="ATTACH DOCUMENT (OPTIONAL)">
            <FileUpload onFileSelect={() => {}} />
          </FormField>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }} onClick={onSubmit}>
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewRequestDrawer({ isOpen, onClose, record }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!record) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="View Request" width="500px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ color: '#1D4ED8', marginTop: '4px' }}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="24" width="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{record.request}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>{record.requestedBy} • {record.id}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Status:</span>
          <Badge status={record.status} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#10B981', color: '#fff', borderRadius: '6px', border: 'none' }}>
            <FiCheck size={14} /> Approve
          </button>
          <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '6px', border: '1px solid #FECACA' }}>
            <FiX size={14} /> Reject
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
        {['details', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === tab ? '#1D4ED8' : '#64748B', fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            {tab === 'details' ? 'Details' : 'Approval History'}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>REQUEST ID</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.id}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>REQUEST</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.request}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>REQUEST TYPE</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.requestType}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>QUANTITY</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.qty}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>REQUESTED BY</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.requestedBy}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>REQUEST DATE</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.requestDate}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>REQUIRED DATE</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>12/02/2024</div>
             </div>
             <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>URGENCY</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.urgency}</div>
             </div>
             <div style={{ gridColumn: 'span 2' }}>
               <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>STATUS</div>
               <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{record.status}</div>
             </div>
          </div>
          
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>PURPOSE</div>
            <div style={{ fontSize: '0.875rem', color: '#334155' }}>
              Current stationery stock is insufficient for ongoing administrative activities.
            </div>
          </div>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>ATTACHED DOCUMENTS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="16" width="16"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                Office_Supplies_List.pdf (25MB)
              </div>
              <button className="icon-btn" title="Download"><FiDownload size={15} /></button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function Requests() {
  const [data, setData] = useState(mockRequests);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewDrawerRecord, setViewDrawerRecord] = useState(null);

  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.request.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || item.requestedBy.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleAction = (action, row) => {
    showToast(`${action} action triggered for ${row.id}`, 'info');
  };

  const columns = [
    { key: 'id', label: 'REQUEST ID', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    { key: 'requestType', label: 'REQUEST TYPE' },
    { key: 'request', label: 'REQUEST', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'qty', label: 'QTY', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    { key: 'requestedBy', label: 'REQUESTED BY' },
    { key: 'requestDate', label: 'REQUEST DATE' },
    { 
      key: 'urgency', 
      label: 'URGENCY',
      render: (val) => {
        const bg = val === 'Critical' ? '#FEE2E2' : val === 'Urgent' ? '#FEF3C7' : '#F1F5F9';
        const color = val === 'Critical' ? '#DC2626' : val === 'Urgent' ? '#D97706' : '#64748B';
        return (
          <span style={{ backgroundColor: bg, color, padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            {val}
          </span>
        );
      }
    },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewDrawerRecord(row)}>
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Requests</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Submit and track requests for materials, equipment, or supplies from the store
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by id, request..."
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
            <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> New Request
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
          emptyMessage="No requests found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <RequestModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        onSubmit={() => {
          showToast('Request submitted successfully', 'success');
          setCreateModalOpen(false);
        }}
      />

      <ViewRequestDrawer 
        isOpen={!!viewDrawerRecord} 
        onClose={() => setViewDrawerRecord(null)} 
        record={viewDrawerRecord} 
      />
    </div>
  );
}
