import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiEdit2, FiCheck, FiX, FiCheckCircle, FiFileText, FiClock
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockBudgets } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

const BUDGET_TYPES = ['All Types', 'CapEx', 'Opex'];
const BUDGET_STATUSES = ['All Statuses', 'Active', 'Pending Approval', 'Closed', 'Draft'];

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

export default function BudgetingForecasting() {
  const [data, setData] = useState(mockBudgets);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const { toast, showToast, hideToast } = useToast();

  // Modals & Drawers
  const [createModal, setCreateModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const emptyForm = {
    budgetId: `PGSL-BUD-0${data.length + 2}`,
    type: 'CapEx',
    project: '',
    period: 'FY 2026',
    currency: 'NGN',
    approvedBudget: '',
    forecastAmount: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2027-06-30',
    description: '',
    doc: ''
  };

  const [form, setForm] = useState(emptyForm);

  const filteredData = data.filter(b => {
    const q = search.toLowerCase();
    const matchesSearch = !q || b.budgetId.toLowerCase().includes(q) || b.project.toLowerCase().includes(q);
    const matchesType = typeFilter === 'All Types' || b.type === typeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || b.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginated = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((b) => b.id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.project || !form.approvedBudget) {
      showToast('Please specify project name and budget amount.', 'error');
      return;
    }
    if (editItem) {
      setData(data.map(d => d.id === editItem.id ? { ...d, ...form } : d));
      showToast('Budget allocation updated successfully', 'success');
      setEditItem(null);
    } else {
      const newBudget = {
        id: Date.now(),
        ...form,
        approvedBudget: Number(form.approvedBudget),
        actualSpend: 0,
        variance: Number(form.approvedBudget),
        status: 'Pending Approval'
      };
      setData([newBudget, ...data]);
      showToast('New budget proposal created for approval', 'success');
      setCreateModal(false);
    }
    setForm(emptyForm);
  };

  const columns = [
    {
      key: 'budgetId',
      label: 'BUDGET CODE',
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
      key: 'project',
      label: 'PROJECT / COST CENTER',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (val) => (
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
          background: val === 'CapEx' ? '#EFF6FF' : '#F5F3FF',
          color: val === 'CapEx' ? '#1D4ED8' : '#7C3AED'
        }}>
          {val}
        </span>
      )
    },
    {
      key: 'approvedBudget',
      label: 'APPROVED BUDGET',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    {
      key: 'actualSpend',
      label: 'ACTUAL SPEND',
      render: (val) => <span>{fmt(val)}</span>
    },
    {
      key: 'variance',
      label: 'VARIANCE',
      render: (val) => (
        <span style={{ fontWeight: 600, color: val >= 0 ? '#16A34A' : '#DC2626' }}>
          {fmt(val)}
        </span>
      )
    },
    { key: 'period', label: 'PERIOD' },
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
          <button className="icon-btn" onClick={() => setViewItem(row)} title="View Budget Details">
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
                icon: <FiEdit2 size={14} />,
                label: 'Edit Allocation',
                onClick: () => { setEditItem(row); setForm(row); }
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Approve Budget',
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Active' } : d));
                  showToast('Budget allocation approved', 'success');
                }
              },
              {
                icon: <FiX size={14} />,
                label: 'Close Budget Period',
                danger: true,
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Closed' } : d));
                  showToast('Budget period closed', 'info');
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
            Budgeting & Forecasting
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            CapEx and OpEx project budgeting, burn rates, and financial variances
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting budget report...', 'info')}
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
            <FiPlus size={14} /> New Budget
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
              placeholder="Search budgets, project code..."
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
          emptyMessage="No budgets found matching query."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: VIEW BUDGET DETAILS ─── */}
      <Drawer
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `${viewItem.budgetId} – ${viewItem.project}` : ''}
        subtitle="Approved budget burn rate and variance breakdown"
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
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Approved</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>{fmt(viewItem.approvedBudget)}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Spent</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D97706', marginTop: '2px' }}>{fmt(viewItem.actualSpend)}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Variance</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16A34A', marginTop: '2px' }}>{fmt(viewItem.variance)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Category Type:</strong> {viewItem.type}</div>
              <div><strong style={{ color: '#64748B' }}>Fiscal Period:</strong> {viewItem.period}</div>
              <div><strong style={{ color: '#64748B' }}>Effective Dates:</strong> {viewItem.startDate} to {viewItem.endDate}</div>
              <div><strong style={{ color: '#64748B' }}>Status:</strong> <Badge status={viewItem.status} /></div>
            </div>

            <div>
              <strong style={{ fontSize: '0.813rem', color: '#64748B', display: 'block', marginBottom: '6px' }}>Proposal Notes</strong>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', fontSize: '0.813rem', color: '#1E293B', lineHeight: 1.5, border: '1px solid #E2E8F0' }}>
                {viewItem.description || 'No description recorded.'}
              </div>
            </div>

            {viewItem.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Proposal Attachment: {viewItem.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Budgets"
        subtitle="Refine by expenditure classification and approval state"
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
          <FormField label="Expenditure Type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
              {BUDGET_TYPES.map((t) => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="btype"
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
              {BUDGET_STATUSES.map((s) => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="bstat"
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

      {/* Modal: New / Edit Budget */}
      {(createModal || editItem) && (
        <Modal
          isOpen={true}
          onClose={() => { setCreateModal(false); setEditItem(null); }}
          title={editItem ? "Edit Budget Allocation" : "Create Budget Allocation Proposal"}
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Budget Code">
                <Input value={form.budgetId} disabled />
              </FormField>
              <FormField label="Type">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  <option value="CapEx">CapEx</option>
                  <option value="Opex">Opex</option>
                </select>
              </FormField>
            </div>

            <FormField label="Project / Cost Center Name">
              <Input
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                placeholder="e.g. Lekki Deep Sea Port Expansion"
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Approved Budget (NGN)">
                <Input
                  type="number"
                  value={form.approvedBudget}
                  onChange={(e) => setForm({ ...form, approvedBudget: e.target.value })}
                  placeholder="3,000,000,000"
                  required
                />
              </FormField>
              <FormField label="Fiscal Period">
                <Input
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="e.g. FY 2026"
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Start Date">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </FormField>
              <FormField label="End Date">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', fontFamily: 'var(--font)' }}
                placeholder="Expenditure scope and justifications..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setCreateModal(false); setEditItem(null); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                {editItem ? "Save Changes" : "Submit Proposal"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
