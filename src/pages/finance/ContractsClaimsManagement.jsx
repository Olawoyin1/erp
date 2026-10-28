import { useEffect, useState } from 'react';
import {
  FiPlus, FiEye, FiEdit2, FiCheck, FiX, FiSend, FiTrash2, FiDownload, FiFileText, FiDollarSign, FiAlertTriangle, FiRefreshCw,
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
import { contractClaimService, contractService, contractVariationService } from '../../services/finance.service';
import { claimsSlice, contractsSlice, variationsSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, Field, FilterDrawer, FormBody, FormError, ListToolbar, MoneyInput, Note, PageHeader, PrimaryButton,
  ReasonModal, SecondaryButton, StatTiles, StatusBadge, TabBar, TwoCol,
} from './shared/FinanceUi';
import { AttachField } from './shared/FinanceRecordExtras';
import RecordDrawer from './shared/RecordDrawer';
import {
  compactMoney, countFilters, csvMoney, downloadFile, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue, statusLabel, toKobo, today,
  uploadStagedFiles, ymd,
} from './shared/financeUtils';
import { clearRefOptionsCache, useClientOptions, useContractOptions, useProjectOptions, useVariationOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useActionDialog } from './shared/useActionDialog';

const CONTRACT_TYPES = ['EPC', 'EPCIC', 'Construction', 'Maintenance'];
const CONTRACT_STATUSES = ['draft', 'under_review', 'signed', 'active', 'closed'];
const VARIATION_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'incorporated'];
const CLAIM_STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'settled'];
const CLAIM_TYPES = ['EOT', 'Cost Claim', 'Scope Change', 'Delay Claim', 'Force Majeure'];
const PAYMENT_TERMS = ['Monthly Progress Payment', 'Milestone-based', 'Net 30 Days', 'Net 60 Days', 'Advance and balance on completion'];
const VARIATION_TYPES = ['Scope Addition', 'Scope Omission', 'Time Extension', 'Design Change', 'Price Adjustment'];
const REASONS = ['Client Change Request', 'Site Condition', 'Design Error', 'Regulatory Change', 'Force Majeure', 'Other'];
const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];

const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';

/** Signed naira text ("-1,500.50") to whole kobo; NaN when invalid. */
const signedKobo = (text) => toKobo(String(text).replace(/,/g, ''));

function SignedMoneyInput({ value, onChange, error }) {
  return (
    <Input
      value={value}
      inputMode="decimal"
      error={Boolean(error)}
      placeholder="0.00 (negative for a reduction)"
      onChange={(e) => {
        const next = e.target.value.replace(/,/g, '');
        if (next === '' || next === '-' || /^-?\d*\.?\d{0,2}$/.test(next)) onChange(next);
      }}
    />
  );
}

/* ───────────────────────────── Contracts ───────────────────────────── */

