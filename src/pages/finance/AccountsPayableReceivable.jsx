import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiCreditCard, FiX, FiCheck, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockPayables, mockReceivables } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

const STATUSES = ['All Statuses', 'Paid', 'Partially Paid', 'Unpaid', 'Overdue'];

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

export default function AccountsPayableReceivable() {
  const [tab, setTab] = useState('payables'); // 'payables' | 'receivables'
  const [payables, setPayables] = useState(mockPayables);
  const [receivables, setReceivables] = useState(mockReceivables);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const { toast, showToast, hideToast } = useToast();

  // Drawers and Modals
  const [viewItem, setViewItem] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Bank Transfer',
    txRef: ''
  });

  const activeList = tab === 'payables' ? payables : receivables;

  const filteredData = activeList.filter(item => {
    const q = search.toLowerCase();
    const idKey = tab === 'payables' ? item.payableId : item.receivableId;
    const nameKey = tab === 'payables' ? item.vendor : item.client;
    const matchesSearch = !q || idKey.toLowerCase().includes(q) || nameKey.toLowerCase().includes(q) || item.project.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All Statuses' || item.status === statusFilter;
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

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentForm.amountPaid) {
      showToast('Please enter payment amount', 'error');
      return;
    }
    const updateTarget = (list) => list.map(item => {
      if (item.id === paymentModal.id) {
        const amt = Number(paymentForm.amountPaid);
        const newOutstanding = Math.max(0, (item.outstanding || item.netAmount || item.netReceivable) - amt);
        return {
          ...item,
          amountPaid: (item.amountPaid || 0) + amt,
          outstanding: newOutstanding,
          status: newOutstanding === 0 ? 'Paid' : 'Partially Paid',
          paymentDate: paymentForm.paymentDate,
          txRef: paymentForm.txRef || 'NIP-TXN-AUTO'
        };
      }
      return item;
    });

    if (tab === 'payables') setPayables(updateTarget(payables));
    else setReceivables(updateTarget(receivables));

    showToast('Payment voucher processed successfully', 'success');
    setPaymentModal(null);
  };

  const payableColumns = [
    {
      key: 'payableId',
      label: 'VOUCHER NO.',
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
      key: 'vendor',
      label: 'VENDOR',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'project', label: 'PROJECT' },
    { key: 'invoice', label: 'INVOICE REF' },
    {
      key: 'netAmount',
      label: 'NET PAYABLE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
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
          <button className="icon-btn" onClick={() => setViewItem(row)} title="View Voucher Details">
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Voucher',
                onClick: () => setViewItem(row)
              },
              {
                icon: <FiCreditCard size={14} />,
                label: 'Record Payment',
                onClick: () => {
                  setPaymentModal(row);
                  setPaymentForm({
                    amountPaid: row.outstanding || row.netAmount,
                    paymentDate: new Date().toISOString().slice(0, 10),
                    paymentMethod: 'Bank Transfer',
                    txRef: ''
                  });
                }
              },
              {
                icon: <FiX size={14} />,
                label: 'Void Voucher',
                danger: true,
                onClick: () => {
                  setPayables(payables.map(p => p.id === row.id ? { ...p, status: 'Cancelled' } : p));
                  showToast('Payable voucher voided', 'info');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  const receivableColumns = [
    {
      key: 'receivableId',
      label: 'RECEIVABLE ID',
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
    {
      key: 'invoiceAmount',
      label: 'VALUATION',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    {
      key: 'netReceivable',
      label: 'NET DUE',
      render: (val) => <span style={{ fontWeight: 600, color: '#16A34A' }}>{fmt(val)}</span>
    },
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
          <button className="icon-btn" onClick={() => setViewItem(row)} title="View Receivable Details">
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Receivable',
                onClick: () => setViewItem(row)
              },
              {
                icon: <FiCreditCard size={14} />,
                label: 'Receive Payment',
                onClick: () => {
                  setPaymentModal(row);
                  setPaymentForm({
                    amountPaid: row.outstanding || row.netReceivable,
                    paymentDate: new Date().toISOString().slice(0, 10),
                    paymentMethod: 'Bank Transfer',
                    txRef: ''
                  });
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
            Payables & Receivables
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Track vendor obligations, milestone billings, withholding tax deductions, and aging
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting aging ledger...', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export Aging
          </button>
        </div>
      </div>

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' }}>
        <button
          onClick={() => { setTab('payables'); setCurrentPage(1); setSelectedIds([]); }}
          style={{
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: tab === 'payables' ? '2px solid #1D4ED8' : '2px solid transparent',
            color: tab === 'payables' ? '#1D4ED8' : '#64748B',
            fontFamily: 'var(--font)'
          }}
        >
          Accounts Payable ({payables.length})
        </button>
        <button
          onClick={() => { setTab('receivables'); setCurrentPage(1); setSelectedIds([]); }}
          style={{
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: tab === 'receivables' ? '2px solid #1D4ED8' : '2px solid transparent',
            color: tab === 'receivables' ? '#1D4ED8' : '#64748B',
            fontFamily: 'var(--font)'
          }}
        >
          Accounts Receivable ({receivables.length})
        </button>
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
              placeholder={tab === 'payables' ? "Search vendor, voucher, invoice ref..." : "Search client, receivable ID..."}
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
              onClick={() => showToast('Exporting entries...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={tab === 'payables' ? payableColumns : receivableColumns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No financial vouchers match your criteria."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: VOUCHER DETAILS ─── */}
      <Drawer
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `${viewItem.payableId || viewItem.receivableId} Details` : ''}
        subtitle="Breakdown of gross value, tax deductions, and payment status"
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
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Net Settled / Due</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewItem.netAmount || viewItem.netReceivable)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewItem.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Party:</strong> {viewItem.vendor || viewItem.client}</div>
              <div><strong style={{ color: '#64748B' }}>Project:</strong> {viewItem.project}</div>
              <div><strong style={{ color: '#64748B' }}>Gross Valuation:</strong> {fmt(viewItem.grossAmount || viewItem.invoiceAmount)}</div>
              <div><strong style={{ color: '#64748B' }}>Due Date:</strong> {viewItem.dueDate}</div>
              <div><strong style={{ color: '#64748B' }}>VAT (7.5%):</strong> {fmt(viewItem.vat)}</div>
              <div><strong style={{ color: '#64748B' }}>WHT (5%):</strong> {fmt(viewItem.wht)}</div>
            </div>

            {viewItem.amountPaid > 0 && (
              <div style={{ background: '#F0FDF4', padding: '14px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#16A34A', marginBottom: '4px' }}>
                  Settlement History
                </div>
                <div style={{ fontSize: '0.813rem', color: '#1E293B' }}>
                  Paid: {fmt(viewItem.amountPaid)} via {viewItem.paymentMethod} on {viewItem.paymentDate}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Reference: {viewItem.txRef}
                </div>
              </div>
            )}

            {viewItem.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Linked Invoice / Document: {viewItem.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Records"
        subtitle="Filter by settlement and overdue status"
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
        <FormField label="Payment Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {STATUSES.map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="stat"
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

      {/* Modal: Record Payment */}
      {paymentModal && (
        <Modal
          isOpen={true}
          onClose={() => setPaymentModal(null)}
          title={`Process Payment Voucher: ${paymentModal.payableId || paymentModal.receivableId}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
              Process settlement for <strong>{paymentModal.vendor || paymentModal.client}</strong>. Outstanding: <strong>{fmt(paymentModal.outstanding || paymentModal.netAmount || paymentModal.netReceivable)}</strong>
            </p>

            <FormField label="Amount to Remit / Receive (NGN)">
              <Input
                type="number"
                value={paymentForm.amountPaid}
                onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Transaction Date">
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Payment Method">
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Remita RRR">Remita RRR</option>
                </select>
              </FormField>
            </div>

            <FormField label="Bank Reference / Cheque No.">
              <Input
                value={paymentForm.txRef}
                onChange={(e) => setPaymentForm({ ...paymentForm, txRef: e.target.value })}
                placeholder="e.g. NIP-TXN-902148"
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
                Confirm Settlement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
