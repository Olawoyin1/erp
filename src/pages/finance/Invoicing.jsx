import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiCreditCard, FiPrinter, FiFileText, FiCheck, FiX
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockInvoices } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

const CLIENTS = ['NNPC Ltd', 'Shell Nigeria', 'TotalEnergies', 'Chevron Nigeria'];
const STATUSES = ['All Statuses', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];

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

export default function Invoicing() {
  const [data, setData] = useState(mockInvoices);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const { toast, showToast, hideToast } = useToast();

  // Drawers & Modals
  const [viewItem, setViewItem] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);

  const emptyForm = {
    invoiceId: `PGSL-INV-0${data.length + 1}`,
    client: 'NNPC Ltd',
    project: 'Offshore Pipeline Upgrade',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '2026-08-15',
    currency: 'NGN',
    workValuation: '',
    description: '',
    doc: ''
  };

  const [form, setForm] = useState(emptyForm);
  const [pmtForm, setPmtForm] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer',
    txRef: ''
  });

  const filteredData = data.filter(inv => {
    const q = search.toLowerCase();
    const matchesSearch = !q || inv.invoiceId.toLowerCase().includes(q) || inv.client.toLowerCase().includes(q) || inv.project.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Statuses' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!form.workValuation) {
      showToast('Please specify the milestone work valuation.', 'error');
      return;
    }
    const val = Number(form.workValuation);
    const vat = Math.round(val * 0.075);
    const wht = Math.round(val * 0.05);
    const net = val + vat - wht;

    const newInv = {
      id: Date.now(),
      ...form,
      workValuation: val,
      vat,
      wht,
      debtReceivable: net,
      outstanding: net,
      status: 'Issued'
    };
    setData([newInv, ...data]);
    showToast('Client invoice generated successfully', 'success');
    setCreateModal(false);
    setForm(emptyForm);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!pmtForm.amountPaid) {
      showToast('Please enter payment received amount', 'error');
      return;
    }
    const amt = Number(pmtForm.amountPaid);
    setData(data.map(item => {
      if (item.id === paymentModal.id) {
        const remaining = Math.max(0, item.outstanding - amt);
        return {
          ...item,
          amountPaid: (item.amountPaid || 0) + amt,
          outstanding: remaining,
          status: remaining === 0 ? 'Paid' : 'Partially Paid',
          paymentDate: pmtForm.paymentDate,
          txRef: pmtForm.txRef || 'NIP-RECV-AUTO'
        };
      }
      return item;
    }));
    showToast('Payment recorded for invoice', 'success');
    setPaymentModal(null);
  };

  const columns = [
    {
      key: 'invoiceId',
      label: 'INVOICE NO.',
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
      key: 'client',
      label: 'CLIENT',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'project', label: 'PROJECT' },
    { key: 'invoiceDate', label: 'DATE' },
    { key: 'dueDate', label: 'DUE DATE' },
    {
      key: 'workValuation',
      label: 'VALUATION',
      render: (val) => <span>{fmt(val)}</span>
    },
    {
      key: 'debtReceivable',
      label: 'NET RECEIVABLE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
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
          <button className="icon-btn" onClick={() => setViewItem(row)} title="View Invoice">
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Invoice',
                onClick: () => setViewItem(row)
              },
              {
                icon: <FiCreditCard size={14} />,
                label: 'Record Payment',
                onClick: () => {
                  setPaymentModal(row);
                  setPmtForm({
                    amountPaid: row.outstanding || row.debtReceivable,
                    paymentDate: new Date().toISOString().slice(0, 10),
                    paymentMethod: 'Bank Transfer',
                    txRef: ''
                  });
                }
              },
              {
                icon: <FiPrinter size={14} />,
                label: 'Print Invoice',
                onClick: () => window.print()
              },
              {
                icon: <FiX size={14} />,
                label: 'Cancel Invoice',
                danger: true,
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Cancelled' } : d));
                  showToast('Invoice marked as cancelled', 'info');
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
            Invoicing & Billing
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Generate client milestone invoices, manage VAT/WHT computations, and payment receipts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting invoices statement...', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => { setForm(emptyForm); setCreateModal(true); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
            }}
          >
            <FiPlus size={14} /> Create Invoice
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
              placeholder="Search invoice number, client, project..."
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
          emptyMessage="No invoices found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: INVOICE DETAILS ─── */}
      <Drawer
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `${viewItem.invoiceId} – ${viewItem.client}` : ''}
        subtitle="Commercial milestone billing breakdown"
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
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Net Invoice Receivable</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewItem.debtReceivable)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewItem.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Client:</strong> {viewItem.client}</div>
              <div><strong style={{ color: '#64748B' }}>Project:</strong> {viewItem.project}</div>
              <div><strong style={{ color: '#64748B' }}>Invoice Date:</strong> {viewItem.invoiceDate}</div>
              <div><strong style={{ color: '#64748B' }}>Due Date:</strong> {viewItem.dueDate}</div>
              <div><strong style={{ color: '#64748B' }}>Work Valuation:</strong> {fmt(viewItem.workValuation)}</div>
              <div><strong style={{ color: '#64748B' }}>VAT (+7.5%):</strong> {fmt(viewItem.vat)}</div>
              <div><strong style={{ color: '#64748B' }}>WHT (-5%):</strong> {fmt(viewItem.wht)}</div>
              <div><strong style={{ color: '#64748B' }}>Outstanding:</strong> {fmt(viewItem.outstanding)}</div>
            </div>

            {viewItem.amountPaid > 0 && (
              <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#16A34A', marginBottom: '4px' }}>
                  Recorded Collections
                </div>
                <div style={{ fontSize: '0.813rem', color: '#1E293B' }}>
                  Received: {fmt(viewItem.amountPaid)} on {viewItem.paymentDate} via {viewItem.paymentMethod || 'Bank Transfer'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Transaction Ref: {viewItem.txRef}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Invoices"
        subtitle="Filter by payment collections and aging status"
        width="420px"
        footer={(
          <>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
              onClick={() => { setStatusFilter('All Statuses'); setFilterOpen(false); }}
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
        <FormField label="Invoice Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {STATUSES.map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="invstat"
                  checked={statusFilter === s}
                  onChange={() => setStatusFilter(s)}
                  style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                />
                {s}
              </label>
            ))}
          </div>
        </FormField>
      </Drawer>

      {/* Modal: Create Invoice */}
      {createModal && (
        <Modal
          isOpen={true}
          onClose={() => setCreateModal(false)}
          title="Generate Client Invoice"
        >
          <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Invoice No.">
                <Input value={form.invoiceId} disabled />
              </FormField>
              <FormField label="Client">
                <select
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Project / Contract Description">
              <Input
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                placeholder="e.g. Jetty Rehabilitation Milestone 2"
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Work Valuation (Gross NGN)">
                <Input
                  type="number"
                  value={form.workValuation}
                  onChange={(e) => setForm({ ...form, workValuation: e.target.value })}
                  placeholder="145,000,000"
                  required
                />
              </FormField>
              <FormField label="Payment Due Date">
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <FormField label="Invoice Notes / Milestone Certification">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', fontFamily: 'var(--font)' }}
                placeholder="State the milestone deliverables completed..."
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
                Generate & Issue
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Record Payment */}
      {paymentModal && (
        <Modal
          isOpen={true}
          onClose={() => setPaymentModal(null)}
          title={`Record Payment for ${paymentModal.invoiceId}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
              Client: <strong>{paymentModal.client}</strong> • Outstanding Due: <strong>{fmt(paymentModal.outstanding)}</strong>
            </p>

            <FormField label="Amount Received (NGN)">
              <Input
                type="number"
                value={pmtForm.amountPaid}
                onChange={(e) => setPmtForm({ ...pmtForm, amountPaid: e.target.value })}
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Receipt Date">
                <Input
                  type="date"
                  value={pmtForm.paymentDate}
                  onChange={(e) => setPmtForm({ ...pmtForm, paymentDate: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Payment Method">
                <select
                  value={pmtForm.paymentMethod}
                  onChange={(e) => setPmtForm({ ...pmtForm, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Remita RRR">Remita RRR</option>
                </select>
              </FormField>
            </div>

            <FormField label="Transaction Reference">
              <Input
                value={pmtForm.txRef}
                onChange={(e) => setPmtForm({ ...pmtForm, txRef: e.target.value })}
                placeholder="e.g. NIP-TXN-88192"
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPaymentModal(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                Save Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
