import { useState } from 'react';
import { FiFileText, FiCheckCircle, FiSend, FiBarChart2, FiEye, FiEdit, FiPlus, FiArchive, FiCheck, FiX, FiBriefcase } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { projectConversionService, tenderService } from '../../../services/bizdev.service';
import { tendersSlice } from '../../../store/bizdev/slices';
import { Choice, ConfirmModal, DataState, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, MoneyInput, Panel, PrimaryButton, SecondaryButton, StatTiles, TabBar, TwoCol } from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import { useBizList, useBizLookups, useExport, useRecord, useRunAction, useSelection } from '../shared/bizHooks';
import { DocumentTable, HistoryList, NotesPanel, PriorityBadge, SortLabel, StageBadge, Strip, TwoLine } from '../shared/BizUi';
import {
  compactMoney, countFilters, csvMoney, dateOnly, fieldErrorsOf, formatDate, fromKobo, money, PRIORITIES, plainOptions, stageLabel, statValue, TENDER_CHAIN, TENDER_STAGES, toKobo,
  toOptions, uploadStagedFiles,
} from '../shared/bizUtils';

const EXPORT_COLUMNS = [
  { label: 'Tender No', value: (t) => t.tenderId },
  { label: 'Tender Name', value: (t) => t.tenderName },
  { label: 'Client Ref', value: (t) => t.clientTenderRef },
  { label: 'Client', value: (t) => t.clientName },
  { label: 'Stage', value: (t) => stageLabel('tender', t.stage) },
  { label: 'Priority', value: (t) => t.priority },
  { label: 'Estimated Value (NGN)', value: (t) => csvMoney(t.estimatedValue) },
  { label: 'Received', value: (t) => dateOnly(t.receivedDate) },
  { label: 'Submission Deadline', value: (t) => dateOnly(t.submissionDeadline) },
  { label: 'BD Officer', value: (t) => t.bdOfficerName },
];

const isOpen = (t) => TENDER_CHAIN.some((s) => s.value === t.stage);
const isDecided = (t) => t.stage === 'won' || t.stage === 'lost';
const PROJECT_TYPES = ['EPCIC', 'Maintenance'];
const CONTRACT_TYPES = ['Lump Sum', 'EPCIC', 'Unit Rate', 'Cost Plus'];

