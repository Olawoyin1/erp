import { useEffect, useState } from 'react';
import { FiPlus, FiEye, FiEdit2, FiCheck, FiTrash2, FiRefreshCw, FiAlertTriangle, FiAlertCircle, FiShield, FiClock } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError, populatedName } from '../../services/apiHelpers';
import { commercialRiskService, insurancePolicyService } from '../../services/finance.service';
import { policiesSlice, risksSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, Field, FilterDrawer, FormBody, FormError, ListToolbar, MoneyInput, PageHeader, PrimaryButton, ReasonModal,
  SecondaryButton, StatTiles, StatusBadge, TabBar, Tag, TwoCol,
} from './shared/FinanceUi';
import { AttachField } from './shared/FinanceRecordExtras';
import RecordDrawer from './shared/RecordDrawer';
import {
  countFilters, csvMoney, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue, statusLabel, toKobo, today, uploadStagedFiles, ymd,
} from './shared/financeUtils';
import { useClientOptions, useProjectOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useActionDialog } from './shared/useActionDialog';

const SEVERITIES = ['Low', 'Medium', 'High'];
const RISK_STATUSES = ['open', 'under_review', 'mitigated', 'closed'];
const RISK_CATEGORIES = ['Financial', 'Contractual', 'Currency Exchange', 'Penalty Clause', 'Counterparty', 'Schedule', 'Regulatory'];
const POLICY_TYPES = ['Insurance', 'Bond'];
const COVERAGE_TYPES = ['Professional Indemnity', 'Contractors All Risk', 'Public Liability', 'Performance Bond', 'Bid Bond', 'Maintenance Bond'];
const POLICY_STATUSES = ['active', 'expiring_soon', 'expired'];
const REMINDERS = ['30 Days Before Expiry', '60 Days Before Expiry', '90 Days Before Expiry'];
const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];
const SEVERITY_TONE = { High: 'red', Medium: 'amber', Low: 'blue' };
const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';

/* ───────────────────────────── Risks ───────────────────────────── */

