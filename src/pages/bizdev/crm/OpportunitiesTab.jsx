import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTarget, FiTrendingUp, FiFileText, FiAward, FiEye, FiEdit, FiPlus, FiCheck, FiX, FiGrid, FiList, FiArrowLeft, FiArrowRight, FiCalendar, FiUser } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { opportunityService, tenderService } from '../../../services/bizdev.service';
import { opportunitiesSlice } from '../../../store/bizdev/slices';
import { Choice, DataState, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, MoneyInput, Panel, PrimaryButton, ReasonModal, SecondaryButton, StatTiles, TabBar, TwoCol } from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import { useBizList, useBizLookups, useExport, useFetched, useRecord, useRunAction, useSelection } from '../shared/bizHooks';
import { DocumentTable, HistoryList, PriorityBadge, ProbabilityBar, StageBadge, Strip, TwoLine } from '../shared/BizUi';
import {
  compactMoney, countFilters, csvMoney, daysUntil, dateOnly, fieldErrorsOf, formatDate, fromKobo, money, OPPORTUNITY_CHAIN, OPPORTUNITY_STAGES, OPPORTUNITY_TYPES,
  PRIORITIES, plainOptions, stageLabel, statValue, TENDER_CHAIN, toKobo, toOptions, uploadStagedFiles, weighted,
} from '../shared/bizUtils';

const EXPORT_COLUMNS = [
  { label: 'Opportunity ID', value: (o) => o.opportunityId },
  { label: 'Title', value: (o) => o.title },
  { label: 'Client', value: (o) => o.clientName },
  { label: 'Type', value: (o) => o.opportunityType },
  { label: 'Stage', value: (o) => stageLabel('opportunity', o.stage) },
  { label: 'Priority', value: (o) => o.priority },
  { label: 'Estimated Value (NGN)', value: (o) => csvMoney(o.estimatedValue) },
  { label: 'Probability (%)', value: (o) => o.probability },
  { label: 'Weighted Value (NGN)', value: (o) => csvMoney(o.weightedValue) },
  { label: 'Expected Close', value: (o) => dateOnly(o.expectedCloseDate) },
  { label: 'BD Officer', value: (o) => o.bdOfficerName },
];

const nextStage = (stage) => {
  const i = OPPORTUNITY_CHAIN.findIndex((s) => s.value === stage);
  return i >= 0 && i < OPPORTUNITY_CHAIN.length - 1 ? OPPORTUNITY_CHAIN[i + 1] : null;
};
const previousStage = (stage) => {
  const i = OPPORTUNITY_CHAIN.findIndex((s) => s.value === stage);
  return i > 0 ? OPPORTUNITY_CHAIN[i - 1] : null;
};
const isOpen = (o) => OPPORTUNITY_CHAIN.some((s) => s.value === o.stage);

