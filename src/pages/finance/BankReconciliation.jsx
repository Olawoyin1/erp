import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiCheckCircle, FiCheck, FiX, FiRefreshCw, FiFileText, FiUploadCloud
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockBankReconciliations } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n, cur = 'NGN') => {
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₦';
  return sym + Number(n).toLocaleString();
};

const BANK_ACCOUNTS = [
  'First Bank HQ Operational Account',
  'Zenith Bank Operations Account',
  'GTBank – NGN Operational',
  'Zenith Bank – USD Domiciliary',
  'Access Bank – EUR Operational'
];

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

export default function BankReconciliation() {
  const [data, setData] = useState(mockBankReconciliations);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const { toast, showToast, hideToast } = useToast();

  // Drawers and Modals
  const [viewItem, setViewItem] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [matchModal, setMatchModal] = useState(null);

  const [form, setForm] = useState({
    reconciliationId: `REC-00${data.length + 1}`,
    bankAccount: 'Zenith Bank Operations Account',
    statementPeriod: 'Jul 2026',
    currency: 'NGN',
    openingBalance: '',
    closingBalance: '',
    remarks: ''
  });

  const [unmatchedLedger, setUnmatchedLedger] = useState([
    { id: 1, date: '2026-06-05', desc: 'Transfer to Vendor ABC Ltd', amount: 1500000 },
    { id: 2, date: '2026-06-12', desc: 'Bank Maintenance Charge', amount: 35000 },
    { id: 3, date: '2026-06-20', desc: 'Inflow NNPC Milestone 1', amount: 45000000 }
  ]);

  const filteredData = data.filter(r => {
    const q = search.toLowerCase();
    return !q || r.reconciliationId.toLowerCase().includes(q) || r.bankAccount.toLowerCase().includes(q) || r.statementPeriod.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginated = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((r) => r.id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.openingBalance || !form.closingBalance) {
      showToast('Please enter opening and closing statement balances', 'error');
      return;
    }
    const newEntry = {
      id: Date.now(),
      ...form,
      openingBalance: Number(form.openingBalance),
      closingBalance: Number(form.closingBalance),
      matchedTransactions: '0 / 0',
      variance: 0,
      status: 'In Progress'
    };
    setData([newEntry, ...data]);
    showToast('New reconciliation cycle started', 'success');
    setCreateModal(false);
  };

  const columns = [
    {
      key: 'reconciliationId',
      label: 'RECONCILIATION ID',
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
      key: 'bankAccount',
      label: 'BANK ACCOUNT',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'statementPeriod', label: 'PERIOD' },
    {
      key: 'openingBalance',
      label: 'OPENING BALANCE',
      render: (val, row) => <span>{fmt(val, row.currency)}</span>
    },
    {
      key: 'closingBalance',
      label: 'CLOSING BALANCE',
      render: (val, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val, row.currency)}</span>
    },
    { key: 'matchedTransactions', label: 'MATCHED ITEMS' },
    {
      key: 'variance',
      label: 'VARIANCE',
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: val > 0 ? '#DC2626' : '#16A34A' }}>
          {fmt(val, row.currency)}
        </span>
      )
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
          <button className="icon-btn" onClick={() => setViewItem(row)}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Details',
                onClick: () => setViewItem(row)
              },
              {
                icon: <FiCheckCircle size={14} />,
                label: 'Match Transactions',
                onClick: () => setMatchModal(row)
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Finalize & Close',
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Reconciled', variance: 0 } : d));
                  showToast('Reconciliation closed and approved', 'success');
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
            Bank Reconciliation
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Reconcile general ledger cash balances against periodic bank statements
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting reconciliation reports...', 'info')}
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
            <FiPlus size={14} /> New Reconciliation
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
              placeholder="Search reconciliation ID, bank account, period..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          <div className="table-toolbar-actions">
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
          emptyMessage="No bank reconciliations found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: RECONCILIATION DETAILS ─── */}
      <Drawer
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `${viewItem.reconciliationId} – ${viewItem.bankAccount}` : ''}
        subtitle="Statement period variance summary"
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Opening</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{fmt(viewItem.openingBalance, viewItem.currency)}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Closing</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1D4ED8', marginTop: '2px' }}>{fmt(viewItem.closingBalance, viewItem.currency)}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Variance</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: viewItem.variance > 0 ? '#DC2626' : '#16A34A', marginTop: '2px' }}>{fmt(viewItem.variance, viewItem.currency)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Bank Account:</strong> {viewItem.bankAccount}</div>
              <div><strong style={{ color: '#64748B' }}>Statement Period:</strong> {viewItem.statementPeriod}</div>
              <div><strong style={{ color: '#64748B' }}>Matched Items:</strong> {viewItem.matchedTransactions}</div>
              <div><strong style={{ color: '#64748B' }}>Status:</strong> <Badge status={viewItem.status} /></div>
            </div>

            {viewItem.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Imported Statement File: {viewItem.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal: New Reconciliation */}
      {createModal && (
        <Modal
          isOpen={true}
          onClose={() => setCreateModal(false)}
          title="Initiate Bank Reconciliation"
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Reconciliation ID">
                <Input value={form.reconciliationId} disabled />
              </FormField>
              <FormField label="Currency">
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </FormField>
            </div>

            <FormField label="Bank Account">
              <select
                value={form.bankAccount}
                onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
              >
                {BANK_ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </FormField>

            <FormField label="Statement Period">
              <Input
                value={form.statementPeriod}
                onChange={(e) => setForm({ ...form, statementPeriod: e.target.value })}
                placeholder="e.g. Jul 2026"
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Opening Balance">
                <Input
                  type="number"
                  value={form.openingBalance}
                  onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                  placeholder="12,450,000"
                  required
                />
              </FormField>
              <FormField label="Closing Balance">
                <Input
                  type="number"
                  value={form.closingBalance}
                  onChange={(e) => setForm({ ...form, closingBalance: e.target.value })}
                  placeholder="10,780,000"
                  required
                />
              </FormField>
            </div>

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
                Start Reconciliation
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Match Transactions */}
      {matchModal && (
        <Modal
          isOpen={true}
          onClose={() => setMatchModal(null)}
          title={`Match Transactions: ${matchModal.bankAccount}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EFF6FF', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.813rem', color: '#1E40AF' }}>
                Reconciling <strong>{matchModal.statementPeriod}</strong> – Variance: <strong>{fmt(matchModal.variance, matchModal.currency)}</strong>
              </span>
              <button
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#1D4ED8' }}
                onClick={() => {
                  setUnmatchedLedger([]);
                  setData(data.map(d => d.id === matchModal.id ? { ...d, matchedTransactions: '128 / 128', variance: 0 } : d));
                  showToast('All open transactions auto-matched successfully', 'success');
                }}
              >
                <FiRefreshCw size={12} /> Auto-Match All
              </button>
            </div>

            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#334155' }}>
              Unmatched Transactions in Ledger ({unmatchedLedger.length})
            </div>

            {unmatchedLedger.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#16A34A', fontWeight: 600, fontSize: '0.813rem' }}>
                ✓ All transactions matched! Zero ledger-statement variance.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {unmatchedLedger.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.813rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.desc}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.date}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 600 }}>{fmt(item.amount, matchModal.currency)}</span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', height: '28px', fontSize: '0.75rem' }}
                        onClick={() => {
                          setUnmatchedLedger(unmatchedLedger.filter(u => u.id !== item.id));
                          showToast(`Matched: ${item.desc}`, 'success');
                        }}
                      >
                        Match
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setMatchModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