function RiskFormModal({ risk, onClose, onSaved }) {
  const editing = Boolean(risk);
  const run = useRunAction(risksSlice);
  const clients = useClientOptions();
  const [form, setForm] = useState(() => (editing ? {
    client: refId(risk.client), project: refId(risk.project), riskCategory: risk.riskCategory, currency: risk.currency || 'NGN',
    potentialExposure: fromKobo(risk.potentialExposure), severity: risk.severity, riskOwner: risk.riskOwner, dateIdentified: ymd(risk.dateIdentified),
    riskDescription: risk.riskDescription, mitigationPlan: risk.mitigationPlan,
  } : {
    client: '', project: '', riskCategory: 'Financial', currency: 'NGN', potentialExposure: '', severity: 'Medium', riskOwner: '', dateIdentified: today(),
    riskDescription: '', mitigationPlan: '',
  }));
  const projects = useProjectOptions(form.client);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const categories = RISK_CATEGORIES.includes(form.riskCategory) ? RISK_CATEGORIES : [form.riskCategory, ...RISK_CATEGORIES];

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.client) next.client = 'Select the client';
    if (!form.project) next.project = 'Select the project';
    if (!form.riskDescription.trim()) next.riskDescription = 'Describe the risk';
    if (form.potentialExposure === '' || Number.isNaN(toKobo(form.potentialExposure)) || toKobo(form.potentialExposure) < 0) next.potentialExposure = 'Enter the potential exposure';
    if (!form.riskOwner.trim()) next.riskOwner = 'Enter the risk owner';
    if (!form.dateIdentified) next.dateIdentified = 'Choose the date identified';
    if (!form.mitigationPlan.trim()) next.mitigationPlan = 'Enter the mitigation plan';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = {
      client: form.client, project: form.project, riskCategory: form.riskCategory, riskDescription: form.riskDescription.trim(), currency: form.currency,
      potentialExposure: toKobo(form.potentialExposure), severity: form.severity, riskOwner: form.riskOwner.trim(), dateIdentified: form.dateIdentified,
      mitigationPlan: form.mitigationPlan.trim(),
    };
    setBusy(true);
    const result = editing ? await run('update', risk._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    let failed = [];
    if (files.length && result.data?._id) failed = await uploadStagedFiles(commercialRiskService, result.data._id, files);
    setBusy(false);
    onSaved(editing ? 'Risk updated successfully' : `${result.data?.riskId} logged`, failed);
  };

  return (
    <Modal isOpen onClose={onClose} title={editing ? `Edit Risk ${risk.riskId}` : 'Log Risk'} subtitle="Record a commercial risk and its potential business impact" maxWidth="700px">
      <FormBody onSubmit={submit}>
        <TwoCol>
          <Field label="Risk ID"><Input value={editing ? risk.riskId : 'Assigned on save'} disabled /></Field>
          <Field label="Client" required error={errors.client}>
            <Choice value={form.client} onChange={(v) => { set('client', v); set('project', ''); }} options={clients.options} searchable placeholder={clients.loading ? 'Loading…' : 'Select client'} error={errors.client} />
          </Field>
        </TwoCol>
        <Field label="Project" required error={errors.project}>
          <Choice value={form.project} onChange={(v) => set('project', v)} options={projects.options} searchable disabled={!form.client} placeholder={form.client ? (projects.loading ? 'Loading…' : 'Select project') : 'Choose the client first'} error={errors.project} />
        </Field>
        <TwoCol>
          <Field label="Risk category" required><Choice value={form.riskCategory} onChange={(v) => set('riskCategory', v)} options={categories} /></Field>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} /></Field>
        </TwoCol>
        <Field label="Risk description" required error={errors.riskDescription}><Textarea rows={2} value={form.riskDescription} onChange={(e) => set('riskDescription', e.target.value)} placeholder="e.g. USD/NGN fluctuation affecting project cash flow" error={Boolean(errors.riskDescription)} /></Field>
        <TwoCol>
          <Field label="Potential exposure" required error={errors.potentialExposure}><MoneyInput value={form.potentialExposure} onChange={(v) => set('potentialExposure', v)} error={errors.potentialExposure} /></Field>
          <Field label="Severity" required><Choice value={form.severity} onChange={(v) => set('severity', v)} options={SEVERITIES} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Risk owner" required error={errors.riskOwner} help="Free text."><Input value={form.riskOwner} onChange={(e) => set('riskOwner', e.target.value)} placeholder="e.g. Chinonso Okoro" error={Boolean(errors.riskOwner)} /></Field>
          <Field label="Date identified" required error={errors.dateIdentified}><DatePicker value={form.dateIdentified} onChange={(e) => set('dateIdentified', e.target.value)} error={Boolean(errors.dateIdentified)} /></Field>
        </TwoCol>
        <Field label="Mitigation plan" required error={errors.mitigationPlan}><Textarea rows={3} value={form.mitigationPlan} onChange={(e) => set('mitigationPlan', e.target.value)} placeholder="Secure forward exchange contracts and review procurement schedules." error={Boolean(errors.mitigationPlan)} /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Log Risk'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}

