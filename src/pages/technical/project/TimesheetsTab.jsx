import { useCallback, useMemo, useState } from 'react';
import { FiCalendar, FiCheck, FiClock, FiEdit2, FiPlus, FiTrash2, FiUsers, FiX, FiZap } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { timesheetService } from '../../../services/technical.service';
import { timesheetsSlice } from '../../../store/technical/slices';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, ReasonModal, RecordSummary, SecondaryButton,
  StatTiles, StatusLine, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel from '../shared/TechFiles';
import { DrawerTabs, RowActions, TechBadge, Trail } from '../shared/TechUi';
import { useFetched, useMyEmployee, useProjectActivities, useRecord, useRunAction, useSelection, useTechExport, useTechList, useTechLookups } from '../shared/techHooks';
import {
  SHIFTS, countFilters, fieldErrorsOf, formatDate, hoursMinutes, hoursText, refId, refName, statValue, statusLabel, toOptions, today, uploadStagedFiles, ymd,
} from '../shared/techUtils';

const STATUS_OPTIONS = ['submitted', 'approved', 'rejected'].map((value) => ({ value, label: statusLabel(value) }));

const EXPORT_COLUMNS = [
  { label: 'Employee ID', value: (r) => refName(r.employeeId, 'employeeId') },
  { label: 'Employee', value: (r) => refName(r.employeeId, 'fullName') },
  { label: 'Role', value: (r) => r.role },
  { label: 'Date', value: (r) => ymd(r.date) },
  { label: 'Activity', value: (r) => refName(r.activityTask, 'activityName') },
  { label: 'Hours Worked', value: (r) => r.hoursWorked },
  { label: 'Overtime Hours', value: (r) => r.overtimeHours },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function TimesheetFormModal({ projectId, record, onClose, onSaved }) {
  const editing = Boolean(record);
  const me = useMyEmployee();
  const { lookups } = useTechLookups(['employees']);
  const activities = useProjectActivities(projectId);
  const [form, setForm] = useState(() => ({
    employeeId: refId(record?.employeeId) || me.id,
    date: record ? ymd(record.date) : today(),
    shift: record?.shift || '',
    activityTask: refId(record?.activityTask),
    hours: record ? String(record.hoursWorked) : '',
    overtime: record ? String(record.overtimeHours ?? 0) : '0',
    workSummary: record?.workSummary || '',
    remarks: record?.additionalRemarksComments || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const chosen = (lookups.employees || []).find((e) => e._id === form.employeeId);
  const employeeName = editing ? refName(record.employeeId, 'fullName') : me.id ? me.name : chosen?.fullName || '';
  const employeeCode = editing ? refName(record.employeeId, 'employeeId') : chosen?.employeeId || '';

  const save = async () => {
    setError('');
    const next = {};
    if (!form.employeeId) next.employeeId = 'Choose the employee';
    if (!form.date) next.date = 'Choose the date';
    if (!form.shift) next.shift = 'Choose the shift';
    if (!form.activityTask) next.activityTask = 'Choose the activity or task';
    const hours = Number(form.hours);
    const overtime = Number(form.overtime || 0);
    if (!(hours > 0 && hours <= 24)) next.hoursWorked = 'Hours worked must be above 0 and at most 24';
    if (!(overtime >= 0 && overtime <= 24)) next.overtimeHours = 'Overtime must be between 0 and 24';
    if (!form.workSummary.trim()) next.workSummary = 'Summarise the work done';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = {
      date: form.date,
      shift: form.shift,
      activityTask: form.activityTask,
      hoursWorked: hours,
      overtimeHours: overtime,
      workSummary: form.workSummary.trim(),
      ...(form.remarks.trim() ? { additionalRemarksComments: form.remarks.trim() } : {}),
    };
    try {
      let saved;
      if (editing) saved = (await timesheetService.update(record._id, body)).data?.data;
      else saved = (await timesheetService.create(projectId, { ...body, ...(me.id ? {} : { employeeId: form.employeeId }) })).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(timesheetService, saved._id, files);
        if (failed.length) note = ` Files not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Timesheet updated' : 'Timesheet logged'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The timesheet could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Timesheet' : 'Log Timesheet'}
      subtitle={editing ? undefined : 'Log your work hours for this project'}
      maxWidth="640px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Save Entry'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Employee" error={errors.employeeId} help={me.id || editing ? 'Hours are logged against this person.' : 'Your account has no employee record, so choose who the hours belong to.'}>
            {me.id || editing
              ? <Input value={employeeName || '—'} disabled />
              : <Choice value={form.employeeId} onChange={(v) => set('employeeId', v)} searchable placeholder="Select an employee" options={toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)} error={errors.employeeId} />}
          </Field>
          <Field label="Employee ID"><Input value={employeeCode || '—'} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Role" help="Recorded from the employee's position when the timesheet is logged."><Input value={(editing ? record.role : me.id ? me.position : chosen?.position) || '—'} disabled /></Field>
          <Field label="Date" required error={errors.date}><DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} error={Boolean(errors.date)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Shift" required error={errors.shift}><Choice value={form.shift} onChange={(v) => set('shift', v)} placeholder="Select" options={SHIFTS} error={errors.shift} /></Field>
          <Field label="Activity / task" required error={errors.activityTask}>
            <Choice value={form.activityTask} onChange={(v) => set('activityTask', v)} searchable placeholder={activities.loading ? 'Loading…' : 'Select an activity'} options={activities.options} error={errors.activityTask || activities.error} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Hours worked" required error={errors.hoursWorked}><Input value={form.hours} inputMode="decimal" onChange={(e) => set('hours', e.target.value.replace(/[^\d.]/g, ''))} placeholder="8" error={Boolean(errors.hoursWorked)} /></Field>
          <Field label="Overtime hours" error={errors.overtimeHours}><Input value={form.overtime} inputMode="decimal" onChange={(e) => set('overtime', e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" error={Boolean(errors.overtimeHours)} /></Field>
        </TwoCol>
        <Field label="Work summary" required error={errors.workSummary}><Textarea rows={3} value={form.workSummary} onChange={(e) => set('workSummary', e.target.value)} error={Boolean(errors.workSummary)} /></Field>
        <Field label="Additional remarks / comments" error={errors.additionalRemarksComments}><Textarea rows={2} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="Notes about weather stoppages..." /></Field>
        {editing
          ? <FilesPanel key={record._id} api={timesheetService} id={record._id} title="Attached documents" canUpload canRemove />
          : <Field label="File upload (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewTimesheetDrawer({ id, refreshKey, actions, canUpdate, onClose }) {
  const { record, error, loading } = useRecord(timesheetService, id, refreshKey);
  const trail = useFetched(() => timesheetService.history(id), id, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title="" width="580px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading timesheet…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiClock size={22} />} title={refName(record.employeeId, 'fullName')} subtitle={`${formatDate(record.date)} • ${refName(record.employeeId, 'employeeId')}`} />
          <StatusLine status={<TechBadge status={record.status} />}>
            <span style={{ flex: 1 }} />
            {actions(record)}
          </StatusLine>
          <DrawerTabs tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]}>
            {(tab) => (tab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailGrid
                  items={[
                    ['Employee', refName(record.employeeId, 'fullName')],
                    ['Employee ID', refName(record.employeeId, 'employeeId')],
                    ['Role', record.role],
                    ['Date', formatDate(record.date)],
                    ['Shift', record.shift],
                    ['Activity / task', refName(record.activityTask, 'activityName')],
                    ['Hours worked', hoursMinutes(record.hoursWorked)],
                    ['Overtime hours', hoursMinutes(record.overtimeHours)],
                  ]}
                />
                <Panel title="Work summary">{record.workSummary || '—'}</Panel>
                <Panel title="Additional remarks">{record.additionalRemarksComments || '—'}</Panel>
                {record.rejectionReason && <Panel title="Rejection reason" tone="red">{record.rejectionReason}</Panel>}
                <FilesPanel key={record._id} api={timesheetService} id={record._id} title="Attached documents" canUpload={canUpdate && record.status === 'submitted'} canRemove={canUpdate && record.status === 'submitted'} />
              </div>
            ) : (
              <>
                {trail.error && <FormError message={trail.error} />}
                <Trail events={trail.data} empty={trail.loading ? 'Loading…' : 'No activity recorded.'} />
              </>
            ))}
          </DrawerTabs>
        </div>
      )}
    </Drawer>
  );
}

export default function TimesheetsTab({ project, refreshKey, showToast, onChanged }) {
  const projectId = project._id;
  const canCreate = usePermission('technical.timesheet.create');
  const canUpdate = usePermission('technical.timesheet.update');
  const canDecide = usePermission('technical.timesheet.decide');
  const open = project.status !== 'completed';
  const me = useMyEmployee();
  const own = (row) => Boolean(me.id) && refId(row.employeeId) === me.id;

  const fixed = useMemo(() => ({ projectId }), [projectId]);
  const list = useTechList(timesheetsSlice, { initialFilters: { status: '', date: '', dateFrom: '', dateTo: '' }, fixed });
  const run = useRunAction(timesheetsSlice);
  const selection = useSelection();
  const exportRequest = useCallback((params) => timesheetService.exportList(projectId, params), [projectId]);
  const exporter = useTechExport(exportRequest, list, selection, EXPORT_COLUMNS, 'timesheets.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [localKey, setLocalKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { list.reload(); setLocalKey((k) => k + 1); if (onChanged) onChanged(); };
  const ask = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const doAction = async (method, args, success) => {
    setBusy(true);
    setActionError('');
    const res = await run(method, ...args);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      if (method === 'remove') setViewId(null);
      showToast(success, 'success');
      refresh();
    } else {
      setActionError(res.error);
    }
  };

  const mayChange = (row) => row.status === 'submitted' && canUpdate && (own(row) || canDecide);
  const mayDecide = (row) => row.status === 'submitted' && canDecide && !own(row);

  const menuItems = (row) => {
    const items = [];
    if (mayChange(row)) {
      items.push({ label: 'Edit Entry', icon: <FiEdit2 size={14} color="#64748B" />, action: () => setFormFor(row) });
      items.push({ label: 'Delete Entry', icon: <FiTrash2 size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('delete', row) });
    }
    if (mayDecide(row)) {
      items.push({ label: 'Approve', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('approve', row) });
      items.push({ label: 'Reject', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('reject', row) });
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'employeeId', label: 'EMPLOYEE ID', render: (v) => <span style={{ color: '#64748B' }}>{refName(v, 'employeeId')}</span> },
    { key: 'employee', label: 'EMPLOYEE', render: (_, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{refName(row.employeeId, 'fullName')}</span> },
    { key: 'role', label: 'ROLE', render: (v) => <span style={{ color: '#3B82F6', fontSize: '0.8rem' }}>{v || '—'}</span> },
    { key: 'activityTask', label: 'ACTIVITY', render: (v) => refName(v, 'activityName') },
    { key: 'hoursWorked', label: 'HOURS WORKED', render: (v) => hoursMinutes(v) },
    { key: 'overtimeHours', label: 'OVERTIME', render: (v) => hoursMinutes(v) },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setViewId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDecide, me.id]);

  const viewActions = (record) => (
    <>
      {mayDecide(record) && (
        <>
          <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => ask('approve', record)}>Approve</PrimaryButton>
          <SecondaryButton danger icon={<FiX size={14} />} onClick={() => ask('reject', record)}>Reject</SecondaryButton>
        </>
      )}
      {mayChange(record) && (
        <>
          <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => { setViewId(null); setFormFor(record); }}>Edit</SecondaryButton>
          <SecondaryButton danger icon={<FiTrash2 size={14} />} onClick={() => ask('delete', record)}>Delete</SecondaryButton>
        </>
      )}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected timesheets exported` : 'Timesheets exported'), message ? 'error' : 'success');
  };

  const tiles = [
    { label: 'Project Workforce', value: statValue(list.stats, 'project_workforce'), sub: 'Personnel assigned to this project', icon: <FiUsers size={16} />, tone: 'blue' },
    { label: 'Hours Logged', value: hoursText(statValue(list.stats, 'hours_logged')), sub: 'Total hours logged on this project to date', icon: <FiClock size={16} />, tone: 'green' },
    { label: 'Overtime', value: hoursText(statValue(list.stats, 'overtime')), sub: 'Total overtime logged on this project to date', icon: <FiZap size={16} />, tone: 'amber' },
    { label: 'Project Attendance', value: `${statValue(list.stats, 'project_attendance')}%`, sub: 'Share of logged timesheets that are approved', icon: <FiCalendar size={16} />, tone: 'purple' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'date', label: 'Single day', type: 'date' },
    { key: 'dateFrom', label: 'Date from', type: 'date' },
    { key: 'dateTo', label: 'Date to', type: 'date' },
  ];
  const summaryRows = (row) => [['Employee', refName(row.employeeId, 'fullName')], ['Date', formatDate(row.date)], ['Hours', hoursMinutes(row.hoursWorked)]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748B' }}>Site Timesheets · {list.filters.date ? formatDate(list.filters.date) : 'all dates'}</div>

      <ListCard
        list={list}
        columns={columns}
        emptyText="No timesheets found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search employee, activity..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && open && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Log Timesheet</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Timesheets" subtitle="Narrow the timesheets by status and date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <TimesheetFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          projectId={projectId}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {viewId && <ViewTimesheetDrawer id={viewId} refreshKey={refreshKey + localKey} actions={viewActions} canUpdate={canUpdate} onClose={() => setViewId(null)} />}

      {confirm?.type === 'approve' && (
        <ConfirmModal
          title="Approve Timesheet?"
          message="Approved timesheets are locked. You cannot approve your own timesheet."
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          confirmLabel="Approve"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('approve', [confirm.row._id], 'Timesheet approved')}
        />
      )}
      {confirm?.type === 'reject' && (
        <ReasonModal
          title="Reject Timesheet?"
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          label="Reason for rejection"
          confirmLabel="Reject Timesheet"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('reject', [confirm.row._id, reason], 'Timesheet rejected')}
        />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Delete Entry?"
          message="This permanently removes the timesheet and its files."
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          confirmLabel="Delete Entry"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('remove', [confirm.row._id], 'Timesheet deleted')}
        />
      )}
    </div>
  );
}
