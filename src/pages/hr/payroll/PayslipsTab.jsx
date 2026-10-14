import { useState, useEffect } from 'react';
import { FiPlus, FiEye, FiDownload, FiMail, FiFilter, FiArrowLeft } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Select } from '../../../components/ui/FormField';
import { payrollService } from '../../../services/hr.service';
import { apiError } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { useServerList } from '../useServerList';
import EmployeePicker from '../EmployeePicker';
import { fieldErrorsOf, saveBlob, blobErrorMessage, fullName } from '../hrUtils';
import { money, koboInWords, periodLabel, MONTHS, exportCsv, fetchAllPages, primaryBtn, ghostBtn } from './payrollUtils';
import { RowMenu, SearchBox, TableSkeleton, LoadError, FormBanner } from './payrollParts';

const YEARS = (() => { const y = new Date().getFullYear(); return [y - 2, y - 1, y, y + 1]; })();

export function PayslipDocument({ payslip }) {
  const earnings = [
    ['Basic salary', payslip.basicSalary], ['Housing allowance', payslip.housingAllowance], ['Transport allowance', payslip.transportAllowance],
    ['Utility allowance', payslip.utilityAllowance], ['Communication allowance', payslip.communicationAllowance], ['Other allowances', payslip.otherAllowances],
  ].filter(([label, v]) => label === 'Basic salary' || v > 0);
  const deductions = [
    ['Tax / PAYE', payslip.paye], ['Employee pension', payslip.pensionDeduction], ['National Housing Fund', payslip.nhfDeduction], ['Other deductions', payslip.otherDeductions],
  ].filter(([, v]) => v > 0);
  const head = { backgroundColor: '#1E3A8A', color: '#fff', padding: '10px 14px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' };
  const row = { display: 'flex', justifyContent: 'space-between', padding: '9px 14px', fontSize: '0.85rem', borderBottom: '1px solid #F1F5F9' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
      <div style={{ border: '1px solid #E2E8F0' }}>
        <div style={head}><span>Salary Structure</span><span>Amount</span></div>
        {earnings.map(([label, v]) => <div key={label} style={row}><span>{label}</span><span>{money(v || 0)}</span></div>)}
        <div style={{ ...row, fontWeight: 700, borderBottom: 'none' }}><span>Gross Salary</span><span>{money(payslip.grossSalary)}</span></div>
      </div>
      <div>
        <div style={{ border: '1px solid #E2E8F0' }}>
          <div style={head}><span>Deductions</span><span>Amount</span></div>
          {deductions.length === 0 && <div style={row}><span>No deductions</span><span>{money(0)}</span></div>}
          {deductions.map(([label, v]) => <div key={label} style={row}><span>{label}</span><span>{money(v)}</span></div>)}
          <div style={{ ...row, fontWeight: 600 }}><span>Total Deduction</span><span>{money(payslip.totalDeductions)}</span></div>
          <div style={{ ...row, fontWeight: 700, borderBottom: 'none', backgroundColor: '#F8FAFC' }}><span>Net Salary</span><span>{money(payslip.netSalary)}</span></div>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: '0.85rem', color: '#334155' }}><strong>Net Salary in Words:</strong> {koboInWords(payslip.netSalary)}</p>
      </div>
    </div>
  );
}