function RisksTab({ perms, onChanged, showToast }) {
  const list = useFinanceList(risksSlice, { initialFilters: { status: '', severity: '' }, withStats: false });
  const run = useRunAction(risksSlice);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  const refreshAll = (message) => {
    reload();
    onChanged();
    setLocalKey((k) => k + 1);
    if (message) showToast(message, 'success');
  };
  const dlg = useActionDialog(run, (message, method) => {
    if (method === 'remove') setViewId(null);
    refreshAll(message);
  });

  const afterSave = (message, failedUploads) => {
    setFormFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, 'success');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'commercial-risks.csv',
        fetchPage: (n) => commercialRiskService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Risk ID', value: (r) => r.riskId },
          { label: 'Client', value: (r) => populatedName(r.client) },
          { label: 'Project', value: (r) => populatedName(r.project) },
          { label: 'Category', value: (r) => r.riskCategory },
          { label: 'Description', value: (r) => r.riskDescription },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Potential Exposure', value: (r) => csvMoney(r.potentialExposure) },
          { label: 'Severity', value: (r) => r.severity },
          { label: 'Owner', value: (r) => r.riskOwner },
          { label: 'Date Identified', value: (r) => ymd(r.dateIdentified) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} risk${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const actionsFor = (r) => {
    const items = [];
    if (r.status === 'open' && perms.update) items.push({ key: 'edit', label: 'Edit Risk', icon: <FiEdit2 size={14} /> });
    if (r.status === 'open' && perms.decide) items.push({ key: 'review', label: 'Mark as Under Review', icon: <FiCheck size={14} /> });
    if (r.status === 'under_review' && perms.decide) items.push({ key: 'mitigate', label: 'Mark as Mitigated', icon: <FiCheck size={14} />, color: '#16A34A' });
    if (['under_review', 'mitigated'].includes(r.status) && perms.decide) items.push({ key: 'close', label: 'Close Risk', icon: <FiCheck size={14} /> });
    if (r.status !== 'closed' && perms.remove) items.push({ key: 'delete', label: 'Delete Risk', icon: <FiTrash2 size={14} />, color: '#DC2626' });
    return items;
  };

  const trigger = (key, r) => {
    if (key === 'edit') setFormFor(r);
    else dlg.open(key, r);
  };

  const columns = [
    { key: 'riskId', label: 'RISK ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'project', label: 'PROJECT', render: (v) => populatedName(v) },
    { key: 'riskCategory', label: 'RISK CATEGORY' },
    { key: 'riskDescription', label: 'RISK DESCRIPTION', render: (v) => <span style={{ display: 'inline-block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v}</span> },
    { key: 'potentialExposure', label: 'POTENTIAL EXPOSURE', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'severity', label: 'SEVERITY', render: (v) => <Tag tone={SEVERITY_TONE[v]}>{v}</Tag> },
    { key: 'riskOwner', label: 'OWNER' },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, color: a.color, action: () => trigger(a.key, row) }));
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View risk" aria-label="View risk"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const describe = (r) => ({
    title: populatedName(r.project),
    subtitle: r.riskId,
    status: r.status,
    actions: actionsFor(r).filter((a) => ['review', 'mitigate', 'close', 'edit', 'delete'].includes(a.key)).map((a) => (
      <SecondaryButton key={a.key} danger={a.key === 'delete'} icon={a.icon} onClick={() => trigger(a.key, r)}>{a.label}</SecondaryButton>
    )),
    notes: [r.closeReason && { text: `Closed: ${r.closeReason}` }],
    items: [
      ['Risk ID', r.riskId], ['Client', populatedName(r.client)], ['Project', populatedName(r.project)], ['Risk category', r.riskCategory],
      ['Currency', r.currency], ['Potential exposure', money(r.potentialExposure, r.currency)], ['Severity', r.severity], ['Risk owner', r.riskOwner],
      ['Date identified', formatDate(r.dateIdentified)], ['Status', statusLabel(r.status)],
    ],
    panels: [{ title: 'Risk description', text: r.riskDescription }, { title: 'Mitigation plan', text: r.mitigationPlan }],
    canEditDocs: r.status === 'open' && perms.update,
  });

  const d = dlg.dialog;
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search risk ID, category, owner, project…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.create && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Log Risk</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No risks found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No risks found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Risks" subtitle="Filter by status and severity"
        fields={[
          { key: 'status', label: 'Status', options: RISK_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
          { key: 'severity', label: 'Severity', options: SEVERITIES.map((s) => ({ value: s, label: s })), allLabel: 'All severities' },
        ]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={commercialRiskService} id={viewId} refreshKey={localKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Risk Details" />}
      {formFor && <RiskFormModal risk={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} onSaved={afterSave} />}

      {d?.kind === 'review' && <ConfirmModal title="Mark as under review?" message="The risk can then be mitigated or closed. An open risk is the only state that can be edited." detail={d.record.riskId} confirmLabel="Mark as Under Review" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('underReview', d.record, `${d.record.riskId} is under review`)} />}
      {d?.kind === 'mitigate' && <ConfirmModal title="Mark as mitigated?" detail={`${d.record.riskId} – ${populatedName(d.record.project)}`} confirmLabel="Mark as Mitigated" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('mitigate', d.record, `${d.record.riskId} mitigated`)} />}
      {d?.kind === 'close' && <ReasonModal title="Close Risk?" message="This will mark the risk as resolved and change its status to Closed." detail={`${d.record.riskId} – ${populatedName(d.record.project)}`} label="Reason for closing" confirmLabel="Close Risk" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('close', d.record, `${d.record.riskId} closed`, reason)} />}
      {d?.kind === 'delete' && <ReasonModal title="Delete Risk?" message="This risk record will be permanently deleted. This action cannot be undone." detail={d.record.riskId} label="Reason for deletion" confirmLabel="Delete Risk" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('remove', d.record, `${d.record.riskId} deleted`, reason)} />}
    </div>
  );
}

