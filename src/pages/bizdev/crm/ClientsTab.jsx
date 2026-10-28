import { useState } from 'react';
import { FiUsers, FiUserPlus, FiCheckCircle, FiAlertTriangle, FiEye, FiEdit, FiArchive, FiPlus, FiRotateCcw } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import RowMenu from '../../../components/ui/RowMenu';
import { Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { clientService } from '../../../services/bizdev.service';
import { clientsSlice } from '../../../store/bizdev/slices';
import { Choice, DataState, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, ReasonModal, SecondaryButton, SimpleTable, StatTiles, TabBar, TwoCol } from '../../procurement/shared/ProcUi';
import { useBizList, useBizLookups, useExport, useFetched, useRecord, useRunAction, useSelection } from '../shared/bizHooks';
import { InteractionBadge, NotesPanel, RelationshipBadge, StageBadge, Strip } from '../shared/BizUi';
import { compactMoney, countFilters, fieldErrorsOf, formatDate, plainOptions, RELATIONSHIPS, statValue, toOptions } from '../shared/bizUtils';

const EXPORT_COLUMNS = [
  { label: 'Client ID', value: (c) => c.clientId },
  { label: 'Client Name', value: (c) => c.clientName },
  { label: 'Sector', value: (c) => c.sector },
  { label: 'Primary Contact', value: (c) => c.primaryContact },
  { label: 'Email', value: (c) => c.email },
  { label: 'Phone', value: (c) => c.phone },
  { label: 'BD Officer', value: (c) => c.bdOfficerName },
  { label: 'Relationship', value: (c) => c.relationship },
  { label: 'Status', value: (c) => c.status },
  { label: 'Active Tenders', value: (c) => c.activeTenders },
  { label: 'Active Projects', value: (c) => c.activeProjects },
  { label: 'Last Interaction', value: (c) => (c.lastInteractionAt ? String(c.lastInteractionAt).slice(0, 10) : '') },
];

const EMPTY = { clientName: '', sector: '', primaryContact: '', email: '', phone: '', companyAddress: '', bdOfficerId: '', relationship: 'Warm', relationshipHistory: '' };

function ClientFormModal({ client, officers, onClose, onSaved }) {
  const editing = Boolean(client);
  const [form, setForm] = useState(() => (client
    ? {
        clientName: client.clientName || '', sector: client.sector || '', primaryContact: client.primaryContact || '', email: client.email || '', phone: client.phone || '',
        companyAddress: client.companyAddress || '', bdOfficerId: client.bdOfficerId || '', relationship: client.relationship || 'Warm', relationshipHistory: client.relationshipHistory || '',
      }
    : EMPTY));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const next = {};
    if (!form.clientName.trim()) next.clientName = 'Enter the client name';
    if (!form.sector.trim()) next.sector = 'Enter the sector, for example Oil & Gas';
    if (!form.primaryContact.trim()) next.primaryContact = 'Enter the primary contact';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.phone.trim()) next.phone = 'Enter the phone number';
    if (!form.bdOfficerId) next.bdOfficerId = 'Choose the BD officer';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = {
      clientName: form.clientName.trim(), sector: form.sector.trim(), primaryContact: form.primaryContact.trim(), email: form.email.trim(), phone: form.phone.trim(),
      bdOfficerId: form.bdOfficerId, relationship: form.relationship,
      ...(form.companyAddress.trim() ? { companyAddress: form.companyAddress.trim() } : {}),
      ...(form.relationshipHistory.trim() ? { relationshipHistory: form.relationshipHistory.trim() } : {}),
    };
    setBusy(true);
    setError('');
    try {
      if (editing) await clientService.update(client._id, body);
      else await clientService.create(body);
      onSaved(editing ? 'Client updated successfully' : 'Client logged successfully');
    } catch (err) {
      setError(apiError(err, 'The client could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Client' : 'Add New Client'}
      subtitle={editing ? undefined : 'Register a client to track interactions and opportunities'}
      width="640px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Log Client'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Client name" required error={errors.clientName}><Input value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g Crane Global" error={Boolean(errors.clientName)} /></Field>
          <Field label="Sector" required error={errors.sector}><Input value={form.sector} onChange={(e) => set('sector', e.target.value)} placeholder="e.g Oil & Gas" error={Boolean(errors.sector)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Primary contact" required error={errors.primaryContact}><Input value={form.primaryContact} onChange={(e) => set('primaryContact', e.target.value)} placeholder="e.g Jane Doe" error={Boolean(errors.primaryContact)} /></Field>
          <Field label="Email" required error={errors.email}><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="e.g janedoe@crane.com" error={Boolean(errors.email)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Phone number" required error={errors.phone}><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} error={Boolean(errors.phone)} /></Field>
          <Field label="Company address" error={errors.companyAddress}><Input value={form.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} /></Field>
        </TwoCol>
        {editing && (
          <TwoCol>
            <Field label="Active tenders" help="Counted from the client's open tenders"><Input value={client.activeTenders ?? 0} disabled readOnly /></Field>
            <Field label="Active projects" help="Counted from the client's projects"><Input value={client.activeProjects ?? 0} disabled readOnly /></Field>
          </TwoCol>
        )}
        <TwoCol>
          <Field label="BD officer" required error={errors.bdOfficerId}>
            <Choice value={form.bdOfficerId} onChange={(v) => set('bdOfficerId', v)} options={officers} placeholder="Select an officer" searchable error={errors.bdOfficerId} />
          </Field>
          <Field label="Last interaction" help="Set automatically when an interaction is logged">
            <Input value={editing && client.lastInteractionAt ? formatDate(client.lastInteractionAt) : '—'} disabled readOnly />
          </Field>
        </TwoCol>
        <Field label="Relationship"><Choice value={form.relationship} onChange={(v) => set('relationship', v)} options={plainOptions(RELATIONSHIPS)} /></Field>
        <Field label="Relationship history (optional)" error={errors.relationshipHistory}>
          <Textarea rows={3} value={form.relationshipHistory} onChange={(e) => set('relationshipHistory', e.target.value)} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ClientDrawer({ clientId, refreshKey, canEdit, canArchive, canOpportunity, onClose, onEdit, onArchive, onRestore, onOpportunity }) {
  const [tab, setTab] = useState('profile');
  const { record: client, error, loading } = useRecord(clientService, clientId, refreshKey);
  const canAddNote = usePermission('businessdev.client.update');
  return (
    <Drawer isOpen onClose={onClose} title={client?.clientName || 'Client'} subtitle={client ? `${client.sector || '—'} • ${client.bdOfficerName || '—'}` : ''} width="600px">
      <DataState loading={loading} error={error} empty={!client}>
        {client && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Strip>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>
                Relationship: <RelationshipBadge value={client.relationship} />
                {client.status === 'archived' && <span style={{ color: '#991B1B', fontWeight: 600 }}>Archived</span>}
                {client.isDormant && <span style={{ color: '#92400E', fontWeight: 600 }}>Dormant</span>}
              </span>
              <span style={{ display: 'inline-flex', gap: 8 }}>
                {canOpportunity && client.status === 'active' && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => onOpportunity(client)}>Opportunity</PrimaryButton>}
                {canEdit && client.status === 'active' && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(client)}>Edit Client</SecondaryButton>}
                {canArchive && client.status === 'active' && <SecondaryButton icon={<FiArchive size={14} />} onClick={() => onArchive(client)}>Archive</SecondaryButton>}
                {canArchive && client.status === 'archived' && <SecondaryButton icon={<FiRotateCcw size={14} />} onClick={() => onRestore(client)}>Restore</SecondaryButton>}
              </span>
            </Strip>
            <TabBar tabs={[{ id: 'profile', label: 'Profile' }, { id: 'tenders', label: 'Tenders' }, { id: 'interactions', label: 'Interactions' }, { id: 'notes', label: 'Notes' }]} active={tab} onChange={setTab} />
            {tab === 'profile' && (
              <>
                <DetailGrid items={[
                  ['Company', client.clientName], ['Sector', client.sector], ['Primary contact', client.primaryContact], ['Email', client.email],
                  ['Phone number', client.phone], ['Company address', client.companyAddress], ['Active tenders', client.activeTenders], ['Active projects', client.activeProjects],
                  ['Last interaction', client.lastInteractionAt ? formatDate(client.lastInteractionAt) : 'No interaction yet'], ['BD officer', client.bdOfficerName],
                  client.status === 'archived' ? ['Archive reason', client.archiveReason] : null,
                ]}
                />
                {client.relationshipHistory && <Panel title="Relationship history">{client.relationshipHistory}</Panel>}
              </>
            )}
            {tab === 'tenders' && <ClientTenders clientId={client._id} />}
            {tab === 'interactions' && <ClientInteractions clientId={client._id} />}
            {tab === 'notes' && <NotesPanel api={clientService} id={client._id} canAdd={canAddNote && client.status === 'active'} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

function ClientTenders({ clientId }) {
  const { data, error, loading } = useFetched(() => clientService.tenders(clientId, { limit: 50 }), clientId);
  return (
    <DataState loading={loading} error={error} empty={false}>
      <SimpleTable
        empty="No tenders for this client yet."
        columns={[
          { key: 'tenderName', label: 'TENDER', render: (t) => t.tenderName },
          { key: 'stage', label: 'STAGE', render: (t) => <StageBadge kind="tender" stage={t.stage} /> },
          { key: 'value', label: 'VALUE', render: (t) => compactMoney(t.estimatedValue) },
          { key: 'officer', label: 'BD OFFICER', render: (t) => t.bdOfficerName || '—' },
        ]}
        rows={data}
      />
    </DataState>
  );
}

function ClientInteractions({ clientId }) {
  const { data, error, loading } = useFetched(() => clientService.interactions(clientId, { limit: 50 }), clientId);
  return (
    <DataState loading={loading} error={error} empty={!data.length} emptyText="No interactions logged for this client yet.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((i) => (
          <div key={i._id}>
            <InteractionBadge type={i.type} />
            <div style={{ fontSize: '0.85rem', color: '#0F172A', marginTop: 6 }}>{i.summary}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{formatDate(i.date)} • {i.bdOfficerName || '—'}</div>
          </div>
        ))}
      </div>
    </DataState>
  );
}

export default function ClientsTab({ notify, onNewOpportunity }) {
  const canCreate = usePermission('businessdev.client.create');
  const canUpdate = usePermission('businessdev.client.update');
  const canArchive = usePermission('businessdev.client.archive');
  const canExport = usePermission('businessdev.client.export');
  const canOpportunity = usePermission('businessdev.opportunity.create');
  const list = useBizList(clientsSlice, { initialFilters: { relationship: '', status: '', dormant: '', bdOfficer: '' } });
  const selection = useSelection();
  const exporter = useExport(clientService, list, selection, EXPORT_COLUMNS, 'clients.csv');
  const run = useRunAction(clientsSlice);
  const { lookups } = useBizLookups(['officers']);
  const officers = toOptions(lookups.officers, (o) => `${o.fullName}${o.position ? ` (${o.position})` : ''}`);

  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveError, setArchiveError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  const saved = (message) => { setNonce((n) => n + 1); setForm(null); notify(message); list.reload(); selection.clear(); };

  const archive = async (reason) => {
    setBusy(true);
    setArchiveError('');
    const result = await run('archive', archiveTarget._id, reason);
    setBusy(false);
    if (!result.ok) { setArchiveError(result.error); return; }
    setArchiveTarget(null);
    setViewId(null);
    notify('Client archived successfully');
    list.reload();
  };

  const restore = async (client) => {
    const result = await run('restore', client._id);
    if (!result.ok) { notify(result.error, 'error'); return; }
    notify('Client restored successfully');
    setNonce((n) => n + 1);
    list.reload();
  };

  const tiles = [
    { label: 'TOTAL CLIENTS', value: statValue(list.stats, 'total_clients'), sub: 'All registered clients', icon: <FiUsers size={16} />, tone: 'blue' },
    {
      label: 'NEW CLIENTS',
      value: statValue(list.stats, 'new_clients'),
      sub: (() => {
        const change = list.stats.find((s) => s.key === 'new_clients')?.changePercent;
        return change == null ? 'This year' : `${change >= 0 ? '+' : ''}${change}% vs last year`;
      })(),
      subColor: '#16A34A',
      icon: <FiUserPlus size={16} />,
      tone: 'purple',
    },
    { label: 'ACTIVE CLIENTS', value: statValue(list.stats, 'active_clients'), sub: 'Currently engaged clients', icon: <FiCheckCircle size={16} />, tone: 'green' },
    { label: 'DORMANT CLIENTS', value: statValue(list.stats, 'dormant_clients'), sub: 'No recent activity', icon: <FiAlertTriangle size={16} />, tone: 'amber' },
  ];

  const columns = [
    { key: 'clientName', label: 'CLIENT NAME', render: (c) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{c.clientName}</span> },
    { key: 'sector', label: 'SECTOR', render: (c) => c.sector || '—' },
    { key: 'primaryContact', label: 'PRIMARY CONTACT', render: (c) => c.primaryContact },
    { key: 'email', label: 'EMAIL', render: (c) => c.email },
    { key: 'last', label: 'LAST INTERACTION', render: (c) => (c.lastInteractionAt ? formatDate(c.lastInteractionAt) : '—') },
    { key: 'activeTenders', label: 'ACTIVE TENDERS', render: (c) => c.activeTenders },
    { key: 'activeProjects', label: 'ACTIVE PROJECTS', render: (c) => c.activeProjects },
    { key: 'relationship', label: 'RELATIONSHIP', render: (c) => <RelationshipBadge value={c.relationship} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="icon-btn" title="View client" onClick={() => setViewId(c._id)}><FiEye size={15} /></button>
          {c.status === 'active' && (canUpdate || canArchive) && (
            <RowMenu items={[
              ...(canUpdate ? [{ label: 'Edit Client', icon: <FiEdit size={13} />, action: () => setForm({ client: c }) }] : []),
              ...(canArchive ? [{ label: 'Archive Client', icon: <FiArchive size={13} />, action: () => { setArchiveError(''); setArchiveTarget(c); } }] : []),
            ]}
            />
          )}
          {c.status === 'archived' && canArchive && (
            <RowMenu items={[{ label: 'Restore Client', icon: <FiRotateCcw size={13} />, action: () => restore(c) }]} />
          )}
        </div>
      ),
    },
  ];

  const filterFields = [
    { key: 'relationship', label: 'Relationship', options: plainOptions(RELATIONSHIPS) },
    { key: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }] },
    { key: 'dormant', label: 'Dormant', options: [{ value: 'true', label: 'Dormant only' }, { value: 'false', label: 'Not dormant' }] },
    { key: 'bdOfficer', label: 'BD officer', options: officers },
  ];

  return (
    <>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />
      <ListCard
        list={list}
        columns={columns}
        selection={selection}
        onRowClick={(c) => setViewId(c._id)}
        emptyText="No clients found."
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search clients..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? async () => { const m = await exporter.run(); notify(m || 'Clients exported', m ? 'error' : 'success'); } : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={15} />} onClick={() => setForm({ client: null })}>Add Client</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Clients" subtitle="Narrow the client list" fields={filterFields} values={list.filters} onApply={list.applyFilters} />
      {form && <ClientFormModal client={form.client} officers={officers} onClose={() => setForm(null)} onSaved={saved} />}
      {viewId && (
        <ClientDrawer
          key={viewId}
          clientId={viewId}
          refreshKey={nonce}
          canEdit={canUpdate}
          canArchive={canArchive}
          canOpportunity={canOpportunity}
          onClose={() => setViewId(null)}
          onEdit={(c) => setForm({ client: c })}
          onArchive={(c) => { setArchiveError(''); setArchiveTarget(c); }}
          onRestore={restore}
          onOpportunity={(c) => onNewOpportunity(c._id)}
        />
      )}
      {archiveTarget && (
        <ReasonModal
          title={`Archive ${archiveTarget.clientName}?`}
          message="This client will be moved to archived records and removed from active lists. You can restore it anytime."
          label="Reason for deactivation"
          confirmLabel="Archive Client"
          danger={false}
          busy={busy}
          error={archiveError}
          onClose={() => setArchiveTarget(null)}
          onConfirm={archive}
        />
      )}
    </>
  );
}