function OpportunityFormModal({ opportunity, clientId, clients, officers, onClose, onSaved }) {
  const editing = Boolean(opportunity);
  const [form, setForm] = useState(() => ({
    title: opportunity?.title || '',
    clientId: opportunity?.clientId || clientId || '',
    opportunityType: opportunity?.opportunityType || 'Tender',
    estimatedValue: opportunity ? fromKobo(opportunity.estimatedValue) : '',
    probability: opportunity ? String(opportunity.probability) : '0',
    stage: opportunity?.stage || 'lead',
    bdOfficerId: opportunity?.bdOfficerId || '',
    expectedCloseDate: dateOnly(opportunity?.expectedCloseDate),
    priority: opportunity?.priority || 'Medium',
    description: opportunity?.description || '',
  }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const client = clients.find((c) => c._id === form.clientId);
  const estimated = toKobo(form.estimatedValue);
  const weightedValue = Number.isNaN(estimated) ? null : weighted(estimated, form.probability);

  const submit = async () => {
    const next = {};
    const probability = Number(form.probability);
    if (!form.title.trim()) next.title = 'Enter the opportunity title';
    if (!form.clientId) next.clientId = 'Choose the client';
    if (Number.isNaN(estimated)) next.estimatedValue = 'Enter the estimated value, for example 280000000';
    if (form.probability === '' || Number.isNaN(probability) || probability < 0 || probability > 100) next.probability = 'Enter a probability between 0 and 100';
    if (!form.bdOfficerId) next.bdOfficerId = 'Choose the BD officer';
    if (!form.expectedCloseDate) next.expectedCloseDate = 'Choose the expected close date';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = {
      title: form.title.trim(), clientId: form.clientId, opportunityType: form.opportunityType, estimatedValue: estimated, probability,
      bdOfficerId: form.bdOfficerId, expectedCloseDate: form.expectedCloseDate, priority: form.priority, stage: form.stage,
      ...(form.description.trim() || editing ? { description: form.description.trim() } : {}),
    };
    setBusy(true);
    setError('');
    try {
      if (editing) await opportunityService.update(opportunity._id, body);
      else await opportunityService.create(body);
      onSaved(editing ? 'Opportunity updated successfully' : 'Opportunity added successfully');
    } catch (err) {
      setError(apiError(err, 'The opportunity could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Opportunity' : 'Add Opportunity'}
      subtitle={editing ? undefined : 'Create a new sales opportunity linked to a client'}
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Opportunity'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Opportunity title" required error={errors.title}><Input value={form.title} onChange={(e) => set('title', e.target.value)} error={Boolean(errors.title)} /></Field>
          <Field label="Client" required error={errors.clientId}>
            <Choice value={form.clientId} onChange={(v) => set('clientId', v)} options={toOptions(clients, 'clientName')} placeholder="Select a client" searchable error={errors.clientId} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Sector" help="Taken from the client"><Input value={client?.sector || opportunity?.clientSector || '—'} disabled readOnly /></Field>
          <Field label="Opportunity type" required><Choice value={form.opportunityType} onChange={(v) => set('opportunityType', v)} options={plainOptions(OPPORTUNITY_TYPES)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Estimated value (₦)" required error={errors.estimatedValue}><MoneyInput value={form.estimatedValue} onChange={(v) => set('estimatedValue', v)} error={errors.estimatedValue} /></Field>
          <Field label="Weighted value (₦)" help="Estimated value × probability"><Input value={weightedValue == null ? '—' : money(weightedValue)} disabled readOnly /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Probability (%)" required error={errors.probability}><Input type="number" min="0" max="100" value={form.probability} onChange={(e) => set('probability', e.target.value)} error={Boolean(errors.probability)} /></Field>
          <Field label="Stage" required><Choice value={form.stage} onChange={(v) => set('stage', v)} options={OPPORTUNITY_CHAIN} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="BD officer" required error={errors.bdOfficerId}><Choice value={form.bdOfficerId} onChange={(v) => set('bdOfficerId', v)} options={officers} placeholder="Select an officer" searchable error={errors.bdOfficerId} /></Field>
          <Field label="Expected close date" required error={errors.expectedCloseDate}><DatePicker value={form.expectedCloseDate} onChange={(e) => set('expectedCloseDate', e.target.value)} /></Field>
        </TwoCol>
        <Field label="Priority"><Choice value={form.priority} onChange={(v) => set('priority', v)} options={plainOptions(PRIORITIES)} /></Field>
        <Field label="Description" error={errors.description}><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add description…" /></Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function CreateTenderModal({ opportunity, officers, onClose, onDone }) {
  const [form, setForm] = useState(() => ({
    tenderName: opportunity.title, clientTenderRef: '', estimatedValue: fromKobo(opportunity.estimatedValue), stage: 'received', receivedDate: '', submissionDeadline: '',
    bdOfficerId: opportunity.bdOfficerId || '', priority: opportunity.priority || 'Medium', description: opportunity.description || '',
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
    if (!form.clientTenderRef.trim()) next.clientTenderRef = 'Enter the client tender reference';
    if (Number.isNaN(value)) next.estimatedValue = 'Enter the estimated value';
    if (!form.bdOfficerId) next.bdOfficerId = 'Choose the BD officer';
    if (form.receivedDate && form.submissionDeadline && form.receivedDate > form.submissionDeadline) next.receivedDate = 'The received date must be on or before the deadline';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      const res = await opportunityService.convertToTender(opportunity._id, {
        tenderName: form.tenderName.trim(), clientTenderRef: form.clientTenderRef.trim(), estimatedValue: value, stage: form.stage, bdOfficerId: form.bdOfficerId, priority: form.priority,
        ...(form.receivedDate ? { receivedDate: form.receivedDate } : {}), ...(form.submissionDeadline ? { submissionDeadline: form.submissionDeadline } : {}),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      let note = '';
      const tenderId = res.data?.data?.tenderId;
      if (files.length && tenderId) {
        const failed = await uploadStagedFiles(tenderService, tenderId, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onDone(`Tender created from opportunity successfully.${note}`);
    } catch (err) {
      setError(apiError(err, 'The tender could not be created'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create Tender for this Opportunity"
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save Tender'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Tender name" required error={errors.tenderName}><Input value={form.tenderName} onChange={(e) => set('tenderName', e.target.value)} error={Boolean(errors.tenderName)} /></Field>
          <Field label="Tender reference" required error={errors.clientTenderRef}><Input value={form.clientTenderRef} onChange={(e) => set('clientTenderRef', e.target.value)} placeholder="e.g TOTAL/FPSO/2026/014" error={Boolean(errors.clientTenderRef)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Related opportunity"><Input value={`${opportunity.opportunityId} ${opportunity.title}`} disabled readOnly /></Field>
          <Field label="Client"><Input value={opportunity.clientName || ''} disabled readOnly /></Field>
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
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Attach documents"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function OpportunityDrawer({ opportunityId, refreshKey, perms, onClose, onAdvance, onEdit, onTenderModal, onLost, onViewTender, onViewInteractions }) {
  const [tab, setTab] = useState('details');
  const { record: o, error, loading } = useRecord(opportunityService, opportunityId, refreshKey);
  const next = o ? nextStage(o.stage) : null;
  return (
    <Drawer isOpen onClose={onClose} title={o?.clientName || 'Opportunity'} subtitle={o ? `${o.clientSector || '—'} • ${o.bdOfficerName || '—'}` : ''} width="600px">
      <DataState loading={loading} error={error} empty={!o}>
        {o && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Strip>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>Stage: <StageBadge kind="opportunity" stage={o.stage} /></span>
              <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                {perms.update && next && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onAdvance(o)}>Mark as {next.label}</PrimaryButton>}
                {perms.decide && o.stage === 'qualified' && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => onTenderModal(o)}>Create Tender</PrimaryButton>}
                {perms.update && isOpen(o) && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(o)}>Edit</SecondaryButton>}
                {perms.decide && isOpen(o) && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onLost(o)}>Mark as Lost</SecondaryButton>}
                {o.stage === 'converted_to_tender' && o.relatedTender && perms.tenders && <PrimaryButton icon={<FiEye size={14} />} onClick={() => onViewTender(o.relatedTender._id)}>View Tender</PrimaryButton>}
                {o.stage === 'converted_to_tender' && perms.interactions && <SecondaryButton icon={<FiEye size={14} />} onClick={() => onViewInteractions(o.clientId)}>View Client Interactions</SecondaryButton>}
              </span>
            </Strip>
            <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'documents', label: 'Documents' }, { id: 'activity', label: 'Activity Log' }]} active={tab} onChange={setTab} />
            {tab === 'details' && (
              <>
                <DetailGrid items={[
                  ['Title', o.title], ['Client', o.clientName], ['Sector', o.clientSector], ['Opportunity type', o.opportunityType],
                  ['Estimated value', money(o.estimatedValue)], ['Weighted value', money(o.weightedValue)], ['Probability (%)', `${o.probability}%`], ['Priority', o.priority],
                  ['BD officer', o.bdOfficerName], ['Expected close date', formatDate(o.expectedCloseDate)], ['Created date', formatDate(o.createdAt)],
                  o.stage === 'lost' ? ['Reason for loss', o.reasonForLoss] : null,
                ]}
                />
                {o.description && <Panel title="Description">{o.description}</Panel>}
                {o.relatedTender && (
                  <DetailGrid items={[['Related tender', o.relatedTender.clientTenderRef || o.relatedTender.tenderId], ['Status', stageLabel('tender', o.relatedTender.stage)], ['Interactions', o.interactionsCount]]} />
                )}
              </>
            )}
            {tab === 'documents' && <DocumentTable api={opportunityService} id={o._id} canUpload={perms.update || perms.create} canRemove={perms.update} />}
            {tab === 'activity' && <HistoryList api={opportunityService} id={o._id} refreshKey={refreshKey} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

function BoardCard({ o, perms, onOpen, onMove }) {
  const days = daysUntil(o.expectedCloseDate);
  const prev = previousStage(o.stage);
  const next = nextStage(o.stage);
  const canForward = perms.update && (next || (o.stage === 'qualified' && perms.decide));
  return (
    <div onClick={() => onOpen(o)} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.35 }}>{o.title}</div>
      <div style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '2px 0 8px' }}>{o.clientName}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1D4ED8' }}>{compactMoney(o.estimatedValue)}</div>
      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Weighted {compactMoney(o.weightedValue)} • {o.probability}%</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.78rem', color: '#475569' }}><FiCalendar size={13} />{formatDate(o.expectedCloseDate)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '0.78rem', color: '#475569' }}><FiUser size={13} />{o.bdOfficerName || '—'}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: '0.7rem', color: days != null && days < 0 ? '#DC2626' : '#94A3B8' }}>
          {days == null ? '' : days < 0 ? `${-days} days overdue` : `${days} days`}
        </span>
        <PriorityBadge priority={o.priority} />
      </div>
      {isOpen(o) && (prev || canForward) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10, borderTop: '1px solid #F1F5F9', paddingTop: 8 }} onClick={(e) => e.stopPropagation()}>
          {perms.update && prev && <button type="button" className="icon-btn" title={`Move back to ${prev.label}`} onClick={() => onMove(o, 'back')}><FiArrowLeft size={14} /></button>}
          {canForward && <button type="button" className="icon-btn" title={next ? `Move to ${next.label}` : 'Create tender'} onClick={() => onMove(o, 'forward')}><FiArrowRight size={14} /></button>}
        </div>
      )}
    </div>
  );
}

function Board({ params, nonce, perms, onOpen, onMove }) {
  const { data, error, loading } = useFetched(() => opportunityService.board(params), JSON.stringify(params), nonce);
  const board = Array.isArray(data) ? {} : data;
  return (
    <div style={{ padding: '0 24px 20px' }}>
      <DataState loading={loading} error={error} empty={false}>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
          {OPPORTUNITY_STAGES.map((stage) => {
            const cards = board[stage.value] || [];
            const total = cards.reduce((sum, o) => sum + o.estimatedValue, 0);
            return (
              <div key={stage.value} style={{ minWidth: 270, flex: '0 0 270px', background: '#F1F5F9', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{stage.label}</span>
                  <span style={{ background: '#1E3A8A', color: '#fff', borderRadius: 999, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{cards.length}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 10px' }}>{compactMoney(total)} total</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cards.map((o) => <BoardCard key={o._id} o={o} perms={perms} onOpen={onOpen} onMove={onMove} />)}
                  {!cards.length && <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.78rem', padding: '16px 0' }}>No opportunities</div>}
                </div>
              </div>
            );
          })}
        </div>
      </DataState>
    </div>
  );
}

export default function OpportunitiesTab({ notify, initialNewForClient = '', onViewInteractions }) {
  const navigate = useNavigate();
  const perms = {
    create: usePermission('businessdev.opportunity.create'),
    update: usePermission('businessdev.opportunity.update'),
    decide: usePermission('businessdev.opportunity.decide'),
    export: usePermission('businessdev.opportunity.export'),
    tenders: usePermission('businessdev.tender.view'),
    interactions: usePermission('businessdev.interaction.view'),
  };
  const list = useBizList(opportunitiesSlice, { initialFilters: { stage: '', opportunityType: '', priority: '', bdOfficer: '', clientId: '' } });
  const selection = useSelection();
  const exporter = useExport(opportunityService, list, selection, EXPORT_COLUMNS, 'opportunities.csv');
  const run = useRunAction(opportunitiesSlice);
  const { lookups } = useBizLookups(['clients', 'officers']);
  const clients = lookups.clients || [];
  const officers = toOptions(lookups.officers, 'fullName');

  const [view, setView] = useState('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState(() => (initialNewForClient ? { opportunity: null, clientId: initialNewForClient } : null));
  const [viewId, setViewId] = useState(null);
  const [tenderFor, setTenderFor] = useState(null);
  const [lostFor, setLostFor] = useState(null);
  const [lostError, setLostError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = () => { setNonce((n) => n + 1); list.reload(); selection.clear(); };
  const saved = (message) => { setForm(null); notify(message); refresh(); };

  const advance = async (o) => {
    const result = await run('advance', o._id);
    if (!result.ok) { notify(result.error, 'error'); return; }
    notify(`Opportunity moved to ${stageLabel('opportunity', result.data?.stage)}`);
    refresh();
  };

  const move = async (o, direction) => {
    if (direction === 'forward') {
      if (nextStage(o.stage)) await advance(o);
      else setTenderFor(o);
      return;
    }
    const prev = previousStage(o.stage);
    const result = await run('update', o._id, { stage: prev.value });
    if (!result.ok) { notify(result.error, 'error'); return; }
    notify(`Opportunity moved back to ${prev.label}`);
    refresh();
  };

  const markLost = async (reason) => {
    setBusy(true);
    setLostError('');
    const result = await run('markLost', lostFor._id, reason);
    setBusy(false);
    if (!result.ok) { setLostError(result.error); return; }
    setLostFor(null);
    notify('Opportunity marked as lost');
    refresh();
  };

  const tiles = [
    { label: 'TOTAL OPPORTUNITIES', value: statValue(list.stats, 'total_opportunities'), sub: 'All opportunities', icon: <FiTarget size={16} />, tone: 'blue' },
    { label: 'PIPELINE VALUE', value: compactMoney(statValue(list.stats, 'pipeline_value')), sub: 'Open deal value', icon: <FiTrendingUp size={16} />, tone: 'amber' },
    { label: 'SUBMITTED', value: statValue(list.stats, 'submitted_bids'), sub: 'Live bids with client', icon: <FiFileText size={16} />, tone: 'purple' },
    { label: 'WON OPPORTUNITIES', value: compactMoney(statValue(list.stats, 'won_value_ytd')), sub: 'Year-to-date wins', icon: <FiAward size={16} />, tone: 'green' },
  ];

  const menuFor = (o) => {
    const next = nextStage(o.stage);
    if (o.stage === 'converted_to_tender') {
      return [
        ...(perms.tenders && o.relatedTenderId ? [{ label: 'View Tender', icon: <FiEye size={13} />, action: () => navigate(`/bizdev/tenders?open=${o.relatedTenderId}`) }] : []),
        ...(perms.interactions ? [{ label: 'View Client Interactions', icon: <FiEye size={13} />, action: () => onViewInteractions(o.clientId) }] : []),
      ];
    }
    if (!isOpen(o)) return [];
    return [
      ...(perms.update ? [{ label: 'Edit Opportunity', icon: <FiEdit size={13} />, action: () => setForm({ opportunity: o }) }] : []),
      ...(perms.update && next ? [{ label: `Mark as ${next.label}`, icon: <FiCheck size={13} />, action: () => advance(o) }] : []),
      ...(perms.decide && o.stage === 'qualified' ? [{ label: 'Create Tender', icon: <FiPlus size={13} />, action: () => setTenderFor(o) }] : []),
      ...(perms.decide ? [{ label: 'Mark as Lost', icon: <FiX size={13} />, color: '#DC2626', action: () => { setLostError(''); setLostFor(o); } }] : []),
    ];
  };

  const columns = [
    { key: 'title', label: 'OPPORTUNITY', render: (o) => <TwoLine primary={o.title} secondary={o.opportunityId} /> },
    { key: 'client', label: 'CLIENT', render: (o) => o.clientName || '—' },
    { key: 'stage', label: 'STAGE', render: (o) => <StageBadge kind="opportunity" stage={o.stage} /> },
    { key: 'value', label: 'ESTIMATED VALUE', render: (o) => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{compactMoney(o.estimatedValue)}</span> },
    { key: 'probability', label: 'PROBABILITY', render: (o) => <ProbabilityBar value={o.probability} /> },
    { key: 'close', label: 'EXPECTED CLOSE', render: (o) => formatDate(o.expectedCloseDate) },
    { key: 'officer', label: 'BD OFFICER', render: (o) => o.bdOfficerName || '—' },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (o) => {
        const items = menuFor(o);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="icon-btn" title="View opportunity" onClick={() => setViewId(o._id)}><FiEye size={15} /></button>
            {items.length > 0 && <RowMenu items={items} />}
          </div>
        );
      },
    },
  ];

  const filterFields = [
    { key: 'stage', label: 'Stage', options: OPPORTUNITY_STAGES },
    { key: 'opportunityType', label: 'Opportunity type', options: plainOptions(OPPORTUNITY_TYPES) },
    { key: 'priority', label: 'Priority', options: plainOptions(PRIORITIES) },
    { key: 'bdOfficer', label: 'BD officer', options: officers },
    { key: 'clientId', label: 'Client', options: toOptions(clients, 'clientName') },
  ];

  const boardParams = (() => {
    const rest = { ...list.exportParams };
    delete rest.stage;
    return rest;
  })();

  const viewToggle = (
    <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
      {[{ key: 'kanban', icon: <FiGrid size={15} />, label: 'Board' }, { key: 'list', icon: <FiList size={15} />, label: 'List' }].map((v) => (
        <button
          key={v.key}
          type="button"
          title={`${v.label} view`}
          onClick={() => setView(v.key)}
          style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: view === v.key ? '#1E3A8A' : 'transparent', color: view === v.key ? '#fff' : '#64748B' }}
        >
          {v.icon}
        </button>
      ))}
    </div>
  );

  const toolbar = (
    <ListToolbar
      search={list.searchText}
      onSearch={list.onSearch}
      placeholder="Search opportunities..."
      onFilter={() => setFilterOpen(true)}
      filterCount={countFilters(list.filters)}
      onExport={perms.export ? async () => { const m = await exporter.run(); notify(m || 'Opportunities exported', m ? 'error' : 'success'); } : undefined}
      exporting={exporter.exporting}
      selectedCount={exporter.selectedCount}
    >
      {perms.create && <PrimaryButton icon={<FiPlus size={15} />} onClick={() => setForm({ opportunity: null })}>Opportunity</PrimaryButton>}
      {viewToggle}
    </ListToolbar>
  );

  return (
    <>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />
      {view === 'list' ? (
        <ListCard list={list} columns={columns} selection={selection} onRowClick={(o) => setViewId(o._id)} emptyText="No opportunities found." toolbar={toolbar} />
      ) : (
        <div className="card" style={{ padding: 0, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
          {toolbar}
          <Board params={boardParams} nonce={nonce} perms={perms} onOpen={(o) => setViewId(o._id)} onMove={move} />
        </div>
      )}
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Opportunities" subtitle="Narrow the pipeline" fields={view === 'kanban' ? filterFields.slice(1) : filterFields} values={list.filters} onApply={list.applyFilters} />
      {form && <OpportunityFormModal opportunity={form.opportunity} clientId={form.clientId} clients={clients} officers={officers} onClose={() => setForm(null)} onSaved={saved} />}
      {tenderFor && <CreateTenderModal opportunity={tenderFor} officers={officers} onClose={() => setTenderFor(null)} onDone={(m) => { setTenderFor(null); notify(m); refresh(); }} />}
      {viewId && (
        <OpportunityDrawer
          key={viewId}
          opportunityId={viewId}
          refreshKey={nonce}
          perms={perms}
          onClose={() => setViewId(null)}
          onAdvance={advance}
          onEdit={(o) => setForm({ opportunity: o })}
          onTenderModal={setTenderFor}
          onLost={(o) => { setLostError(''); setLostFor(o); }}
          onViewTender={(id) => navigate(`/bizdev/tenders?open=${id}`)}
          onViewInteractions={onViewInteractions}
        />
      )}
      {lostFor && (
        <ReasonModal
          title="Mark Opportunity as Lost?"
          message="Are you sure you want to mark this opportunity as lost? This will remove it from the active opportunity pipeline."
          label="Reason for loss"
          confirmLabel="Mark as Lost"
          danger
          busy={busy}
          error={lostError}
          onClose={() => setLostFor(null)}
          onConfirm={markLost}
        />
      )}
    </>
  );
}
