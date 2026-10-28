import { useState } from 'react';
import { FiFileText, FiAlertTriangle, FiSend, FiCheckCircle, FiEye, FiEdit, FiPlus, FiArchive, FiCheck, FiX } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { rfqService } from '../../../services/bizdev.service';
import { rfqsSlice } from '../../../store/bizdev/slices';
import { Choice, ConfirmModal, DataState, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, MoneyInput, Panel, PrimaryButton, SecondaryButton, StatTiles, TabBar, TwoCol } from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import { useBizList, useBizLookups, useExport, useRecord, useRunAction, useSelection } from '../shared/bizHooks';
import { DocumentTable, HistoryList, PriorityBadge, SortLabel, StageBadge, Strip, TwoLine } from '../shared/BizUi';
import {
  compactMoney, countFilters, csvMoney, CURRENCIES, dateOnly, fieldErrorsOf, formatDate, fromKobo, money, PRIORITIES, plainOptions, RFQ_CHAIN, RFQ_STAGES, RFQ_TYPES, stageLabel, statValue,
  toKobo, toOptions, uploadStagedFiles,
} from '../shared/bizUtils';

const EXPORT_COLUMNS = [
  { label: 'RFQ ID', value: (r) => r.rfqId },
  { label: 'Title', value: (r) => r.rfqTitle },
  { label: 'Client', value: (r) => r.clientName },
  { label: 'Client RFQ Ref', value: (r) => r.clientRfqRef },
  { label: 'Type', value: (r) => r.rfqType },
  { label: 'Stage', value: (r) => stageLabel('rfq', r.stage) },
  { label: 'Priority', value: (r) => r.priority },
  { label: 'Estimated Value (NGN)', value: (r) => csvMoney(r.estimatedValue) },
  { label: 'Issue Date', value: (r) => dateOnly(r.issueDate) },
  { label: 'Deadline', value: (r) => dateOnly(r.deadline) },
  { label: 'Assigned Officer', value: (r) => r.assignedOfficerName },
];

const isOpen = (r) => RFQ_CHAIN.some((s) => s.value === r.stage);
const isDecided = (r) => r.stage === 'awarded' || r.stage === 'lost';
const nextStage = (stage) => {
  const i = RFQ_CHAIN.findIndex((s) => s.value === stage);
  return i >= 0 && i < RFQ_CHAIN.length - 1 ? RFQ_CHAIN[i + 1] : null;
};

