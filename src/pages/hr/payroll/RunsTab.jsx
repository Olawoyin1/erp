import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiEye, FiCheckCircle, FiXCircle, FiDownload, FiFilter } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../../../components/ui/FormField';
import { createPayrollRun, approvePayrollRun, rejectPayrollRun } from '../../../store/hr/payrollSlice';
import { payrollService, employeeService } from '../../../services/hr.service';
import { selectCurrentUser } from '../../../store/authSlice';
import { apiError, formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { useServerList } from '../useServerList';
import { fieldErrorsOf, fullName } from '../hrUtils';
import { money, periodLabel, MONTHS, exportCsv, fetchAllPages, idOf, primaryBtn, ghostBtn } from './payrollUtils';
import { RowMenu, SearchBox, TableSkeleton, LoadError, FormBanner, StatusPill } from './payrollParts';

const YEARS = (() => { const y = new Date().getFullYear(); return [y - 2, y - 1, y, y + 1]; })();
const STATUS_FILTERS = [{ value: '', label: 'All statuses' }, { value: 'pending_approval', label: 'Pending Approval' }, { value: 'paid', label: 'Paid' }, { value: 'rejected', label: 'Rejected' }];

const personName = (u) => (u && typeof u === 'object' ? [u.firstName, u.lastName].filter(Boolean).join(' ') : '') || '—';

function GenerateModal({ onClose, onGenerated, showToast }) {
  const dispatch = useDispatch();
  const now = new Date();
  const [form, setForm] = useState({ name: '', periodMonth: String(now.getMonth() + 1), year: String(now.getFullYear()), departmentId: '' });
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    employeeService.lookups()
      .then((res) => { if (!cancelled) setDepartments(res.data?.data?.departments || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const defaultName = `${MONTHS[Number(form.periodMonth) - 1]} ${form.year} Payroll`;

  const submit = async () => {
    setFormError('');
    const name = form.name.trim() || defaultName;
    setSaving(true);
    const result = await dispatch(createPayrollRun({
      name, year: Number(form.year), periodMonth: Number(form.periodMonth), employeeGroup: 'all',
      ...(form.departmentId ? { departmentId: form.departmentId } : {}),
    }));
    setSaving(false);
    if (createPayrollRun.fulfilled.match(result)) {
      const r = result.payload;
      showToast(`${r.runId} generated for ${r.employeeCount} employee(s)${r.skippedEmployeeIds?.length ? `; ${r.skippedEmployeeIds.length} skipped` : ''}`, r.skippedEmployeeIds?.length ? 'info' : 'success');
      onGenerated();
      return;
    }
    setErrors(fieldErrorsOf(result.payload?.details));
    setFormError(result.payload?.message || 'The payroll could not be generated');
  };

  return (
    <Modal isOpen onClose={onClose} title="Generate Payroll" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormBanner message={formError} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Payroll name" required error={errors.name}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={defaultName} />
          </FormField>
          <FormField label="Payroll period" required error={errors.periodMonth}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
              <Select value={form.periodMonth} onChange={(e) => set('periodMonth', e.target.value)} options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} />
              <Select value={form.year} onChange={(e) => set('year', e.target.value)} options={YEARS.map((y) => ({ value: String(y), label: String(y) }))} />
            </div>
          </FormField>
          <FormField label="Payroll type"><Input value="Monthly" readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
          <FormField label="Department" error={errors.departmentId}>
            <Select value={form.departmentId} searchable onChange={(e) => set('departmentId', e.target.value)}
              options={[{ value: '', label: 'All Departments' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]} />
          </FormField>
          <FormField label="Employee group"><Input value="All Employees" readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>Employees on probation, active or on leave are paid. An active PAYE tax definition is required. You cannot approve a run you generated; someone else with approval rights must.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>{saving ? 'Generating…' : 'Generate Payroll'}</button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ run, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    const message = await onConfirm(run, reason.trim());
    setSaving(false);
    if (message) setError(message);
  };
  return (
    <Modal isOpen onClose={onClose} title="Reject Payroll Run" maxWidth="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155' }}>Reject <strong>{run.name}</strong> ({run.runId})? Its payslips are released so the period can be generated again.</p>
        <FormField label="Reason (optional)" error={error}><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Department budget not yet confirmed for this period" /></FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Back</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? 'Rejecting…' : 'Reject Run'}</button>
        </div>
      </div>
    </Modal>
  );
}

function RunDrawer({ id, onClose, access, onApprove, onReject, busy }) {
  const [state, setState] = useState({ id: null, run: null, error: '' });
  useEffect(() => {
    let cancelled = false;
    payrollService.getRun(id)
      .then((res) => { if (!cancelled) setState({ id, run: res.data?.data, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ id, run: null, error: apiError(err, 'The payroll run could not be loaded') }); });
    return () => { cancelled = true; };
  }, [id, busy]);
  const run = state.id === id ? state.run : null;
  const totals = run?.totals || {};
  const rows = run ? [
    ['Gross pay', totals.gross], ['PAYE', totals.paye], ['Pension (employee)', totals.pension], ['National Housing Fund', totals.nhf], ['Other deductions', totals.otherDeductions], ['Net pay', totals.net],
  ] : [];
  const employer = run ? [['Employer pension', totals.employerPension], ['Employer NSITF', totals.employerNsitf], ['Employer ITF', totals.employerItf]] : [];
  const decision = run ? access.decision(run) : null;
  return (
    <Drawer isOpen onClose={onClose} title={run?.name || 'Payroll run'} subtitle={run ? `${run.runId} • ${periodLabel(run.periodMonth, run.year)}` : ''} width="520px">
      {state.error ? <LoadError message={state.error} onRetry={onClose} /> : !run ? <div style={{ padding: 24, color: '#94A3B8' }}>Loading…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>Status: <StatusPill status={run.status} /></div>
            {run.status === 'pending_approval' && access.canApprove && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={!decision.ok || busy} title={decision.reason} onClick={() => onApprove(run)} style={{ ...primaryBtn, backgroundColor: decision.ok ? '#059669' : '#CBD5E1', cursor: decision.ok ? 'pointer' : 'not-allowed' }}><FiCheckCircle size={14} /> Approve</button>
                <button disabled={busy} onClick={() => onReject(run)} style={{ ...primaryBtn, backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}><FiXCircle size={14} /> Reject</button>
              </div>
            )}
          </div>
          {run.status === 'pending_approval' && access.canApprove && !decision.ok && <div style={{ fontSize: '0.78rem', color: '#92400E' }}>{decision.reason}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
            {[
              ['PERIOD', periodLabel(run.periodMonth, run.year)], ['DEPARTMENT', run.departmentId?.name || 'All Departments'],
              ['EMPLOYEES PAID', run.employeeCount], ['TOTAL NET AMOUNT', money(run.totalAmount)],
              ['GENERATED BY', personName(run.generatedBy)], ['APPROVED BY', run.approvedBy ? personName(run.approvedBy) : '—'],
              ['GENERATED ON', formatDate(run.createdAt)], ['STATUS CHANGED', formatDate(run.updatedAt)],
            ].map(([label, value]) => (
              <div key={label}><div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>{label}</div><div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#0F172A' }}>{value}</div></div>
            ))}
          </div>
          {run.rejectionReason && <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.82rem' }}>Rejected: {run.rejectionReason}</div>}
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
            {rows.map(([label, v], i) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < rows.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: '0.85rem', fontWeight: label === 'Net pay' ? 700 : 400 }}><span>{label}</span><span>{money(v || 0)}</span></div>)}
          </div>
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <div style={{ padding: '8px 14px', fontSize: '0.7rem', color: '#64748B', fontWeight: 700, backgroundColor: '#F8FAFC' }}>EMPLOYER CONTRIBUTIONS</div>
            {employer.map(([label, v]) => <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid #F1F5F9', fontSize: '0.85rem' }}><span>{label}</span><span>{money(v || 0)}</span></div>)}
          </div>
          {run.skippedEmployeeIds?.length > 0 && (
            <div style={{ border: '1px solid #FDE68A', backgroundColor: '#FFFBEB', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400E', marginBottom: 6 }}>{run.skippedEmployeeIds.length} employee(s) skipped (usually no active salary structure for their grade)</div>
              {run.skippedEmployeeIds.map((e) => <div key={idOf(e)} style={{ fontSize: '0.82rem', color: '#78350F' }}>{fullName(e)}{e.employeeId ? ` (${e.employeeId})` : ''}{e.grade ? ` • grade ${e.grade}` : ' • no grade'}</div>)}
            </div>
          )}
          {run.posting?.length > 0 && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, marginBottom: 8 }}>LEDGER POSTING</div>
              {run.posting.map((p) => <div key={p.event} style={{ fontSize: '0.82rem', color: '#334155' }}>{p.event.replace(/[._]/g, ' ')}: <strong>{p.status}</strong>{p.lastError ? ` (${p.lastError})` : ''}</div>)}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default function RunsTab({ showToast, onChanged }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const userId = user?._id || user?.id || '';
  const canCreate = usePermission('hr.payroll.create');
  const canApprove = usePermission('hr.payroll.approve');
  const list = useServerList(payrollService.listRuns, { status: '', year: '' }, { limit: 10 });
  const [genOpen, setGenOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const access = {
    canApprove,
    decision: (run) => (idOf(run.generatedBy) && idOf(run.generatedBy) === userId
      ? { ok: false, reason: 'You generated this run, so another person with approval rights must approve it.' }
      : { ok: true, reason: '' }),
  };

  const after = () => { list.reload(); onChanged(); };

  const approve = async (run) => {
    setBusy(true);
    const result = await dispatch(approvePayrollRun(run._id));
    setBusy(false);
    if (approvePayrollRun.fulfilled.match(result)) {
      const posting = result.payload?.posting || [];
      const waiting = posting.filter((p) => p.status !== 'posted' && p.status !== 'done');
      showToast(waiting.length ? `${run.runId} approved; ${waiting.length} ledger posting(s) are waiting (see the run details)` : `${run.runId} approved and posted`, waiting.length ? 'info' : 'success');
      after();
    } else {
      showToast(result.payload?.message || 'Approval failed', 'error');
    }
  };

  const reject = async (run, reason) => {
    const result = await dispatch(rejectPayrollRun({ id: run._id, reason }));
    if (rejectPayrollRun.fulfilled.match(result)) {
      showToast(`${run.runId} rejected`, 'success');
      setRejectTarget(null);
      after();
      return '';
    }
    return result.payload?.message || 'Reject failed';
  };

  const exportAll = async () => {
    const rows = await fetchAllPages((p) => payrollService.listRuns({ ...p, ...list.params }));
    exportCsv('payroll-runs.csv', [
      { label: 'Run', value: (r) => r.runId }, { label: 'Batch', value: (r) => r.name }, { label: 'Period', value: (r) => periodLabel(r.periodMonth, r.year) },
      { label: 'Employees', value: (r) => r.employeeCount }, { label: 'Net total (NGN)', value: (r) => (r.totalAmount / 100).toFixed(2) }, { label: 'Status', value: (r) => r.status },
      { label: 'Generated by', value: (r) => personName(r.generatedBy) },
    ], rows);
  };

  const columns = [
    { key: 'name', label: 'PAYROLL BATCH', render: (v, r) => <div><div style={{ fontWeight: 600, color: '#0F172A' }}>{v}</div><div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{r.runId}</div></div> },
    { key: 'year', label: 'YEAR', render: (_, r) => periodLabel(r.periodMonth, r.year) },
    { key: 'employeeCount', label: 'EMPLOYEES', render: (v) => <span style={{ color: '#1D4ED8' }}>{v}</span> },
    { key: 'totalAmount', label: 'TOTAL AMOUNT', render: (v) => <span style={{ fontWeight: 600 }}>{money(v)}</span> },
    { key: 'generatedBy', label: 'GENERATED BY', render: (v) => personName(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const canDecide = row.status === 'pending_approval' && canApprove;
        const decision = access.decision(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <button className="icon-btn" title="View" onClick={() => setViewId(row._id)}><FiEye size={15} /></button>
            <RowMenu options={canDecide ? [
              ...(decision.ok ? [{ label: 'Approve Payroll', icon: FiCheckCircle, color: '#059669', onClick: () => approve(row) }] : []),
              { label: 'Reject Payroll', icon: FiXCircle, color: '#DC2626', onClick: () => setRejectTarget(row) },
            ] : []} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="table-toolbar">
        <SearchBox value={list.search} onChange={list.setSearch} placeholder="Search payroll name or id…" />
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" style={ghostBtn} onClick={() => setFilterOpen(true)}><FiFilter size={14} /> Filter{[list.filters.status, list.filters.year].filter(Boolean).length ? ` (${[list.filters.status, list.filters.year].filter(Boolean).length})` : ''}</button>
          <button className="btn btn-secondary" style={ghostBtn} onClick={exportAll}>Export <FiDownload size={14} /></button>
          {canCreate && <button style={primaryBtn} onClick={() => setGenOpen(true)}><FiPlus size={14} /> Generate Payroll</button>}
        </div>
      </div>
      {list.error ? <LoadError message={list.error} onRetry={list.hardReload} /> : list.loading ? <TableSkeleton cols={7} /> : (
        <DataTable columns={columns} data={list.items} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onSelectAll={() => setSelectedIds(selectedIds.length === list.items.length ? [] : list.items.map((r) => r._id))}
          emptyMessage={list.activeSearch || list.filters.status || list.filters.year ? 'No payroll runs match your search or filter.' : 'No payroll runs yet.'} />
      )}
      {list.meta?.totalPages > 1 && <Pagination currentPage={list.page} totalPages={list.meta.totalPages} onPageChange={list.setPage} />}
      {genOpen && <GenerateModal showToast={showToast} onClose={() => setGenOpen(false)} onGenerated={() => { setGenOpen(false); after(); }} />}
      {viewId && <RunDrawer id={viewId} access={access} busy={busy} onClose={() => setViewId(null)} onApprove={approve} onReject={(r) => { setViewId(null); setRejectTarget(r); }} />}
      {rejectTarget && <RejectModal run={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={reject} />}
      {filterOpen && (
        <Drawer isOpen onClose={() => setFilterOpen(false)} title="Filter payroll runs" width="360px"
          footer={<button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { list.setFilters({ status: '', year: '' }); setFilterOpen(false); }}>Clear filters</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Status"><Select value={list.filters.status} onChange={(e) => list.setFilters({ ...list.filters, status: e.target.value })} options={STATUS_FILTERS} /></FormField>
            <FormField label="Year"><Select value={list.filters.year} onChange={(e) => list.setFilters({ ...list.filters, year: e.target.value })} options={[{ value: '', label: 'Any year' }, ...YEARS.map((y) => ({ value: String(y), label: String(y) }))]} /></FormField>
          </div>
        </Drawer>
      )}
    </>
  );
}
