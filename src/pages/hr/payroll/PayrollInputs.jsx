import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiPlus, FiEye, FiMoreVertical, FiEdit2, FiCopy,
  FiCheckCircle, FiXCircle, FiX, FiAlertCircle, FiDollarSign
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { Input, FormField, Select, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { useKobo } from '../../../hooks/useKobo';
import {
  fetchSalaryStructures, createSalaryStructure, updateSalaryStructure,
  toggleStructureStatus, duplicateStructure,
  fetchTaxDefinitions, createTaxDefinition, updateTaxDefinition,
  fetchPayslips, fetchPayrollRuns, createPayrollRun, approvePayrollRun, rejectPayrollRun,
  selectStructures, selectStructuresMeta, selectStructuresLoading,
  selectTaxDefs, selectTaxDefsLoading,
  selectPayslips, selectPayslipsMeta, selectPayslipsLoading,
  selectRuns, selectRunsMeta, selectRunsLoading,
  selectPayrollError, clearPayrollError,
} from '../../../store/hr/payrollSlice';

const ITEMS_PER_PAGE = 10;

function RowMenu({ options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!options?.length) return null;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#fff',
          borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
          padding: '6px 0', zIndex: 50, width: 220 }}>
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <div key={i} onClick={() => { opt.onClick(); setOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.813rem', color: opt.color || '#334155',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Icon size={13} /> {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SkeletonRow({ cols = 7 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: i === 1 ? '75%' : '55%' }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Salary Structure Modal ───────────────────────────────────────────────────
function StructureModal({ isOpen, onClose, editItem, onSaved }) {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const { nairaToKobo, koboToNaira } = useKobo();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(editItem ? {
        jobTitle: editItem.jobTitle || '',
        level: editItem.level || '',
        basicSalary: koboToNaira(editItem.basicSalary),
        housingAllowance: koboToNaira(editItem.housingAllowance),
        transportAllowance: koboToNaira(editItem.transportAllowance),
        utilityAllowance: koboToNaira(editItem.utilityAllowance),
        communicationAllowance: koboToNaira(editItem.communicationAllowance),
        otherAllowances: koboToNaira(editItem.otherAllowances),
        pensionDeduction: koboToNaira(editItem.pensionDeduction),
        otherDeductions: koboToNaira(editItem.otherDeductions),
      } : { jobTitle: '', level: '', basicSalary: '', housingAllowance: '', transportAllowance: '',
        utilityAllowance: '', communicationAllowance: '', otherAllowances: '', pensionDeduction: '', otherDeductions: '' });
    }
  }, [isOpen, editItem]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.jobTitle || !form.level || !form.basicSalary) {
      addToast('Job title, level, and basic salary are required', 'error'); return;
    }
    setSaving(true);
    const payload = {
      jobTitle: form.jobTitle, level: form.level,
      basicSalary: nairaToKobo(parseFloat(form.basicSalary) || 0),
      housingAllowance: nairaToKobo(parseFloat(form.housingAllowance) || 0),
      transportAllowance: nairaToKobo(parseFloat(form.transportAllowance) || 0),
      utilityAllowance: nairaToKobo(parseFloat(form.utilityAllowance) || 0),
      communicationAllowance: nairaToKobo(parseFloat(form.communicationAllowance) || 0),
      otherAllowances: nairaToKobo(parseFloat(form.otherAllowances) || 0),
      pensionDeduction: nairaToKobo(parseFloat(form.pensionDeduction) || 0),
      otherDeductions: nairaToKobo(parseFloat(form.otherDeductions) || 0),
    };
    try {
      if (editItem?._id) {
        await dispatch(updateSalaryStructure({ id: editItem._id, data: payload })).unwrap();
        addToast('Salary structure updated', 'success');
      } else {
        await dispatch(createSalaryStructure(payload)).unwrap();
        addToast('Salary structure created', 'success');
      }
      onSaved();
    } catch (err) {
      addToast(err?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const fields = [
    ['JOB TITLE *', 'jobTitle', 'text'], ['LEVEL *', 'level', 'text'],
    ['BASIC SALARY (₦) *', 'basicSalary', 'number'], ['HOUSING ALLOWANCE (₦)', 'housingAllowance', 'number'],
    ['TRANSPORT ALLOWANCE (₦)', 'transportAllowance', 'number'], ['UTILITY ALLOWANCE (₦)', 'utilityAllowance', 'number'],
    ['COMMUNICATION ALLOWANCE (₦)', 'communicationAllowance', 'number'], ['OTHER ALLOWANCES (₦)', 'otherAllowances', 'number'],
    ['PENSION DEDUCTION (₦)', 'pensionDeduction', 'number'], ['OTHER DEDUCTIONS (₦)', 'otherDeductions', 'number'],
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, width: 700, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>
            {editItem?._id ? 'Edit Salary Structure' : 'Create Salary Structure'}
          </h2>
          <button className="icon-btn" onClick={onClose}><FiX size={20} /></button>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {fields.map(([label, key, type]) => (
            <FormField key={key} label={label}>
              <Input type={type} value={form[key] || ''} onChange={(e) => set(key, e.target.value)} />
            </FormField>
          ))}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editItem?._id ? 'Save Changes' : 'Create Structure')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Generate Payroll Run Modal ───────────────────────────────────────────────
function GenerateRunModal({ isOpen, onClose, onGenerated }) {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ name: '', year: now.getFullYear(), periodMonth: now.getMonth() + 1, employeeGroup: 'all' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const handleGenerate = async () => {
    if (!form.name) { addToast('Payroll run name is required', 'error'); return; }
    setSaving(true);
    try {
      const res = await dispatch(createPayrollRun({
        name: form.name,
        year: parseInt(form.year),
        periodMonth: parseInt(form.periodMonth),
        employeeGroup: form.employeeGroup,
      })).unwrap();
      addToast(`Payroll run generated — ${res.employeeCount} employees processed`, 'success');
      onGenerated();
    } catch (err) {
      addToast(err?.message || 'Failed to generate payroll run', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Payroll Run" width="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="PAYROLL RUN NAME *">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={`${MONTHS[parseInt(form.periodMonth)-1]} ${form.year} Monthly Payroll`} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="YEAR">
            <Input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} />
          </FormField>
          <FormField label="MONTH">
            <Select value={String(form.periodMonth)}
              options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              onChange={(v) => set('periodMonth', v)} />
          </FormField>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '8px 20px' }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Generating…' : 'Generate Payroll'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PayrollInputs() {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const { koboToNaira } = useKobo();

  const structures = useSelector(selectStructures);
  const structuresMeta = useSelector(selectStructuresMeta);
  const structuresLoading = useSelector(selectStructuresLoading);
  const taxDefs = useSelector(selectTaxDefs);
  const taxDefsLoading = useSelector(selectTaxDefsLoading);
  const payslips = useSelector(selectPayslips);
  const payslipsMeta = useSelector(selectPayslipsMeta);
  const payslipsLoading = useSelector(selectPayslipsLoading);
  const runs = useSelector(selectRuns);
  const runsMeta = useSelector(selectRunsMeta);
  const runsLoading = useSelector(selectRunsLoading);
  const apiError = useSelector(selectPayrollError);

  const [activeTab, setActiveTab] = useState('structure');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Structure modal
  const [structureModal, setStructureModal] = useState(null); // null | {} | {_id,...}
  // Run modals
  const [generateRunOpen, setGenerateRunOpen] = useState(false);
  const [rejectRunModal, setRejectRunModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const debounceRef = useRef(null);

  // Load data when tab changes
  useEffect(() => {
    setPage(1);
    if (activeTab === 'structure') dispatch(fetchSalaryStructures({ page: 1, limit: ITEMS_PER_PAGE }));
    if (activeTab === 'tax') dispatch(fetchTaxDefinitions());
    if (activeTab === 'payslips') dispatch(fetchPayslips({ page: 1, limit: ITEMS_PER_PAGE }));
    if (activeTab === 'runs') dispatch(fetchPayrollRuns({ page: 1, limit: ITEMS_PER_PAGE }));
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab === 'structure') dispatch(fetchSalaryStructures({ page, limit: ITEMS_PER_PAGE }));
    if (activeTab === 'payslips') dispatch(fetchPayslips({ page, limit: ITEMS_PER_PAGE }));
    if (activeTab === 'runs') dispatch(fetchPayrollRuns({ page, limit: ITEMS_PER_PAGE }));
  }, [page]); // eslint-disable-line

  const handleDuplicate = async (item) => {
    try {
      await dispatch(duplicateStructure(item._id)).unwrap();
      addToast('Structure duplicated', 'success');
    } catch (err) {
      addToast(err?.message || 'Failed to duplicate', 'error');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    try {
      await dispatch(toggleStructureStatus({ id: item._id, status: newStatus })).unwrap();
      addToast(`Structure ${newStatus === 'active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      addToast(err?.message || 'Failed', 'error');
    }
  };

  const handleApproveRun = async (id) => {
    try {
      await dispatch(approvePayrollRun(id)).unwrap();
      addToast('Payroll run approved', 'success');
    } catch (err) {
      addToast(err?.message || 'Failed to approve', 'error');
    }
  };

  const handleRejectRun = async () => {
    try {
      await dispatch(rejectPayrollRun({ id: rejectRunModal._id, reason: rejectReason })).unwrap();
      addToast('Payroll run rejected', 'success');
      setRejectRunModal(null);
      setRejectReason('');
    } catch (err) {
      addToast(err?.message || 'Failed to reject', 'error');
    }
  };

  const fmt = (kobo) => `₦${koboToNaira(kobo).toLocaleString()}`;
  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ─── Columns ────────────────────────────────────────────────────────────────
  const structureColumns = [
    { key: 'structureId', label: 'ID', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{v}</span> },
    { key: 'jobTitle', label: 'JOB TITLE', render: (v) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{v}</span> },
    { key: 'level', label: 'LEVEL' },
    { key: 'basicSalary', label: 'BASIC SALARY', render: fmt },
    {
      key: 'grossSalary', label: 'GROSS SALARY',
      render: (_, row) => fmt((row.basicSalary||0)+(row.housingAllowance||0)+(row.transportAllowance||0)+(row.utilityAllowance||0)+(row.communicationAllowance||0)+(row.otherAllowances||0))
    },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v === 'active' ? 'Active' : 'Inactive'} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" onClick={() => setStructureModal(row)}><FiEye size={15} /></button>
          <RowMenu options={[
            { label: 'Edit', icon: FiEdit2, onClick: () => setStructureModal(row) },
            { label: 'Duplicate', icon: FiCopy, onClick: () => handleDuplicate(row) },
            { label: row.status === 'active' ? 'Deactivate' : 'Activate',
              icon: row.status === 'active' ? FiXCircle : FiCheckCircle,
              color: row.status === 'active' ? '#DC2626' : '#10B981',
              onClick: () => handleToggleStatus(row) },
          ]} />
        </div>
      )
    }
  ];

  const taxColumns = [
    { key: 'taxType', label: 'TAX TYPE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'isProgressive', label: 'TYPE', render: (v) => v ? 'Progressive' : 'Flat' },
    { key: 'flatPercentage', label: 'FLAT RATE', render: (v, row) => row.isProgressive ? `${row.brackets?.length || 0} brackets` : `${v}%` },
    { key: 'effectiveDate', label: 'EFFECTIVE DATE', render: (v) => v?.slice(0, 10) || '—' },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={v === 'active' ? 'Active' : 'Inactive'} /> },
  ];

  const payslipColumns = [
    { key: 'payslipId', label: 'PAYSLIP ID', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{v}</span> },
    { key: 'employeeId', label: 'EMPLOYEE', render: (v) => <span style={{ fontWeight: 500 }}>{v?.fullName || v}</span> },
    { key: 'periodMonth', label: 'PERIOD', render: (v, row) => `${MONTHS_SHORT[(v||1)-1]} ${row.periodYear}` },
    { key: 'grossSalary', label: 'GROSS', render: fmt },
    { key: 'totalDeductions', label: 'DEDUCTIONS', render: fmt },
    { key: 'netSalary', label: 'NET PAY', render: (v) => <span style={{ fontWeight: 600, color: '#065F46' }}>{fmt(v)}</span> },
  ];

  const runColumns = [
    { key: 'runId', label: 'RUN ID', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{v}</span> },
    { key: 'name', label: 'NAME', render: (v) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{v}</span> },
    { key: 'periodMonth', label: 'PERIOD', render: (v, row) => `${MONTHS_SHORT[(v||1)-1]} ${row.year}` },
    { key: 'employeeCount', label: 'EMPLOYEES' },
    { key: 'totalAmount', label: 'TOTAL', render: fmt },
    { key: 'status', label: 'STATUS', render: (v) => {
      const styles = { pending_approval: { bg: '#FEF3C7', color: '#92400E' }, paid: { bg: '#D1FAE5', color: '#065F46' }, rejected: { bg: '#FEF2F2', color: '#991B1B' } };
      const s = styles[v] || { bg: '#F1F5F9', color: '#64748B' };
      return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 500, backgroundColor: s.bg, color: s.color }}>{v?.replace('_', ' ')}</span>;
    }},
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => row.status === 'pending_approval' ? (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => handleApproveRun(row._id)}
            style={{ padding: '5px 12px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            Approve
          </button>
          <button onClick={() => { setRejectRunModal(row); setRejectReason(''); }}
            style={{ padding: '5px 12px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
            Reject
          </button>
        </div>
      ) : null
    }
  ];

  const tabs = [
    { key: 'structure', label: 'Payroll Structure' },
    { key: 'tax', label: 'Tax Definitions' },
    { key: 'payslips', label: 'Payslips' },
    { key: 'runs', label: 'Payroll Runs' },
  ];

  const currentMeta = activeTab === 'structure' ? structuresMeta : activeTab === 'payslips' ? payslipsMeta : activeTab === 'runs' ? runsMeta : null;
  const isLoading = activeTab === 'structure' ? structuresLoading : activeTab === 'tax' ? taxDefsLoading : activeTab === 'payslips' ? payslipsLoading : runsLoading;
  const currentData = activeTab === 'structure' ? structures : activeTab === 'tax' ? taxDefs : activeTab === 'payslips' ? payslips : runs;
  const currentCols = activeTab === 'structure' ? structureColumns : activeTab === 'tax' ? taxColumns : activeTab === 'payslips' ? payslipColumns : runColumns;

  // Derive summary stats from runs
  const pendingRuns = runs.filter(r => r.status === 'pending_approval').length;
  const paidRuns = runs.filter(r => r.status === 'paid').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Payroll Inputs</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage salary structures, tax rules, payslips, and payroll processing
          </p>
        </div>
      </div>

      {apiError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem' }}>
          <FiAlertCircle size={16} /> {apiError.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { title: 'SALARY STRUCTURES', value: structuresMeta?.total ?? structures.length, subtitle: 'Defined salary structures', color: '#1D4ED8', bg: '#EFF6FF' },
          { title: 'TAX DEFINITIONS', value: taxDefs.length, subtitle: 'Configured tax rules', color: '#8B5CF6', bg: '#EDE9FE' },
          { title: 'PENDING APPROVAL', value: pendingRuns, subtitle: 'Payroll runs awaiting approval', color: '#F59E0B', bg: '#FEF3C7' },
          { title: 'PAID RUNS', value: paidRuns, subtitle: 'Successfully paid payroll runs', color: '#10B981', bg: '#D1FAE5' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiDollarSign size={13} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: 24 }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ background: 'none', border: 'none', padding: '12px 0', cursor: 'pointer',
              borderBottom: activeTab === key ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === key ? '#1D4ED8' : '#64748B',
              fontWeight: activeTab === key ? 600 : 400, fontSize: '0.9rem' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'structure' ? 'job title or level' : activeTab === 'tax' ? 'tax type' : activeTab === 'payslips' ? 'employee or payslip ID' : 'run name'}...`}
              style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            {activeTab === 'structure' && (
              <button className="btn btn-primary" onClick={() => setStructureModal({})}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
                <FiPlus size={14} /> Create Salary Structure
              </button>
            )}
            {activeTab === 'runs' && (
              <button className="btn btn-primary" onClick={() => setGenerateRunOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                  backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
                <FiPlus size={14} /> Generate Payroll
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={currentCols.length} />)}</tbody>
          </table>
        ) : (
          <DataTable columns={currentCols} data={currentData} keyField="_id" emptyMessage="No records found." />
        )}

        {currentMeta && currentMeta.totalPages > 1 && (
          <Pagination currentPage={page} totalPages={currentMeta.totalPages} onPageChange={setPage} />
        )}
      </div>

      <StructureModal isOpen={!!structureModal} onClose={() => setStructureModal(null)}
        editItem={structureModal?._id ? structureModal : null}
        onSaved={() => { setStructureModal(null); dispatch(fetchSalaryStructures({ page, limit: ITEMS_PER_PAGE })); }} />

      <GenerateRunModal isOpen={generateRunOpen} onClose={() => setGenerateRunOpen(false)}
        onGenerated={() => { setGenerateRunOpen(false); dispatch(fetchPayrollRuns({ page: 1, limit: ITEMS_PER_PAGE })); }} />

      {/* Reject Run Modal */}
      <Modal isOpen={!!rejectRunModal} onClose={() => setRejectRunModal(null)} title="Reject Payroll Run" width="440px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
            Reject <strong>{rejectRunModal?.name}</strong>?
          </p>
          <FormField label="REASON (OPTIONAL)">
            <Textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-outline" onClick={() => setRejectRunModal(null)} style={{ padding: '8px 20px' }}>Cancel</button>
            <button onClick={handleRejectRun}
              style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              Reject Run
            </button>
          </div>
        </div>
      </Modal>

      <Toast />
    </div>
  );
}
