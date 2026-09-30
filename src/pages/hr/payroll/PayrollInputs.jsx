import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiEdit2, FiCopy, FiCheckCircle, FiXCircle, FiUpload, FiX } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import { Input, FormField, Select } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockPayrollStructures } from '../../../data/mockPayroll';

const ITEMS_PER_PAGE = 10;

function RowMenu({ row, onEdit, onDuplicate, onToggleStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = row.status === 'Active';

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '220px'
        }}>
          <div onClick={() => { onEdit(); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiEdit2 size={13} /> Edit Salary Structure
          </div>
          <div onClick={() => { onDuplicate(); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiCopy size={13} /> Duplicate Salary Structure
          </div>
          <div onClick={() => { onToggleStatus(); setOpen(false); }} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: isActive ? '#DC2626' : '#10B981', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            {isActive ? <FiXCircle size={13} /> : <FiCheckCircle size={13} />} {isActive ? 'Deactivate Salary Structure' : 'Activate Salary Structure'}
          </div>
        </div>
      )}
    </div>
  );
}

function SalaryModal({ isOpen, onClose, mode, initialData, onSave }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '700px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            {mode === 'create' ? 'Create Salary Definition' : 'Edit Salary Definition'}
          </h2>
          <button className="icon-btn" onClick={onClose}><FiX size={20} /></button>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <FormField label="JOB TITLE" required>
            <Input placeholder="e.g. Managing Director" defaultValue={initialData?.title} />
          </FormField>
          <FormField label="LEVEL" required>
            <Select>
              <option>EXD-01</option>
              <option>GM</option>
              <option>SM</option>
            </Select>
          </FormField>
          
          <FormField label="BASIC SALARY (₦)" required>
            <Input type="number" defaultValue={initialData?.basic} />
          </FormField>
          <FormField label="HOUSING ALLOWANCE (₦)" required>
            <Input type="number" defaultValue={initialData?.housing} />
          </FormField>

          <FormField label="TRANSPORT ALLOWANCE (₦)" required>
            <Input type="number" defaultValue={initialData?.transport} />
          </FormField>
          <FormField label="UTILITY ALLOWANCE (₦)" required>
            <Input type="number" defaultValue={initialData?.utility} />
          </FormField>

          <FormField label="COMMUNICATION ALLOWANCE (₦)" required>
            <Input type="number" defaultValue={initialData?.communication} />
          </FormField>
          <FormField label="OTHER ALLOWANCES (₦)" required>
            <Input type="number" defaultValue={initialData?.otherAllowances} />
          </FormField>

          <FormField label="PENSION DEDUCTION (₦)" required>
            <Input type="number" defaultValue={initialData?.pension} />
          </FormField>
          <FormField label="OTHER DEDUCTIONS (₦)" required>
            <Input type="number" defaultValue={initialData?.otherDeductions} />
          </FormField>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }} onClick={onSave}>
            {mode === 'create' ? 'Save Salary Structure' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollInputs() {
  const [data, setData] = useState(mockPayrollStructures);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('structure');
  
  const [modalMode, setModalMode] = useState(null); // 'create' or 'edit'
  const [modalData, setModalData] = useState(null);

  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatCurrency = (val) => `₦${val.toLocaleString()}`;

  const columns = [
    { key: 'id', label: 'STRUCTURE ID', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{val}</span> },
    { key: 'title', label: 'TITLE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'level', label: 'LEVEL' },
    { key: 'grossSalary', label: 'GROSS SALARY', render: formatCurrency },
    { key: 'allowances', label: 'ALLOWANCES', render: formatCurrency },
    { key: 'deductions', label: 'DEDUCTIONS', render: formatCurrency },
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
          <RowMenu
            row={row}
            onEdit={() => { setModalMode('edit'); setModalData(row); }}
            onDuplicate={() => showToast('Structure duplicated', 'success')}
            onToggleStatus={() => showToast(`Structure ${row.status === 'Active' ? 'deactivated' : 'activated'}`, 'success')}
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Payroll Inputs</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage salary structures, tax rules, payslips, and payroll processing across the organisation
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'TOTAL PAYROLL COST', value: '₦46,450,000', subtitle: 'Total payroll value for the current month', color: '#1D4ED8', bg: '#EFF6FF' },
          { title: 'EMPLOYEES ON PAYROLL', value: '128', subtitle: 'Active employees in the current cycle', color: '#8B5CF6', bg: '#EDE9FE' },
          { title: 'PENDING APPROVAL', value: '3', subtitle: 'Payroll batches awaiting approval', color: '#F59E0B', bg: '#FEF3C7' },
          { title: 'PROCESSED PAYROLLS', value: '12', subtitle: 'Payroll successfully processed this year', color: '#10B981', bg: '#D1FAE5' }
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

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: '24px', paddingBottom: '0' }}>
        {['Payroll Structure', 'Tax Definitions', 'Payslips', 'Payroll Runs'].map((tab) => {
          const tabKey = tab.toLowerCase().split(' ')[0];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tabKey)}
              style={{
                background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer',
                borderBottom: activeTab === tabKey ? '2px solid #1D4ED8' : '2px solid transparent',
                color: activeTab === tabKey ? '#1D4ED8' : '#64748B',
                fontWeight: activeTab === tabKey ? 600 : 400,
                fontSize: '0.9rem'
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search level.."
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
            <button className="btn btn-primary" onClick={() => { setModalMode('create'); setModalData(null); }} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> Create Salary Definition
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
          emptyMessage="No salary structures found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <SalaryModal
        isOpen={!!modalMode}
        mode={modalMode}
        initialData={modalData}
        onClose={() => setModalMode(null)}
        onSave={() => {
          showToast(`Salary structure ${modalMode === 'create' ? 'created' : 'updated'} successfully`, 'success');
          setModalMode(null);
        }}
      />
    </div>
  );
}
