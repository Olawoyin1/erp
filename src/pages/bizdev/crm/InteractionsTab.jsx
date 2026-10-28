import { useState } from 'react';
import { FiMessageSquare, FiCalendar, FiAlertTriangle, FiCheckCircle, FiEye, FiEdit, FiPlus } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { interactionService } from '../../../services/bizdev.service';
import { interactionsSlice } from '../../../store/bizdev/slices';
import { Choice, DataState, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, SecondaryButton, StatTiles, TabBar, TwoCol } from '../../procurement/shared/ProcUi';
import { useBizList, useBizLookups, useExport, useRecord, useSelection } from '../shared/bizHooks';
import { DocumentTable, HistoryList, InteractionBadge, Pill, Strip, TwoLine } from '../shared/BizUi';
import { countFilters, dateOnly, fieldErrorsOf, formatDate, INTERACTION_TYPES, plainOptions, statValue, toOptions, today } from '../shared/bizUtils';

const EXPORT_COLUMNS = [
  { label: 'Date', value: (i) => dateOnly(i.date) },
  { label: 'Client', value: (i) => i.clientName },
  { label: 'Primary Contact', value: (i) => i.primaryContact },
  { label: 'Email', value: (i) => i.email },
  { label: 'Type', value: (i) => i.type },
  { label: 'BD Officer', value: (i) => i.bdOfficerName },
  { label: 'Follow-up Required', value: (i) => (i.followUpRequired ? 'Yes' : 'No') },
  { label: 'Follow-up Date', value: (i) => dateOnly(i.followUpDate) },
  { label: 'Summary', value: (i) => i.summary },
];

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

