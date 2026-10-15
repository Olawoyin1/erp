import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiCheck, FiX, FiTruck, FiCornerUpLeft } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermissions } from '../../../hooks/usePermission';
import { admMovementsSlice } from '../../../store/administration/slices';
import { apiError } from '../../../services/apiHelpers';
import { movementService } from '../../../services/admin.service';
import {
  countFilters, fieldErrorsOf, formatDate, refId, refName, statusLabel, toOptions, today, uploadStagedFiles, ymd,
} from '../../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel,
  PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { AttachField, DocumentList } from '../../procurement/shared/ProcExtras';
import { HistoryTimeline, Pill } from '../shared/AdmUi';

const CONDITIONS = [{ value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' }];
const STATUSES = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'rejected', label: 'Rejected' },
];
const STATUS_TONE = { pending_approval: 'amber', approved: 'green', in_transit: 'sky', delivered: 'green', returned: 'slate', rejected: 'red' };

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;

const EXPORT_COLUMNS = [
  { label: 'Movement ID', value: (r) => r.movementId },
  { label: 'Asset / Equipment', value: (r) => r.assetOrEquipment },
  { label: 'From', value: (r) => refName(r.fromLocationId, 'name') },
  { label: 'To', value: (r) => refName(r.toLocationId, 'name') },
  { label: 'Moved By', value: (r) => refName(r.movedBy, 'fullName') },
  { label: 'Moved On', value: (r) => ymd(r.movedOn) },
  { label: 'Expected Return', value: (r) => ymd(r.expectedReturn) },
  { label: 'Condition Before', value: (r) => statusLabel(r.conditionBefore) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function MovementFormModal({ record, lookups, me, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => ({
    assetOrEquipment: record?.assetOrEquipment || '',
    movedBy: record ? refId(record.movedBy) : me?.employeeId || '',
    fromLocationId: record ? refId(record.fromLocationId) : '',
    toLocationId: record ? refId(record.toLocationId) : '',
    movedOn: record ? ymd(record.movedOn) : today(),
    expectedReturn: record ? ymd(record.expectedReturn) : '',
    conditionBefore: record?.conditionBefore || 'good',
    purposeOfMovement: record?.purposeOfMovement || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.assetOrEquipment.trim()) next.assetOrEquipment = 'Name the asset or equipment';
    if (!form.movedBy) next.movedBy = 'Choose who is moving it';
    if (!form.fromLocationId) next.fromLocationId = 'Choose where it is moving from';
    if (!form.toLocationId) next.toLocationId = 'Choose where it is moving to';
    if (form.fromLocationId && form.fromLocationId === form.toLocationId) next.toLocationId = 'The destination must differ from the origin';
    if (!form.movedOn) next.movedOn = 'Choose the movement date';
    if (form.expectedReturn && form.movedOn && form.expectedReturn < form.movedOn) next.expectedReturn = 'Expected return cannot be before the movement date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = {
        assetOrEquipment: form.assetOrEquipment.trim(),
        movedBy: form.movedBy,
        fromLocationId: form.fromLocationId,
        toLocationId: form.toLocationId,
        movedOn: form.movedOn,
        conditionBefore: form.conditionBefore,
        ...(form.expectedReturn ? { expectedReturn: form.expectedReturn } : {}),
        ...(form.purposeOfMovement.trim() ? { purposeOfMovement: form.purposeOfMovement.trim() } : {}),
      };
      let saved;
      if (editing) saved = (await movementService.update(record._id, payload)).data?.data;
      else saved = (await movementService.create(payload)).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(movementService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Movement updated' : `Movement ${saved?.movementId || ''} logged`}.${note}`.replace('  ', ' '));
    } catch (err) {
      setError(apiError(err, 'The movement could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  const locations = toOptions(lookups.locations, 'name');

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Movement Request' : 'Log Movement'}
      subtitle={editing ? undefined : 'Log equipment movement between locations'}
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Log Movement'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label="Asset/equipment" required error={errors.assetOrEquipment}>
          <Input value={form.assetOrEquipment} onChange={(e) => set('assetOrEquipment', e.target.value)} placeholder="e.g. Lincoln Electric Welding Machine (x2)" error={Boolean(errors.assetOrEquipment)} />
        </Field>
        <TwoCol>
          <Field label="Movement ID" help={editing ? undefined : 'Assigned automatically.'}>
            <Input value={editing ? record.movementId : 'Assigned on save'} disabled />
          </Field>
          <Field label="Moved by" required error={errors.movedBy}>
            <Choice value={form.movedBy} onChange={(v) => set('movedBy', v)} searchable placeholder="Select an employee" options={toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)} error={errors.movedBy} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="From" required error={errors.fromLocationId}>
            <Choice value={form.fromLocationId} onChange={(v) => set('fromLocationId', v)} searchable placeholder="Select a location" options={locations} error={errors.fromLocationId} />
          </Field>
          <Field label="To" required error={errors.toLocationId}>
            <Choice value={form.toLocationId} onChange={(v) => set('toLocationId', v)} searchable placeholder="Select a location" options={locations} error={errors.toLocationId} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Moved on" required error={errors.movedOn}>
            <DatePicker value={form.movedOn} onChange={(e) => set('movedOn', e.target.value)} error={Boolean(errors.movedOn)} />
          </Field>
          <Field label="Expected return" error={errors.expectedReturn}>
            <DatePicker value={form.expectedReturn} onChange={(e) => set('expectedReturn', e.target.value)} error={Boolean(errors.expectedReturn)} />
          </Field>
        </TwoCol>
        <div style={{ maxWidth: 260 }}>
          <Field label="Condition before" required error={errors.conditionBefore}>
            <Choice value={form.conditionBefore} onChange={(v) => set('conditionBefore', v)} options={CONDITIONS} />
          </Field>
        </div>
        <Field label="Purpose of movement" error={errors.purposeOfMovement}>
          <Textarea rows={3} value={form.purposeOfMovement} onChange={(e) => set('purposeOfMovement', e.target.value)} placeholder="Add notes…" />
        </Field>
        {editing ? (
          <DocumentList key={record._id} api={movementService} id={record._id} canUpload title="Attached documents" />
        ) : (
          <Field label="Attach documents (optional)">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewMovementModal({ id, refreshKey, actions, canUpload, onClose }) {
  const { record, error, loading } = useRecord(movementService, id, refreshKey);
  const [tab, setTab] = useState('details');
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="720px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading movement…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiTruck size={22} />} title={record.assetOrEquipment} subtitle={record.movementId}>{actions(record)}</ViewHeader>
          <StatusLine status={<Status status={record.status} />} />
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'Approval History' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Asset/equipment', record.assetOrEquipment],
                  ['Movement ID', record.movementId],
                  ['Moved by', refName(record.movedBy, 'fullName')],
                  ['From', refName(record.fromLocationId, 'name')],
                  ['To', refName(record.toLocationId, 'name')],
                  ['Moved on', formatDate(record.movedOn)],
                  ['Expected return', record.expectedReturn ? formatDate(record.expectedReturn) : '—'],
                  ['Condition before', statusLabel(record.conditionBefore)],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              <Panel title="Purpose of movement">{record.purposeOfMovement || 'No purpose was entered.'}</Panel>
              {record.status === 'rejected' && <Panel title="Rejection reason" tone="red">{record.rejectionReason || 'No reason was recorded.'}</Panel>}
              <DocumentList key={record._id} api={movementService} id={record._id} canUpload={canUpload(record)} />
            </>
          )}
          {tab === 'history' && <HistoryTimeline key={`${record._id}-${refreshKey}`} load={movementService.history} id={record._id} title="Approval history" />}
        </div>
      )}
    </Modal>
  );
}

export default function MovementsTab({ lookups, me, showToast }) {
  const { can } = usePermissions();
  const canCreate = can('administration.movement.create');
  const canUpdate = can('administration.movement.update');
  const canDecide = can('administration.movement.decide');
  const canExport = can('administration.movement.export');

  const list = useProcList(admMovementsSlice, { initialFilters: { status: '', movedFrom: '', movedTo: '' }, withStats: false });
  const run = useRunAction(admMovementsSlice);
  const selection = useSelection();
  const exporter = useExport(movementService, list, selection, EXPORT_COLUMNS, 'movements.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const doAction = async (method, args, success) => {
    setBusy(true);
    setActionError('');
    const res = await run(method, ...args);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      showToast(success, 'success');
      refresh();
    } else {
      setActionError(res.error);
      if (!confirm) showToast(res.error, 'error');
    }
  };

  const open = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const menuItems = (row) => {
    const items = [];
    if (row.status === 'pending_approval') {
      if (canUpdate) items.push({ label: 'Edit Movement', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
      if (canDecide) {
        items.push({ label: 'Approve Movement', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('approve', row) });
        items.push({ label: 'Reject Movement', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => open('reject', row) });
      }
    }
    if (row.status === 'approved' && canUpdate) items.push({ label: 'Mark as In Transit', icon: <FiTruck size={14} color="#2563EB" />, action: () => open('transit', row) });
    if (row.status === 'in_transit' && canUpdate) items.push({ label: 'Confirm Delivery', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('deliver', row) });
    if (row.status === 'delivered' && canUpdate) items.push({ label: 'Mark as Returned', icon: <FiCornerUpLeft size={14} color="#64748B" />, action: () => open('return', row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'movementId', label: 'MOVEMENT ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'assetOrEquipment', label: 'ASSET / EQUIPMENT', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'fromLocationId', label: 'FROM', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'name')}</span> },
    { key: 'toLocationId', label: 'TO', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'name')}</span> },
    { key: 'movedBy', label: 'MOVED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'movedOn', label: 'MOVED ON', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'expectedReturn', label: 'EXPECTED RETURN', render: (v) => <span style={{ color: '#64748B' }}>{v ? formatDate(v) : '—'}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Movement" aria-label="View movement" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDecide]);

  const viewActions = (record) => (
    <>
      {record.status === 'pending_approval' && canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit</SecondaryButton>}
      {record.status === 'pending_approval' && canDecide && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('approve', record)}>Approve</PrimaryButton>}
      {record.status === 'pending_approval' && canDecide && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => open('reject', record)}>Reject</SecondaryButton>}
      {record.status === 'approved' && canUpdate && <PrimaryButton icon={<FiTruck size={14} />} onClick={() => open('transit', record)}>Mark as In Transit</PrimaryButton>}
      {record.status === 'in_transit' && canUpdate && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('deliver', record)}>Confirm Delivery</PrimaryButton>}
      {record.status === 'delivered' && canUpdate && <PrimaryButton icon={<FiCornerUpLeft size={14} />} onClick={() => open('return', record)}>Mark as Returned</PrimaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected movements exported` : 'Movements exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'movedFrom', label: 'Moved from', type: 'date' },
    { key: 'movedTo', label: 'Moved to', type: 'date' },
  ];

  const summary = (row) => <RecordSummary rows={[['Movement', row.movementId], ['Equipment', row.assetOrEquipment]]} />;
  const simple = {
    approve: { title: 'Approve Movement?', message: 'Once approved, the equipment can be marked as in transit.', label: 'Approve Movement', method: 'approve', done: 'Movement approved' },
    transit: { title: 'Mark as In Transit?', message: 'Confirm that the equipment has left its origin.', label: 'Mark as In Transit', method: 'markInTransit', done: 'Movement marked in transit' },
    deliver: { title: 'Confirm Delivery?', message: 'Confirm that the equipment has arrived at its destination.', label: 'Confirm Delivery', method: 'confirmDelivery', done: 'Delivery confirmed' },
    return: { title: 'Mark as Returned?', message: 'Confirm that the equipment has come back from its destination.', label: 'Mark as Returned', method: 'markReturned', done: 'Movement marked returned' },
  };
  const step = confirm ? simple[confirm.type] : null;

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No equipment movements found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by id, equipment, location, person..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Log Movement</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Movements" subtitle="Narrow the list by status and date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <MovementFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          me={me}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewMovementModal id={viewId} refreshKey={refreshKey} actions={viewActions} canUpload={(r) => (canCreate || canUpdate) && ['pending_approval', 'approved', 'in_transit'].includes(r.status)} onClose={() => setViewId(null)} />}

      {step && (
        <ConfirmModal
          title={step.title}
          message={step.message}
          detail={summary(confirm.row)}
          confirmLabel={step.label}
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction(step.method, [confirm.row._id], step.done)}
        />
      )}
      {confirm?.type === 'reject' && (
        <ReasonModal
          title="Reject Movement?"
          message={`Are you sure you want to reject ${confirm.row.movementId}? A reason is required.`}
          detail={summary(confirm.row)}
          label="Reason for rejection"
          confirmLabel="Reject Movement"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('reject', [confirm.row._id, reason], 'Movement rejected')}
        />
      )}
    </>
  );
}
