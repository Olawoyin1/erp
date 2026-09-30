import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiUpload,
  FiEye, FiMoreVertical, FiCheck, FiX, FiEdit2,
  FiFileText, FiArrowLeft, FiUsers, FiBookOpen
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, DatePicker, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockTrainings, mockParticipants, getStatusStyle } from '../../../data/mockTrainings';

const ROWS_PER_PAGE = 8;

function StatusBadge({ status }) {
  const { bg, color } = getStatusStyle(status);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 500,
      backgroundColor: bg,
      color: color,
    }}>
      {status}
    </span>
  );
}

function RowMenu({ item, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!options || options.length === 0) return <div style={{ width: '24px' }} />;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
      >
        <FiMoreVertical size={18} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 50,
          backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderRadius: '8px',
          padding: '4px', minWidth: '180px'
        }}>
          {options.map((opt, idx) => {
            const Icon = opt.icon;
            return (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); opt.onClick(); setOpen(false); }}
                style={{
                  padding: '8px 12px', fontSize: '0.8rem', color: opt.color || '#334155',
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Icon size={14} /> {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Sub-page View Participants Component
function ParticipantsView({ training, onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isRecordOutcomeOpen, setIsRecordOutcomeOpen] = useState(false);
  const [isReevaluateOpen, setIsReevaluateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = useMemo(() => {
    return mockParticipants.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length && paginated.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(p => p.id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header for Sub-Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Training & Certifications</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Track and employee training and certification
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          Upload <FiUpload size={13} />
        </button>
      </div>

      <button 
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', color: '#64748B',
          fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer',
          padding: '0', alignSelf: 'flex-start'
        }}
      >
        <FiArrowLeft /> Back to Training
      </button>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-search">
             <Input
               value={searchTerm}
               onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
               placeholder="Search employee, id, department..."
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
          columns={[
            { label: 'EMPLOYEE ID', key: 'id' },
            { label: 'EMPLOYEE', key: 'name' },
            { label: 'DEPARTMENT', key: 'department' },
            { 
              label: 'ATTENDANCE', 
              key: 'attendance',
              render: (val) => (
                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: '24px' }}>
                  <input type="checkbox" checked={val} readOnly style={{ width: '16px', height: '16px', cursor: 'default' }} />
                </div>
              )
            }
          ]}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          onRowClick={(row) => setSelectedParticipant(row)}
        />
        
        {filtered.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / ROWS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <Drawer 
        isOpen={!!selectedParticipant} 
        onClose={() => setSelectedParticipant(null)} 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUsers color="#3B82F6" />
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B' }}>{selectedParticipant?.name}</span>
          </div>
        }
        subtitle={`${training.training} • ${selectedParticipant?.id}`}
        width="550px"
      >
        {selectedParticipant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Status:</span>
                <StatusBadge status={selectedParticipant.outcomeStatus || 'Value Not Yet Observed'} />
              </div>
              <button 
                onClick={() => {
                  if (selectedParticipant.outcomeStatus === 'Under Evaluation' || !selectedParticipant.outcomeStatus) {
                    setIsRecordOutcomeOpen(true);
                  } else {
                    setIsReevaluateOpen(true);
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FiEdit2 size={14} /> {selectedParticipant.outcomeStatus === 'Under Evaluation' || !selectedParticipant.outcomeStatus ? 'Record Outcome' : 'Re-evaluate'}
              </button>
            </div>

            <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>EMPLOYEE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant.name}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>EMPLOYEE ID</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant.id}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>DEPARTMENT</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant.department}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>POSITION</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant.position}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>PROVIDER</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{training.provider}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>COURSE/TRAINING</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{training.training}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>COMPLETION DATE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>28/05/25</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>EXPIRY DATE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>28/05/25</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>VALIDITY PERIOD</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{training.validityPeriod}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>STATUS</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant.outcomeStatus || 'Value Not Yet Observed'}</p></div>
            </div>

            {selectedParticipant.outcomeStatus && selectedParticipant.outcomeStatus !== 'Under Evaluation' && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Notes / Operational Feedback</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
                  Employee demonstrates a good understanding of offshore safety procedures and emergency response protocols during site drills.
                </p>
              </div>
            )}

            <div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.7rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Certificate</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #F1F5F9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiFileText color="#94A3B8" size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{training.training.split(' ').join('_')}_Certificate.pdf</span>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                  <FiDownload size={14} /> Download
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={isRecordOutcomeOpen} onClose={() => setIsRecordOutcomeOpen(false)} title="Record Outcome" maxWidth="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormField label="EMPLOYEE">
                <Input value={selectedParticipant?.name || ''} readOnly style={{ backgroundColor: '#F8FAFC' }} />
             </FormField>
             <FormField label="EMPLOYEE ID">
                <Input value={selectedParticipant?.id || ''} readOnly style={{ backgroundColor: '#F8FAFC' }} />
             </FormField>
          </div>
          <FormField label="OUTCOME STATUS" required>
            <Select value="Under Evaluation" onChange={() => {}} options={[{value: 'Under Evaluation', label: 'Under Evaluation'}, {value: 'Value Created', label: 'Value Created'}, {value: 'Value Not Yet Observed', label: 'Value Not Yet Observed'}]} />
          </FormField>
          <FormField label="NOTES / OPERATIONAL FEEDBACK" required>
            <Textarea rows={4} placeholder="Enter feedback here..." />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormField label="EVALUATED BY" required>
                <Input defaultValue="Hannah Badmus" />
             </FormField>
             <FormField label="DATE EVALUATED" required>
                <DatePicker value="2026-10-24" onChange={()=>{}} />
             </FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button className="btn btn-outline" onClick={() => setIsRecordOutcomeOpen(false)} style={{ padding: '8px 20px' }}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setIsRecordOutcomeOpen(false)} style={{ padding: '8px 20px' }}>Save Outcome</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isReevaluateOpen} onClose={() => setIsReevaluateOpen(false)} title="Re-evaluate Outcome" maxWidth="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '10px' }}>
           <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><p style={{ margin: 0, fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>EMPLOYEE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant?.name}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>EMPLOYEE ID</p><p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant?.id}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>EVALUATED BY</p><p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', fontWeight: 500, color: '#1E293B' }}>Hannah Badmus</p></div>
              <div><p style={{ margin: 0, fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>DATE EVALUATED</p><p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', fontWeight: 500, color: '#1E293B' }}>24/10/26</p></div>
              <div style={{ gridColumn: 'span 2' }}><p style={{ margin: 0, fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>STATUS</p><p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', fontWeight: 500, color: '#1E293B' }}>{selectedParticipant?.outcomeStatus}</p></div>
           </div>

          <FormField label="NEW OUTCOME STATUS" required>
            <Select value="Value Created" onChange={() => {}} options={[{value: 'Under Evaluation', label: 'Under Evaluation'}, {value: 'Value Created', label: 'Value Created'}, {value: 'Value Not Yet Observed', label: 'Value Not Yet Observed'}]} />
          </FormField>
          <FormField label="NOTES / OPERATIONAL FEEDBACK" required>
            <Textarea rows={3} defaultValue="Employee now consistently applies offshore safety procedures and demonstrates confidence during emergency drills." />
          </FormField>
          <FormField label="REASON FOR RE-EVALUATION" required>
            <Textarea rows={3} defaultValue="Employee completed additional coaching and practical field assignments." />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <FormField label="RE-EVALUATED BY" required>
                <Input defaultValue="Hannah Badmus" />
             </FormField>
             <FormField label="RE-EVALUATION DATE" required>
                <DatePicker value="2026-10-24" onChange={()=>{}} />
             </FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button className="btn btn-outline" onClick={() => setIsReevaluateOpen(false)} style={{ padding: '8px 20px' }}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setIsReevaluateOpen(false)} style={{ padding: '8px 20px' }}>Save Outcome</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function TrainingCertifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const { addToast } = useToast();

  const [activeViewParticipant, setActiveViewParticipant] = useState(null); 
  
  // Drawers and Modals
  const [viewCourse, setViewCourse] = useState(null);
  const [editSchedule, setEditSchedule] = useState(null); 
  
  const filtered = useMemo(() => {
    return mockTrainings.filter(t => 
      t.training.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length && paginated.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(t => t.id));
    }
  };

  const getMenuOptions = (item) => {
    switch (item.status) {
      case 'Scheduled':
        return [
          { label: 'Edit Schedule', icon: FiEdit2, onClick: () => setEditSchedule(item) },
          { label: 'View Participants', icon: FiUsers, onClick: () => setActiveViewParticipant(item) },
          { label: 'Start Training', icon: FiCheck, onClick: () => {} },
          { label: 'Cancel Training', icon: FiX, color: '#EF4444', onClick: () => {} }
        ];
      case 'Active':
        return [
          { label: 'Mark as Completed', icon: FiCheck, color: '#10B981', onClick: () => {} },
          { label: 'View Participants', icon: FiUsers, onClick: () => setActiveViewParticipant(item) },
        ];
      case 'Completed':
        return [
          { label: 'Start Evaluation', icon: FiFileText, onClick: () => {} },
          { label: 'View Participants', icon: FiUsers, onClick: () => setActiveViewParticipant(item) },
        ];
      case 'Evaluation':
        return [
          { label: 'View Participants', icon: FiUsers, onClick: () => setActiveViewParticipant(item) },
        ];
      default:
        return [];
    }
  };

  const columns = [
    { label: 'TRAINING ID', key: 'id' },
    { label: 'TRAINING', key: 'training' },
    { label: 'PROVIDER', key: 'provider' },
    { label: 'DURATION', key: 'duration' },
    { label: 'VALIDITY PERIOD', key: 'validityPeriod' },
    { label: 'PARTICIPANTS', key: 'participantsCount' },
    { 
      label: 'STATUS', 
      key: 'status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      label: 'ACTIONS',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
          <button 
            onClick={() => setViewCourse(row)}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <FiEye size={17} />
          </button>
          <RowMenu item={row} options={getMenuOptions(row)} />
        </div>
      )
    }
  ];

  if (activeViewParticipant) {
    return <ParticipantsView training={activeViewParticipant} onBack={() => setActiveViewParticipant(null)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Training & Certifications</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Track and employee training and certification
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          Upload <FiUpload size={13} />
        </button>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search training, id, provider..."
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
            <button 
              className="btn btn-primary" 
              style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px',
                backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
              }} 
              onClick={() => setEditSchedule({})}
            >
              <FiPlus size={14} /> Schedule Training
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
        />
        
        {filtered.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filtered.length / ROWS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* View Course Drawer */}
      <Drawer
        isOpen={!!viewCourse}
        onClose={() => setViewCourse(null)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiBookOpen color="#3B82F6"/> 
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B' }}>{viewCourse?.training}</span>
          </div>
        }
        subtitle={viewCourse?.id}
        width="650px"
      >
        {viewCourse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Status:</span>
                <StatusBadge status={viewCourse.status} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {viewCourse.status === 'Scheduled' && (
                  <button className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                     Start Training
                  </button>
                )}
                {viewCourse.status === 'Active' && (
                  <button style={{ backgroundColor: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                     <FiCheck size={16} /> Mark as Completed
                  </button>
                )}
                <button className="btn btn-outline" style={{ padding: '8px', display: 'flex', alignItems: 'center' }}>
                  <FiMoreVertical size={18} />
                </button>
              </div>
            </div>

            <div style={{ border: '1px solid #3B82F6', borderRadius: '8px', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>TRAINING</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.training}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>TRAINING ID</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.id}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>PROVIDER TYPE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.providerType}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>PROVIDER NAME</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.provider}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>START DATE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.startDate}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>END DATE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.endDate}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>START TIME</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.startTime}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>END TIME</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.endTime}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>DURATION</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.duration}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>TRAINING TYPE</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.trainingType}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>LOCATION / PLATFORM</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.location}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>PARTICIPANTS</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.participantsCount} Employees</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>VALIDITY PERIOD</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.validityPeriod}</p></div>
              <div><p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>STATUS</p><p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{viewCourse.status}</p></div>
            </div>

            <div style={{ border: '1px solid #3B82F6', borderStyle: 'dashed', padding: '20px', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>DESCRIPTION</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
                {viewCourse.description}
              </p>
            </div>

            <div style={{ border: '1px solid #3B82F6', borderStyle: 'dashed', padding: '20px', borderRadius: '8px', backgroundColor: '#F8FAFC' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>RENEWAL REQUIREMENTS</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
                {viewCourse.renewalRequirements}
              </p>
            </div>

          </div>
        )}
      </Drawer>

      {/* Schedule / Edit Training Drawer */}
      <Drawer 
        isOpen={!!editSchedule} 
        onClose={() => setEditSchedule(null)} 
        title={editSchedule?.id ? 'Edit Training' : 'Schedule Training'} 
        subtitle="Schedule a training session and assign participants"
        width="650px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <FormField label="TRAINING *" required>
              <Input defaultValue={editSchedule?.training || ''} />
            </FormField>
            <FormField label="PROVIDER TYPE *" required>
              <Select value={editSchedule?.providerType || 'External'} options={[{value: 'External', label: 'External'}, {value: 'Internal', label: 'Internal'}]} onChange={()=>{}} />
            </FormField>
            <FormField label="PROVIDER NAME *" required>
              <Input defaultValue={editSchedule?.provider || ''} />
            </FormField>
            <FormField label="START DATE *" required>
              <DatePicker value={editSchedule?.startDate || ''} onChange={()=>{}} />
            </FormField>
            <FormField label="END DATE *" required>
              <DatePicker value={editSchedule?.endDate || ''} onChange={()=>{}} />
            </FormField>
            <FormField label="START TIME *" required>
              <div style={{ position: 'relative' }}>
                <input type="time" defaultValue={editSchedule?.startTime || ''} style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }} />
              </div>
            </FormField>
            <FormField label="END TIME *" required>
              <div style={{ position: 'relative' }}>
                <input type="time" defaultValue={editSchedule?.endTime || ''} style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }} />
              </div>
            </FormField>
            <FormField label="TRAINING TYPE *" required>
              <Select value={editSchedule?.trainingType || 'Virtual'} options={[{value: 'Virtual', label: 'Virtual'}, {value: 'In-person', label: 'In-person'}]} onChange={()=>{}} />
            </FormField>
            <FormField label="LOCATION / PLATFORM *" required>
              <Input defaultValue={editSchedule?.location || ''} />
            </FormField>
            <FormField label="VALIDITY PERIOD *" required>
              <Input defaultValue={editSchedule?.validityPeriod || ''} />
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>How long the certification remains valid</span>
            </FormField>
          </div>
          
          <div>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', fontWeight: 600, color: '#1E293B' }}>ADD PARTICIPANTS (SELECT AT LEAST 1) *</p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }} />
                <input type="text" placeholder="Search employee name, id, department.." style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }} />
              </div>
              <Select value="All Departments" onChange={()=>{}} options={[{value: 'All Departments', label: 'All Departments'}]} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '0.8rem' }}>
              <button style={{ background: 'none', border: 'none', color: '#3B82F6', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Select All</button>
              <button style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer', padding: 0 }}>Clear</button>
            </div>
            <div style={{ border: '1px solid #F1F5F9', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto' }}>
               {mockParticipants.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < mockParticipants.length -1 ? '1px solid #F1F5F9' : 'none' }}>
                     <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <input type="checkbox" defaultChecked={p.attendance} style={{ marginTop: '4px', width: '15px', height: '15px', accentColor: '#3B82F6' }} />
                        <div>
                           <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{p.name}</p>
                           <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>{p.position} • {p.id}</p>
                        </div>
                     </div>
                     <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: 500 }}>
                        {p.department}
                     </span>
                  </div>
               ))}
            </div>
          </div>

          <FormField label="DESCRIPTION (OPTIONAL)">
            <Textarea rows={4} defaultValue={editSchedule?.description || ''} />
          </FormField>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button className="btn btn-outline" onClick={() => setEditSchedule(null)} style={{ padding: '8px 20px' }}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setEditSchedule(null)} style={{ padding: '8px 20px' }}>{editSchedule?.id ? 'Save Changes' : 'Schedule Training'}</button>
          </div>
        </div>
      </Drawer>
      <Toast />
    </div>
  );
}