function RfqFormModal({ rfq, clients, officers, opportunities, tenders, onClose, onSaved }) {
  const editing = Boolean(rfq);
  const [form, setForm] = useState(() => ({
    rfqTitle: rfq?.rfqTitle || '',
    clientId: rfq?.clientId || '',
    clientRfqRef: rfq?.clientRfqRef || '',
    clientRequestingOfficer: rfq?.clientRequestingOfficer || '',
    linkedOpportunityId: rfq?.linkedOpportunityId || '',
    linkedTenderId: rfq?.linkedTenderId || '',
    estimatedValue: rfq ? fromKobo(rfq.estimatedValue) : '',
    currency: rfq?.currency || 'NGN',
    rfqType: rfq?.rfqType || 'Goods',
    assignedOfficerId: rfq?.assignedOfficerId || '',
    issueDate: dateOnly(rfq?.issueDate),
    deadline: dateOnly(rfq?.deadline),
    stage: rfq?.stage || 'received',
    priority: rfq?.priority || 'High',
    rfqDescription: rfq?.rfqDescription || '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const forClient = (rows) => rows.filter((r) => !form.clientId || r.clientId === form.clientId);

  const submit = async () => {
    const next = {};
    const value = toKobo(form.estimatedValue);
    if (!form.rfqTitle.trim()) next.rfqTitle = 'Enter the RFQ title';
    if (!form.clientId) next.clientId = 'Choose the client';
    if (!form.clientRfqRef.trim()) next.clientRfqRef = 'Enter the client RFQ reference';
    if (!form.clientRequestingOfficer.trim()) next.clientRequestingOfficer = 'Enter the client officer who requested the quotation';
    if (Number.isNaN(value)) next.estimatedValue = 'Enter the estimated value, for example 45000000';
    if (!form.assignedOfficerId) next.assignedOfficerId = 'Choose the assigned officer';
    if (form.issueDate && form.deadline && form.issueDate > form.deadline) next.issueDate = 'The issue date must be on or before the deadline';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = {
      rfqTitle: form.rfqTitle.trim(), clientId: form.clientId, clientRfqRef: form.clientRfqRef.trim(), clientRequestingOfficer: form.clientRequestingOfficer.trim(),
      estimatedValue: value, currency: form.currency, rfqType: form.rfqType, assignedOfficerId: form.assignedOfficerId, stage: form.stage, priority: form.priority,
      ...(form.linkedOpportunityId ? { linkedOpportunityId: form.linkedOpportunityId } : {}),
      ...(form.linkedTenderId ? { linkedTenderId: form.linkedTenderId } : {}),
      ...(form.issueDate ? { issueDate: form.issueDate } : {}),
      ...(form.deadline ? { deadline: form.deadline } : {}),
      ...(form.rfqDescription.trim() || editing ? { rfqDescription: form.rfqDescription.trim() } : {}),
    };
    setBusy(true);
    setError('');
    try {
      const res = editing ? await rfqService.update(rfq._id, body) : await rfqService.create(body);
      let note = '';
      const id = res.data?.data?._id;
      if (files.length && id) {
        const failed = await uploadStagedFiles(rfqService, id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'RFQ updated successfully' : 'RFQ logged successfully'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The RFQ could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? `Edit RFQ (${rfq.rfqId})` : 'Log RFQ'}
      subtitle={editing ? undefined : 'Record a quotation request received from a client and track its progress'}
      width="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Log RFQ'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="RFQ title" required error={errors.rfqTitle}><Input value={form.rfqTitle} onChange={(e) => set('rfqTitle', e.target.value)} error={Boolean(errors.rfqTitle)} /></Field>
          <Field label="RFQ ID" help={editing ? undefined : 'Generated when the RFQ is saved'}><Input value={rfq?.rfqId || 'Assigned on save'} disabled readOnly /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Client" required error={errors.clientId}>
            <Choice value={form.clientId} onChange={(v) => setForm((f) => ({ ...f, clientId: v, linkedOpportunityId: '', linkedTenderId: '' }))} options={toOptions(clients, 'clientName')} placeholder="Select client…" searchable error={errors.clientId} />
          </Field>
          <Field label="Client RFQ ref" required error={errors.clientRfqRef}><Input value={form.clientRfqRef} onChange={(e) => set('clientRfqRef', e.target.value)} placeholder="e.g NNPC/RFQ/2026/0148" error={Boolean(errors.clientRfqRef)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Client requesting officer" required error={errors.clientRequestingOfficer}><Input value={form.clientRequestingOfficer} onChange={(e) => set('clientRequestingOfficer', e.target.value)} error={Boolean(errors.clientRequestingOfficer)} /></Field>
          <Field label="Linked opportunity" error={errors.linkedOpportunityId}>
            <Choice value={form.linkedOpportunityId} onChange={(v) => set('linkedOpportunityId', v)} options={[{ value: '', label: 'None' }, ...toOptions(forClient(opportunities), (o) => `${o.opportunityId} ${o.title}`)]} placeholder="Search or select opportunity" searchable />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Linked tender" error={errors.linkedTenderId}>
            <Choice value={form.linkedTenderId} onChange={(v) => set('linkedTenderId', v)} options={[{ value: '', label: 'None' }, ...toOptions(forClient(tenders), (t) => `${t.tenderId} ${t.tenderName}`)]} placeholder="Search or select tender" searchable />
          </Field>
          <Field label="Estimated value" required error={errors.estimatedValue}><MoneyInput value={form.estimatedValue} onChange={(v) => set('estimatedValue', v)} error={errors.estimatedValue} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Currency" required><Choice value={form.currency} onChange={(v) => set('currency', v)} options={plainOptions(CURRENCIES)} /></Field>
          <Field label="RFQ type" required><Choice value={form.rfqType} onChange={(v) => set('rfqType', v)} options={plainOptions(RFQ_TYPES)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Assigned officer" required error={errors.assignedOfficerId}><Choice value={form.assignedOfficerId} onChange={(v) => set('assignedOfficerId', v)} options={officers} placeholder="Select an officer" searchable error={errors.assignedOfficerId} /></Field>
          <Field label="Issue date" error={errors.issueDate}><DatePicker value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Deadline" error={errors.deadline}><DatePicker value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></Field>
          <Field label="Current stage" required><Choice value={form.stage} onChange={(v) => set('stage', v)} options={RFQ_CHAIN} /></Field>
        </TwoCol>
        <Field label="Priority" required><Choice value={form.priority} onChange={(v) => set('priority', v)} options={plainOptions(PRIORITIES)} /></Field>
        <Field label="RFQ description" error={errors.rfqDescription}><Textarea rows={3} value={form.rfqDescription} onChange={(e) => set('rfqDescription', e.target.value)} /></Field>
        <Field label="Attach documents">
          {editing && <div style={{ marginBottom: 10 }}><DocumentTable api={rfqService} id={rfq._id} canUpload={false} canRemove /></div>}
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function RfqDrawer({ rfqId, refreshKey, perms, onClose, onEdit, onAction }) {
  const [tab, setTab] = useState('details');
  const { record: r, error, loading } = useRecord(rfqService, rfqId, refreshKey);
  const next = r ? nextStage(r.stage) : null;
  return (
    <Drawer isOpen onClose={onClose} title={r?.rfqTitle || 'RFQ'} subtitle={r ? `${r.clientName || '—'} • ${r.rfqId}` : ''} width="620px">
      <DataState loading={loading} error={error} empty={!r}>
        {r && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Strip>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>
                Stage: <StageBadge kind="rfq" stage={r.stage} /> <PriorityBadge priority={r.priority} />
                {r.archivedAt && <span style={{ color: '#991B1B', fontWeight: 600 }}>Archived</span>}
              </span>
              <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                {perms.update && next && !r.archivedAt && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onAction('advance', r)}>Mark {next.label}</PrimaryButton>}
                {perms.decide && r.stage === 'submitted' && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onAction('awarded', r)}>Awarded</PrimaryButton>}
                {perms.decide && isOpen(r) && !r.archivedAt && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onAction('lost', r)}>Lost</SecondaryButton>}
                {perms.update && isOpen(r) && !r.archivedAt && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(r)}>Edit</SecondaryButton>}
                {perms.decide && isDecided(r) && !r.archivedAt && <SecondaryButton icon={<FiArchive size={14} />} onClick={() => onAction('archive', r)}>Archive</SecondaryButton>}
              </span>
            </Strip>
            <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'documents', label: 'Documents' }, { id: 'activity', label: 'Activity Log' }]} active={tab} onChange={setTab} />
            {tab === 'details' && (
              <>
                <DetailGrid items={[
                  ['RFQ title', r.rfqTitle], ['RFQ ID', r.rfqId], ['Client', r.clientName], ['Client RFQ ref', r.clientRfqRef],
                  ['Client requesting officer', r.clientRequestingOfficer], ['Linked opportunity', r.linkedOpportunity ? `${r.linkedOpportunity.opportunityId} ${r.linkedOpportunity.title}` : '—'],
                  ['Linked tender', r.linkedTender ? `${r.linkedTender.tenderId} ${r.linkedTender.tenderName}` : '—'], ['Estimated value', money(r.estimatedValue, r.currency)],
                  ['Currency', r.currency], ['RFQ type', r.rfqType], ['Assigned officer', r.assignedOfficerName], ['Issue date', r.issueDate ? formatDate(r.issueDate) : '—'],
                  ['Deadline', r.deadline ? formatDate(r.deadline) : '—'], ['Current stage', stageLabel('rfq', r.stage)], ['Priority', r.priority],
                ]}
                />
                {r.rfqDescription && <Panel title="RFQ description">{r.rfqDescription}</Panel>}
              </>
            )}
            {tab === 'documents' && <DocumentTable api={rfqService} id={r._id} canUpload={perms.update && !r.archivedAt} canRemove={perms.update && !r.archivedAt} />}
            {tab === 'activity' && <HistoryList api={rfqService} id={r._id} refreshKey={refreshKey} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

const ACTION_TEXT = {
  advance: { title: 'Move RFQ forward?', message: 'The RFQ moves to its next stage.', confirm: 'Confirm' },
  awarded: { title: 'Mark RFQ as awarded?', message: 'This records that the client awarded the RFQ and locks it from further edits.', confirm: 'Mark as Awarded' },
  lost: { title: 'Mark RFQ as lost?', message: 'This records that the RFQ was not won and locks it from further edits.', confirm: 'Mark as Lost' },
  archive: { title: 'Archive RFQ?', message: 'The RFQ moves out of the active list. You can still find it with the Archive filter.', confirm: 'Archive RFQ' },
};

export default function RfqsTab({ notify }) {
  const perms = {
    create: usePermission('businessdev.rfq.create'),
    update: usePermission('businessdev.rfq.update'),
    decide: usePermission('businessdev.rfq.decide'),
    export: usePermission('businessdev.rfq.export'),
  };
  const list = useBizList(rfqsSlice, { initialFilters: { stage: '', priority: '', rfqType: '', assignedOfficer: '', clientId: '', archived: '', sort: 'createdAt', order: 'desc' } });
  const selection = useSelection();
  const exporter = useExport(rfqService, list, selection, EXPORT_COLUMNS, 'rfqs.csv');
  const run = useRunAction(rfqsSlice);
  const { lookups } = useBizLookups(['clients', 'officers', 'opportunities', 'tenders']);
  const clients = lookups.clients || [];
  const officers = toOptions(lookups.officers, 'fullName');

  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = () => { setNonce((n) => n + 1); list.reload(); selection.clear(); };
  const saved = (message) => { setForm(null); notify(message); refresh(); };
  const ask = (kind, rfq) => { setActionError(''); setConfirm({ kind, rfq }); };
  const sortBy = (sort, order) => list.applyFilters({ ...list.filters, sort, order });

  const runConfirmed = async () => {
    setBusy(true);
    setActionError('');
    const { kind, rfq } = confirm;
    const method = { advance: 'advance', awarded: 'awarded', lost: 'lost', archive: 'archive' }[kind];
    const result = await run(method, rfq._id);
    setBusy(false);
    if (!result.ok) { setActionError(result.error); return; }
    setConfirm(null);
    notify(kind === 'advance' ? `RFQ moved to ${stageLabel('rfq', result.data?.stage)}` : kind === 'archive' ? 'RFQ archived' : `RFQ marked as ${kind}`);
    refresh();
  };

  const tiles = [
    { label: 'TOTAL RFQS', value: statValue(list.stats, 'total_rfqs'), sub: 'All RFQs logged', icon: <FiFileText size={16} />, tone: 'blue' },
    { label: 'PENDING RESPONSE', value: statValue(list.stats, 'pending_response'), sub: 'Awaiting pricing submission', icon: <FiAlertTriangle size={16} />, tone: 'amber' },
    { label: 'SUBMITTED QUOTES', value: statValue(list.stats, 'submitted_quotes'), sub: 'Sent quotes', icon: <FiSend size={16} />, tone: 'purple' },
    { label: 'AWARDED RFQS', value: statValue(list.stats, 'awarded_rfqs'), sub: 'Converted into purchase', icon: <FiCheckCircle size={16} />, tone: 'green' },
  ];

  const menuFor = (r) => {
    if (r.archivedAt) return [];
    if (isDecided(r)) return perms.decide ? [{ label: 'Archive', icon: <FiArchive size={13} />, action: () => ask('archive', r) }] : [];
    const next = nextStage(r.stage);
    return [
      ...(perms.update && r.stage !== 'submitted' ? [{ label: 'Edit RFQ', icon: <FiEdit size={13} />, action: () => setForm({ rfq: r }) }] : []),
      ...(perms.update && next && r.stage !== 'submitted' ? [{ label: next.value === 'in_progress' ? 'Mark In Progress' : `Mark as ${next.label}`, icon: <FiCheck size={13} />, action: () => ask('advance', r) }] : []),
      ...(perms.decide && r.stage === 'submitted' ? [{ label: 'Mark as Awarded', icon: <FiCheck size={13} />, color: '#059669', action: () => ask('awarded', r) }] : []),
      ...(perms.decide ? [{ label: 'Mark as Lost', icon: <FiX size={13} />, color: '#DC2626', action: () => ask('lost', r) }] : []),
    ];
  };

  const columns = [
    { key: 'rfqId', label: 'RFQ ID', render: (r) => <TwoLine primary={r.rfqId} secondary={r.clientRfqRef} /> },
    { key: 'client', label: 'CLIENT', render: (r) => r.clientName || '—' },
    { key: 'title', label: 'RFQ TITLE', render: (r) => <span style={{ display: 'inline-block', maxWidth: 260 }}>{r.rfqTitle}</span> },
    { key: 'deadline', label: <SortLabel label="SUBMISSION DATE" field="deadline" filters={list.filters} onChange={sortBy} />, render: (r) => (r.deadline ? formatDate(r.deadline) : '—') },
    { key: 'officer', label: 'ASSIGNED OFFICER', render: (r) => r.assignedOfficerName || '—' },
    { key: 'priority', label: 'PRIORITY', render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'value', label: <SortLabel label="VALUE" field="estimatedValue" filters={list.filters} onChange={sortBy} />, render: (r) => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{compactMoney(r.estimatedValue)}</span> },
    { key: 'stage', label: <SortLabel label="STAGE" field="stage" filters={list.filters} onChange={sortBy} />, render: (r) => <StageBadge kind="rfq" stage={r.stage} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (r) => {
        const items = menuFor(r);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-btn" title="View RFQ" onClick={() => setViewId(r._id)}><FiEye size={15} /></button>
            {items.length > 0 && <RowMenu items={items} />}
          </div>
        );
      },
    },
  ];

  const filterFields = [
    { key: 'stage', label: 'Stage', options: RFQ_STAGES },
    { key: 'priority', label: 'Priority', options: plainOptions(PRIORITIES) },
    { key: 'rfqType', label: 'RFQ type', options: plainOptions(RFQ_TYPES) },
    { key: 'assignedOfficer', label: 'Assigned officer', options: officers },
    { key: 'clientId', label: 'Client', options: toOptions(clients, 'clientName') },
    { key: 'archived', label: 'Archive', allLabel: 'Active RFQs', options: [{ value: 'true', label: 'Archived RFQs only' }] },
  ];

  const text = confirm ? ACTION_TEXT[confirm.kind] : null;

  return (
    <>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />
      <ListCard
        list={list}
        columns={columns}
        selection={selection}
        onRowClick={(r) => setViewId(r._id)}
        emptyText="No RFQs found."
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search RFQs..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters({ ...list.filters, sort: '', order: '' })}
            onExport={perms.export ? async () => { const m = await exporter.run(); notify(m || 'RFQs exported', m ? 'error' : 'success'); } : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {perms.create && <PrimaryButton icon={<FiPlus size={15} />} onClick={() => setForm({ rfq: null })}>Log RFQ</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter RFQs" subtitle="Narrow the RFQ list" fields={filterFields} values={list.filters} onApply={(v) => list.applyFilters({ sort: 'createdAt', order: 'desc', ...v })} />
      {form && (
        <RfqFormModal
          rfq={form.rfq}
          clients={clients}
          officers={officers}
          opportunities={lookups.opportunities || []}
          tenders={lookups.tenders || []}
          onClose={() => setForm(null)}
          onSaved={saved}
        />
      )}
      {viewId && <RfqDrawer key={viewId} rfqId={viewId} refreshKey={nonce} perms={perms} onClose={() => setViewId(null)} onEdit={(r) => setForm({ rfq: r })} onAction={ask} />}
      {confirm && (
        <ConfirmModal
          title={text.title}
          message={text.message}
          detail={<div style={{ fontSize: '0.8rem', color: '#334155' }}><strong>{confirm.rfq.rfqId}</strong> {confirm.rfq.rfqTitle}</div>}
          confirmLabel={text.confirm}
          danger={confirm.kind === 'lost'}
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={runConfirmed}
        />
      )}
    </>
  );
}
