import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiCreditCard, FiCheck, FiX, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockTaxRecords } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

const TAX_TYPES = ['All Types', 'VAT', 'WHT', 'CIT', 'NCD Levy', 'PAYE'];
const TAX_STATUSES = ['All Statuses', 'Draft', 'Pending Filing', 'Filed', 'Paid'];

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
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '190px'
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

export default function TaxManagement() {
  const [data, setData] = useState(mockTaxRecords);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const { toast, showToast, hideToast } = useToast();

  // Drawers and Modals
  const [viewItem, setViewItem] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer',
    paymentRef: ''
  });

  const [form, setForm] = useState({
    taxId: `TAX-00${data.length + 1}`,
    taxType: 'VAT',
    filingPeriod: 'Q3 2026',
    taxAmount: '',
    taxEntity: 'PGSL Construction Ltd.',
    dueDate: new Date().toISOString().slice(0, 10),
    taxReference: `TAX-REF-${Date.now().toString().slice(-4)}`
  });

  const filteredData = data.filter(t => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.taxId.toLowerCase().includes(q) || t.taxType.toLowerCase().includes(q) || t.taxEntity.toLowerCase().includes(q);
    const matchesType = typeFilter === 'All Types' || t.taxType === typeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || t.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginated = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((item) => item.id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.taxAmount) {
      showToast('Please specify computed tax amount', 'error');
      return;
    }
    const newEntry = {
      id: Date.now(),
      ...form,
      taxAmount: Number(form.taxAmount),
      status: 'Pending Filing'
    };
    setData([newEntry, ...data]);
    showToast('Statutory tax obligation added', 'success');
    setCreateModal(false);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!payForm.amountPaid || !payForm.paymentRef) {
      showToast('Please enter remittance amount and reference / RRR', 'error');
      return;
    }
    setData(data.map(item => {
      if (item.id === payModal.id) {
        return {
          ...item,
          status: 'Paid',
          amountPaid: Number(payForm.amountPaid),
          paymentDate: payForm.paymentDate,
          paymentMethod: payForm.paymentMethod,
          paymentRef: payForm.paymentRef
        };
      }
      return item;
    }));
    showToast('Tax remittance recorded successfully', 'success');
    setPayModal(null);
  };

  const columns = [
    {
      key: 'taxId',
      label: 'TAX ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewItem(row)}
        >
          {val}
        </span>
      )
    },
    {
      key: 'taxType',
      label: 'TAX TYPE',
      render: (val) => (
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
          background: '#EFF6FF', color: '#1D4ED8'
        }}>
          {val}
        </span>
      )
    },
    { key: 'filingPeriod', label: 'PERIOD' },
    {
      key: 'taxAmount',
      label: 'AMOUNT DUE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    { key: 'taxEntity', label: 'TAX ENTITY' },
    { key: 'dueDate', label: 'DUE DATE' },
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
          <button className="icon-btn" onClick={() => setViewItem(row)}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Obligation',
                onClick: () => setViewItem(row)
              },
              {
                icon: <FiCreditCard size={14} />,
                label: 'Record Remittance',
                onClick: () => {
                  setPayModal(row);
                  setPayForm({
                    amountPaid: row.taxAmount,
                    paymentDate: new Date().toISOString().slice(0, 10),
                    paymentMethod: 'Bank Transfer',
                    paymentRef: ''
                  });
                }
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Mark as Filed',
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Filed' } : d));
                  showToast('Filing marked as submitted to revenue authority', 'success');
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
            Tax Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Monitor statutory obligations, VAT, WHT, CIT, and Nigerian Content Development (NCD) levies
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting tax schedule...', 'info')}
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
            <FiPlus size={14} /> Add Tax Obligation
          </button>
        </div>
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
              placeholder="Search tax ID, type, entity, RRR..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          <div className="table-toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setFilterOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiFilter size={14} /> Filter
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting spreadsheet...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No tax records found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: TAX DETAILS ─── */}
      <Drawer
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `${viewItem.taxId} – ${viewItem.taxType}` : ''}
        subtitle="Statutory tax assessment and payment audit"
        width="500px"
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
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Tax Obligation Amount</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewItem.taxAmount)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewItem.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Entity:</strong> {viewItem.taxEntity}</div>
              <div><strong style={{ color: '#64748B' }}>Filing Period:</strong> {viewItem.filingPeriod}</div>
              <div><strong style={{ color: '#64748B' }}>Due Date:</strong> {viewItem.dueDate}</div>
              <div><strong style={{ color: '#64748B' }}>Reference / RRR:</strong> {viewItem.taxReference || '—'}</div>
            </div>

            {viewItem.amountPaid > 0 && (
              <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#16A34A', marginBottom: '4px' }}>
                  Remittance Receipt
                </div>
                <div style={{ fontSize: '0.813rem', color: '#1E293B' }}>
                  Paid: {fmt(viewItem.amountPaid)} on {viewItem.paymentDate} via {viewItem.paymentMethod}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Transaction Ref / RRR: {viewItem.paymentRef}
                </div>
              </div>
            )}

            {viewItem.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Computation File: {viewItem.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Tax Obligations"
        subtitle="Filter by statutory tax type and filing status"
        width="420px"
        footer={(
          <>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
              onClick={() => { setTypeFilter('All Types'); setStatusFilter('All Statuses'); setFilterOpen(false); }}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
              onClick={() => setFilterOpen(false)}
            >
              Apply Filters
            </button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FormField label="Tax Type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
              {TAX_TYPES.map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ttype"
                    checked={typeFilter === t}
                    onChange={() => setTypeFilter(t)}
                    style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
              {TAX_STATUSES.map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="tstat"
                    checked={statusFilter === s}
                    onChange={() => setStatusFilter(s)}
                    style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                  />
                  {s}
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </Drawer>

      {/* Modal: New Tax Obligation */}
      {createModal && (
        <Modal
          isOpen={true}
          onClose={() => setCreateModal(false)}
          title="Add Tax Obligation"
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Tax ID">
                <Input value={form.taxId} disabled />
              </FormField>
              <FormField label="Tax Type">
                <select
                  value={form.taxType}
                  onChange={(e) => setForm({ ...form, taxType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  {TAX_TYPES.filter(t => t !== 'All Types').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Legal Tax Entity">
              <Input
                value={form.taxEntity}
                onChange={(e) => setForm({ ...form, taxEntity: e.target.value })}
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Filing Period">
                <Input
                  value={form.filingPeriod}
                  onChange={(e) => setForm({ ...form, filingPeriod: e.target.value })}
                  placeholder="e.g. Q3 2026"
                  required
                />
              </FormField>
              <FormField label="Tax Due Date">
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <FormField label="Computed Tax Amount (NGN)">
              <Input
                type="number"
                value={form.taxAmount}
                onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                placeholder="8,450,000"
                required
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
                Save Obligation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Record Payment */}
      {payModal && (
        <Modal
          isOpen={true}
          onClose={() => setPayModal(null)}
          title={`Record Tax Remittance: ${payModal.taxId}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
              Remittance for {payModal.taxType} ({payModal.filingPeriod}). Entity: <strong>{payModal.taxEntity}</strong>
            </p>

            <FormField label="Amount Remitted (NGN)">
              <Input
                type="number"
                value={payForm.amountPaid}
                onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })}
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Remittance Date">
                <Input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Payment Method">
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Remita RRR">Remita RRR</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </FormField>
            </div>

            <FormField label="Remita RRR / Bank Payment Reference">
              <Input
                value={payForm.paymentRef}
                onChange={(e) => setPayForm({ ...payForm, paymentRef: e.target.value })}
                placeholder="e.g. FIRS-TRX-20260710-001"
                required
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPayModal(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                Confirm Remittance
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