function ContractFormModal({ contract, canSubmit, onClose, onSaved }) {
  const editing = Boolean(contract);
  const run = useRunAction(contractsSlice);
  const clients = useClientOptions();
  const [form, setForm] = useState(() => (editing ? {
    client: refId(contract.client), contractTitle: contract.contractTitle || '', project: refId(contract.project), contractType: contract.contractType,
    contractValue: fromKobo(contract.contractValue), currency: contract.currency || 'NGN', startDate: ymd(contract.startDate), endDate: ymd(contract.endDate),
    paymentTerms: contract.paymentTerms || '', contractManager: contract.contractManager || '', description: contract.description || '',
  } : {
    client: '', contractTitle: '', project: '', contractType: 'EPC', contractValue: '', currency: 'NGN', startDate: today(), endDate: '',
    paymentTerms: 'Monthly Progress Payment', contractManager: '', description: '',
  }));
  const projects = useProjectOptions(form.client);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (submitAfter) => {
    const next = {};
    if (!form.client) next.client = 'Select the client';
    if (!form.contractTitle.trim()) next.contractTitle = 'Enter the contract title';
    if (!form.project) next.project = 'Select the project';
    if (form.contractValue === '' || Number.isNaN(toKobo(form.contractValue)) || toKobo(form.contractValue) < 0) next.contractValue = 'Enter the contract value';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.endDate) next.endDate = 'Choose the end date';
    if (form.startDate && form.endDate && form.startDate > form.endDate) next.startDate = 'Must be on or before the end date';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = {
      client: form.client, contractTitle: form.contractTitle.trim(), project: form.project, contractType: form.contractType,
      contractValue: toKobo(form.contractValue), currency: form.currency, startDate: form.startDate, endDate: form.endDate,
    };
    if (form.paymentTerms) body.paymentTerms = form.paymentTerms;
    if (form.contractManager.trim()) body.contractManager = form.contractManager.trim();
    if (form.description.trim()) body.description = form.description.trim();
    setBusy(true);
    let result = editing ? await run('update', contract._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    const saved = result.data;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(contractService, saved._id, files);
    if (submitAfter && saved?._id) {
      result = await run('submitReview', saved._id);
      if (!result.ok) {
        setBusy(false);
        onSaved(`${saved.contractId} saved as a draft, but it could not be submitted: ${result.error}`, failed, 'error');
        return;
      }
    }
    setBusy(false);
    onSaved(editing ? 'Contract updated successfully' : `${saved?.contractId} ${submitAfter ? 'submitted for review' : 'saved as a draft'}`, failed);
  };

  return (
    <Drawer isOpen onClose={onClose} title={editing ? `Edit Contract ${contract.contractId}` : 'Create Contract'} subtitle="Create a new project contract" width="700px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          {editing ? (
            <PrimaryButton onClick={() => save(false)} disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</PrimaryButton>
          ) : (
            <>
              <SecondaryButton onClick={() => save(false)} disabled={busy}>Save as Draft</SecondaryButton>
              {canSubmit && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : 'Create Contract'}</PrimaryButton>}
            </>
          )}
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Contract ID"><Input value={editing ? contract.contractId : 'Assigned on save'} disabled /></Field>
          <Field label="Client" required error={errors.client}>
            <Choice value={form.client} onChange={(v) => { set('client', v); set('project', ''); }} options={clients.options} searchable placeholder={clients.loading ? 'Loading…' : 'Select client'} error={errors.client} />
          </Field>
        </TwoCol>
        <Field label="Contract title" required error={errors.contractTitle}><Input value={form.contractTitle} onChange={(e) => set('contractTitle', e.target.value)} placeholder="e.g. Offshore Pipeline Upgrade EPC Contract" error={Boolean(errors.contractTitle)} /></Field>
        <Field label="Project" required error={errors.project}>
          <Choice value={form.project} onChange={(v) => set('project', v)} options={projects.options} searchable disabled={!form.client} placeholder={form.client ? (projects.loading ? 'Loading…' : 'Select project') : 'Choose the client first'} error={errors.project} />
        </Field>
        <TwoCol>
          <Field label="Contract type" required><Choice value={form.contractType} onChange={(v) => set('contractType', v)} options={CONTRACT_TYPES} /></Field>
          <Field label="Contract value" required error={errors.contractValue}><MoneyInput value={form.contractValue} onChange={(v) => set('contractValue', v)} error={errors.contractValue} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} /></Field>
          <Field label="Payment terms"><Choice value={form.paymentTerms} onChange={(v) => set('paymentTerms', v)} options={PAYMENT_TERMS} placeholder="Select terms" /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Start date" required error={errors.startDate}><DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} /></Field>
          <Field label="End date" required error={errors.endDate}><DatePicker value={form.endDate} onChange={(e) => set('endDate', e.target.value)} error={Boolean(errors.endDate)} /></Field>
        </TwoCol>
        <Field label="Contract manager" help="Free text: the manager may be on the client side."><Input value={form.contractManager} onChange={(e) => set('contractManager', e.target.value)} placeholder="e.g. Mary Johnson" /></Field>
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="EPC contract for engineering, procurement, installation and commissioning." /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
      </FormBody>
    </Drawer>
  );
}

