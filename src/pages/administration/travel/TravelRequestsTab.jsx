import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiSend, FiCheck, FiX, FiNavigation } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermissions } from '../../../hooks/usePermission';
import { admTravelSlice } from '../../../store/administration/slices';
import { apiError } from '../../../services/apiHelpers';
import { travelRequestService } from '../../../services/admin.service';
import {
  countFilters, csvMoney, fieldErrorsOf, formatDate, fromKobo, money, refId, refName, statusLabel, toKobo, toOptions, today, uploadStagedFiles, ymd,
} from '../../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, MoneyInput, Panel,
  PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { AttachField, DocumentList } from '../../procurement/shared/ProcExtras';
import { HistoryTimeline, Pill } from '../shared/AdmUi';

const TRAVEL_TYPES = ['Within State', 'Interstate', 'International'];
const MODES = ['Company Vehicle', 'Domestic Flight', 'Hired Vehicle', 'Boat', 'International Flight', 'Train'];
const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const STATUS_TONE = { draft: 'slate', pending: 'amber', approved: 'green', rejected: 'red' };
const STEP_LABELS = { admin_approval: 'Admin Approval', finance_approval: 'Finance Approval', final_approval: 'Final Approval' };
const CHAIN = Object.keys(STEP_LABELS);
const STEP_PERMISSIONS = {
  admin_approval: 'administration.travelrequest.decide',
  finance_approval: 'administration.travelrequest.decide-finance',
  final_approval: 'administration.travelrequest.decide-final',
};

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;
const accommodation = (r) => (r.accommodationRequired ? `Yes (${r.numberOfNights ?? 0} night${r.numberOfNights === 1 ? '' : 's'})` : 'No');

