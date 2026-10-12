import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiEdit2, FiCheck, FiX, FiBook, FiRefreshCw, FiFileText, FiClock, FiUser
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockChartOfAccounts, mockJournalEntries } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

const CATEGORIES = ['All Categories', 'Assets', 'Liabilities', 'Equity', 'Revenue', 'Expenses'];
const ENTITIES = ['All Entities', 'PGSL Parent Company', 'PGSL Offshore Services', 'PGSL Marine Logistics'];

// ─── Row Menu Component ───────────────────────────────────────────────────────
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

// ─── Filter Drawer ────────────────────────────────────────────────────────────
function FilterDrawer({ isOpen, onClose, onApply, tab, catFilter, setCatFilter, entityFilter, setEntityFilter }) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filter General Ledger"
      subtitle="Refine account codes or journal entries by categories and legal entities"
      width="420px"
      footer={(
        <>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={() => { setCatFilter('All Categories'); setEntityFilter('All Entities'); onApply(); onClose(); }}
          >
            Reset
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
            onClick={() => { onApply(); onClose(); }}
          >
            Apply Filters
          </button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {tab === 'chart' ? (
          <FormField label="Account Category">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
              {CATEGORIES.map((cat) => (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cat"
                    checked={catFilter === cat}
                    onChange={() => setCatFilter(cat)}
                    style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </FormField>
        ) : (
          <FormField label="Legal Entity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
              {ENTITIES.map((ent) => (
                <label key={ent} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="ent"
                    checked={entityFilter === ent}
                    onChange={() => setEntityFilter(ent)}
                    style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                  />
                  {ent}
                </label>
              ))}
            </div>
          </FormField>
        )}
      </div>
    </Drawer>
  );
}

export default function GeneralLedger() {
  const [tab, setTab] = useState('chart'); // 'chart' | 'journals'
  const [accounts, setAccounts] = useState(mockChartOfAccounts);
  const [journals, setJournals] = useState(mockJournalEntries);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [catFilter, setCatFilter] = useState('All Categories');
  const [entityFilter, setEntityFilter] = useState('All Entities');

  const { toast, showToast, hideToast } = useToast();

  // Drawers and Modals
  const [viewAcct, setViewAcct] = useState(null);
  const [createAcctModal, setCreateAcctModal] = useState(false);
  const [editAcct, setEditAcct] = useState(null);

  const [viewJE, setViewJE] = useState(null);
  const [createJEModal, setCreateJEModal] = useState(false);
  const [reverseJE, setReverseJE] = useState(null);

  // Forms
  const [acctForm, setAcctForm] = useState({ code: '', name: '', category: 'Asset', parent: '', description: '' });
  const [jeForm, setJeForm] = useState({
    journalId: `JE-26-0${journals.length + 85}`,
    date: new Date().toISOString().slice(0, 10),
    entity: 'PGSL Parent Company',
    description: '',
    project: 'PGSL-26-001 Chevron Wellhead',
    debit: '',
    credit: '',
    memo: '',
    debitAccount: '5100 – Project Costs',
    creditAccount: '1010 – First Bank HQ Operational Account'
  });

  // Filtered logic
  const filteredAccounts = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    const matchesCat = catFilter === 'All Categories' || a.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const filteredJournals = journals.filter(j => {
    const q = search.toLowerCase();
    const matchesSearch = !q || j.journalId.toLowerCase().includes(q) || j.description.toLowerCase().includes(q) || j.entity.toLowerCase().includes(q);
    const matchesEntity = entityFilter === 'All Entities' || j.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const activeList = tab === 'chart' ? filteredAccounts : filteredJournals;
  const totalPages = Math.max(1, Math.ceil(activeList.length / ITEMS_PER_PAGE));
  const paginatedList = activeList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedList.length) setSelectedIds([]);
    else setSelectedIds(paginatedList.map((e) => e.id));
  };

  const handleSaveAcct = (e) => {
    e.preventDefault();
    if (!acctForm.code || !acctForm.name) {
      showToast('Please provide account code and name.', 'error');
      return;
    }
    if (editAcct) {
      setAccounts(accounts.map(a => a.id === editAcct.id ? { ...a, ...acctForm } : a));
      showToast('Account details updated successfully', 'success');
      setEditAcct(null);
    } else {
      const newAcc = { id: Date.now(), ...acctForm, balance: 0, status: 'Active' };
      setAccounts([newAcc, ...accounts]);
      showToast('New account code added to Chart of Accounts', 'success');
      setCreateAcctModal(false);
    }
  };

  const handleSaveJE = (e) => {
    e.preventDefault();
    if (!jeForm.description || !jeForm.debit || !jeForm.credit) {
      showToast('Please provide entry description and debit/credit balances.', 'error');
      return;
    }
    if (Number(jeForm.debit) !== Number(jeForm.credit)) {
      showToast('Debit and Credit amounts must be equal for a balanced entry.', 'error');
      return;
    }
    const newJE = {
      id: Date.now(),
      ...jeForm,
      debit: Number(jeForm.debit),
      credit: Number(jeForm.credit),
      createdBy: 'You (Current User)',
      status: 'Draft'
    };
    setJournals([newJE, ...journals]);
    showToast('Journal Entry created in Draft status', 'success');
    setCreateJEModal(false);
  };

  // Columns for Chart of Accounts
  const accountColumns = [
    {
      key: 'code',
      label: 'ACCOUNT CODE',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewAcct(row)}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'ACCOUNT NAME',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (val) => (
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
          background: val === 'Asset' ? '#EFF6FF' : val === 'Liability' ? '#FEF3C7' : val === 'Equity' ? '#EDE9FE' : '#F1F5F9',
          color: val === 'Asset' ? '#1D4ED8' : val === 'Liability' ? '#D97706' : val === 'Equity' ? '#7C3AED' : '#475569'
        }}>
          {val}
        </span>
      )
    },
    {
      key: 'balance',
      label: 'CURRENT BALANCE',
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
          <button className="icon-btn" onClick={() => setViewAcct(row)} title="View Account Details">
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Details',
                onClick: () => setViewAcct(row)
              },
              {
                icon: <FiEdit2 size={14} />,
                label: 'Edit Account',
                onClick: () => { setEditAcct(row); setAcctForm(row); }
              },
              {
                icon: row.status === 'Active' ? <FiX size={14} /> : <FiCheck size={14} />,
                label: row.status === 'Active' ? 'Deactivate' : 'Activate',
                danger: row.status === 'Active',
                onClick: () => {
                  const next = row.status === 'Active' ? 'Inactive' : 'Active';
                  setAccounts(accounts.map(a => a.id === row.id ? { ...a, status: next } : a));
                  showToast(`Account marked as ${next}`, 'success');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  // Columns for Journal Entries
  const journalColumns = [
    {
      key: 'journalId',
      label: 'JOURNAL ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewJE(row)}
        >
          {val}
        </span>
      )
    },
    { key: 'date', label: 'DATE' },
    { key: 'entity', label: 'LEGAL ENTITY' },
    {
      key: 'description',
      label: 'DESCRIPTION',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    {
      key: 'debit',
      label: 'DEBIT (₦)',
      render: (val) => <span style={{ fontWeight: 600 }}>{fmt(val)}</span>
    },
    {
      key: 'credit',
      label: 'CREDIT (₦)',
      render: (val) => <span style={{ fontWeight: 600 }}>{fmt(val)}</span>
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
          <button className="icon-btn" onClick={() => setViewJE(row)} title="View Journal Entry">
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Entry',
                onClick: () => setViewJE(row)
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Post Entry',
                onClick: () => {
                  setJournals(journals.map(j => j.id === row.id ? { ...j, status: 'Posted' } : j));
                  showToast('Journal Entry posted to General Ledger', 'success');
                }
              },
              {
                icon: <FiRefreshCw size={14} />,
                label: 'Reverse Entry',
                danger: true,
                onClick: () => {
                  setJournals(journals.map(j => j.id === row.id ? { ...j, status: 'Reversed' } : j));
                  showToast('Journal Entry reversed', 'info');
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
            General Ledger
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Manage chart of accounts, double-entry journal vouchers, and audit trails
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting general ledger trial balance...', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (tab === 'chart') {
                setAcctForm({ code: '', name: '', category: 'Asset', parent: '', description: '' });
                setCreateAcctModal(true);
              } else {
                setCreateJEModal(true);
              }
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
            }}
          >
            <FiPlus size={14} /> {tab === 'chart' ? 'New Account' : 'New Journal Entry'}
          </button>
        </div>
      </div>

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '2px' }}>
        <button
          onClick={() => { setTab('chart'); setCurrentPage(1); setSelectedIds([]); }}
          style={{
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: tab === 'chart' ? '2px solid #1D4ED8' : '2px solid transparent',
            color: tab === 'chart' ? '#1D4ED8' : '#64748B',
            fontFamily: 'var(--font)'
          }}
        >
          Chart of Accounts ({accounts.length})
        </button>
        <button
          onClick={() => { setTab('journals'); setCurrentPage(1); setSelectedIds([]); }}
          style={{
            padding: '8px 18px',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: tab === 'journals' ? '2px solid #1D4ED8' : '2px solid transparent',
            color: tab === 'journals' ? '#1D4ED8' : '#64748B',
            fontFamily: 'var(--font)'
          }}
        >
          Journal Entries ({journals.length})
        </button>
      </div>

      {/* Table Container Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="table-toolbar">
          {/* Search Box */}
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={tab === 'chart' ? "Search accounts, code, category..." : "Search journals, ID, description..."}
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          {/* Action Toolbar */}
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
              onClick={() => showToast('Exporting active dataset...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={tab === 'chart' ? accountColumns : journalColumns}
          data={paginatedList}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage={tab === 'chart' ? "No accounts found matching search." : "No journal entries found."}
        />

        {/* Pagination */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: VIEW ACCOUNT DETAILS ─── */}
      <Drawer
        isOpen={!!viewAcct}
        onClose={() => setViewAcct(null)}
        title={viewAcct ? `${viewAcct.code} – ${viewAcct.name}` : ''}
        subtitle="Chart of Accounts general ledger balance breakdown"
        width="460px"
        footer={(
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={() => setViewAcct(null)}
          >
            Close
          </button>
        )}
      >
        {viewAcct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Account Balance
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewAcct.balance)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewAcct.status} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Account Code:</strong> {viewAcct.code}</div>
              <div><strong style={{ color: '#64748B' }}>Category:</strong> {viewAcct.category}</div>
              <div><strong style={{ color: '#64748B' }}>Parent Head:</strong> {viewAcct.parent || 'Main Group'}</div>
            </div>

            <div>
              <strong style={{ fontSize: '0.813rem', color: '#64748B', display: 'block', marginBottom: '6px' }}>Description</strong>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', fontSize: '0.813rem', color: '#1E293B', lineHeight: 1.5, border: '1px solid #E2E8F0' }}>
                {viewAcct.description || 'No additional description provided.'}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── SLIDE-OVER DRAWER: VIEW JOURNAL ENTRY ─── */}
      <Drawer
        isOpen={!!viewJE}
        onClose={() => setViewJE(null)}
        title={viewJE ? `Journal Entry: ${viewJE.journalId}` : ''}
        subtitle="Double-entry audit voucher breakdown"
        width="500px"
        footer={(
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
            onClick={() => setViewJE(null)}
          >
            Close
          </button>
        )}
      >
        {viewJE && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Debit</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1D4ED8', marginTop: '2px' }}>{fmt(viewJE.debit)}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Credit</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16A34A', marginTop: '2px' }}>{fmt(viewJE.credit)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Date:</strong> {viewJE.date}</div>
              <div><strong style={{ color: '#64748B' }}>Legal Entity:</strong> {viewJE.entity}</div>
              <div><strong style={{ color: '#64748B' }}>Chargeable Project:</strong> {viewJE.project || 'N/A'}</div>
              <div><strong style={{ color: '#64748B' }}>Created By:</strong> {viewJE.createdBy}</div>
              <div><strong style={{ color: '#64748B' }}>Status:</strong> <Badge status={viewJE.status} /></div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Accounting Line Items</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#1D4ED8' }}>Dr: {viewJE.debitAccount || 'Project Costs (5100)'}</span>
                <span style={{ fontWeight: 600 }}>{fmt(viewJE.debit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', padding: '6px 0' }}>
                <span style={{ color: '#16A34A' }}>Cr: {viewJE.creditAccount || 'Bank HQ (1010)'}</span>
                <span style={{ fontWeight: 600 }}>{fmt(viewJE.credit)}</span>
              </div>
            </div>

            {viewJE.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Supporting Voucher: {viewJE.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={() => {}}
        tab={tab}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        entityFilter={entityFilter}
        setEntityFilter={setEntityFilter}
      />

      {/* Modal: New / Edit Account */}
      {(createAcctModal || editAcct) && (
        <Modal
          isOpen={true}
          onClose={() => { setCreateAcctModal(false); setEditAcct(null); }}
          title={editAcct ? "Edit General Ledger Account" : "Add Account to Chart of Accounts"}
        >
          <form onSubmit={handleSaveAcct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Account Code">
                <Input
                  value={acctForm.code}
                  onChange={(e) => setAcctForm({ ...acctForm, code: e.target.value })}
                  placeholder="e.g. 5450"
                  required
                />
              </FormField>
              <FormField label="Category">
                <select
                  value={acctForm.category}
                  onChange={(e) => setAcctForm({ ...acctForm, category: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  {CATEGORIES.filter(c => c !== 'All Categories').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Account Name">
              <Input
                value={acctForm.name}
                onChange={(e) => setAcctForm({ ...acctForm, name: e.target.value })}
                placeholder="e.g. Offshore Vessel Charter Expense"
                required
              />
            </FormField>

            <FormField label="Parent Group / Classification (Optional)">
              <Input
                value={acctForm.parent}
                onChange={(e) => setAcctForm({ ...acctForm, parent: e.target.value })}
                placeholder="e.g. 5000"
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={acctForm.description}
                onChange={(e) => setAcctForm({ ...acctForm, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', fontFamily: 'var(--font)' }}
                placeholder="Specify the accounting purpose of this code..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setCreateAcctModal(false); setEditAcct(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                {editAcct ? "Save Changes" : "Create Account"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Create Journal Entry */}
      {createJEModal && (
        <Modal
          isOpen={true}
          onClose={() => setCreateJEModal(false)}
          title="Create Double-Entry Journal Voucher"
        >
          <form onSubmit={handleSaveJE} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Journal ID">
                <Input value={jeForm.journalId} disabled />
              </FormField>
              <FormField label="Posting Date">
                <Input
                  type="date"
                  value={jeForm.date}
                  onChange={(e) => setJeForm({ ...jeForm, date: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Legal Entity">
                <select
                  value={jeForm.entity}
                  onChange={(e) => setJeForm({ ...jeForm, entity: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  {ENTITIES.filter(e => e !== 'All Entities').map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </FormField>
              <FormField label="Chargeable Project">
                <Input
                  value={jeForm.project}
                  onChange={(e) => setJeForm({ ...jeForm, project: e.target.value })}
                  placeholder="e.g. Chevron Wellhead"
                />
              </FormField>
            </div>

            <FormField label="Narration / Description">
              <Input
                value={jeForm.description}
                onChange={(e) => setJeForm({ ...jeForm, description: e.target.value })}
                placeholder="e.g. Direct site mobilization payment"
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Debit Amount (NGN)">
                <Input
                  type="number"
                  value={jeForm.debit}
                  onChange={(e) => setJeForm({ ...jeForm, debit: e.target.value })}
                  placeholder="5,000,000"
                  required
                />
              </FormField>
              <FormField label="Credit Amount (NGN)">
                <Input
                  type="number"
                  value={jeForm.credit}
                  onChange={(e) => setJeForm({ ...jeForm, credit: e.target.value })}
                  placeholder="5,000,000"
                  required
                />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateJEModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                Save Draft Entry
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
