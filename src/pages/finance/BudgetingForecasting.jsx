import { useState } from 'react';
import {
  FiPlus, FiEye, FiEdit2, FiCheck, FiX, FiSend, FiTrash2, FiDownload, FiDollarSign, FiActivity, FiTrendingUp, FiBarChart2,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError, populatedName } from '../../services/apiHelpers';
import { budgetService } from '../../services/finance.service';
import { budgetsSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, DetailGrid, DrawerStatusBar, Field, FilterDrawer, FormBody, FormError, ListToolbar, MoneyInput, Note,
  PageHeader, Panel, PrimaryButton, ReasonModal, SecondaryButton, StatTiles, StatusBadge, TabBar, Tag, TwoCol,
} from './shared/FinanceUi';
import { AttachField, DocumentUploads, HistoryList } from './shared/FinanceRecordExtras';
import {
  compactMoney, countFilters, csvMoney, downloadFile, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue, statusLabel, toKobo,
  today, uploadStagedFiles, ymd,
} from './shared/financeUtils';
import { useProjectOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useRecord } from './shared/useRecord';

const TYPES = ['CapEx', 'Opex'];
const STATUSES = ['draft', 'pending_approval', 'active', 'rejected', 'closed'];
const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';

function BudgetFormModal({ budget, canSubmit, onClose, onSaved }) {
  const editing = Boolean(budget);
  const activeEdit = editing && budget.status === 'active';
  const run = useRunAction(budgetsSlice);
  const projects = useProjectOptions();
  const [form, setForm] = useState(() => (editing ? {
    budgetType: budget.budgetType, project: refId(budget.project), budgetPeriod: budget.budgetPeriod, currency: budget.currency || 'NGN',
    approvedBudget: fromKobo(budget.approvedBudget), forecastAmount: fromKobo(budget.forecastAmount), startDate: ymd(budget.startDate),
    endDate: ymd(budget.endDate), description: budget.description || '',
  } : {
    budgetType: 'CapEx', project: '', budgetPeriod: '', currency: 'NGN', approvedBudget: '', forecastAmount: '', startDate: today(), endDate: '', description: '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.project) next.project = 'Select the project';
    if (!form.budgetPeriod.trim()) next.budgetPeriod = 'Enter the budget period, e.g. FY 2026';
    if (form.approvedBudget === '' || Number.isNaN(toKobo(form.approvedBudget)) || toKobo(form.approvedBudget) <= 0) next.approvedBudget = 'Enter the approved budget';
    if (form.forecastAmount !== '' && (Number.isNaN(toKobo(form.forecastAmount)) || toKobo(form.forecastAmount) < 0)) next.forecastAmount = 'Enter a valid amount';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.endDate) next.endDate = 'Choose the end date';
    if (form.startDate && form.endDate && form.startDate > form.endDate) next.startDate = 'Must be on or before the end date';
    return next;
  };

  const save = async (submitAfter) => {
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    const full = {
      budgetType: form.budgetType, project: form.project, budgetPeriod: form.budgetPeriod.trim(), currency: form.currency,
      approvedBudget: toKobo(form.approvedBudget), startDate: form.startDate, endDate: form.endDate,
    };
    if (form.forecastAmount !== '') full.forecastAmount = toKobo(form.forecastAmount);
    if (form.description.trim()) full.description = form.description.trim();
    let body = full;
    if (activeEdit) {
      body = {};
      if (full.forecastAmount !== undefined && full.forecastAmount !== budget.forecastAmount) body.forecastAmount = full.forecastAmount;
      if ((full.description || '') !== (budget.description || '')) body.description = full.description || '';
      if (Object.keys(body).length === 0) { onSaved('No changes to save', []); return; }
    }
    setBusy(true);
    let result = editing ? await run('update', budget._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    const saved = result.data;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(budgetService, saved._id, files);
    if (submitAfter && saved?._id) {
      result = await run('submit', saved._id);
      if (!result.ok) {
        setBusy(false);
        onSaved(`${saved.budgetId} saved as a draft, but it could not be submitted: ${result.error}`, failed, 'error');
        return;
      }
    }
    setBusy(false);
    onSaved(editing ? 'Budget updated successfully' : submitAfter ? `${saved?.budgetId} submitted for approval` : `${saved?.budgetId} saved as a draft`, failed);
  };

  const footer = (
    <>
      <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
      {editing ? (
        <PrimaryButton onClick={() => save(false)} disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</PrimaryButton>
      ) : (
        <>
          <SecondaryButton onClick={() => save(false)} disabled={busy}>Save as Draft</SecondaryButton>
          {canSubmit && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : 'Create Budget'}</PrimaryButton>}
        </>
      )}
    </>
  );

  return (
    <Drawer isOpen onClose={onClose} title={editing ? `Edit Budget ${budget.budgetId}` : 'Create Budget'} subtitle="Create a new budget for planning and approval" width="680px" footer={footer}>
      <FormBody onSubmit={(e) => e.preventDefault()}>
        {activeEdit && <Note tone="amber">This budget is active. Only the forecast amount and description can be changed; the approved amount, project and dates are what was signed off.</Note>}
        <TwoCol>
          <Field label="Budget ID"><Input value={editing ? budget.budgetId : 'Assigned on save'} disabled /></Field>
          <Field label="Budget type" required><Choice value={form.budgetType} onChange={(v) => set('budgetType', v)} options={TYPES} disabled={activeEdit} /></Field>
        </TwoCol>
        <Field label="Project" required error={errors.project}>
          <Choice value={form.project} onChange={(v) => set('project', v)} options={projects.options} searchable disabled={activeEdit} placeholder={projects.loading ? 'Loading projects…' : 'Select project'} error={errors.project} />
        </Field>
        <TwoCol>
          <Field label="Budget period" required error={errors.budgetPeriod}><Input value={form.budgetPeriod} onChange={(e) => set('budgetPeriod', e.target.value)} placeholder="e.g. FY 2026" disabled={activeEdit} error={Boolean(errors.budgetPeriod)} /></Field>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={['NGN', 'USD', 'EUR', 'GBP']} disabled={activeEdit} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Approved budget" required error={errors.approvedBudget}><MoneyInput value={form.approvedBudget} onChange={(v) => set('approvedBudget', v)} disabled={activeEdit} error={errors.approvedBudget} /></Field>
          <Field label="Forecast amount" error={errors.forecastAmount}><MoneyInput value={form.forecastAmount} onChange={(v) => set('forecastAmount', v)} error={errors.forecastAmount} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Start date" required error={errors.startDate}><DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} disabled={activeEdit} error={Boolean(errors.startDate)} /></Field>
          <Field label="End date" required error={errors.endDate}><DatePicker value={form.endDate} onChange={(e) => set('endDate', e.target.value)} disabled={activeEdit} error={Boolean(errors.endDate)} /></Field>
        </TwoCol>
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Annual budget for civil works, equipment procurement and mobilisation." /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
      </FormBody>
    </Drawer>
  );
}

function BudgetDrawer({ budgetId, perms, refreshKey, onClose, onAction }) {
  const [tab, setTab] = useState('details');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { record: b, loading, error } = useRecord(budgetService, budgetId, refreshKey);

  const exportPdf = async () => {
    setExporting(true);
    setExportError('');
    const failure = await downloadFile(() => budgetService.pdf(budgetId), `${b?.budgetId || 'budget'}.pdf`);
    if (failure) setExportError(failure);
    setExporting(false);
  };

  return (
    <Drawer isOpen onClose={onClose} title={b ? b.budgetId : 'Budget'} subtitle={b?.budgetType} width="560px" footer={<SecondaryButton style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</SecondaryButton>}>
      <DataState loading={loading} error={error} empty={!loading && !error && !b}>
        {b && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DrawerStatusBar status={<StatusBadge status={b.status} />}>
              {b.status === 'draft' && perms.update && <PrimaryButton icon={<FiSend size={13} />} onClick={() => onAction('submit', b)}>Submit for Approval</PrimaryButton>}
              {b.status === 'pending_approval' && perms.decide && <PrimaryButton icon={<FiCheck size={13} />} onClick={() => onAction('approve', b)}>Approve</PrimaryButton>}
              {b.status === 'pending_approval' && perms.decide && <SecondaryButton danger icon={<FiX size={13} />} onClick={() => onAction('reject', b)}>Reject</SecondaryButton>}
              {b.status === 'active' && perms.decide && <PrimaryButton icon={<FiCheck size={13} />} onClick={() => onAction('close', b)}>Close Budget</PrimaryButton>}
              {['draft', 'active'].includes(b.status) && perms.update && <SecondaryButton icon={<FiEdit2 size={13} />} onClick={() => onAction('edit', b)}>Edit Budget</SecondaryButton>}
              <SecondaryButton icon={<FiDownload size={13} />} onClick={exportPdf} disabled={exporting}>{exporting ? 'Exporting…' : 'Download'}</SecondaryButton>
            </DrawerStatusBar>
            {exportError && <FormError message={exportError} />}
            {b.status === 'rejected' && b.rejectionReason && <Note tone="amber">Rejected: {b.rejectionReason}</Note>}
            {b.status === 'closed' && b.closeReason && <Note tone="amber">Closed: {b.closeReason}</Note>}
            <TabBar tabs={[{ id: 'details', label: 'Budget Details' }, { id: 'history', label: 'History' }]} active={tab} onChange={setTab} />
            {tab === 'details' && (
              <>
                <DetailGrid items={[
                  ['Budget ID', b.budgetId],
                  ['Budget type', b.budgetType],
                  ['Project', populatedName(b.project)],
                  ['Budget period', b.budgetPeriod],
                  ['Currency', b.currency],
                  ['Approved budget', money(b.approvedBudget, b.currency)],
                  ['Forecast amount', b.forecastAmount == null ? '—' : money(b.forecastAmount, b.currency)],
                  ['Actual spend (from the ledger)', money(b.actualSpend, b.currency)],
                  ['Variance', money(b.variance, b.currency)],
                  ['Start date', formatDate(b.startDate)],
                  ['End date', formatDate(b.endDate)],
                  ['Status', statusLabel(b.status)],
                ]} />
                <Panel title="Description">{b.description || 'No description recorded.'}</Panel>
                <DocumentUploads key={b._id} api={budgetService} id={b._id} canEdit={['draft', 'active'].includes(b.status) && perms.update} />
              </>
            )}
            {tab === 'history' && <HistoryList key={b._id + refreshKey} api={budgetService} id={b._id} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

export default function BudgetingForecasting() {
  const { toast, showToast, hideToast } = useToast();
  const canView = usePermission('finance.budget.view');
  const perms = { create: usePermission('finance.budget.create'), update: usePermission('finance.budget.update'), decide: usePermission('finance.budget.decide') };
  const list = useFinanceList(budgetsSlice, { initialFilters: { budgetType: '', status: '' }, enabled: canView });
  const run = useRunAction(budgetsSlice);
  const projects = useProjectOptions();
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  const refreshAll = () => { reload(); setLocalKey((k) => k + 1); };

  const afterSave = (message, failedUploads, tone) => {
    setFormFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, tone || 'success');
  };

  const simple = async (method, b, message, ...extra) => {
    setBusy(true);
    setActionError('');
    const result = await run(method, b._id, ...extra);
    setBusy(false);
    if (!result.ok) { setActionError(result.error); return; }
    setDialog(null);
    if (method === 'remove') setViewId(null);
    refreshAll();
    showToast(message, 'success');
  };

  const handleAction = (kind, b) => {
    setActionError('');
    if (kind === 'edit') setFormFor(b);
    else setDialog({ kind, b });
  };

  const download = async (b) => {
    const failure = await downloadFile(() => budgetService.pdf(b._id), `${b.budgetId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'budgets.csv',
        fetchPage: (n) => budgetService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Budget ID', value: (r) => r.budgetId },
          { label: 'Project', value: (r) => populatedName(r.project) },
          { label: 'Type', value: (r) => r.budgetType },
          { label: 'Period', value: (r) => r.budgetPeriod },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Approved Budget', value: (r) => csvMoney(r.approvedBudget) },
          { label: 'Actual Spend', value: (r) => csvMoney(r.actualSpend) },
          { label: 'Variance', value: (r) => csvMoney(r.variance) },
          { label: 'Forecast Amount', value: (r) => csvMoney(r.forecastAmount) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} budget${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const menuFor = (b) => {
    const items = [];
    if (b.status === 'pending_approval' && perms.decide) {
      items.push({ label: 'Approve Budget', icon: <FiCheck size={14} />, color: '#16A34A', action: () => handleAction('approve', b) });
      items.push({ label: 'Reject Budget', icon: <FiX size={14} />, color: '#DC2626', action: () => handleAction('reject', b) });
    }
    if (b.status === 'draft' && perms.update) {
      items.push({ label: 'Edit Budget', icon: <FiEdit2 size={14} />, action: () => handleAction('edit', b) });
      items.push({ label: 'Submit for Approval', icon: <FiSend size={14} />, color: '#16A34A', action: () => handleAction('submit', b) });
      items.push({ label: 'Delete Budget', icon: <FiTrash2 size={14} />, color: '#DC2626', action: () => handleAction('delete', b) });
    }
    if (b.status === 'active') {
      if (perms.update) items.push({ label: 'Edit Budget', icon: <FiEdit2 size={14} />, action: () => handleAction('edit', b) });
      if (perms.decide) items.push({ label: 'Close Budget', icon: <FiCheck size={14} />, action: () => handleAction('close', b) });
    }
    if (b.status === 'closed') items.push({ label: 'Download Budget', icon: <FiDownload size={14} />, action: () => download(b) });
    return items;
  };

  const columns = [
    { key: 'budgetId', label: 'BUDGET ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'project', label: 'PROJECT', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{populatedName(v)}</span> },
    { key: 'budgetType', label: 'BUDGET TYPE', render: (v) => <Tag tone={v === 'CapEx' ? 'blue' : 'purple'}>{v}</Tag> },
    { key: 'approvedBudget', label: 'APPROVED BUDGET', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'actualSpend', label: 'ACTUAL SPEND', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'variance', label: 'VARIANCE', render: (v, row) => <span style={{ fontWeight: 600, color: v >= 0 ? '#16A34A' : '#DC2626' }}>{money(v, row.currency)}</span> },
    { key: 'forecastAmount', label: 'FORECAST AMOUNT', render: (v, row) => (v == null ? '—' : money(v, row.currency)) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = menuFor(row);
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View budget" aria-label="View budget"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const tiles = [
    { label: 'Total budget value', value: compactMoney(statValue(list.stats, 'total_budget_value')), sub: 'Approved project budgets (active, NGN)', icon: <FiDollarSign size={15} />, tone: 'green' },
    { label: 'Actual spend', value: compactMoney(statValue(list.stats, 'actual_spend')), sub: 'Total expenditure to date (ledger)', icon: <FiActivity size={15} />, tone: 'amber' },
    { label: 'Forecast at completion', value: compactMoney(statValue(list.stats, 'forecast_at_completion')), sub: 'Projected final project cost', icon: <FiTrendingUp size={15} />, tone: 'red' },
    { label: 'Budget variance', value: compactMoney(statValue(list.stats, 'budget_variance')), sub: 'Forecast less approved (positive = overrun)', icon: <FiBarChart2 size={15} />, tone: 'blue' },
  ];

  if (!canView) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view budgets.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Budgeting & Forecasting" subtitle="Plan project budgets, monitor actual spending, forecast remaining costs, and identify budget variance" />
      <StatTiles tiles={tiles} loading={list.statsLoading && list.stats.length === 0} error={Boolean(list.statsError)} />

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search budget ID, project, period…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
          {perms.create && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Create Budget</PrimaryButton>}
        </ListToolbar>
        <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No budgets found." onRetry={list.reload}>
          <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No budgets found." />
        </DataState>
        <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      </div>

      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Budgets" subtitle="Refine by classification, approval state and project"
        fields={[
          { key: 'budgetType', label: 'Expenditure type', options: TYPES.map((t) => ({ value: t, label: t })), allLabel: 'All types' },
          { key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
          { key: 'project', label: 'Project', options: projects.options.map((p) => ({ value: p.value, label: p.label })), allLabel: 'All projects' },
        ]}
        values={{ project: '', ...list.filters }} onApply={list.applyFilters}
      />
      {viewId && <BudgetDrawer budgetId={viewId} perms={perms} refreshKey={localKey} onClose={() => setViewId(null)} onAction={handleAction} />}
      {formFor && <BudgetFormModal budget={formFor === 'new' ? null : formFor} canSubmit={perms.update} onClose={() => setFormFor(null)} onSaved={afterSave} />}

      {dialog?.kind === 'submit' && (
        <ConfirmModal title="Submit for approval?" message="You cannot edit the budget once it is submitted." detail={dialog.b.budgetId} confirmLabel="Submit" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={() => simple('submit', dialog.b, `${dialog.b.budgetId} submitted for approval`)} />
      )}
      {dialog?.kind === 'approve' && (
        <ConfirmModal title="Approve budget?" message="The budget becomes active and starts tracking actual spend from the ledger." detail={`${dialog.b.budgetId} – ${populatedName(dialog.b.project)}`} confirmLabel="Approve Budget" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={() => simple('approve', dialog.b, `${dialog.b.budgetId} approved`)} />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmModal title="Delete draft budget?" message="This draft budget will be permanently removed. This action cannot be undone." detail={`${dialog.b.budgetId} – ${populatedName(dialog.b.project)}`} confirmLabel="Delete Budget" danger busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={() => simple('remove', dialog.b, `${dialog.b.budgetId} deleted`)} />
      )}
      {dialog?.kind === 'reject' && (
        <ReasonModal title="Reject Budget?" message="Are you sure you want to reject this budget? Please provide a reason before continuing." detail={dialog.b.budgetId} label="Reason for rejection" confirmLabel="Reject Budget" danger busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={(reason) => simple('reject', dialog.b, `${dialog.b.budgetId} rejected`, reason)} />
      )}
      {dialog?.kind === 'close' && (
        <ReasonModal title="Close budget?" message="No further spend is tracked against a closed budget." detail={`${dialog.b.budgetId} – ${populatedName(dialog.b.project)}`} label="Reason for closing" confirmLabel="Close Budget" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={(reason) => simple('close', dialog.b, `${dialog.b.budgetId} closed`, reason)} />
      )}
    </div>
  );
}