function InteractionFormModal({ interaction, parent, clients, officers, defaultClientId, onClose, onSaved }) {
  const editing = Boolean(interaction);
  const followUp = Boolean(parent);
  const source = interaction || null;
  const [form, setForm] = useState(() => ({
    clientId: source?.clientId || parent?.clientId || defaultClientId || '',
    date: source ? dateOnly(source.date) : followUp ? dateOnly(parent.followUpDate) || today() : today(),
    primaryContact: source?.primaryContact || parent?.primaryContact || '',
    email: source?.email || parent?.email || '',
    type: source?.type || (followUp ? parent.type : 'Meeting'),
    bdOfficerId: source?.bdOfficerId || parent?.bdOfficerId || '',
    followUp: source?.followUpRequired ? 'yes' : 'no',
    followUpDate: dateOnly(source?.followUpDate),
    purpose: source?.purpose || '',
    summary: source?.summary || '',
  }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const clientOf = (id) => clients.find((c) => c._id === id);

  const pickClient = (id) => {
    const c = clientOf(id);
    setForm((f) => ({ ...f, clientId: id, primaryContact: c?.primaryContact || f.primaryContact, email: c?.email || f.email, bdOfficerId: f.bdOfficerId || c?.bdOfficerId || '' }));
  };

  const submit = async () => {
    const next = {};
    if (!form.clientId) next.clientId = 'Choose the client';
    if (!form.date) next.date = 'Choose the date';
    if (!form.primaryContact.trim()) next.primaryContact = 'Enter the primary contact';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.bdOfficerId) next.bdOfficerId = 'Choose the BD officer';
    if (!form.summary.trim()) next.summary = 'Write a short summary';
    if (!followUp && form.followUp === 'yes' && !form.followUpDate) next.followUpDate = 'Choose the follow-up date';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = {
      date: form.date, primaryContact: form.primaryContact.trim(), email: form.email.trim(), type: form.type, bdOfficerId: form.bdOfficerId, summary: form.summary.trim(),
      ...(followUp ? { purpose: form.purpose.trim() || undefined } : { followUpRequired: form.followUp === 'yes', followUpDate: form.followUp === 'yes' ? form.followUpDate : undefined }),
    };
    setBusy(true);
    setError('');
    try {
      if (followUp) await interactionService.followUp(parent._id, body);
      else if (editing) await interactionService.update(interaction._id, body);
      else await interactionService.create({ ...body, clientId: form.clientId });
      onSaved(followUp ? 'Follow-up interaction logged successfully' : editing ? 'Interaction updated successfully' : 'Interaction logged successfully');
    } catch (err) {
      setError(apiError(err, 'The interaction could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  const clientName = clientOf(form.clientId)?.clientName || interaction?.clientName || parent?.clientName || '';
  const title = followUp ? 'Add Follow-up Interaction' : editing ? 'Edit Interaction' : 'Add New Interaction';

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={title}
      subtitle={followUp ? 'Schedule a follow-up interaction linked to the previous engagement' : editing ? undefined : 'Log a client interaction to track engagement and follow-ups'}
      width="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : followUp ? 'Save Follow-Up' : editing ? 'Save Changes' : 'Save Interaction'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Client" required error={errors.clientId}>
            {editing || followUp
              ? <Input value={clientName} disabled readOnly />
              : <Choice value={form.clientId} onChange={pickClient} options={toOptions(clients, 'clientName')} placeholder="e.g Crane Global" searchable error={errors.clientId} />}
          </Field>
          {!followUp && (
            <Field label="Date" required error={errors.date}><DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
          )}
          {followUp && (
            <Field label="Primary contact" required><Input value={form.primaryContact} disabled readOnly /></Field>
          )}
        </TwoCol>
        {!followUp && (
          <TwoCol>
            <Field label="Primary contact" required error={errors.primaryContact}><Input value={form.primaryContact} onChange={(e) => set('primaryContact', e.target.value)} placeholder="e.g Jane Doe" error={Boolean(errors.primaryContact)} /></Field>
            <Field label="Email" required error={errors.email}><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="e.g jane@crane.com" error={Boolean(errors.email)} /></Field>
          </TwoCol>
        )}
        {followUp && (
          <Panel title="Summary from previous interaction">{parent.summary}</Panel>
        )}
        <TwoCol>
          <Field label="Type"><Choice value={form.type} onChange={(v) => set('type', v)} options={plainOptions(INTERACTION_TYPES)} /></Field>
          {followUp
            ? <Field label="Follow-up date" required error={errors.date}><DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
            : <Field label="BD officer" required error={errors.bdOfficerId}><Choice value={form.bdOfficerId} onChange={(v) => set('bdOfficerId', v)} options={officers} placeholder="Select an officer" searchable error={errors.bdOfficerId} /></Field>}
        </TwoCol>
        {followUp && (
          <>
            <Field label="Email" required error={errors.email}><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={Boolean(errors.email)} /></Field>
            <Field label="BD officer" required error={errors.bdOfficerId}><Choice value={form.bdOfficerId} onChange={(v) => set('bdOfficerId', v)} options={officers} placeholder="Select an officer" searchable error={errors.bdOfficerId} /></Field>
            <Field label="Purpose" error={errors.purpose}><Input value={form.purpose} onChange={(e) => set('purpose', e.target.value)} placeholder="e.g Share proposal" /></Field>
          </>
        )}
        {!followUp && (
          <TwoCol>
            <Field label="Follow-up"><Choice value={form.followUp} onChange={(v) => set('followUp', v)} options={YES_NO} /></Field>
            <Field label="Follow-up date" required={form.followUp === 'yes'} error={errors.followUpDate}>
              <DatePicker value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} disabled={form.followUp !== 'yes'} />
            </Field>
          </TwoCol>
        )}
        <Field label="Summary" required error={errors.summary}>
          <Textarea rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="e.g Discussed FPSO maintenance scope and PGSL capability presentation" error={Boolean(errors.summary)} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function InteractionDrawer({ interactionId, refreshKey, canEdit, canFollowUp, canUpload, onClose, onEdit, onFollowUp }) {
  const [tab, setTab] = useState('details');
  const { record: i, error, loading } = useRecord(interactionService, interactionId, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title={i?.clientName || 'Interaction'} subtitle={i ? `${i.clientSector || '—'} • ${i.bdOfficerName || '—'}` : ''} width="600px">
      <DataState loading={loading} error={error} empty={!i}>
        {i && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Strip>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>Interaction: <InteractionBadge type={i.type} /></span>
              <span style={{ display: 'inline-flex', gap: 8 }}>
                {canFollowUp && i.followUpRequired && !i.followUpLogged && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => onFollowUp(i)}>Add Follow-up</PrimaryButton>}
                {canEdit && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(i)}>Edit</SecondaryButton>}
              </span>
            </Strip>
            <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'documents', label: 'Documents' }, { id: 'activity', label: 'Activity Log' }]} active={tab} onChange={setTab} />
            {tab === 'details' && (
              <>
                <DetailGrid items={[
                  ['Client', i.clientName], ['Date', formatDate(i.date)], ['Primary contact', i.primaryContact], ['Email', i.email],
                  ['Follow-up', i.followUpRequired ? 'Yes' : 'No'], ['Follow-up date', i.followUpDate ? formatDate(i.followUpDate) : '—'], ['BD officer', i.bdOfficerName],
                ]}
                />
                <Panel title={i.parent ? 'Summary' : 'Summary from previous meeting'}>{i.summary}</Panel>
                {i.parent && (
                  <Panel title="Follow-up to">
                    {i.parent.type} on {formatDate(i.parent.date)}: {i.parent.summary}
                  </Panel>
                )}
                {(i.followUps || []).map((f) => (
                  <div key={f._id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <DetailGrid items={[['Follow-up date', formatDate(f.date)], ['Follow-up type', f.type], ['Purpose', f.purpose], ['Logged by', f.bdOfficerName]]} />
                    <Panel title="Summary from follow-up meeting">{f.summary}</Panel>
                  </div>
                ))}
              </>
            )}
            {tab === 'documents' && <DocumentTable api={interactionService} id={i._id} canUpload={canUpload} canRemove={canUpload} />}
            {tab === 'activity' && <HistoryList api={interactionService} id={i._id} refreshKey={refreshKey} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

export default function InteractionsTab({ notify, initialClientId = '' }) {
  const canCreate = usePermission('businessdev.interaction.create');
  const canUpdate = usePermission('businessdev.interaction.update');
  const list = useBizList(interactionsSlice, { initialFilters: { type: '', followUpRequired: '', bdOfficer: '', clientId: initialClientId, dateFrom: '', dateTo: '' } });
  const selection = useSelection();
  const exporter = useExport(interactionService, list, selection, EXPORT_COLUMNS, 'interactions.csv');
  const { lookups } = useBizLookups(['clients', 'officers']);
  const clients = lookups.clients || [];
  const officers = toOptions(lookups.officers, 'fullName');

  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [nonce, setNonce] = useState(0);

  const saved = (message) => { setForm(null); setNonce((n) => n + 1); notify(message); list.reload(); selection.clear(); };

  const tiles = [
    { label: 'TOTAL INTERACTIONS', value: statValue(list.stats, 'total_interactions'), sub: 'All recorded engagements', icon: <FiMessageSquare size={16} />, tone: 'blue' },
    { label: 'THIS MONTH', value: statValue(list.stats, 'this_month'), sub: 'Recent activity volume', icon: <FiCalendar size={16} />, tone: 'purple' },
    { label: 'PENDING FOLLOW-UPS', value: statValue(list.stats, 'pending_follow_ups'), sub: 'Actions awaiting response', icon: <FiAlertTriangle size={16} />, tone: 'amber' },
    { label: 'MEETINGS COMPLETED', value: statValue(list.stats, 'meetings_completed'), sub: 'Successful client meetings', icon: <FiCheckCircle size={16} />, tone: 'green' },
  ];

  const columns = [
    { key: 'date', label: 'DATE', render: (i) => formatDate(i.date) },
    { key: 'client', label: 'CLIENT NAME', render: (i) => <TwoLine primary={i.clientName} secondary={i.primaryContact} /> },
    { key: 'type', label: 'TYPE', render: (i) => <InteractionBadge type={i.type} /> },
    { key: 'summary', label: 'SUMMARY', render: (i) => <span style={{ display: 'inline-block', maxWidth: 280 }}>{i.summary}</span> },
    { key: 'officer', label: 'BD OFFICER', render: (i) => i.bdOfficerName || '—' },
    { key: 'followUp', label: 'FOLLOW-UP', render: (i) => <Pill tone={i.followUpRequired ? (i.followUpLogged ? 'green' : 'amber') : 'blue'}>{i.followUpRequired ? 'Yes' : 'No'}</Pill> },
    { key: 'followUpDate', label: 'FOLLOW-UP DATE', render: (i) => (i.followUpDate ? formatDate(i.followUpDate) : '—') },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (i) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="icon-btn" title="View interaction" onClick={() => setViewId(i._id)}><FiEye size={15} /></button>
          {(canUpdate || (canCreate && i.followUpRequired && !i.followUpLogged)) && (
            <RowMenu items={[
              ...(canUpdate ? [{ label: 'Edit Interaction', icon: <FiEdit size={13} />, action: () => setForm({ interaction: i }) }] : []),
              ...(canCreate && i.followUpRequired && !i.followUpLogged ? [{ label: 'Add Follow-up', icon: <FiPlus size={13} />, action: () => setForm({ parent: i }) }] : []),
            ]}
            />
          )}
        </div>
      ),
    },
  ];

  const filterFields = [
    { key: 'type', label: 'Type', options: plainOptions(INTERACTION_TYPES) },
    { key: 'followUpRequired', label: 'Follow-up', options: [{ value: 'true', label: 'Follow-up required' }, { value: 'false', label: 'No follow-up' }] },
    { key: 'bdOfficer', label: 'BD officer', options: officers },
    { key: 'clientId', label: 'Client', options: toOptions(clients, 'clientName') },
    { key: 'dateFrom', label: 'From date', type: 'date' },
    { key: 'dateTo', label: 'To date', type: 'date' },
  ];

  return (
    <>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />
      <ListCard
        list={list}
        columns={columns}
        selection={selection}
        onRowClick={(i) => setViewId(i._id)}
        emptyText="No interactions found."
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search interactions..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={async () => { const m = await exporter.run(); notify(m || 'Interactions exported', m ? 'error' : 'success'); }}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={15} />} onClick={() => setForm({ interaction: null })}>Log Interaction</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Interactions" subtitle="Narrow the interaction log" fields={filterFields} values={list.filters} onApply={list.applyFilters} />
      {form && (
        <InteractionFormModal
          interaction={form.interaction}
          parent={form.parent}
          clients={clients}
          officers={officers}
          defaultClientId={initialClientId}
          onClose={() => setForm(null)}
          onSaved={saved}
        />
      )}
      {viewId && (
        <InteractionDrawer
          key={viewId}
          interactionId={viewId}
          refreshKey={nonce}
          canEdit={canUpdate}
          canFollowUp={canCreate}
          canUpload={canCreate || canUpdate}
          onClose={() => setViewId(null)}
          onEdit={(i) => setForm({ interaction: i })}
          onFollowUp={(i) => setForm({ parent: i })}
        />
      )}
    </>
  );
}