function CreatePayslipDrawer({ onClose, onSaved, showToast }) {
  const now = new Date();
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({ employeeId: '', periodMonth: String(now.getMonth() + 1), periodYear: String(now.getFullYear()) });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setFormError('');
    if (!form.employeeId) { setErrors({ employeeId: 'Choose the employee' }); return; }
    setSaving(true);
    try {
      const res = await payrollService.createPayslip({ employeeId: form.employeeId, periodMonth: Number(form.periodMonth), periodYear: Number(form.periodYear) }, { headers: { 'Idempotency-Key': crypto.randomUUID() } });
      showToast(`Payslip ${res.data?.data?.payslipId} created`, 'success');
      onSaved();
    } catch (err) {
      setErrors(fieldErrorsOf(err));
      setFormError(apiError(err, 'The payslip could not be created'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title="Create Payslip" subtitle="Generate a single payslip outside a payroll run" width="460px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...primaryBtn, flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>{saving ? 'Creating…' : 'Create Payslip'}</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormBanner message={formError} />
        <FormField label="Employee" required error={errors.employeeId}>
          <EmployeePicker value={form.employeeId} selected={employee} params={{ activeOnly: 'true' }} error={!!errors.employeeId}
            onChange={(id, emp) => { setForm((f) => ({ ...f, employeeId: id })); setEmployee(emp); setErrors({}); }} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Month" required><Select value={form.periodMonth} onChange={(e) => setForm((f) => ({ ...f, periodMonth: e.target.value }))} options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} /></FormField>
          <FormField label="Year" required><Select value={form.periodYear} onChange={(e) => setForm((f) => ({ ...f, periodYear: e.target.value }))} options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} /></FormField>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>The employee needs an active salary structure for their grade, and an active PAYE tax definition must exist. One payslip exists per employee per month.</p>
      </div>
    </Drawer>
  );
}

function PayslipDetail({ id, onBack, showToast }) {
  const [state, setState] = useState({ id: null, payslip: null, error: '' });
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let cancelled = false;
    payrollService.getPayslip(id)
      .then((res) => { if (!cancelled) setState({ id, payslip: res.data?.data, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ id, payslip: null, error: apiError(err, 'The payslip could not be loaded') }); });
    return () => { cancelled = true; };
  }, [id]);

  const loaded = state.id === id;
  const payslip = loaded ? state.payslip : null;

  const download = async () => {
    setBusy('download');
    try {
      const res = await payrollService.downloadPayslip(id);
      saveBlob(res.data, `payslip-${payslip.payslipId}.pdf`);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Download failed'), 'error');
    } finally { setBusy(''); }
  };
  const email = async () => {
    setBusy('email');
    try {
      await payrollService.emailPayslip(id);
      showToast('The employee has been told to sign in to view the payslip', 'success');
    } catch (err) {
      showToast(apiError(err, 'The payslip could not be emailed'), 'error');
    } finally { setBusy(''); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><FiArrowLeft size={14} /> Back to Directory</button>
      {state.error ? <LoadError message={state.error} onRetry={() => setState({ id: null, payslip: null, error: '' })} /> : !payslip ? <div style={{ padding: 30, color: '#94A3B8', textAlign: 'center' }}>Loading payslip…</div> : (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A' }}>{fullName(payslip.employeeId)}</h2>
              <div style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>{payslip.jobTitle} | {payslip.level} | {periodLabel(payslip.periodMonth, payslip.periodYear)} | {payslip.payslipId}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={download} disabled={!!busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1 }}><FiDownload size={14} /> {busy === 'download' ? 'Preparing…' : 'Download'}</button>
              <button className="btn btn-secondary" onClick={email} disabled={!!busy} style={ghostBtn}><FiMail size={14} /> {busy === 'email' ? 'Sending…' : 'Email Payslip'}</button>
            </div>
          </div>
          <PayslipDocument payslip={payslip} />
        </div>
      )}
    </div>
  );
}

