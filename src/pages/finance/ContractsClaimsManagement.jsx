import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiCheck, FiX, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockContracts, mockVariations, mockClaims } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

function RowMenu({ items }) {
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
          {items.map((it, idx) => (
            <div
              key={idx}
              onClick={() => { it.onClick(); setOpen(false); }}
              style={{
                padding: '8px 14px', fontSize: '0.813rem', color: it.danger ? '#DC2626' : '#334155',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = it.danger ? '#FEE2E2' : '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              {it.icon} {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContractsClaimsManagement() {
  const [tab, setTab] = useState('contracts'); // 'contracts' | 'variations' | 'claims'
  const [contracts, setContracts] = useState(mockContracts);
  const [variations, setVariations] = useState(mockVariations);
  const [claims, setClaims] = useState(mockClaims);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  // Drawers and Modals
  const [viewItem, setViewItem] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  const [contractForm, setContractForm] = useState({
    contractId: `PGSL-CTR-0${contracts.length + 1}`,
    client: 'NNPC Ltd',
    project: '',
    contractTitle: '',
    contractType: 'EPC',
    contractValue: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2027-12-31',
    paymentTerms: 'Monthly Progress Payment',
    contactManager: 'Mary Johnson',
    description: ''
  });

  const activeList = tab === 'contracts' ? contracts : tab === 'variations' ? variations : claims;

  const filteredData = activeList.filter(item => {
    const q = search.toLowerCase();
    const idKey = item.contractId || item.variationId || item.claimId || '';
    const titleKey = item.contractTitle || item.variationTitle || item.claimTitle || '';
    const clientKey = item.client || item.project || '';
    return !q || idKey.toLowerCase().includes(q) || titleKey.toLowerCase().includes(q) || clientKey.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginated = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((p) => p.id));
  };

  const handleSaveContract = (e) => {
    e.preventDefault();
    if (!contractForm.contractTitle || !contractForm.contractValue) {
      showToast('Please fill all required contract details', 'error');
      return;
    }
    const newEntry = {
      id: Date.now(),
      ...contractForm,
      contractValue: Number(contractForm.contractValue),
      status: 'Active'
    };
    setContracts([newEntry, ...contracts]);
    showToast('Contract registered successfully', 'success');
    setCreateModal(false);
  };

  const contractColumns = [
    {
      key: 'contractId',
      label: 'CONTRACT ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewItem({ ...row, typeTag: 'Contract' })}
        >
          {val}
        </span>
      )
    },
    {
      key: 'contractTitle',
      label: 'CONTRACT TITLE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'client', label: 'CLIENT' },
    { key: 'contractType', label: 'TYPE' },
    {
      key: 'contractValue',
      label: 'CONTRACT VALUE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    { key: 'startDate', label: 'START' },
    { key: 'endDate', label: 'END' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewItem({ ...row, typeTag: 'Contract' })}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Contract',
                onClick: () => setViewItem({ ...row, typeTag: 'Contract' })
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Sign Contract',
                onClick: () => {
                  setContracts(contracts.map(c => c.id === row.id ? { ...c, status: 'Signed' } : c));
                  showToast('Contract status updated to Signed', 'success');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  const variationColumns = [
    {
      key: 'variationId',
      label: 'VARIATION ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewItem({ ...row, typeTag: 'Variation' })}
        >
          {val}
        </span>
      )
    },
    {
      key: 'variationTitle',
      label: 'VARIATION TITLE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'client', label: 'CLIENT' },
    { key: 'variationType', label: 'TYPE' },
    {
      key: 'valueImpact',
      label: 'VALUE IMPACT',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    { key: 'lodgeDate', label: 'DATE LODGED' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewItem({ ...row, typeTag: 'Variation' })}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Variation',
                onClick: () => setViewItem({ ...row, typeTag: 'Variation' })
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Approve Variation',
                onClick: () => {
                  setVariations(variations.map(v => v.id === row.id ? { ...v, status: 'Approved' } : v));
                  showToast('Variation order approved', 'success');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  const claimColumns = [
    {
      key: 'claimId',
      label: 'CLAIM ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewItem({ ...row, typeTag: 'Claim' })}
        >
          {val}
        </span>
      )
    },
    {
      key: 'claimTitle',
      label: 'CLAIM TITLE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'type', label: 'CLAIM TYPE' },
    {
      key: 'amount',
      label: 'CLAIMED AMOUNT',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    { key: 'raisedBy', label: 'RAISED BY' },
    { key: 'lodgeDate', label: 'LODGED DATE' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewItem({ ...row, typeTag: 'Claim' })}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Claim',
                onClick: () => setViewItem({ ...row, typeTag: 'Claim' })
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Settle Claim',
                onClick: () => {
                  setClaims(claims.map(c => c.id === row.id ? { ...c, status: 'Settled' } : c));
                  showToast('Commercial claim marked as Settled', 'success');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Contracts & Claims Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Oversee project EPCIC contracts, variation orders, EOT extension claims, and settlement disputes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting schedule...', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setCreateModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
            }}
          >
            <FiPlus size={14} /> Register Contract
          </button>
        </div>
      </div>

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' }}>
        {[
          { id: 'contracts', label: `Contracts (${contracts.length})` },
          { id: 'variations', label: `Variations (${variations.length})` },
          { id: 'claims', label: `Claims (${claims.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setCurrentPage(1); setSelectedIds([]); }}
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: tab === t.id ? '2px solid #1D4ED8' : '2px solid transparent',
              color: tab === t.id ? '#1D4ED8' : '#64748B',
              fontFamily: 'var(--font)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search contracts, variation orders, claims..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          <div className="table-toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting active dataset...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={tab === 'contracts' ? contractColumns : tab === 'variations' ? variationColumns : claimColumns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No commercial contract records found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: VIEW ITEM DETAILS ─── */}
      <Drawer
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `${viewItem.contractId || viewItem.variationId || viewItem.claimId}` : ''}
        subtitle={`${viewItem?.typeTag || 'Commercial'} agreement and commercial scope details`}
        width="520px"
        footer={(
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={() => setViewItem(null)}
          >
            Close
          </button>
        )}
      >
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Financial Value / Impact</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewItem.contractValue || viewItem.valueImpact || viewItem.amount)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewItem.status} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Title:</strong> {viewItem.contractTitle || viewItem.variationTitle || viewItem.claimTitle}</div>
              <div><strong style={{ color: '#64748B' }}>Client / Project:</strong> {viewItem.client || viewItem.project}</div>
              {viewItem.contactManager && <div><strong style={{ color: '#64748B' }}>Contract Manager:</strong> {viewItem.contactManager}</div>}
              {viewItem.raisedBy && <div><strong style={{ color: '#64748B' }}>Raised By:</strong> {viewItem.raisedBy}</div>}
              {viewItem.lodgeDate && <div><strong style={{ color: '#64748B' }}>Lodged:</strong> {viewItem.lodgeDate}</div>}
            </div>

            <div>
              <strong style={{ fontSize: '0.813rem', color: '#64748B', display: 'block', marginBottom: '6px' }}>Commercial Scope</strong>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', fontSize: '0.813rem', color: '#1E293B', lineHeight: 1.5, border: '1px solid #E2E8F0' }}>
                {viewItem.description || 'Full scope documented in project execution plan.'}
              </div>
            </div>

            {viewItem.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Legal Document: {viewItem.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal: Register Contract */}
      {createModal && (
        <Modal
          isOpen={true}
          onClose={() => setCreateModal(false)}
          title="Register Project Contract"
        >
          <form onSubmit={handleSaveContract} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Contract ID">
                <Input value={contractForm.contractId} disabled />
              </FormField>
              <FormField label="Contract Type">
                <select
                  value={contractForm.contractType}
                  onChange={(e) => setContractForm({ ...contractForm, contractType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  <option value="EPC">EPC</option>
                  <option value="EPCIC">EPCIC</option>
                  <option value="Construction">Construction</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </FormField>
            </div>

            <FormField label="Contract Title">
              <Input
                value={contractForm.contractTitle}
                onChange={(e) => setContractForm({ ...contractForm, contractTitle: e.target.value })}
                placeholder="e.g. Offshore Pipeline Upgrade EPC Contract"
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Client">
                <Input
                  value={contractForm.client}
                  onChange={(e) => setContractForm({ ...contractForm, client: e.target.value })}
                  placeholder="e.g. NNPC Ltd"
                  required
                />
              </FormField>
              <FormField label="Contract Value (NGN)">
                <Input
                  type="number"
                  value={contractForm.contractValue}
                  onChange={(e) => setContractForm({ ...contractForm, contractValue: e.target.value })}
                  placeholder="145,000,000"
                  required
                />
              </FormField>
            </div>

            <FormField label="Scope Overview">
              <textarea
                value={contractForm.description}
                onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', fontFamily: 'var(--font)' }}
                placeholder="Key scope specifications..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                Register Contract
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