const EXPORT_COLUMNS = [
  { label: 'Request ID', value: (r) => r.requestId },
  { label: 'Traveler', value: (r) => refName(r.traveler, 'fullName') },
  { label: 'Employee ID', value: (r) => (r.traveler && typeof r.traveler === 'object' ? r.traveler.employeeId : '') },
  { label: 'Department', value: (r) => refName(r.departmentId, 'name') },
  { label: 'From', value: (r) => r.fromLocation },
  { label: 'To', value: (r) => r.toLocation },
  { label: 'Departure', value: (r) => ymd(r.departureDate) },
  { label: 'Return', value: (r) => ymd(r.returnDate) },
  { label: 'Travel Type', value: (r) => r.travelType },
  { label: 'Mode', value: (r) => r.mode },
  { label: 'Accommodation', value: (r) => accommodation(r) },
  { label: 'Estimated Amount (NGN)', value: (r) => csvMoney(r.estimatedAmount) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function TravelFormModal({ record, lookups, me, ownOnly, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => (record
    ? {
        traveler: refId(record.traveler), departmentId: refId(record.departmentId), fromLocation: record.fromLocation, toLocation: record.toLocation,
        departureDate: ymd(record.departureDate), returnDate: ymd(record.returnDate), travelType: record.travelType, mode: record.mode,
        accommodationRequired: Boolean(record.accommodationRequired), hotelName: record.hotelName || '', numberOfNights: String(record.numberOfNights ?? ''),
        travelAllowanceRequired: Boolean(record.travelAllowanceRequired), estimatedAmount: fromKobo(record.estimatedAmount), purposeOfTravel: record.purposeOfTravel || '',
      }
    : {
        traveler: me?.employeeId || '', departmentId: me?.departmentId || '', fromLocation: '', toLocation: '', departureDate: today(), returnDate: today(),
        travelType: 'Within State', mode: 'Company Vehicle', accommodationRequired: false, hotelName: '', numberOfNights: '', travelAllowanceRequired: false,
        estimatedAmount: '', purposeOfTravel: '',
      }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const traveler = (lookups.employees || []).find((e) => e._id === form.traveler);

  const pickTraveler = (id) => {
    const person = (lookups.employees || []).find((e) => e._id === id);
    setForm((f) => ({ ...f, traveler: id, departmentId: person?.departmentId ? refId(person.departmentId) : f.departmentId }));
  };

  const validate = () => {
    const next = {};
    if (!form.traveler) next.traveler = 'Choose the traveler';
    if (!form.departmentId) next.departmentId = 'Choose the department';
    if (!form.fromLocation.trim()) next.fromLocation = 'Enter where the trip starts';
    if (!form.toLocation.trim()) next.toLocation = 'Enter the destination';
    if (!form.departureDate) next.departureDate = 'Choose the departure date';
    if (!form.returnDate) next.returnDate = 'Choose the return date';
    if (form.departureDate && form.returnDate && form.departureDate > form.returnDate) next.departureDate = 'Departure must be on or before the return date';
    if (!form.mode.trim()) next.mode = 'Enter the mode of travel';
    if (form.accommodationRequired) {
      if (!form.hotelName.trim()) next.hotelName = 'Enter the hotel name';
      if (form.numberOfNights === '' || !(Number(form.numberOfNights) >= 0)) next.numberOfNights = 'Enter the number of nights';
    }
    if (form.travelAllowanceRequired && Number.isNaN(toKobo(form.estimatedAmount))) next.estimatedAmount = 'Enter the estimated amount in naira';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => ({
    traveler: form.traveler,
    departmentId: form.departmentId,
    fromLocation: form.fromLocation.trim(),
    toLocation: form.toLocation.trim(),
    departureDate: form.departureDate,
    returnDate: form.returnDate,
    travelType: form.travelType,
    mode: form.mode.trim(),
    accommodationRequired: form.accommodationRequired,
    travelAllowanceRequired: form.travelAllowanceRequired,
    ...(form.accommodationRequired ? { hotelName: form.hotelName.trim(), numberOfNights: Number(form.numberOfNights) } : {}),
    ...(form.travelAllowanceRequired ? { estimatedAmount: toKobo(form.estimatedAmount) } : {}),
    ...(form.purposeOfTravel.trim() ? { purposeOfTravel: form.purposeOfTravel.trim() } : {}),
  });

  const save = async (submit) => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      let saved;
      if (editing) {
        saved = (await travelRequestService.update(record._id, payload())).data?.data;
        if (submit && record.status === 'draft') await travelRequestService.submit(record._id);
      } else {
        saved = (await travelRequestService.create(payload())).data?.data;
        if (submit && saved?._id) await travelRequestService.submit(saved._id);
      }
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(travelRequestService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Travel request updated' : submit ? 'Travel request sent for approval' : 'Travel request saved as draft'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The travel request could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Request' : 'New Travel Request'}
      subtitle={editing ? undefined : 'Create a travel request and arrange travel logistics for an employee'}
      maxWidth="720px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          {(!editing || record.status === 'draft') && <SecondaryButton onClick={() => save(false)} disabled={busy}>{editing ? 'Save Changes' : 'Save as Draft'}</SecondaryButton>}
          {editing && record.status !== 'draft' && <PrimaryButton onClick={() => save(false)} disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</PrimaryButton>}
          {(!editing || record.status === 'draft') && <PrimaryButton onClick={() => save(true)} disabled={busy}>{busy ? 'Sending…' : 'Send Travel Request'}</PrimaryButton>}
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Traveler" required error={errors.traveler}>
            {ownOnly ? (
              <Input value={me.fullName} disabled />
            ) : (
              <Choice value={form.traveler} onChange={pickTraveler} searchable placeholder="Select an employee" options={toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)} error={errors.traveler} />
            )}
          </Field>
          <Field label="Request ID" help={editing ? undefined : 'Assigned automatically.'}>
            <Input value={editing ? record.requestId : 'Assigned on save'} disabled />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Department" required error={errors.departmentId}>
            <Choice value={form.departmentId} onChange={(v) => set('departmentId', v)} searchable placeholder="Select a department" options={toOptions(lookups.departments, 'name')} error={errors.departmentId} />
          </Field>
          <Field label="Employee ID">
            <Input value={traveler?.employeeId || (editing && record.traveler?.employeeId) || '—'} disabled />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="From" required error={errors.fromLocation}>
            <Input value={form.fromLocation} onChange={(e) => set('fromLocation', e.target.value)} placeholder="Lagos Head Office" error={Boolean(errors.fromLocation)} />
          </Field>
          <Field label="To" required error={errors.toLocation}>
            <Input value={form.toLocation} onChange={(e) => set('toLocation', e.target.value)} placeholder="Warri Yard" error={Boolean(errors.toLocation)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Departure" required error={errors.departureDate}>
            <DatePicker value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)} error={Boolean(errors.departureDate)} />
          </Field>
          <Field label="Return" required error={errors.returnDate}>
            <DatePicker value={form.returnDate} onChange={(e) => set('returnDate', e.target.value)} error={Boolean(errors.returnDate)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Travel type" required error={errors.travelType}>
            <Choice value={form.travelType} onChange={(v) => set('travelType', v)} options={TRAVEL_TYPES} />
          </Field>
          <Field label="Mode" required error={errors.mode}>
            <Input list="travel-modes" value={form.mode} onChange={(e) => set('mode', e.target.value)} error={Boolean(errors.mode)} />
            <datalist id="travel-modes">{MODES.map((m) => <option key={m} value={m} />)}</datalist>
          </Field>
        </TwoCol>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.accommodationRequired} onChange={(e) => set('accommodationRequired', e.target.checked)} style={{ accentColor: '#1E3A8A' }} />
          Accommodation required
        </label>
        {form.accommodationRequired && (
          <TwoCol>
            <Field label="Hotel name" required error={errors.hotelName}>
              <Input value={form.hotelName} onChange={(e) => set('hotelName', e.target.value)} error={Boolean(errors.hotelName)} />
            </Field>
            <Field label="Number of nights" required error={errors.numberOfNights}>
              <Input type="number" min="0" value={form.numberOfNights} onChange={(e) => set('numberOfNights', e.target.value)} error={Boolean(errors.numberOfNights)} />
            </Field>
          </TwoCol>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.travelAllowanceRequired} onChange={(e) => set('travelAllowanceRequired', e.target.checked)} style={{ accentColor: '#1E3A8A' }} />
          Travel allowance required
        </label>
        {form.travelAllowanceRequired && (
          <div style={{ maxWidth: 300 }}>
            <Field label="Estimated amount (₦)" required error={errors.estimatedAmount}>
              <MoneyInput value={form.estimatedAmount} onChange={(v) => set('estimatedAmount', v)} error={errors.estimatedAmount} />
            </Field>
          </div>
        )}
        <Field label="Purpose of travel" error={errors.purposeOfTravel}>
          <Textarea rows={3} value={form.purposeOfTravel} onChange={(e) => set('purposeOfTravel', e.target.value)} placeholder="Add notes…" />
        </Field>
        {editing ? (
          <DocumentList key={record._id} api={travelRequestService} id={record._id} canUpload title="Attached documents" />
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

function ViewTravelModal({ id, refreshKey, actions, canUpload, onClose }) {
  const { record, error, loading } = useRecord(travelRequestService, id, refreshKey);
  const [tab, setTab] = useState('details');
  const remaining = record && record.status === 'pending' && record.currentStep ? CHAIN.slice(CHAIN.indexOf(record.currentStep)).map((s) => STEP_LABELS[s]) : [];
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="720px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading travel request…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiNavigation size={22} />} title={refName(record.traveler, 'fullName')} subtitle={record.requestId}>{actions(record)}</ViewHeader>
          <StatusLine status={<Status status={record.status} />}>
            {record.status === 'pending' && record.currentStep && <span>Waiting for {STEP_LABELS[record.currentStep]}</span>}
          </StatusLine>
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'Approval History' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Traveler', refName(record.traveler, 'fullName')],
                  ['Request ID', record.requestId],
                  ['Employee ID', record.traveler && typeof record.traveler === 'object' ? record.traveler.employeeId : '—'],
                  ['Department', refName(record.departmentId, 'name')],
                  ['Travel type', record.travelType],
                  ['Mode', record.mode],
                  ['From', record.fromLocation],
                  ['To', record.toLocation],
                  ['Departure', formatDate(record.departureDate)],
                  ['Return', formatDate(record.returnDate)],
                  ['Accommodation required', record.accommodationRequired ? 'Yes' : 'No'],
                  ['Hotel name', record.hotelName],
                  ['Number of nights', record.numberOfNights],
                  ['Travel allowance', record.travelAllowanceRequired ? 'Yes' : 'No'],
                  ['Estimated amount', record.estimatedAmount != null ? money(record.estimatedAmount) : '—'],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              <Panel title="Purpose of travel">{record.purposeOfTravel || 'No purpose was entered.'}</Panel>
              {record.status === 'rejected' && <Panel title="Rejection reason" tone="red">{record.rejectionReason || 'No reason was recorded.'}</Panel>}
              <DocumentList key={record._id} api={travelRequestService} id={record._id} canUpload={canUpload(record)} />
            </>
          )}
          {tab === 'history' && <HistoryTimeline key={`${record._id}-${refreshKey}`} load={travelRequestService.history} id={record._id} title="Approval history" pending={remaining} />}
        </div>
      )}
    </Modal>
  );
}

export default function TravelRequestsTab({ lookups, me, showToast }) {
  const { can, isSuperAdmin } = usePermissions();
  const canCreate = can('administration.travelrequest.create');
  const canUpdate = can('administration.travelrequest.update');
  // The requester can submit their own draft with only the create permission (the desk edits with update).
  const canSubmit = canCreate || canUpdate;
  const ownOnly = !canUpdate && Boolean(me?.employeeId);
  const canReject = can('administration.travelrequest.decide');
  const canExport = can('administration.travelrequest.export');
  const canApproveNow = (r) => r.status === 'pending' && Boolean(STEP_PERMISSIONS[r.currentStep]) && (isSuperAdmin || can(STEP_PERMISSIONS[r.currentStep]));

  const list = useProcList(admTravelSlice, { initialFilters: { status: '', departmentId: '', departureFrom: '', departureTo: '' }, withStats: false });
  const run = useRunAction(admTravelSlice);
  const selection = useSelection();
  const exporter = useExport(travelRequestService, list, selection, EXPORT_COLUMNS, 'travel-requests.csv');

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
    if (row.status === 'draft' && canUpdate) {
      items.push({ label: 'Edit Request', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    }
    if (row.status === 'draft' && canSubmit) {
      items.push({ label: 'Submit for Approval', icon: <FiSend size={14} color="#2563EB" />, action: () => doAction('submit', [row._id], 'Travel request sent for approval') });
    }
    if (canApproveNow(row)) items.push({ label: 'Approve Request', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('approve', row) });
    if (row.status === 'pending' && canReject) items.push({ label: 'Reject Request', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => open('reject', row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'requestId', label: 'REQUEST ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'traveler', label: 'TRAVELER', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{refName(v, 'fullName')}</span> },
    { key: 'fromLocation', label: 'FROM', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'toLocation', label: 'TO', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'departureDate', label: 'DEPARTURE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'returnDate', label: 'RETURN', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'mode', label: 'MODE', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'accommodationRequired', label: 'ACCOM.', render: (_, row) => <span style={{ color: '#475569' }}>{accommodation(row)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Request" aria-label="View request" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [can, isSuperAdmin]);

  const viewActions = (record) => (
    <>
      {record.status === 'draft' && canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit</SecondaryButton>}
      {record.status === 'draft' && canSubmit && <PrimaryButton icon={<FiSend size={14} />} onClick={() => doAction('submit', [record._id], 'Travel request sent for approval')}>Submit for Approval</PrimaryButton>}
      {canApproveNow(record) && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('approve', record)}>Approve</PrimaryButton>}
      {record.status === 'pending' && canReject && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => open('reject', record)}>Reject</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected requests exported` : 'Travel requests exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'departmentId', label: 'Department', options: toOptions(lookups.departments, 'name') },
    { key: 'departureFrom', label: 'Departing from', type: 'date' },
    { key: 'departureTo', label: 'Departing to', type: 'date' },
  ];

  const summary = (row) => <RecordSummary rows={[['Request', row.requestId], ['Traveler', refName(row.traveler, 'fullName')], ['Route', `${row.fromLocation} to ${row.toLocation}`]]} />;

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No travel requests found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by id, traveler, destination..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>New Travel Request</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Travel Requests" subtitle="Narrow the list by status, department and dates." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <TravelFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          me={me}
          ownOnly={ownOnly}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewTravelModal id={viewId} refreshKey={refreshKey} actions={viewActions} canUpload={(r) => canUpdate && (r.status === 'draft' || r.status === 'pending')} onClose={() => setViewId(null)} />}

      {confirm?.type === 'approve' && (
        <ConfirmModal
          title="Approve Travel Request?"
          message={`This approves the ${STEP_LABELS[confirm.row.currentStep] || 'current'} step and moves the request on.`}
          detail={summary(confirm.row)}
          confirmLabel="Approve Request"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('approve', [confirm.row._id], 'Travel request approved')}
        />
      )}
      {confirm?.type === 'reject' && (
        <ReasonModal
          title="Reject Request?"
          message={`Are you sure you want to reject ${confirm.row.requestId}? A rejection reason is required and the requester will be notified.`}
          label="Reason for rejection"
          confirmLabel="Reject Request"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('reject', [confirm.row._id, reason], 'Travel request rejected')}
        />
      )}
    </>
  );
}