export default function PayslipsTab({ showToast }) {
  const canCreate = usePermission('hr.payroll.create');
  const list = useServerList(payrollService.listPayslips, { periodMonth: '', periodYear: '' }, { limit: 10 });
  const [viewId, setViewId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const download = async (row) => {
    try {
      const res = await payrollService.downloadPayslip(row._id);
      saveBlob(res.data, `payslip-${row.payslipId}.pdf`);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Download failed'), 'error');
    }
  };
  const email = async (row) => {
    try {
      await payrollService.emailPayslip(row._id);
      showToast('The employee has been told to sign in to view the payslip', 'success');
    } catch (err) {
      showToast(apiError(err, 'The payslip could not be emailed'), 'error');
    }
  };

  const exportAll = async () => {
    try {
      const rows = await fetchAllPages((p) => payrollService.listPayslips({ ...p, ...list.params }));
      exportCsv('payslips.csv', [
        { label: 'Payslip', value: (r) => r.payslipId }, { label: 'Employee ID', value: (r) => r.employeeId?.employeeId }, { label: 'Employee', value: (r) => fullName(r.employeeId) },
        { label: 'Title', value: (r) => r.jobTitle }, { label: 'Level', value: (r) => r.level }, { label: 'Period', value: (r) => periodLabel(r.periodMonth, r.periodYear) },
        { label: 'Gross (NGN)', value: (r) => (r.grossSalary / 100).toFixed(2) }, { label: 'Deductions (NGN)', value: (r) => (r.totalDeductions / 100).toFixed(2) }, { label: 'Net (NGN)', value: (r) => (r.netSalary / 100).toFixed(2) },
      ], rows);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  if (viewId) return <PayslipDetail id={viewId} onBack={() => setViewId(null)} showToast={showToast} />;

  const columns = [
    { key: 'e', label: 'EMPLOYEE ID', render: (_, r) => <span style={{ color: '#475569', fontSize: '0.78rem' }}>{r.employeeId?.employeeId || '—'}</span> },
    { key: 'n', label: 'EMPLOYEE', render: (_, r) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fullName(r.employeeId)}</span> },
    { key: 'jobTitle', label: 'TITLE' },
    { key: 'level', label: 'LEVEL' },
    { key: 'p', label: 'PERIOD', render: (_, r) => periodLabel(r.periodMonth, r.periodYear) },
    { key: 'grossSalary', label: 'GROSS SALARY', render: (v) => money(v) },
    { key: 'totalDeductions', label: 'DEDUCTIONS', render: (v) => money(v) },
    { key: 'netSalary', label: 'NET SALARY', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{money(v)}</span> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View" onClick={() => setViewId(row._id)}><FiEye size={15} /></button>
          <RowMenu options={[{ label: 'Download PDF', icon: FiDownload, onClick: () => download(row) }, { label: 'Email Payslip', icon: FiMail, onClick: () => email(row) }]} />
        </div>
      ),
    },
  ];

  const filterCount = [list.filters.periodMonth, list.filters.periodYear].filter(Boolean).length;

  return (
    <>
      <div className="table-toolbar">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search employee, title, level…" />
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" style={ghostBtn} onClick={() => setFilterOpen(true)}><FiFilter size={14} /> Filter{filterCount ? ` (${filterCount})` : ''}</button>
          <button className="btn btn-secondary" style={ghostBtn} onClick={exportAll}>Export <FiDownload size={14} /></button>
          {canCreate && <button style={primaryBtn} onClick={() => setCreateOpen(true)}><FiPlus size={14} /> Create Payslip</button>}
        </div>
      </div>
      {list.error ? <LoadError message={list.error} onRetry={list.hardReload} /> : list.loading ? <TableSkeleton cols={9} /> : (
        <DataTable columns={columns} data={list.items} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onSelectAll={() => setSelectedIds(selectedIds.length === list.items.length ? [] : list.items.map((r) => r._id))}
          emptyMessage={list.activeSearch || filterCount ? 'No payslips match your search or filter.' : 'No payslips yet. They appear when a payroll run is generated.'} />
      )}
      {list.meta?.totalPages > 1 && <Pagination currentPage={list.page} totalPages={list.meta.totalPages} onPageChange={list.setPage} />}
      {createOpen && <CreatePayslipDrawer showToast={showToast} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); list.reload(); }} />}
      {filterOpen && (
        <Drawer isOpen onClose={() => setFilterOpen(false)} title="Filter payslips" width="360px"
          footer={<button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { list.setFilters({ periodMonth: '', periodYear: '' }); setFilterOpen(false); }}>Clear filters</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Month"><Select value={list.filters.periodMonth} onChange={(e) => list.setFilters({ ...list.filters, periodMonth: e.target.value })} options={[{ value: '', label: 'Any month' }, ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))]} /></FormField>
            <FormField label="Year"><Select value={list.filters.periodYear} onChange={(e) => list.setFilters({ ...list.filters, periodYear: e.target.value })} options={[{ value: '', label: 'Any year' }, ...YEARS.map((y) => ({ value: String(y), label: String(y) }))]} /></FormField>
          </div>
        </Drawer>
      )}
    </>
  );
}
