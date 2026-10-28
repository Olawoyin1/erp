import { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiEye, FiEdit2, FiCheck, FiX, FiSend, FiTrash2, FiFileText, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError, populatedName } from '../../services/apiHelpers';
import { financeFormService } from '../../services/finance.service';
import { financeFormsSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, Field, FilterDrawer, FormBody, FormError, ListToolbar, MoneyInput, PageHeader, PrimaryButton, ReasonModal,
  SecondaryButton, StatTiles, StatusBadge, TwoCol,
} from './shared/FinanceUi';
import { AttachField } from './shared/FinanceRecordExtras';
import RecordDrawer from './shared/RecordDrawer';
import {
  countFilters, csvMoney, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue, statusLabel, toKobo, today, uploadStagedFiles, ymd,
} from './shared/financeUtils';
import { useDepartmentOptions, useProjectOptions, useVendorOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useActionDialog } from './shared/useActionDialog';

const FORM_TYPES = ['CapEx Requisition', 'Payment Request', 'Budget Adjustment Request', 'Vendor Advance Request', 'Cash Advance'];
const STATUSES = ['draft', 'pending_approval', 'approved', 'rejected'];
const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];
const TIER_LABEL = { 1: 'Line Manager (tier 1)', 2: 'Head of Department (tier 2)', 3: 'Manager / CFO (tier 3)' };
const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';