function ContractsTab({ perms, onChanged, showToast, refreshKey }) {
  const list = useFinanceList(contractsSlice, { initialFilters: { status: '', contractType: '' }, withStats: false });
  const run = useRunAction(contractsSlice);
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
    clearRefOptionsCache();
    if (message) showToast(message, 'success');
  };
  const dlg = useActionDialog(run, (message) => refreshAll(message));

  const afterSave = (message, failedUploads, tone) => {
    setFormFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, tone || 'success');
  };

  const exportPdf = async (c) => {
    const failure = await downloadFile(() => contractService.pdf(c._id), `${c.contractId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'contracts.csv',
        fetchPage: (n) => contractService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Contract ID', value: (r) => r.contractId },
          { label: 'Title', value: (r) => r.contractTitle || '' },
          { label: 'Client', value: (r) => populatedName(r.client) },
          { label: 'Project', value: (r) => populatedName(r.project) },
          { label: 'Type', value: (r) => r.contractType },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Contract Value', value: (r) => csvMoney(r.contractValue) },
          { label: 'Start Date', value: (r) => ymd(r.startDate) },
          { label: 'End Date', value: (r) => ymd(r.endDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} contract${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const actionsFor = (c) => {
    const items = [];
    if (c.status === 'draft' && perms.update) items.push({ key: 'submit', label: 'Submit for Review', icon: <FiSend size={14} />, color: '#16A34A' });
    if (['draft', 'under_review'].includes(c.status) && perms.update) items.push({ key: 'edit', label: 'Edit Contract', icon: <FiEdit2 size={14} /> });
    if (c.status === 'under_review' && perms.decide) items.push({ key: 'sign', label: 'Mark as Signed', icon: <FiCheck size={14} />, color: '#16A34A' });
    if (c.status === 'signed' && perms.decide) items.push({ key: 'activate', label: 'Mark as Active', icon: <FiCheck size={14} />, color: '#16A34A' });
    if (c.status === 'active' && perms.decide) items.push({ key: 'close', label: 'Close Contract', icon: <FiCheck size={14} /> });
    if (c.status === 'draft' && perms.remove) items.push({ key: 'delete', label: 'Delete Contract', icon: <FiTrash2 size={14} />, color: '#DC2626' });
    if (['signed', 'active', 'closed'].includes(c.status)) items.push({ key: 'pdf', label: 'Export PDF', icon: <FiDownload size={14} /> });
    return items;
  };

  const trigger = (key, c) => {
    if (key === 'edit') setFormFor(c);
    else if (key === 'pdf') exportPdf(c);
    else dlg.open(key, c);
  };

  const columns = [
    { key: 'contractId', label: 'CONTRACT ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'client', label: 'CLIENT', render: (v) => populatedName(v) },
    { key: 'project', label: 'PROJECT', render: (v) => populatedName(v) },
    { key: 'contractType', label: 'CONTRACT TYPE' },
    { key: 'contractValue', label: 'CONTRACT VALUE', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'startDate', label: 'START DATE', render: (v) => formatDate(v) },
    { key: 'endDate', label: 'END DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, color: a.color, action: () => trigger(a.key, row) }));
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View contract" aria-label="View contract"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  const describe = (c) => ({
    title: populatedName(c.client),
    subtitle: c.contractId,
    status: c.status,
    pdfName: `${c.contractId}.pdf`,
    exportLabel: 'Export Contract',
    actions: actionsFor(c).filter((a) => ['submit', 'edit', 'sign', 'activate', 'close'].includes(a.key)).map((a) => (
      <SecondaryButton key={a.key} icon={a.icon} onClick={() => trigger(a.key, c)}>{a.label}</SecondaryButton>
    )),
    notes: [c.closeReason && { text: `Closed: ${c.closeReason}` }],
    items: [
      ['Contract ID', c.contractId], ['Contract title', c.contractTitle || '—'], ['Project', populatedName(c.project)], ['Client', populatedName(c.client)],
      ['Contract type', c.contractType], ['Contract value', money(c.contractValue, c.currency)], ['Currency', c.currency],
      ['Start date', formatDate(c.startDate)], ['End date', formatDate(c.endDate)], ['Payment terms', c.paymentTerms || '—'],
      ['Contract manager', c.contractManager || '—'], ['Status', statusLabel(c.status)],
    ],
    panels: [{ title: 'Description', text: c.description, empty: 'No description recorded.' }],
    canEditDocs: ['draft', 'under_review'].includes(c.status) && perms.update,
  });

  const d = dlg.dialog;
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search contract ID, title, client, project…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.create && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Create Contract</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No contracts found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No contracts found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Contracts" subtitle="Filter by status and contract type"
        fields={[
          { key: 'status', label: 'Status', options: CONTRACT_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
          { key: 'contractType', label: 'Contract type', options: CONTRACT_TYPES.map((t) => ({ value: t, label: t })), allLabel: 'All types' },
        ]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={contractService} id={viewId} refreshKey={localKey + refreshKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Contract Details" historyLabel="Contract Timeline" />}
      {formFor && <ContractFormModal contract={formFor === 'new' ? null : formFor} canSubmit={perms.update} onClose={() => setFormFor(null)} onSaved={afterSave} />}

      {d?.kind === 'submit' && <ConfirmModal title="Submit for review?" message="The contract can no longer be deleted once it is under review." detail={d.record.contractId} confirmLabel="Submit for Review" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('submitReview', d.record, `${d.record.contractId} submitted for review`)} />}
      {d?.kind === 'sign' && <ConfirmModal title="Mark contract as signed?" message="A signed contract can no longer be edited." detail={d.record.contractId} confirmLabel="Mark as Signed" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('markSigned', d.record, `${d.record.contractId} marked as signed`)} />}
      {d?.kind === 'activate' && <ConfirmModal title="Mark contract as active?" message="The contract becomes active and can take variations and claims." detail={d.record.contractId} confirmLabel="Mark as Active" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('markActive', d.record, `${d.record.contractId} is now active`)} />}
      {d?.kind === 'close' && <ReasonModal title="Close Contract?" message="This contract will be marked as Closed. It cannot be closed while it still has open claims or variations that are not yet incorporated or rejected." detail={`${d.record.contractId} – ${d.record.contractTitle || populatedName(d.record.client)}`} label="Reason for closing" confirmLabel="Close Contract" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('close', d.record, `${d.record.contractId} closed`, reason)} />}
      {d?.kind === 'delete' && <ReasonModal title="Delete Contract?" message="This draft contract will be permanently removed from the system. This action cannot be undone." detail={`${d.record.contractId} – ${d.record.contractTitle || populatedName(d.record.client)}`} label="Reason for deletion" confirmLabel="Delete Contract" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('remove', d.record, `${d.record.contractId} deleted`, reason)} />}
    </div>
  );
}

/* ───────────────────────────── Variations ───────────────────────────── */

function VariationFormModal({ variation, canSubmit, onClose, onSaved }) {
  const editing = Boolean(variation);
  const run = useRunAction(variationsSlice);
  const contracts = useContractOptions();
  const [form, setForm] = useState(() => (editing ? {
    contract: refId(variation.contract), variationTitle: variation.variationTitle, variationType: variation.variationType || '', currency: variation.currency || 'NGN',
    valueImpact: fromKobo(variation.valueImpact), lodgeDate: ymd(variation.lodgeDate), variationReason: variation.variationReason || '', description: variation.description || '',
  } : {
    contract: '', variationTitle: '', variationType: 'Scope Addition', currency: 'NGN', valueImpact: '', lodgeDate: today(), variationReason: 'Client Change Request', description: '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const contract = contracts.options.find((c) => c.value === form.contract);

  const save = async (submitAfter) => {
    const next = {};
    if (!form.contract) next.contract = 'Select the contract';
    if (!form.variationTitle.trim()) next.variationTitle = 'Enter the variation title';
    if (form.valueImpact === '' || Number.isNaN(signedKobo(form.valueImpact))) next.valueImpact = 'Enter the value impact';
    if (!form.lodgeDate) next.lodgeDate = 'Choose the lodge date';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = {
      variationTitle: form.variationTitle.trim(), variationType: form.variationType || undefined, currency: form.currency,
      valueImpact: signedKobo(form.valueImpact), lodgeDate: form.lodgeDate, variationReason: form.variationReason || undefined,
      description: form.description.trim() || undefined,
    };
    if (!editing) body.contract = form.contract;
    setBusy(true);
    let result = editing ? await run('update', variation._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    const saved = result.data;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(contractVariationService, saved._id, files);
    if (submitAfter && saved?._id) {
      result = await run('submit', saved._id);
      if (!result.ok) {
        setBusy(false);
        onSaved(`${saved.variationId} saved as a draft, but it could not be submitted: ${result.error}`, failed, 'error');
        return;
      }
    }
    setBusy(false);
    onSaved(editing ? (submitAfter ? 'Variation updated and submitted' : 'Variation updated successfully') : `${saved?.variationId} ${submitAfter ? 'submitted' : 'saved as a draft'}`, failed);
  };

  return (
    <Drawer isOpen onClose={onClose} title={editing ? `Edit Variation ${variation.variationId}` : 'Create Variation'} subtitle="Create a variation to update contract scope, cost, or schedule" width="700px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <SecondaryButton onClick={() => save(false)} disabled={busy}>{editing ? 'Save Changes' : 'Save as Draft'}</SecondaryButton>
          {canSubmit && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : 'Submit Variation'}</PrimaryButton>}
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Variation ID"><Input value={editing ? variation.variationId : 'Assigned on save'} disabled /></Field>
          <Field label="Contract" required error={errors.contract}>
            <Choice value={form.contract} onChange={(v) => set('contract', v)} options={contracts.options} searchable disabled={editing} placeholder={contracts.loading ? 'Loading…' : 'Select contract'} error={errors.contract} />
          </Field>
        </TwoCol>
        {contract && <Note>Client and project are taken from the contract: {populatedName(contract.client)} / {populatedName(contract.project)}.</Note>}
        <Field label="Variation title" required error={errors.variationTitle}><Input value={form.variationTitle} onChange={(e) => set('variationTitle', e.target.value)} placeholder="e.g. Additional Pipeline Installation" error={Boolean(errors.variationTitle)} /></Field>
        <TwoCol>
          <Field label="Variation type"><Choice value={form.variationType} onChange={(v) => set('variationType', v)} options={VARIATION_TYPES} /></Field>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Value impact" required error={errors.valueImpact}><SignedMoneyInput value={form.valueImpact} onChange={(v) => set('valueImpact', v)} error={errors.valueImpact} /></Field>
          <Field label="Lodge date" required error={errors.lodgeDate}><DatePicker value={form.lodgeDate} onChange={(e) => set('lodgeDate', e.target.value)} error={Boolean(errors.lodgeDate)} /></Field>
        </TwoCol>
        <Field label="Variation reason"><Choice value={form.variationReason} onChange={(v) => set('variationReason', v)} options={REASONS} /></Field>
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Installation of an additional 2.5 km pipeline section requested by the client." /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
      </FormBody>
    </Drawer>
  );
}

function VariationsTab({ perms, onChanged, showToast }) {
  const list = useFinanceList(variationsSlice, { initialFilters: { status: '' }, withStats: false });
  const run = useRunAction(variationsSlice);
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
    clearRefOptionsCache();
    if (message) showToast(message, 'success');
  };
  const dlg = useActionDialog(run, (message) => refreshAll(message));

  const afterSave = (message, failedUploads, tone) => {
    setFormFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, tone || 'success');
  };

  const exportPdf = async (v) => {
    const failure = await downloadFile(() => contractVariationService.pdf(v._id), `${v.variationId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'variations.csv',
        fetchPage: (n) => contractVariationService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Variation ID', value: (r) => r.variationId },
          { label: 'Contract', value: (r) => populatedName(r.contract?.contractId) },
          { label: 'Client', value: (r) => populatedName(r.client) },
          { label: 'Project', value: (r) => populatedName(r.project) },
          { label: 'Title', value: (r) => r.variationTitle },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Value Impact', value: (r) => csvMoney(r.valueImpact) },
          { label: 'Date Lodged', value: (r) => ymd(r.lodgeDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} variation${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const actionsFor = (v) => {
    const items = [];
    if (v.status === 'draft' && perms.vUpdate) {
      items.push({ key: 'edit', label: 'Edit Variation', icon: <FiEdit2 size={14} /> });
      items.push({ key: 'submit', label: 'Submit Variation', icon: <FiSend size={14} />, color: '#16A34A' });
      items.push({ key: 'delete', label: 'Delete Variation', icon: <FiTrash2 size={14} />, color: '#DC2626' });
    }
    if (v.status === 'submitted' && perms.vDecide) {
      items.push({ key: 'approve', label: 'Mark as Approved', icon: <FiCheck size={14} />, color: '#16A34A' });
      items.push({ key: 'reject', label: 'Reject Variation', icon: <FiX size={14} />, color: '#DC2626' });
    }
    if (v.status === 'approved' && perms.vDecide) items.push({ key: 'incorporate', label: 'Incorporate Variation', icon: <FiRefreshCw size={14} /> });
    items.push({ key: 'pdf', label: 'Export PDF', icon: <FiDownload size={14} /> });
    return items;
  };

  const trigger = (key, v) => {
    if (key === 'edit') setFormFor(v);
    else if (key === 'pdf') exportPdf(v);
    else dlg.open(key, v);
  };

  const columns = [
    { key: 'variationId', label: 'VARIATION ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'contract', label: 'CONTRACT ID', render: (v) => (v && typeof v === 'object' ? v.contractId : '—') },
    { key: 'client', label: 'CLIENT', render: (v) => populatedName(v) },
    { key: 'project', label: 'PROJECT', render: (v) => populatedName(v) },
    { key: 'variationTitle', label: 'DESCRIPTION', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'valueImpact', label: 'VALUE IMPACT', render: (v, row) => <span style={{ fontWeight: 600, color: v < 0 ? '#DC2626' : '#0F172A' }}>{money(v, row.currency)}</span> },
    { key: 'lodgeDate', label: 'LODGE DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
          <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View variation" aria-label="View variation"><FiEye size={15} /></button>
          <RowMenu items={actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, color: a.color, action: () => trigger(a.key, row) }))} />
        </div>
      ),
    },
  ];

  const describe = (v) => ({
    title: populatedName(v.client),
    subtitle: v.variationId,
    status: v.status,
    pdfName: `${v.variationId}.pdf`,
    exportLabel: 'Export Variation',
    actions: actionsFor(v).filter((a) => !['pdf', 'delete'].includes(a.key)).map((a) => <SecondaryButton key={a.key} icon={a.icon} onClick={() => trigger(a.key, v)}>{a.label}</SecondaryButton>),
    notes: [v.status === 'rejected' && v.rejectionReason && { text: `Rejected: ${v.rejectionReason}` }],
    items: [
      ['Variation ID', v.variationId], ['Contract ID', v.contract?.contractId || '—'], ['Client', populatedName(v.client)], ['Project', populatedName(v.project)],
      ['Variation title', v.variationTitle], ['Variation type', v.variationType || '—'], ['Currency', v.currency], ['Value impact', money(v.valueImpact, v.currency)],
      ['Lodge date', formatDate(v.lodgeDate)], ['Variation reason', v.variationReason || '—'], ['Status', statusLabel(v.status)],
    ],
    panels: [{ title: 'Description', text: v.description, empty: 'No description recorded.' }],
    canEditDocs: v.status === 'draft' && perms.vUpdate,
  });

  const d = dlg.dialog;
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search variation ID, title, client, project…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.vCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Create Variation</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No variations found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No variations found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Variations" subtitle="Filter by status"
        fields={[{ key: 'status', label: 'Status', options: VARIATION_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' }]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={contractVariationService} id={viewId} refreshKey={localKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Variation Details" />}
      {formFor && <VariationFormModal variation={formFor === 'new' ? null : formFor} canSubmit={perms.vUpdate} onClose={() => setFormFor(null)} onSaved={afterSave} />}

      {d?.kind === 'submit' && <ConfirmModal title="Submit variation?" message="It can no longer be edited once submitted." detail={d.record.variationId} confirmLabel="Submit Variation" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('submit', d.record, `${d.record.variationId} submitted`)} />}
      {d?.kind === 'approve' && <ConfirmModal title="Approve variation?" detail={`${d.record.variationId} – ${d.record.variationTitle}`} confirmLabel="Mark as Approved" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('approve', d.record, `${d.record.variationId} approved`)} />}
      {d?.kind === 'incorporate' && <ConfirmModal title="Incorporate variation?" message="The approved change becomes part of the contract." detail={`${d.record.variationId} – ${d.record.variationTitle}`} confirmLabel="Incorporate" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('incorporate', d.record, `${d.record.variationId} incorporated`)} />}
      {d?.kind === 'reject' && <ReasonModal title="Reject variation?" message="A variation with an active claim against it cannot be rejected." detail={d.record.variationId} label="Reason for rejection" confirmLabel="Reject Variation" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('reject', d.record, `${d.record.variationId} rejected`, reason)} />}
      {d?.kind === 'delete' && <ReasonModal title="Delete variation?" message="This draft variation will be permanently removed." detail={d.record.variationId} label="Reason for deletion" required={false} confirmLabel="Delete Variation" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('remove', d.record, `${d.record.variationId} deleted`, reason)} />}
    </div>
  );
}

