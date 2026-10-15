import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiPlay, FiCheck, FiX, FiTool } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { admMaintenanceSlice } from '../../store/administration/slices';
import { apiError } from '../../services/apiHelpers';
import { facilityMaintenanceService } from '../../services/admin.service';
import {
  countFilters, csvMoney, fieldErrorsOf, formatDate, fromKobo, money, statusLabel, toKobo, today, ymd,
} from '../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, MoneyInput, PageHeader, Panel,
  PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../procurement/shared/ProcUi';
import { HistoryTimeline, Pill } from './shared/AdmUi';

const TYPES = [{ value: 'preventive', label: 'Preventive' }, { value: 'corrective', label: 'Corrective' }];
const FREQUENCIES = [
  { value: 'one_time', label: 'One-time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'bi_annually', label: 'Bi-annually' },
];
const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];
const STATUS_TONE = { scheduled: 'sky', in_progress: 'amber', completed: 'green', overdue: 'amber', cancelled: 'red' };
const frequencyLabel = (v) => FREQUENCIES.find((f) => f.value === v)?.label || statusLabel(v);

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;
const TypeTag = ({ type }) => <Pill tone={type === 'preventive' ? 'sky' : 'amber'}>{statusLabel(type)}</Pill>;

const EXPORT_COLUMNS = [
  { label: 'Maintenance ID', value: (r) => r.maintenanceId },
  { label: 'Facility / Asset', value: (r) => r.facilityOrAsset },
  { label: 'Type', value: (r) => statusLabel(r.maintenanceType) },
  { label: 'Description', value: (r) => r.description || '' },
  { label: 'Assigned To', value: (r) => r.assignedTo },
  { label: 'Frequency', value: (r) => frequencyLabel(r.frequency) },
  { label: 'Due Date', value: (r) => ymd(r.dueDate) },
  { label: 'Estimated Cost (NGN)', value: (r) => csvMoney(r.estimatedCost) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function ScheduleFormModal({ record, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => ({
    facilityOrAsset: record?.facilityOrAsset || '',
    maintenanceType: record?.maintenanceType || 'preventive',
    assignedTo: record?.assignedTo || '',
    dueDate: record ? ymd(record.dueDate) : today(),
    frequency: record?.frequency || 'monthly',
    estimatedCost: record ? fromKobo(record.estimatedCost) : '',
    description: record?.description || '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.facilityOrAsset.trim()) next.facilityOrAsset = 'Name the facility or asset';
    if (!form.assignedTo.trim()) next.assignedTo = 'Say who the job is assigned to';
    if (!form.dueDate) next.dueDate = 'Choose the due date';
    if (Number.isNaN(toKobo(form.estimatedCost))) next.estimatedCost = 'Enter the estimated cost in naira, for example 250000';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = {
        facilityOrAsset: form.facilityOrAsset.trim(),
        maintenanceType: form.maintenanceType,
        assignedTo: form.assignedTo.trim(),
        dueDate: form.dueDate,
        frequency: form.frequency,
        estimatedCost: toKobo(form.estimatedCost),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      };
      if (editing) {
        await facilityMaintenanceService.update(record._id, payload);
        onSaved('Maintenance schedule updated');
      } else {
        const res = await facilityMaintenanceService.create(payload);
        onSaved(`Maintenance ${res.data?.data?.maintenanceId || ''} scheduled`.replace('  ', ' '));
      }
    } catch (err) {
      setError(apiError(err, 'The schedule could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Schedule Maintenance"
      subtitle={editing ? undefined : 'Schedule maintenance for review and execution'}
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Schedule Maintenance'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <TwoCol>
          <Field label="Facility / asset" required error={errors.facilityOrAsset}>
            <Input value={form.facilityOrAsset} onChange={(e) => set('facilityOrAsset', e.target.value)} placeholder="e.g. Lagos Head Office — Generator" error={Boolean(errors.facilityOrAsset)} />
          </Field>
          <Field label="Maintenance ID" help={editing ? undefined : 'Assigned automatically when the job is scheduled.'}>
            <Input value={editing ? record.maintenanceId : 'Assigned on save'} disabled />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Maintenance type" required error={errors.maintenanceType}>
            <Choice value={form.maintenanceType} onChange={(v) => set('maintenanceType', v)} options={TYPES} />
          </Field>
          <Field label="Assigned to" required error={errors.assignedTo}>
            <Input value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} placeholder="Team or contractor" error={Boolean(errors.assignedTo)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Due date" required error={errors.dueDate}>
            <DatePicker value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} error={Boolean(errors.dueDate)} />
          </Field>
          <Field label="Frequency" required error={errors.frequency}>
            <Choice value={form.frequency} onChange={(v) => set('frequency', v)} options={FREQUENCIES} />
          </Field>
        </TwoCol>
        <div style={{ maxWidth: 300 }}>
          <Field label="Estimated cost (₦)" required error={errors.estimatedCost}>
            <MoneyInput value={form.estimatedCost} onChange={(v) => set('estimatedCost', v)} error={errors.estimatedCost} />
          </Field>
        </div>
        <Field label="Description / notes" error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add notes…" />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewMaintenanceModal({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(facilityMaintenanceService, id, refreshKey);
  const [tab, setTab] = useState('details');
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="680px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading job…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiTool size={22} />} title={record.facilityOrAsset} subtitle={`${record.assignedTo} • ${record.maintenanceId}`}>{actions(record)}</ViewHeader>
          <StatusLine status={<Status status={record.status} />} />
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Facility/asset', record.facilityOrAsset],
                  ['Maintenance ID', record.maintenanceId],
                  ['Maintenance type', statusLabel(record.maintenanceType)],
                  ['Assigned to', record.assignedTo],
                  ['Due date', formatDate(record.dueDate)],
                  ['Frequency', frequencyLabel(record.frequency)],
                  ['Estimated cost', record.estimatedCost != null ? money(record.estimatedCost) : '—'],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              <Panel title="Description">{record.description || 'No description was entered.'}</Panel>
              {record.status === 'cancelled' && <Panel title="Cancellation reason" tone="red">{record.cancellationReason || 'No reason was recorded.'}</Panel>}
            </>
          )}
          {tab === 'history' && <HistoryTimeline key={`${record._id}-${refreshKey}`} load={facilityMaintenanceService.history} id={record._id} title="Job history" />}
        </div>
      )}
    </Modal>
  );
}

export default function FacilityMaintenance() {
  const { can } = usePermissions();
  const canCreate = can('administration.facilitymaintenance.create');
  const canUpdate = can('administration.facilitymaintenance.update');
  const canExport = can('administration.facilitymaintenance.export');

  const list = useProcList(admMaintenanceSlice, { initialFilters: { status: '', type: '', frequency: '', dueFrom: '', dueTo: '' }, withStats: false });
  const run = useRunAction(admMaintenanceSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const exporter = useExport(facilityMaintenanceService, list, selection, EXPORT_COLUMNS, 'facility-maintenance.csv');

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
    if (!canUpdate) return items;
    if (row.status === 'scheduled' || row.status === 'overdue') items.push({ label: 'Edit Schedule', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (row.status === 'scheduled') items.push({ label: 'Start Work', icon: <FiPlay size={14} color="#2563EB" />, action: () => doAction('start', [row._id], 'Maintenance started') });
    if (row.status === 'in_progress' || row.status === 'overdue') items.push({ label: 'Mark Complete', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('complete', row) });
    if (row.status === 'scheduled' || row.status === 'overdue') items.push({ label: 'Cancel Schedule', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => open('cancel', row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'maintenanceId', label: 'MAINTENANCE ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'facilityOrAsset', label: 'FACILITY/ASSET', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'maintenanceType', label: 'TYPE', render: (v) => <TypeTag type={v} /> },
    { key: 'description', label: 'DESCRIPTION', render: (v) => <span style={{ color: '#475569' }}>{v || '—'}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO', render: (v) => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'frequency', label: 'FREQUENCY', render: (v) => <span style={{ color: '#475569' }}>{frequencyLabel(v)}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Maintenance" aria-label="View maintenance" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate]);

  const viewActions = (record) => (
    <>
      {canUpdate && record.status === 'scheduled' && <PrimaryButton icon={<FiPlay size={14} />} onClick={() => doAction('start', [record._id], 'Maintenance started')}>Start Work</PrimaryButton>}
      {canUpdate && (record.status === 'in_progress' || record.status === 'overdue') && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('complete', record)}>Mark Complete</PrimaryButton>}
      {canUpdate && (record.status === 'scheduled' || record.status === 'overdue') && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit Schedule</SecondaryButton>}
      {canUpdate && (record.status === 'scheduled' || record.status === 'overdue') && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => open('cancel', record)}>Cancel</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected jobs exported` : 'Maintenance jobs exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'type', label: 'Type', options: TYPES },
    { key: 'frequency', label: 'Frequency', options: FREQUENCIES },
    { key: 'dueFrom', label: 'Due from', type: 'date' },
    { key: 'dueTo', label: 'Due to', type: 'date' },
  ];

  const summary = (row) => <RecordSummary rows={[['Maintenance', row.maintenanceId], ['Facility/asset', row.facilityOrAsset]]} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Facility Maintenance" subtitle="Planned and active facility maintenance jobs" />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No maintenance jobs found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by id, facility, description..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Schedule Maintenance</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Maintenance" subtitle="Narrow the jobs by status, type and due date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <ScheduleFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewMaintenanceModal id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}

      {confirm?.type === 'complete' && (
        <ConfirmModal
          title="Mark Maintenance Complete?"
          message="Confirm that the maintenance work has been carried out."
          detail={summary(confirm.row)}
          confirmLabel="Mark Complete"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('complete', [confirm.row._id], 'Maintenance marked complete')}
        />
      )}
      {confirm?.type === 'cancel' && (
        <ReasonModal
          title="Cancel Maintenance?"
          message="Are you sure you want to cancel this scheduled maintenance?"
          detail={summary(confirm.row)}
          label="Reason"
          confirmLabel="Cancel Maintenance"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('cancel', [confirm.row._id, reason], 'Maintenance cancelled')}
        />
      )}
    </div>
  );
}