function FormModal({ form: record, canSubmit, requesterName, onClose, onSaved }) {
  const editing = Boolean(record);
  const run = useRunAction(financeFormsSlice);
  const departments = useDepartmentOptions();
  const vendors = useVendorOptions();
  const projects = useProjectOptions();
  const [form, setForm] = useState(() => (editing ? {
    formType: record.formType, requestTitle: record.requestTitle, department: refId(record.department), vendor: refId(record.vendor), project: refId(record.project),
    currency: record.currency || 'NGN', amount: fromKobo(record.amount), requestDate: ymd(record.requestDate), justification: record.justification,
  } : {
    formType: 'Payment Request', requestTitle: '', department: '', vendor: '', project: '', currency: 'NGN', amount: '', requestDate: today(), justification: '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (submitAfter) => {
    const next = {};
    if (!form.requestTitle.trim()) next.requestTitle = 'Enter the request title';
    if (!form.department) next.department = 'Select the department';
    if (!form.project) next.project = 'Select the project';
    if (form.amount === '' || Number.isNaN(toKobo(form.amount)) || toKobo(form.amount) <= 0) next.amount = 'Enter the amount';
    if (!form.requestDate) next.requestDate = 'Choose the request date';
    if (!form.justification.trim()) next.justification = 'Enter the justification';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = {
      formType: form.formType, requestTitle: form.requestTitle.trim(), department: form.department, project: form.project, currency: form.currency,
      amount: toKobo(form.amount), requestDate: form.requestDate, justification: form.justification.trim(),
    };
    if (form.vendor) body.vendor = form.vendor;
    setBusy(true);
    let result = editing ? await run('update', record._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    const saved = result.data;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(financeFormService, saved._id, files);
    if (submitAfter && saved?._id) {
      result = await run('submit', saved._id);
      if (!result.ok) {
        setBusy(false);
        onSaved(`${saved.formId} saved as a draft, but it could not be submitted: ${result.error}`, failed, 'error');
        return;
      }
    }
    setBusy(false);
    onSaved(editing ? (submitAfter ? 'Form updated and submitted for approval' : 'Form updated successfully') : `${saved?.formId} ${submitAfter ? 'submitted for approval' : 'saved as a draft'}`, failed);
  };

  return (
    <Drawer isOpen onClose={onClose} title={editing ? `Edit Form ${record.formId}` : 'Add Finance Form'} subtitle="Create a finance request that needs approval" width="700px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <SecondaryButton onClick={() => save(false)} disabled={busy}>{editing ? 'Save Changes' : 'Save as Draft'}</SecondaryButton>
          {canSubmit && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : editing ? 'Submit for Approval' : 'Add Finance Form'}</PrimaryButton>}
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Form ID"><Input value={editing ? record.formId : 'Assigned on save'} disabled /></Field>
          <Field label="Form type" required><Choice value={form.formType} onChange={(v) => set('formType', v)} options={FORM_TYPES} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Request title" required error={errors.requestTitle}><Input value={form.requestTitle} onChange={(e) => set('requestTitle', e.target.value)} placeholder="e.g. Payment for Structural Steel Supply" error={Boolean(errors.requestTitle)} /></Field>
          <Field label="Department" required error={errors.department}><Choice value={form.department} onChange={(v) => set('department', v)} options={departments.options} searchable placeholder={departments.loading ? 'Loading…' : 'Select department'} error={errors.department} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Requested by" help="Set from your own employee record; it cannot be changed."><Input value={editing ? populatedName(record.requestedBy) : requesterName} disabled /></Field>
          <Field label="Vendor (optional)"><Choice value={form.vendor} onChange={(v) => set('vendor', v)} options={[{ value: '', label: 'No vendor' }, ...vendors.options]} searchable placeholder={vendors.loading ? 'Loading…' : 'Select vendor'} /></Field>
        </TwoCol>
        <Field label="Project" required error={errors.project}><Choice value={form.project} onChange={(v) => set('project', v)} options={projects.options} searchable placeholder={projects.loading ? 'Loading…' : 'Select project'} error={errors.project} /></Field>
        <TwoCol>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} /></Field>
          <Field label="Amount" required error={errors.amount} help="The amount decides which approval tier must decide this request."><MoneyInput value={form.amount} onChange={(v) => set('amount', v)} error={errors.amount} /></Field>
        </TwoCol>
        <Field label="Request date" required error={errors.requestDate}><DatePicker value={form.requestDate} onChange={(e) => set('requestDate', e.target.value)} error={Boolean(errors.requestDate)} /></Field>
        <Field label="Justification" required error={errors.justification}><Textarea rows={3} value={form.justification} onChange={(e) => set('justification', e.target.value)} placeholder="Payment for structural steel supplied under Purchase Order PO-2026-045." error={Boolean(errors.justification)} /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
      </FormBody>
    </Drawer>
  );
}

export default function FinanceForms() {
  const { toast, showToast, hideToast } = useToast();
  const authUser = useSelector((s) => s.auth.user);
  const myEmployeeId = authUser?.employeeId ? String(authUser.employeeId) : '';
  const canView = usePermission('finance.financeform.view');
  const canCreate = usePermission('finance.financeform.create');
  const canUpdate = usePermission('finance.financeform.update');
  const canDelete = usePermission('finance.financeform.delete');
  const tier1 = usePermission('finance.financeform.decide');
  const tier2 = usePermission('finance.financeform.decide-tier2');
  const tier3 = usePermission('finance.financeform.decide-tier3');
  const heldTier = tier3 ? 3 : tier2 ? 2 : tier1 ? 1 : 0;
  const list = useFinanceList(financeFormsSlice, { initialFilters: { formType: '', status: '' }, enabled: canView });
  const run = useRunAction(financeFormsSlice);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;
  const requesterName = authUser ? `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'You' : 'You';

  const refreshAll = (message) => {
    reload();
    setLocalKey((k) => k + 1);
    if (message) showToast(message, 'success');
  };
  const dlg = useActionDialog(run, (message, method) => {
    if (method === 'remove') setViewId(null);
    refreshAll(message);
  });

  const afterSave = (message, failedUploads, tone) => {
    setFormFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, tone || 'success');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'finance-forms.csv',
        fetchPage: (n) => financeFormService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Form ID', value: (r) => r.formId },
          { label: 'Form Type', value: (r) => r.formType },
          { label: 'Title', value: (r) => r.requestTitle },
          { label: 'Department', value: (r) => populatedName(r.department) },
          { label: 'Requested By', value: (r) => populatedName(r.requestedBy) },
          { label: 'Project', value: (r) => populatedName(r.project) },
          { label: 'Vendor', value: (r) => (r.vendor ? populatedName(r.vendor) : '') },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Fund Value', value: (r) => csvMoney(r.amount) },
          { label: 'Approval Tier', value: (r) => r.requiredApprovalTier },
          { label: 'Submitted On', value: (r) => ymd(r.requestDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} form${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const isOwn = (f) => myEmployeeId && refId(f.requestedBy) === myEmployeeId;
  const canDecide = (f) => heldTier >= f.requiredApprovalTier && !isOwn(f);

  const actionsFor = (f) => {
    const items = [];
    if (f.status === 'draft' && canUpdate) {
      items.push({ key: 'edit', label: 'Edit Form', icon: <FiEdit2 size={14} /> });
      items.push({ key: 'submit', label: 'Submit Form', icon: <FiSend size={14} />, color: '#16A34A' });
    }
    if (f.status === 'draft' && canDelete) items.push({ key: 'delete', label: 'Delete Form', icon: <FiTrash2 size={14} />, color: '#DC2626' });
    if (f.status === 'pending_approval' && canDecide(f)) {
      items.push({ key: 'approve', label: 'Approve', icon: <FiCheck size={14} />, color: '#16A34A' });
      items.push({ key: 'reject', label: 'Reject', icon: <FiX size={14} />, color: '#DC2626' });
    }
    return items;
  };

  const trigger = (key, f) => {
    if (key === 'edit') setFormFor(f);
    else dlg.open(key, f);
  };

  const columns = [
    { key: 'formId', label: 'FORM ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'formType', label: 'FORM TYPE' },
    { key: 'requestedBy', label: 'REQUESTED BY', render: (v) => populatedName(v) },
    { key: 'project', label: 'REFERENCE', render: (v, row) => (row.vendor ? `Vendor: ${populatedName(row.vendor)}` : populatedName(v)) },
    { key: 'amount', label: 'FUND VALUE', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'requestDate', label: 'SUBMITTED ON', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, color: a.color, action: () => trigger(a.key, row) }));
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View form" aria-label="View form"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const describe = (f) => ({
    title: f.requestTitle,
    subtitle: `${f.formId} · ${populatedName(f.requestedBy)}`,
    status: f.status,
    actions: actionsFor(f).filter((a) => ['approve', 'reject', 'submit', 'edit'].includes(a.key)).map((a) => (
      a.key === 'approve'
        ? <PrimaryButton key={a.key} icon={a.icon} onClick={() => trigger(a.key, f)}>{a.label}</PrimaryButton>
        : <SecondaryButton key={a.key} danger={a.key === 'reject'} icon={a.icon} onClick={() => trigger(a.key, f)}>{a.label}</SecondaryButton>
    )),
    notes: [
      f.status === 'pending_approval' && isOwn(f) && { text: 'You raised this request, so someone else must approve or reject it.' },
      f.status === 'pending_approval' && !isOwn(f) && heldTier < f.requiredApprovalTier && { text: `This amount needs ${TIER_LABEL[f.requiredApprovalTier]} authority; you do not hold it.` },
      f.status === 'rejected' && f.rejectionReason && { text: `Rejected: ${f.rejectionReason}` },
    ],
    items: [
      ['Form ID', f.formId], ['Form type', f.formType], ['Request title', f.requestTitle], ['Department', populatedName(f.department)],
      ['Requested by', populatedName(f.requestedBy)], ['Vendor / payee', f.vendor ? populatedName(f.vendor) : '—'], ['Project', populatedName(f.project)],
      ['Currency', f.currency], ['Amount', money(f.amount, f.currency)], ['Request date', formatDate(f.requestDate)],
      ['Approval needed from', TIER_LABEL[f.requiredApprovalTier]],
    ],
    panels: [{ title: 'Justification', text: f.justification }],
    canEditDocs: f.status === 'draft' && canUpdate,
  });

  const tiles = [
    { label: 'Total forms', value: statValue(list.stats, 'total_forms'), sub: 'All finance forms', icon: <FiFileText size={15} />, tone: 'green' },
    { label: 'Pending approval', value: statValue(list.stats, 'pending_approval'), sub: 'Awaiting review', icon: <FiClock size={15} />, tone: 'amber' },
    { label: 'Approved', value: statValue(list.stats, 'approved'), sub: 'Successfully processed', icon: <FiCheckCircle size={15} />, tone: 'green' },
    { label: 'Rejected', value: statValue(list.stats, 'rejected'), sub: 'Returned for correction', icon: <FiXCircle size={15} />, tone: 'red' },
  ];

  if (!canView) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view finance forms.</div>;

  const d = dlg.dialog;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Finance Forms" subtitle="Create and manage finance requests requiring approval" />
      <StatTiles tiles={tiles} loading={list.statsLoading && list.stats.length === 0} error={Boolean(list.statsError)} />

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search form ID, title, requester, type…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
          {canCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Finance Form</PrimaryButton>}
        </ListToolbar>
        <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No finance forms found." onRetry={list.reload}>
          <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No finance forms found." />
        </DataState>
        <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      </div>

      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Finance Forms" subtitle="Filter by form type and status"
        fields={[
          { key: 'formType', label: 'Form type', options: FORM_TYPES.map((t) => ({ value: t, label: t })), allLabel: 'All types' },
          { key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
        ]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={financeFormService} id={viewId} refreshKey={localKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Form Details" historyLabel="Approval History" />}
      {formFor && <FormModal form={formFor === 'new' ? null : formFor} canSubmit={canUpdate} requesterName={requesterName} onClose={() => setFormFor(null)} onSaved={afterSave} />}

      {d?.kind === 'submit' && <ConfirmModal title="Submit form for approval?" message="It can no longer be edited once submitted." detail={`${d.record.formId} – ${money(d.record.amount, d.record.currency)}`} confirmLabel="Submit Form" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('submit', d.record, `${d.record.formId} submitted for approval`)} />}
      {d?.kind === 'approve' && (
        <ConfirmModal
          title="Approve this request?"
          message={`${d.record.formType} for ${money(d.record.amount, d.record.currency)}. Needs ${TIER_LABEL[d.record.requiredApprovalTier]} authority.`}
          detail={`${d.record.formId} – ${d.record.requestTitle}`}
          confirmLabel="Approve" busy={dlg.busy} error={dlg.error} onClose={dlg.close}
          onConfirm={() => dlg.exec('approve', d.record, `${d.record.formId} approved`)}
        />
      )}
      {d?.kind === 'reject' && <ReasonModal title="Reject this request?" detail={`${d.record.formId} – ${d.record.requestTitle}`} label="Reason for rejection" confirmLabel="Reject" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('reject', d.record, `${d.record.formId} rejected`, reason)} />}
      {d?.kind === 'delete' && <ReasonModal title="Delete form?" message="This draft form will be permanently removed." detail={d.record.formId} label="Reason for deletion" confirmLabel="Delete Form" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('remove', d.record, `${d.record.formId} deleted`, reason)} />}
    </div>
  );
}