function TenderFormModal({ tender, clients, officers, onClose, onSaved }) {
  const editing = Boolean(tender);
  const [form, setForm] = useState(() => ({
    tenderName: tender?.tenderName || '',
    clientTenderRef: tender?.clientTenderRef || '',
    clientId: tender?.clientId || '',
    estimatedValue: tender ? fromKobo(tender.estimatedValue) : '',
    stage: tender?.stage || 'received',
    receivedDate: dateOnly(tender?.receivedDate),
    submissionDeadline: dateOnly(tender?.submissionDeadline),
    bdOfficerId: tender?.bdOfficerId || '',
    priority: tender?.priority || 'High',
    description: tender?.description || '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const next = {};
    const value = toKobo(form.estimatedValue);
    if (!form.tenderName.trim()) next.tenderName = 'Enter the tender name';
    if (!form.clientId) next.clientId = 'Choose the client';
    if (Number.isNaN(value)) next.estimatedValue = 'Enter the estimated value, for example 250000000';
    if (!form.bdOfficerId) next.bdOfficerId = 'Choose the BD officer';
    if (form.receivedDate && form.submissionDeadline && form.receivedDate > form.submissionDeadline) next.receivedDate = 'The received date must be on or before the deadline';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = {
      tenderName: form.tenderName.trim(), clientId: form.clientId, estimatedValue: value, stage: form.stage, bdOfficerId: form.bdOfficerId, priority: form.priority,
      ...(form.clientTenderRef.trim() ? { clientTenderRef: form.clientTenderRef.trim() } : {}),
      ...(form.receivedDate ? { receivedDate: form.receivedDate } : {}),
      ...(form.submissionDeadline ? { submissionDeadline: form.submissionDeadline } : {}),
      ...(form.description.trim() || editing ? { description: form.description.trim() } : {}),
    };
    setBusy(true);
    setError('');
    try {
      const res = editing ? await tenderService.update(tender._id, body) : await tenderService.create(body);
      let note = '';
      const id = res.data?.data?._id;
      if (files.length && id) {
        const failed = await uploadStagedFiles(tenderService, id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Tender updated successfully' : 'Tender created successfully'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The tender could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? `Edit Tender (${tender.tenderId})` : 'Add New Tender'}
      width="660px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Save Tender'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Tender name" required error={errors.tenderName}><Input value={form.tenderName} onChange={(e) => set('tenderName', e.target.value)} error={Boolean(errors.tenderName)} /></Field>
          <Field label="Client" required error={errors.clientId}>
            <Choice value={form.clientId} onChange={(v) => set('clientId', v)} options={toOptions(clients, 'clientName')} placeholder="Select client…" searchable error={errors.clientId} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Estimated value (₦)" required error={errors.estimatedValue}><MoneyInput value={form.estimatedValue} onChange={(v) => set('estimatedValue', v)} error={errors.estimatedValue} /></Field>
          <Field label="Stage" required><Choice value={form.stage} onChange={(v) => set('stage', v)} options={TENDER_CHAIN} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Received date" error={errors.receivedDate}><DatePicker value={form.receivedDate} onChange={(e) => set('receivedDate', e.target.value)} /></Field>
          <Field label="Submission deadline" error={errors.submissionDeadline}><DatePicker value={form.submissionDeadline} onChange={(e) => set('submissionDeadline', e.target.value)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="BD officer" required error={errors.bdOfficerId}><Choice value={form.bdOfficerId} onChange={(v) => set('bdOfficerId', v)} options={officers} placeholder="Select an officer" searchable error={errors.bdOfficerId} /></Field>
          <Field label="Priority" required><Choice value={form.priority} onChange={(v) => set('priority', v)} options={plainOptions(PRIORITIES)} /></Field>
        </TwoCol>
        <Field label="Client tender reference (optional)" error={errors.clientTenderRef}><Input value={form.clientTenderRef} onChange={(e) => set('clientTenderRef', e.target.value)} placeholder="e.g TOTAL/FPSO/2026/014" /></Field>
        <Field label="Description (optional)" error={errors.description}><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Attach documents">
          {editing && <div style={{ marginBottom: 10 }}><DocumentTable api={tenderService} id={tender._id} canUpload={false} canRemove /></div>}
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ConvertToProjectModal({ tender, onClose, onDone }) {
  const [form, setForm] = useState({ projectName: tender.tenderName, projectType: 'EPCIC', contractType: 'Lump Sum', location: '', startDate: '', plannedCompletion: '', description: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const submit = async () => {
    const next = {};
    if (!form.projectName.trim()) next.projectName = 'Enter the project name';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.plannedCompletion) next.plannedCompletion = 'Choose the planned completion date';
    if (form.startDate && form.plannedCompletion && form.startDate > form.plannedCompletion) next.startDate = 'The start date must be on or before the planned completion';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      await projectConversionService.fromTender(tender._id, {
        projectName: form.projectName.trim(), projectType: form.projectType, contractType: form.contractType, startDate: form.startDate, plannedCompletion: form.plannedCompletion,
        ...(form.location.trim() ? { location: form.location.trim() } : {}), ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      onDone('Tender converted to a project');
    } catch (err) {
      setError(apiError(err, 'The tender could not be converted'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };
  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Convert Tender to Project"
      subtitle={`${tender.tenderId} • ${tender.clientName || ''}. The client, value and tender link are carried over.`}
      width="580px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Converting…' : 'Create Project'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Project name" required error={errors.projectName}><Input value={form.projectName} onChange={(e) => set('projectName', e.target.value)} error={Boolean(errors.projectName)} /></Field>
        <TwoCol>
          <Field label="Project type" required><Choice value={form.projectType} onChange={(v) => set('projectType', v)} options={plainOptions(PROJECT_TYPES)} /></Field>
          <Field label="Contract type" required><Choice value={form.contractType} onChange={(v) => set('contractType', v)} options={plainOptions(CONTRACT_TYPES)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Start date" required error={errors.startDate}><DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></Field>
          <Field label="Planned completion" required error={errors.plannedCompletion}><DatePicker value={form.plannedCompletion} onChange={(e) => set('plannedCompletion', e.target.value)} /></Field>
        </TwoCol>
        <Field label="Location (optional)"><Input value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Description (optional)"><Textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function TenderDrawer({ tenderId, refreshKey, perms, onClose, onEdit, onDecide, onArchive, onConvert }) {
  const [tab, setTab] = useState('overview');
  const { record: t, error, loading } = useRecord(tenderService, tenderId, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title={t?.tenderName || 'Tender'} subtitle={t ? `${t.clientName || '—'} • ${t.tenderId}` : ''} width="620px">
      <DataState loading={loading} error={error} empty={!t}>
        {t && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Strip>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#64748B' }}>
                Stage: <StageBadge kind="tender" stage={t.stage} />
                <strong style={{ color: '#0F172A' }}>{compactMoney(t.estimatedValue)}</strong>
                {t.archivedAt && <span style={{ color: '#991B1B', fontWeight: 600 }}>Archived</span>}
              </span>
              <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                {perms.decide && t.stage === 'clarification' && (
                  <>
                    <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onDecide(t, 'awarded')} style={{ background: '#059669' }}>Awarded</PrimaryButton>
                    <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onDecide(t, 'not_awarded')}>Not Awarded</SecondaryButton>
                  </>
                )}
                {perms.convert && t.stage === 'won' && !t.project && <PrimaryButton icon={<FiBriefcase size={14} />} onClick={() => onConvert(t)}>Convert to Project</PrimaryButton>}
                {perms.update && isOpen(t) && !t.archivedAt && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(t)}>Edit Tender</SecondaryButton>}
                {perms.decide && !t.archivedAt && isDecided(t) && <SecondaryButton icon={<FiArchive size={14} />} onClick={() => onArchive(t)}>Archive</SecondaryButton>}
              </span>
            </Strip>
            <TabBar tabs={[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: 'Document' }, { id: 'activity', label: 'Activity Log' }, { id: 'notes', label: 'Notes' }]} active={tab} onChange={setTab} />
            {tab === 'overview' && (
              <>
                <DetailGrid items={[
                  ['Client', t.clientName], ['Tender name', t.tenderName], ['Tender no', t.tenderId], ['Opportunity value', money(t.estimatedValue, t.currency)],
                  ['Submission deadline', t.submissionDeadline ? formatDate(t.submissionDeadline) : '—'], ['Current stage', stageLabel('tender', t.stage)], ['Priority', t.priority], ['BD officer', t.bdOfficerName],
                  t.clientTenderRef ? ['Client tender reference', t.clientTenderRef] : null,
                  t.receivedDate ? ['Received date', formatDate(t.receivedDate)] : null,
                  t.relatedOpportunity ? ['Related opportunity', `${t.relatedOpportunity.opportunityId} ${t.relatedOpportunity.title}`] : null,
                  t.project ? ['Project', `${t.project.projectId} ${t.project.projectName}`] : null,
                ]}
                />
                {t.description && <Panel title="Description">{t.description}</Panel>}
              </>
            )}
            {tab === 'documents' && <DocumentTable api={tenderService} id={t._id} canUpload={perms.update && !t.archivedAt} canRemove={perms.update && !t.archivedAt} />}
            {tab === 'activity' && <HistoryList api={tenderService} id={t._id} refreshKey={refreshKey} />}
            {tab === 'notes' && <NotesPanel api={tenderService} id={t._id} canAdd={perms.update} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

export default function TendersTab({ notify, openId = '' }) {
  const perms = {
    create: usePermission('businessdev.tender.create'),
    update: usePermission('businessdev.tender.update'),
    decide: usePermission('businessdev.tender.decide'),
    export: usePermission('businessdev.tender.export'),
    convert: usePermission('technical.project.create'),
  };
  const list = useBizList(tendersSlice, { initialFilters: { stage: '', priority: '', bdOfficer: '', clientId: '', archived: '', sort: 'createdAt', order: 'desc' } });
  const selection = useSelection();
  const exporter = useExport(tenderService, list, selection, EXPORT_COLUMNS, 'tenders.csv');
  const run = useRunAction(tendersSlice);
  const { lookups } = useBizLookups(['clients', 'officers']);
  const clients = lookups.clients || [];
  const officers = toOptions(lookups.officers, 'fullName');

  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [viewId, setViewId] = useState(openId || null);
  const [confirm, setConfirm] = useState(null);
  const [convertFor, setConvertFor] = useState(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = () => { setNonce((n) => n + 1); list.reload(); selection.clear(); };
  const saved = (message) => { setForm(null); notify(message); refresh(); };

  const runConfirmed = async () => {
    setBusy(true);
    setActionError('');
    const { kind, tender } = confirm;
    const result = kind === 'archive' ? await run('archive', tender._id) : await run('decide', tender._id, kind);
    setBusy(false);
    if (!result.ok) { setActionError(result.error); return; }
    setConfirm(null);
    notify(kind === 'archive' ? 'Tender archived' : kind === 'awarded' ? 'Tender marked as awarded' : 'Tender marked as not awarded');
    refresh();
  };

  const ask = (kind, tender) => { setActionError(''); setConfirm({ kind, tender }); };
  const sortBy = (sort, order) => list.applyFilters({ ...list.filters, sort, order });

  const tiles = [
    { label: 'TOTAL TENDERS', value: statValue(list.stats, 'total_tenders'), sub: 'All tracked tenders', icon: <FiFileText size={16} />, tone: 'blue' },
    { label: 'ACTIVE TENDERS', value: statValue(list.stats, 'active_tenders'), sub: 'In progress', icon: <FiCheckCircle size={16} />, tone: 'green' },
    { label: 'SUBMITTED TENDERS', value: statValue(list.stats, 'submitted_tenders'), sub: 'Bids sent to clients', icon: <FiSend size={16} />, tone: 'purple' },
    { label: 'WIN RATE', value: `${statValue(list.stats, 'win_rate')}%`, sub: 'Awarded vs submitted', icon: <FiBarChart2 size={16} />, tone: 'amber' },
  ];

  const menuFor = (t) => {
    if (t.archivedAt) return [];
    if (isDecided(t)) {
      return [
        ...(perms.convert && t.stage === 'won' ? [{ label: 'Convert to Project', icon: <FiBriefcase size={13} />, action: () => setConvertFor(t) }] : []),
        ...(perms.decide ? [{ label: 'Archive Tender', icon: <FiArchive size={13} />, action: () => ask('archive', t) }] : []),
      ];
    }
    return [
      ...(perms.update ? [{ label: 'Edit Tender', icon: <FiEdit size={13} />, action: () => setForm({ tender: t }) }] : []),
      ...(perms.decide && t.stage === 'clarification' ? [
        { label: 'Mark as Awarded', icon: <FiCheck size={13} />, color: '#059669', action: () => ask('awarded', t) },
        { label: 'Mark as Not Awarded', icon: <FiX size={13} />, color: '#DC2626', action: () => ask('not_awarded', t) },
      ] : []),
    ];
  };

  const columns = [
    { key: 'tenderId', label: 'TENDER NO', render: (t) => <TwoLine primary={t.tenderId} secondary={t.clientTenderRef} /> },
    { key: 'tenderName', label: 'TENDER NAME', render: (t) => <span style={{ display: 'inline-block', maxWidth: 240 }}>{t.tenderName}</span> },
    { key: 'client', label: 'CLIENT', render: (t) => t.clientName || '—' },
    { key: 'stage', label: <SortLabel label="STAGE" field="stage" filters={list.filters} onChange={sortBy} />, render: (t) => <StageBadge kind="tender" stage={t.stage} /> },
    { key: 'value', label: <SortLabel label="VALUE (₦)" field="estimatedValue" filters={list.filters} onChange={sortBy} />, render: (t) => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{compactMoney(t.estimatedValue)}</span> },
    { key: 'deadline', label: <SortLabel label="DEADLINE" field="submissionDeadline" filters={list.filters} onChange={sortBy} />, render: (t) => (t.submissionDeadline ? formatDate(t.submissionDeadline) : '—') },
    { key: 'priority', label: 'PRIORITY', render: (t) => <PriorityBadge priority={t.priority} /> },
    { key: 'officer', label: 'ASSIGNED', render: (t) => t.bdOfficerName || '—' },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (t) => {
        const items = menuFor(t);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-btn" title="View tender" onClick={() => setViewId(t._id)}><FiEye size={15} /></button>
            {items.length > 0 && <RowMenu items={items} />}
          </div>
        );
      },
    },
  ];

  const filterFields = [
    { key: 'stage', label: 'Stage', options: TENDER_STAGES },
    { key: 'priority', label: 'Priority', options: plainOptions(PRIORITIES) },
    { key: 'bdOfficer', label: 'BD officer', options: officers },
    { key: 'clientId', label: 'Client', options: toOptions(clients, 'clientName') },
    { key: 'archived', label: 'Archive', allLabel: 'Active tenders', options: [{ value: 'true', label: 'Archived tenders only' }] },
  ];

  return (
    <>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />
      <ListCard
        list={list}
        columns={columns}
        selection={selection}
        onRowClick={(t) => setViewId(t._id)}
        emptyText="No tenders found."
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search tenders..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters({ ...list.filters, sort: '', order: '' })}
            onExport={perms.export ? async () => { const m = await exporter.run(); notify(m || 'Tenders exported', m ? 'error' : 'success'); } : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {perms.create && <PrimaryButton icon={<FiPlus size={15} />} onClick={() => setForm({ tender: null })}>Add Tender</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Tenders" subtitle="Narrow the tender pipeline" fields={filterFields} values={list.filters} onApply={(v) => list.applyFilters({ sort: 'createdAt', order: 'desc', ...v })} />
      {form && <TenderFormModal tender={form.tender} clients={clients} officers={officers} onClose={() => setForm(null)} onSaved={saved} />}
      {viewId && (
        <TenderDrawer
          key={viewId}
          tenderId={viewId}
          refreshKey={nonce}
          perms={perms}
          onClose={() => setViewId(null)}
          onEdit={(t) => setForm({ tender: t })}
          onDecide={ask}
          onArchive={(t) => ask('archive', t)}
          onConvert={setConvertFor}
        />
      )}
      {confirm && (
        <ConfirmModal
          title={confirm.kind === 'archive' ? 'Archive tender?' : confirm.kind === 'awarded' ? 'Mark tender as awarded?' : 'Mark tender as not awarded?'}
          message={confirm.kind === 'archive' ? 'The tender moves out of the active list. You can still find it with the Archive filter.' : 'This records the client decision and locks the tender from further edits.'}
          detail={<div style={{ fontSize: '0.8rem', color: '#334155' }}><strong>{confirm.tender.tenderId}</strong> {confirm.tender.tenderName}</div>}
          confirmLabel={confirm.kind === 'archive' ? 'Archive Tender' : confirm.kind === 'awarded' ? 'Mark as Awarded' : 'Mark as Not Awarded'}
          danger={confirm.kind === 'not_awarded'}
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={runConfirmed}
        />
      )}
      {convertFor && <ConvertToProjectModal tender={convertFor} onClose={() => setConvertFor(null)} onDone={(m) => { setConvertFor(null); notify(m); refresh(); }} />}
    </>
  );
}