/* ───────────────────────────── Policies ───────────────────────────── */

function PolicyFormModal({ policy, onClose, onSaved }) {
  const editing = Boolean(policy);
  const run = useRunAction(policiesSlice);
  const projects = useProjectOptions();
  const [form, setForm] = useState(() => (editing ? {
    policyType: policy.policyType, coverageType: policy.coverageType, provider: policy.provider, project: refId(policy.project), currency: policy.currency || 'NGN',
    coverageValue: fromKobo(policy.coverageValue), premiumAmount: fromKobo(policy.premiumAmount), startDate: ymd(policy.startDate), expiryDate: ymd(policy.expiryDate),
    renewalReminder: policy.renewalReminder || '', remarks: policy.remarks || '',
  } : {
    policyType: 'Insurance', coverageType: 'Contractors All Risk', provider: '', project: '', currency: 'NGN', coverageValue: '', premiumAmount: '', startDate: today(),
    expiryDate: '', renewalReminder: '30 Days Before Expiry', remarks: '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.provider.trim()) next.provider = 'Enter the insurer or bank';
    if (!form.project) next.project = 'Select the project';
    if (form.coverageValue === '' || Number.isNaN(toKobo(form.coverageValue)) || toKobo(form.coverageValue) < 0) next.coverageValue = 'Enter the coverage value';
    if (form.premiumAmount === '' || Number.isNaN(toKobo(form.premiumAmount)) || toKobo(form.premiumAmount) < 0) next.premiumAmount = 'Enter the premium amount';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.expiryDate) next.expiryDate = 'Choose the expiry date';
    if (form.startDate && form.expiryDate && form.startDate > form.expiryDate) next.startDate = 'Must be on or before the expiry date';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = {
      policyType: form.policyType, coverageType: form.coverageType, provider: form.provider.trim(), project: form.project, currency: form.currency,
      coverageValue: toKobo(form.coverageValue), premiumAmount: toKobo(form.premiumAmount), startDate: form.startDate, expiryDate: form.expiryDate,
      renewalReminder: form.renewalReminder || undefined, remarks: form.remarks.trim() || undefined,
    };
    setBusy(true);
    const result = editing ? await run('update', policy._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    let failed = [];
    if (files.length && result.data?._id) failed = await uploadStagedFiles(insurancePolicyService, result.data._id, files);
    setBusy(false);
    onSaved(editing ? 'Policy updated successfully' : `${result.data?.policyNo} registered`, failed);
  };

  return (
    <Modal isOpen onClose={onClose} title={editing ? `Edit Policy / Bond ${policy.policyNo}` : 'Register Policy / Bond'} subtitle="Register a new insurance policy or performance bond" maxWidth="700px">
      <FormBody onSubmit={submit}>
        <TwoCol>
          <Field label="Policy no"><Input value={editing ? policy.policyNo : 'Assigned on save'} disabled /></Field>
          <Field label="Policy type" required><Choice value={form.policyType} onChange={(v) => set('policyType', v)} options={POLICY_TYPES} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Coverage type" required><Choice value={form.coverageType} onChange={(v) => set('coverageType', v)} options={COVERAGE_TYPES} /></Field>
          <Field label="Provider (insurer / bank)" required error={errors.provider}><Input value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Leadway Assurance" error={Boolean(errors.provider)} /></Field>
        </TwoCol>
        <Field label="Project" required error={errors.project}><Choice value={form.project} onChange={(v) => set('project', v)} options={projects.options} searchable placeholder={projects.loading ? 'Loading…' : 'Select project'} error={errors.project} /></Field>
        <TwoCol>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} /></Field>
          <Field label="Coverage value" required error={errors.coverageValue}><MoneyInput value={form.coverageValue} onChange={(v) => set('coverageValue', v)} error={errors.coverageValue} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Premium amount" required error={errors.premiumAmount}><MoneyInput value={form.premiumAmount} onChange={(v) => set('premiumAmount', v)} error={errors.premiumAmount} /></Field>
          <Field label="Renewal reminder"><Choice value={form.renewalReminder} onChange={(v) => set('renewalReminder', v)} options={REMINDERS} placeholder="Select" /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Start date" required error={errors.startDate}><DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} /></Field>
          <Field label="Expiry date" required error={errors.expiryDate}><DatePicker value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} error={Boolean(errors.expiryDate)} /></Field>
        </TwoCol>
        <Field label="Remarks (optional)"><Textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="Annual contractor's all-risk policy covering offshore construction activities." /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Register Policy / Bond'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}

function RenewModal({ policy, onClose, onSaved }) {
  const run = useRunAction(policiesSlice);
  const [form, setForm] = useState({
    coverageValue: fromKobo(policy.coverageValue), premiumAmount: fromKobo(policy.premiumAmount), startDate: ymd(policy.expiryDate) || today(), expiryDate: '',
    renewalReminder: policy.renewalReminder || '', remarks: policy.remarks || '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.startDate) next.startDate = 'Choose the new start date';
    if (!form.expiryDate) next.expiryDate = 'Choose the new expiry date';
    if (form.startDate && form.expiryDate && form.startDate > form.expiryDate) next.startDate = 'Must be on or before the expiry date';
    if (Number.isNaN(toKobo(form.coverageValue)) || toKobo(form.coverageValue) < 0) next.coverageValue = 'Enter a valid amount';
    if (Number.isNaN(toKobo(form.premiumAmount)) || toKobo(form.premiumAmount) < 0) next.premiumAmount = 'Enter a valid amount';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = { startDate: form.startDate, expiryDate: form.expiryDate, coverageValue: toKobo(form.coverageValue), premiumAmount: toKobo(form.premiumAmount) };
    if (form.renewalReminder) body.renewalReminder = form.renewalReminder;
    if (form.remarks.trim()) body.remarks = form.remarks.trim();
    setBusy(true);
    const result = await run('renew', policy._id, body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    let failed = [];
    if (files.length) failed = await uploadStagedFiles(insurancePolicyService, policy._id, files);
    setBusy(false);
    onSaved(`${policy.policyNo} renewed`, failed);
  };

  return (
    <Modal isOpen onClose={onClose} title="Renew Policy / Bond" subtitle="Extend this policy or bond; the same record keeps its history" maxWidth="640px">
      <FormBody onSubmit={submit}>
        <TwoCol>
          <Field label="Policy no"><Input value={policy.policyNo} disabled /></Field>
          <Field label="Provider"><Input value={policy.provider} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Coverage value" error={errors.coverageValue}><MoneyInput value={form.coverageValue} onChange={(v) => set('coverageValue', v)} error={errors.coverageValue} /></Field>
          <Field label="Premium amount" error={errors.premiumAmount}><MoneyInput value={form.premiumAmount} onChange={(v) => set('premiumAmount', v)} error={errors.premiumAmount} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="New start date" required error={errors.startDate}><DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} /></Field>
          <Field label="New expiry date" required error={errors.expiryDate}><DatePicker value={form.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} error={Boolean(errors.expiryDate)} /></Field>
        </TwoCol>
        <Field label="Renewal reminder"><Choice value={form.renewalReminder} onChange={(v) => set('renewalReminder', v)} options={REMINDERS} placeholder="Select" /></Field>
        <Field label="Remarks"><Textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} /></Field>
        <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Renewing…' : 'Renew Policy / Bond'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}

function PoliciesTab({ perms, onChanged, showToast }) {
  const list = useFinanceList(policiesSlice, { initialFilters: { status: '', policyType: '' }, withStats: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [renewFor, setRenewFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  const afterSave = (message, failedUploads) => {
    setFormFor(null);
    setRenewFor(null);
    reload();
    onChanged();
    setLocalKey((k) => k + 1);
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, 'success');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'insurance-policies.csv',
        fetchPage: (n) => insurancePolicyService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Policy No', value: (r) => r.policyNo },
          { label: 'Type', value: (r) => r.policyType },
          { label: 'Coverage', value: (r) => r.coverageType },
          { label: 'Provider', value: (r) => r.provider },
          { label: 'Project', value: (r) => populatedName(r.project) },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Coverage Value', value: (r) => csvMoney(r.coverageValue) },
          { label: 'Premium', value: (r) => csvMoney(r.premiumAmount) },
          { label: 'Start Date', value: (r) => ymd(r.startDate) },
          { label: 'Expiry Date', value: (r) => ymd(r.expiryDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} polic${count === 1 ? 'y' : 'ies'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const actionsFor = (p) => {
    const items = [];
    if (perms.pUpdate) items.push({ key: 'edit', label: 'Edit Policy', icon: <FiEdit2 size={14} /> });
    if (p.status !== 'expired' && perms.pDecide) items.push({ key: 'renew', label: 'Renew Policy/Bond', icon: <FiRefreshCw size={14} /> });
    return items;
  };

  const trigger = (key, p) => (key === 'edit' ? setFormFor(p) : setRenewFor(p));

  const columns = [
    { key: 'policyNo', label: 'POLICY NO', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'policyType', label: 'POLICY TYPE' },
    { key: 'coverageType', label: 'COVERAGE TYPE' },
    { key: 'provider', label: 'PROVIDER' },
    { key: 'project', label: 'PROJECT', render: (v) => populatedName(v) },
    { key: 'coverageValue', label: 'COVERAGE VALUE', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'expiryDate', label: 'EXPIRY DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, action: () => trigger(a.key, row) }));
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View policy" aria-label="View policy"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const describe = (p) => ({
    title: populatedName(p.project),
    subtitle: p.policyNo,
    status: p.status,
    actions: actionsFor(p).map((a) => <SecondaryButton key={a.key} icon={a.icon} onClick={() => trigger(a.key, p)}>{a.key === 'renew' ? 'Renew' : 'Edit'}</SecondaryButton>),
    items: [
      ['Policy no', p.policyNo], ['Policy type', p.policyType], ['Coverage type', p.coverageType], ['Provider', p.provider], ['Project', populatedName(p.project)],
      ['Currency', p.currency], ['Coverage value', money(p.coverageValue, p.currency)], ['Premium amount', money(p.premiumAmount, p.currency)],
      ['Start date', formatDate(p.startDate)], ['End date', formatDate(p.expiryDate)], ['Renewal reminder', p.renewalReminder || '—'], ['Status', statusLabel(p.status)],
    ],
    panels: [{ title: 'Remarks', text: p.remarks, empty: 'No remarks recorded.' }],
    canEditDocs: perms.pUpdate,
  });

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search policy no, provider, project…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.pCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Register Policy / Bond</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No policies or bonds found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No policies or bonds found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Policies" subtitle="Filter by type and status"
        fields={[
          { key: 'policyType', label: 'Policy type', options: POLICY_TYPES.map((t) => ({ value: t, label: t })), allLabel: 'All types' },
          { key: 'status', label: 'Status', options: POLICY_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
          { key: 'coverageType', label: 'Coverage type', options: COVERAGE_TYPES.map((c) => ({ value: c, label: c })), allLabel: 'All coverage types' },
        ]}
        values={{ coverageType: '', ...list.filters }} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={insurancePolicyService} id={viewId} refreshKey={localKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Policy / Bond Details" />}
      {formFor && <PolicyFormModal policy={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} onSaved={afterSave} />}
      {renewFor && <RenewModal policy={renewFor} onClose={() => setRenewFor(null)} onSaved={afterSave} />}
    </div>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */

export default function CommercialRisksInsurance() {
  const { toast, showToast, hideToast } = useToast();
  const canRisks = usePermission('finance.commercialrisk.view');
  const canPolicies = usePermission('finance.insurancepolicy.view');
  const perms = {
    create: usePermission('finance.commercialrisk.create'),
    update: usePermission('finance.commercialrisk.update'),
    decide: usePermission('finance.commercialrisk.decide'),
    remove: usePermission('finance.commercialrisk.delete'),
    pCreate: usePermission('finance.insurancepolicy.create'),
    pUpdate: usePermission('finance.insurancepolicy.update'),
    pDecide: usePermission('finance.insurancepolicy.decide'),
  };
  const tabs = [
    canRisks && { id: 'risks', label: 'Risk Register' },
    canPolicies && { id: 'policies', label: 'Insurance Policies & Bonds' },
  ].filter(Boolean);
  const [tab, setTab] = useState(null);
  const active = tab && tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;
  const [stats, setStats] = useState({ risks: [], policies: [], loading: true, error: false });
  const [statsKey, setStatsKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      canRisks ? commercialRiskService.stats().then((r) => r.data?.data || []) : Promise.resolve([]),
      canPolicies ? insurancePolicyService.stats().then((r) => r.data?.data || []) : Promise.resolve([]),
    ])
      .then(([risks, policies]) => { if (!cancelled) setStats({ risks, policies, loading: false, error: false }); })
      .catch(() => { if (!cancelled) setStats({ risks: [], policies: [], loading: false, error: true }); });
    return () => { cancelled = true; };
  }, [canRisks, canPolicies, statsKey]);

  const onChanged = () => setStatsKey((k) => k + 1);

  const tiles = [
    { label: 'Open risks', value: statValue(stats.risks, 'open') + statValue(stats.risks, 'under_review'), sub: 'Active commercial risks requiring monitoring', icon: <FiAlertCircle size={15} />, tone: 'blue' },
    { label: 'High risk items', value: statValue(stats.risks, 'high_severity'), sub: 'Risks with significant business impact', icon: <FiAlertTriangle size={15} />, tone: 'red' },
    { label: 'Active policies', value: statValue(stats.policies, 'active') + statValue(stats.policies, 'expiring_soon'), sub: 'Insurance policies currently in force', icon: <FiShield size={15} />, tone: 'green' },
    { label: 'Policies expiring soon', value: statValue(stats.policies, 'expiring_soon'), sub: 'Policies due for renewal soon', icon: <FiClock size={15} />, tone: 'amber' },
  ];

  if (!tabs.length) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view commercial risks or insurance.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Commercial Risks & Insurance" subtitle="Monitor commercial risks, insurance coverage, renewals, and contractual exposure" />
      <StatTiles tiles={tiles} loading={stats.loading} error={stats.error} />
      <TabBar tabs={tabs} active={active} onChange={setTab} />
      {active === 'risks' && <RisksTab perms={perms} onChanged={onChanged} showToast={showToast} />}
      {active === 'policies' && <PoliciesTab perms={perms} onChanged={onChanged} showToast={showToast} />}
    </div>
  );
}