/* ───────────────────────────── Claims ───────────────────────────── */

function ClaimFormModal({ claim, canSubmit, onClose, onSaved }) {
  const editing = Boolean(claim);
  const run = useRunAction(claimsSlice);
  const variations = useVariationOptions();
  const [form, setForm] = useState(() => (editing ? {
    variation: refId(claim.variation), claimType: claim.claimType, currency: claim.currency || 'NGN', claimAmount: fromKobo(claim.claimAmount),
    claimReason: claim.claimReason || '', raisedBy: claim.raisedBy || '', lodgeDate: ymd(claim.lodgeDate), description: claim.description || '',
  } : {
    variation: '', claimType: 'Cost Claim', currency: 'NGN', claimAmount: '', claimReason: 'Client Change Request', raisedBy: '', lodgeDate: today(), description: '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (submitAfter) => {
    const next = {};
    if (!form.variation) next.variation = 'Select the variation';
    if (form.claimAmount === '' || Number.isNaN(toKobo(form.claimAmount)) || toKobo(form.claimAmount) < 0) next.claimAmount = 'Enter the claim amount';
    if (!form.lodgeDate) next.lodgeDate = 'Choose the lodge date';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    const body = {
      claimType: form.claimType, currency: form.currency, claimAmount: toKobo(form.claimAmount), lodgeDate: form.lodgeDate,
      claimReason: form.claimReason || undefined, raisedBy: form.raisedBy.trim() || undefined, description: form.description.trim() || undefined,
    };
    if (!editing) body.variation = form.variation;
    setBusy(true);
    let result = editing ? await run('update', claim._id, body) : await run('create', body);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    const saved = result.data;
    let failed = [];
    if (files.length && saved?._id) failed = await uploadStagedFiles(contractClaimService, saved._id, files);
    if (submitAfter && saved?._id) {
      result = await run('submit', saved._id);
      if (!result.ok) {
        setBusy(false);
        onSaved(`${saved.claimId} saved as a draft, but it could not be submitted: ${result.error}`, failed, 'error');
        return;
      }
    }
    setBusy(false);
    onSaved(editing ? (submitAfter ? 'Claim updated and submitted' : 'Claim updated successfully') : `${saved?.claimId} ${submitAfter ? 'submitted' : 'saved as a draft'}`, failed);
  };

  return (
    <Drawer isOpen onClose={onClose} title={editing ? `Edit Claim ${claim.claimId}` : 'Raise Claim'} subtitle="Raise a contract claim for additional cost, time, or scope adjustments" width="700px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <SecondaryButton onClick={() => save(false)} disabled={busy}>{editing ? 'Save Changes' : 'Save as Draft'}</SecondaryButton>
          {canSubmit && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : 'Submit Claim'}</PrimaryButton>}
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Claim ID"><Input value={editing ? claim.claimId : 'Assigned on save'} disabled /></Field>
          <Field label="Variation" required error={errors.variation} help="The contract, client and project follow the variation. A rejected variation cannot take a claim.">
            <Choice value={form.variation} onChange={(v) => set('variation', v)} options={variations.options} searchable disabled={editing} placeholder={variations.loading ? 'Loading…' : 'Select variation'} error={errors.variation} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Claim type" required><Choice value={form.claimType} onChange={(v) => set('claimType', v)} options={CLAIM_TYPES} /></Field>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Claim amount" required error={errors.claimAmount}><MoneyInput value={form.claimAmount} onChange={(v) => set('claimAmount', v)} error={errors.claimAmount} /></Field>
          <Field label="Lodge date" required error={errors.lodgeDate}><DatePicker value={form.lodgeDate} onChange={(e) => set('lodgeDate', e.target.value)} error={Boolean(errors.lodgeDate)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Claim reason"><Choice value={form.claimReason} onChange={(v) => set('claimReason', v)} options={REASONS} /></Field>
          <Field label="Raised by" help="Free text."><Input value={form.raisedBy} onChange={(e) => set('raisedBy', e.target.value)} placeholder="e.g. Chidi Okonkwo, Project QS" /></Field>
        </TwoCol>
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Additional welding activities required due to revised client specifications." /></Field>
        {!editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
      </FormBody>
    </Drawer>
  );
}

function ClaimsTab({ perms, onChanged, showToast }) {
  const list = useFinanceList(claimsSlice, { initialFilters: { status: '' }, withStats: false });
  const run = useRunAction(claimsSlice);
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
  const dlg = useActionDialog(run, (message) => refreshAll(message));

  const afterSave = (message, failedUploads, tone) => {
    setFormFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, tone || 'success');
  };

  const exportPdf = async (c) => {
    const failure = await downloadFile(() => contractClaimService.pdf(c._id), `${c.claimId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'claims.csv',
        fetchPage: (n) => contractClaimService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Claim ID', value: (r) => r.claimId },
          { label: 'Contract', value: (r) => r.contract?.contractId || '' },
          { label: 'Project', value: (r) => populatedName(r.project) },
          { label: 'Type', value: (r) => r.claimType },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Amount', value: (r) => csvMoney(r.claimAmount) },
          { label: 'Raised By', value: (r) => r.raisedBy || '' },
          { label: 'Lodge Date', value: (r) => ymd(r.lodgeDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} claim${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const actionsFor = (c) => {
    const items = [];
    if (c.status === 'draft' && perms.cUpdate) {
      items.push({ key: 'edit', label: 'Edit Claim', icon: <FiEdit2 size={14} /> });
      items.push({ key: 'submit', label: 'Submit Claim', icon: <FiSend size={14} />, color: '#16A34A' });
    }
    if (c.status === 'draft' && perms.cDelete) items.push({ key: 'delete', label: 'Delete Claim', icon: <FiTrash2 size={14} />, color: '#DC2626' });
    if (['submitted', 'under_review'].includes(c.status) && perms.cDecide) {
      items.push({ key: 'approve', label: 'Mark as Approved', icon: <FiCheck size={14} />, color: '#16A34A' });
      items.push({ key: 'reject', label: 'Reject Claim', icon: <FiX size={14} />, color: '#DC2626' });
    }
    if (c.status === 'approved' && perms.cDecide) items.push({ key: 'settle', label: 'Mark as Settled', icon: <FiCheck size={14} /> });
    items.push({ key: 'pdf', label: 'Export PDF', icon: <FiDownload size={14} /> });
    return items;
  };

  const trigger = (key, c) => {
    if (key === 'edit') setFormFor(c);
    else if (key === 'pdf') exportPdf(c);
    else dlg.open(key, c);
  };

  const columns = [
    { key: 'claimId', label: 'CLAIM ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'contract', label: 'CONTRACT ID', render: (v) => (v && typeof v === 'object' ? v.contractId : '—') },
    { key: 'project', label: 'PROJECT', render: (v) => populatedName(v) },
    { key: 'claimType', label: 'TYPE' },
    { key: 'claimAmount', label: 'AMOUNT', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'description', label: 'DESCRIPTION', render: (v, row) => v || row.claimReason || '—' },
    { key: 'raisedBy', label: 'RAISED BY', render: (v) => v || '—' },
    { key: 'lodgeDate', label: 'LODGE DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
          <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View claim" aria-label="View claim"><FiEye size={15} /></button>
          <RowMenu items={actionsFor(row).map((a) => ({ label: a.label, icon: a.icon, color: a.color, action: () => trigger(a.key, row) }))} />
        </div>
      ),
    },
  ];

  const describe = (c) => ({
    title: populatedName(c.project),
    subtitle: c.claimId,
    status: c.status,
    pdfName: `${c.claimId}.pdf`,
    exportLabel: 'Export Claim',
    actions: actionsFor(c).filter((a) => ['approve', 'settle', 'submit'].includes(a.key)).map((a) => <SecondaryButton key={a.key} icon={a.icon} onClick={() => trigger(a.key, c)}>{a.label}</SecondaryButton>),
    notes: [c.status === 'rejected' && c.rejectionReason && { text: `Rejected: ${c.rejectionReason}` }],
    items: [
      ['Claim ID', c.claimId], ['Contract ID', c.contract?.contractId || '—'], ['Client', populatedName(c.contract?.client)], ['Project', populatedName(c.project)],
      ['Variation', c.variation ? `${c.variation.variationId} – ${c.variation.variationTitle}` : '—'], ['Claim type', c.claimType], ['Currency', c.currency],
      ['Claim amount', money(c.claimAmount, c.currency)], ['Claim reason', c.claimReason || '—'], ['Raised by', c.raisedBy || '—'],
      ['Lodge date', formatDate(c.lodgeDate)], ['Status', statusLabel(c.status)],
    ],
    panels: [{ title: 'Description', text: c.description, empty: 'No description recorded.' }],
    canEditDocs: c.status === 'draft' && perms.cUpdate,
  });

  const d = dlg.dialog;
  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search claim ID, project, raised by…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.cCreate && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Raise Claim</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No claims found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No claims found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Claims" subtitle="Filter by status"
        fields={[{ key: 'status', label: 'Status', options: CLAIM_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' }]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <RecordDrawer api={contractClaimService} id={viewId} refreshKey={localKey} onClose={() => setViewId(null)} describe={describe} detailsLabel="Claim Details" />}
      {formFor && <ClaimFormModal claim={formFor === 'new' ? null : formFor} canSubmit={perms.cUpdate} onClose={() => setFormFor(null)} onSaved={afterSave} />}

      {d?.kind === 'submit' && <ConfirmModal title="Submit claim?" message="It can no longer be edited once submitted." detail={d.record.claimId} confirmLabel="Submit Claim" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('submit', d.record, `${d.record.claimId} submitted`)} />}
      {d?.kind === 'approve' && <ConfirmModal title="Approve claim?" detail={`${d.record.claimId} – ${money(d.record.claimAmount, d.record.currency)}`} confirmLabel="Mark as Approved" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('approve', d.record, `${d.record.claimId} approved`)} />}
      {d?.kind === 'settle' && <ConfirmModal title="Mark claim as settled?" detail={`${d.record.claimId} – ${money(d.record.claimAmount, d.record.currency)}`} confirmLabel="Mark as Settled" busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={() => dlg.exec('settle', d.record, `${d.record.claimId} settled`)} />}
      {d?.kind === 'reject' && <ReasonModal title="Reject claim?" detail={d.record.claimId} label="Reason for rejection" confirmLabel="Reject Claim" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('reject', d.record, `${d.record.claimId} rejected`, reason)} />}
      {d?.kind === 'delete' && <ReasonModal title="Delete Claim?" message="This draft claim will be permanently deleted. This action cannot be undone." detail={d.record.claimId} label="Reason for deletion" confirmLabel="Delete Claim" danger busy={dlg.busy} error={dlg.error} onClose={dlg.close} onConfirm={(reason) => dlg.exec('remove', d.record, `${d.record.claimId} deleted`, reason)} />}
    </div>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */

export default function ContractsClaimsManagement() {
  const { toast, showToast, hideToast } = useToast();
  const canContracts = usePermission('finance.contract.view');
  const canVariations = usePermission('finance.contractvariation.view');
  const canClaims = usePermission('finance.contractclaim.view');
  const perms = {
    create: usePermission('finance.contract.create'),
    update: usePermission('finance.contract.update'),
    decide: usePermission('finance.contract.decide'),
    remove: usePermission('finance.contract.delete'),
    vCreate: usePermission('finance.contractvariation.create'),
    vUpdate: usePermission('finance.contractvariation.update'),
    vDecide: usePermission('finance.contractvariation.decide'),
    cCreate: usePermission('finance.contractclaim.create'),
    cUpdate: usePermission('finance.contractclaim.update'),
    cDecide: usePermission('finance.contractclaim.decide'),
    cDelete: usePermission('finance.contractclaim.delete'),
  };
  const tabs = [
    canContracts && { id: 'contracts', label: 'Contracts' },
    canVariations && { id: 'variations', label: 'Variations' },
    canClaims && { id: 'claims', label: 'Claims & Extensions' },
  ].filter(Boolean);
  const [tab, setTab] = useState(null);
  const active = tab && tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;
  const [tiles, setTiles] = useState({ rows: [], loading: true, error: false });
  const [statsKey, setStatsKey] = useState(0);

  const onChanged = () => setStatsKey((k) => k + 1);

  useEffect(() => {
    if (!canContracts) return undefined;
    let cancelled = false;
    contractService.stats()
      .then((res) => { if (!cancelled) setTiles({ rows: res.data?.data || [], loading: false, error: false }); })
      .catch(() => { if (!cancelled) setTiles({ rows: [], loading: false, error: true }); });
    return () => { cancelled = true; };
  }, [canContracts, statsKey]);

  const cards = [
    { label: 'Active contracts', value: statValue(tiles.rows, 'active_contracts'), sub: 'Ongoing project agreements', icon: <FiFileText size={15} />, tone: 'blue' },
    { label: 'Total contract value', value: compactMoney(statValue(tiles.rows, 'total_contract_value')), sub: 'Signed and active contract value', icon: <FiDollarSign size={15} />, tone: 'purple' },
    { label: 'Pending claims', value: statValue(tiles.rows, 'pending_claims'), sub: 'Unresolved contractual claims', icon: <FiAlertTriangle size={15} />, tone: 'amber' },
    { label: 'Approved variations', value: compactMoney(statValue(tiles.rows, 'approved_variations_value')), sub: 'Approved contract adjustments', icon: <FiRefreshCw size={15} />, tone: 'green' },
  ];

  if (!tabs.length) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view contracts or claims.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Contracts & Claims Management" subtitle="Manage project contracts, variations, claims, and contractual obligations across all projects" />
      {canContracts && <StatTiles tiles={cards} loading={tiles.loading} error={tiles.error} />}
      <TabBar tabs={tabs} active={active} onChange={setTab} />
      {active === 'contracts' && <ContractsTab perms={perms} onChanged={onChanged} showToast={showToast} refreshKey={0} />}
      {active === 'variations' && <VariationsTab perms={perms} onChanged={onChanged} showToast={showToast} />}
      {active === 'claims' && <ClaimsTab perms={perms} onChanged={onChanged} showToast={showToast} />}
    </div>
  );
}
