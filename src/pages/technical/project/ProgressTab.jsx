import { useCallback, useMemo, useState } from 'react';
import { FiActivity, FiAlertTriangle, FiCheck, FiCreditCard, FiEdit2, FiFolder, FiPlay, FiPlus, FiX } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { projectLogService, projectService } from '../../../services/technical.service';
import { logsSlice } from '../../../store/technical/slices';
import {
  Choice, DataState, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, ReasonModal, RecordSummary, SecondaryButton,
  StatTiles, StatusLine, TwoCol, ViewHeader, ConfirmModal,
} from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel from '../shared/TechFiles';
import { Legend, LineChart, PairedBarChart } from '../shared/TechCharts';
import { DrawerTabs, PriorityText, RowActions, TechBadge, Trail } from '../shared/TechUi';
import { useFetched, useMyEmployee, useProjectActivities, useRecord, useRunAction, useSelection, useTechExport, useTechList, useTechLookups } from '../shared/techHooks';
import {
  LOG_TYPES, compactMoney, countFilters, csvMoney, fieldErrorsOf, formatDate, fromKobo, money, refId, refName, statusLabel, toKobo, toOptions, today, uploadStagedFiles, ymd,
} from '../shared/techUtils';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Hot'];
const STATUS_OPTIONS = ['monitoring', 'mitigated', 'occurred', 'open', 'in_progress', 'resolved', 'pending_approval', 'approved', 'rejected'].map((value) => ({ value, label: statusLabel(value) }));

const EXPORT_COLUMNS = [
  { label: 'Log ID', value: (r) => r.logId },
  { label: 'Type', value: (r) => r.type },
  { label: 'Title', value: (r) => r.title },
  { label: 'Related WBS', value: (r) => refName(r.linkedWbsActivityId, 'activityName') },
  { label: 'Raised By', value: (r) => refName(r.raisedBy, 'fullName') },
  { label: 'Date Raised', value: (r) => ymd(r.dateRaised) },
  { label: 'Priority', value: (r) => r.priority },
  { label: 'Budget Impact', value: (r) => csvMoney(r.budgetImpact) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

const activityText = (a) => (a && typeof a === 'object' ? `${a.activityName}${a.wbsCode ? ` (WBS ${a.wbsCode})` : ''}` : '—');

/** Log New Entry, or Edit Log (the type cannot change once logged). */
function LogFormModal({ projectId, record, onClose, onSaved }) {
  const editing = Boolean(record);
  const me = useMyEmployee();
  const { lookups } = useTechLookups(['employees']);
  const activities = useProjectActivities(projectId);
  const [form, setForm] = useState(() => ({
    type: record?.type || 'Risk',
    title: record?.title || '',
    activityId: refId(record?.linkedWbsActivityId),
    raisedBy: me.id,
    dateRaised: record ? ymd(record.dateRaised) : today(),
    targetDate: ymd(record?.targetResolutionDate),
    assignedTo: refId(record?.assignedTo),
    priority: record?.priority || 'Medium',
    budget: fromKobo(record?.budgetImpact),
    scheduleImpact: record?.scheduleImpact || '',
    description: record?.description || '',
    potentialImpact: record?.potentialImpact || '',
    recommendedAction: record?.recommendedAction || '',
    resolutionNotes: record?.resolutionNotes || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const employeeOptions = useMemo(() => {
    const options = toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`);
    const current = record?.assignedTo;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: current.fullName });
    return options;
  }, [lookups.employees, record]);

  const save = async () => {
    setError('');
    const next = {};
    if (!form.title.trim()) next.title = 'Enter a title';
    if (!form.activityId) next.linkedWbsActivityId = 'Choose the linked activity';
    if (!form.assignedTo) next.assignedTo = 'Choose who this is assigned to';
    if (!editing && !form.raisedBy) next.raisedBy = 'Choose who raised this entry';
    if (!form.description.trim()) next.description = 'Describe the entry';
    if (!form.potentialImpact.trim()) next.potentialImpact = 'Describe the potential impact';
    if (!form.recommendedAction.trim()) next.recommendedAction = 'State the recommended action';
    if (form.budget !== '' && Number.isNaN(toKobo(form.budget))) next.budgetImpact = 'Enter the budget impact in naira';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = {
      title: form.title.trim(),
      linkedWbsActivityId: form.activityId,
      assignedTo: form.assignedTo,
      priority: form.priority,
      dateRaised: form.dateRaised,
      ...(form.targetDate ? { targetResolutionDate: form.targetDate } : {}),
      ...(form.budget !== '' ? { budgetImpact: toKobo(form.budget) } : {}),
      ...(form.scheduleImpact.trim() ? { scheduleImpact: form.scheduleImpact.trim() } : {}),
      description: form.description.trim(),
      potentialImpact: form.potentialImpact.trim(),
      recommendedAction: form.recommendedAction.trim(),
    };
    try {
      let saved;
      if (editing) saved = (await projectLogService.update(record._id, { ...body, ...(form.resolutionNotes.trim() ? { resolutionNotes: form.resolutionNotes.trim() } : {}) })).data?.data;
      else saved = (await projectLogService.create(projectId, { ...body, type: form.type, ...(me.id ? {} : { raisedBy: form.raisedBy }) })).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(projectLogService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Log entry updated' : 'Log entry created'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The log entry could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Log' : 'Log New Entry'}
      subtitle={editing ? undefined : 'Record a new project risk, issue, or change request'}
      maxWidth="720px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Submit Log'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Type" required error={errors.type}><Choice value={form.type} onChange={(v) => set('type', v)} options={LOG_TYPES} disabled={editing} /></Field>
          <Field label="Title" required error={errors.title}><Input value={form.title} onChange={(e) => set('title', e.target.value)} error={Boolean(errors.title)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Linked WBS activity" required error={errors.linkedWbsActivityId}>
            <Choice value={form.activityId} onChange={(v) => set('activityId', v)} searchable placeholder={activities.loading ? 'Loading…' : 'Select an activity'} options={activities.options} error={errors.linkedWbsActivityId || activities.error} />
          </Field>
          <Field label="Raised by" error={errors.raisedBy} help={me.id || editing ? 'Taken from your account.' : 'Your account has no employee record, so choose who raised this.'}>
            {editing
              ? <Input value={refName(record.raisedBy, 'fullName')} disabled />
              : me.id
                ? <Input value={me.name} disabled />
                : <Choice value={form.raisedBy} onChange={(v) => set('raisedBy', v)} searchable placeholder="Select a person" options={employeeOptions} error={errors.raisedBy} />}
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Date raised" required error={errors.dateRaised}><DatePicker value={form.dateRaised} onChange={(e) => set('dateRaised', e.target.value)} error={Boolean(errors.dateRaised)} /></Field>
          <Field label="Target resolution date" error={errors.targetResolutionDate}><DatePicker value={form.targetDate} onChange={(e) => set('targetDate', e.target.value)} error={Boolean(errors.targetResolutionDate)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Assigned to" required error={errors.assignedTo}>
            <Choice value={form.assignedTo} onChange={(v) => set('assignedTo', v)} searchable placeholder="Select a person" options={employeeOptions} error={errors.assignedTo} />
          </Field>
          <Field label="Priority" required error={errors.priority}><Choice value={form.priority} onChange={(v) => set('priority', v)} options={PRIORITY_OPTIONS} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Budget impact (₦)" error={errors.budgetImpact}><Input value={form.budget} inputMode="decimal" onChange={(e) => set('budget', e.target.value.replace(/,/g, ''))} placeholder="0.00" error={Boolean(errors.budgetImpact)} /></Field>
          <Field label="Schedule impact" error={errors.scheduleImpact}><Input value={form.scheduleImpact} onChange={(e) => set('scheduleImpact', e.target.value)} placeholder="e.g. 3 days delay" /></Field>
        </TwoCol>
        <Field label="Description" required error={errors.description}><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} error={Boolean(errors.description)} /></Field>
        <Field label="Potential impact" required error={errors.potentialImpact}><Textarea rows={3} value={form.potentialImpact} onChange={(e) => set('potentialImpact', e.target.value)} error={Boolean(errors.potentialImpact)} /></Field>
        <Field label="Recommended action" required error={errors.recommendedAction}><Textarea rows={3} value={form.recommendedAction} onChange={(e) => set('recommendedAction', e.target.value)} error={Boolean(errors.recommendedAction)} /></Field>
        {editing && <Field label="Resolution notes" error={errors.resolutionNotes}><Textarea rows={3} value={form.resolutionNotes} onChange={(e) => set('resolutionNotes', e.target.value)} /></Field>}
        {editing
          ? <FilesPanel key={record._id} api={projectLogService} id={record._id} canUpload canRemove />
          : <Field label="Attach document (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewLogDrawer({ id, refreshKey, canUpdate, actions, onClose }) {
  const { record, error, loading } = useRecord(projectLogService, id, refreshKey);
  const trail = useFetched(() => projectLogService.history(id), id, refreshKey);
  const editable = record && (record.type === 'Issue' ? record.status !== 'resolved' : record.type === 'Risk' ? record.status === 'monitoring' : false);
  return (
    <Drawer isOpen onClose={onClose} title="" width="600px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading log entry…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiAlertTriangle size={22} />} title={record.title} subtitle={`${record.logId} • ${refName(record.assignedTo, 'fullName')}`} />
          <StatusLine status={<TechBadge status={record.status} />}>
            <span style={{ flex: 1 }} />
            {actions(record)}
          </StatusLine>
          <DrawerTabs tabs={[{ id: 'overview', label: 'Overview' }, { id: 'timeline', label: 'Timeline' }]}>
            {(tab) => (tab === 'overview' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <DetailGrid
                  items={[
                    ['Request', record.title],
                    ['Log ID', record.logId],
                    ['Type', record.type],
                    ['Linked WBS activity', activityText(record.linkedWbsActivityId)],
                    ['Raised by', refName(record.raisedBy, 'fullName')],
                    ['Date raised', formatDate(record.dateRaised)],
                    ['Target resolution date', formatDate(record.targetResolutionDate)],
                    ['Assigned to', refName(record.assignedTo, 'fullName')],
                    ['Priority', record.priority],
                    ['Budget impact', record.budgetImpact ? money(record.budgetImpact) : '-'],
                    ['Schedule impact', record.scheduleImpact],
                    ['Status', statusLabel(record.status)],
                  ]}
                />
                <Panel title="Description">{record.description || 'No description entered.'}</Panel>
                <Panel title="Potential impact">{record.potentialImpact || 'None recorded.'}</Panel>
                <Panel title="Recommended action">{record.recommendedAction || 'None recorded.'}</Panel>
                <FilesPanel key={record._id} api={projectLogService} id={record._id} canUpload={canUpdate && editable} canRemove={canUpdate && editable} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {trail.error && <FormError message={trail.error} />}
                <Trail events={trail.data} empty={trail.loading ? 'Loading…' : 'No activity recorded.'} />
                {record.resolutionNotes && <Panel title="Resolution notes">{record.resolutionNotes}</Panel>}
              </div>
            ))}
          </DrawerTabs>
        </div>
      )}
    </Drawer>
  );
}

export default function ProgressTab({ project, refreshKey, showToast, onChanged }) {
  const projectId = project._id;
  const canCreate = usePermission('technical.projectlog.create');
  const canUpdate = usePermission('technical.projectlog.update');
  const canDecide = usePermission('technical.projectlog.decide');
  const open = project.status !== 'completed';

  const progress = useFetched(() => projectService.progress(projectId, { months: 6 }), projectId, refreshKey);
  const data = progress.data && !Array.isArray(progress.data) ? progress.data : null;
  const summary = data?.summary;
  const trend = data?.trend || [];
  const latest = trend[trend.length - 1];

  const fixed = useMemo(() => ({ projectId }), [projectId]);
  const list = useTechList(logsSlice, { initialFilters: { type: '', status: '', priority: '', dateFrom: '', dateTo: '' }, fixed, withStats: false });
  const run = useRunAction(logsSlice);
  const selection = useSelection();
  const exportRequest = useCallback((params) => projectLogService.exportList(projectId, params), [projectId]);
  const exporter = useTechExport(exportRequest, list, selection, EXPORT_COLUMNS, 'project-logs.csv');

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
      showToast(success, 'success');
      refresh();
    } else {
      setActionError(res.error);
    }
  };

  const editableRow = (row) => (row.type === 'Issue' ? row.status !== 'resolved' : row.type === 'Risk' ? row.status === 'monitoring' : false);

  const menuItems = (row) => {
    const items = [];
    if (canUpdate && editableRow(row)) items.push({ label: 'Edit Log Entry', icon: <FiEdit2 size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (canDecide) {
      if (row.type === 'Issue' && row.status === 'open') items.push({ label: 'Start Work', icon: <FiPlay size={14} color="#2563EB" />, action: () => ask('start', row) });
      if (row.type === 'Issue' && row.status !== 'resolved') items.push({ label: 'Mark as Resolved', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('resolve', row) });
      if (row.type === 'Risk' && row.status === 'monitoring') {
        items.push({ label: 'Mark as Mitigated', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('mitigate', row) });
        items.push({ label: 'Mark as Occurred', icon: <FiAlertTriangle size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('occurred', row) });
      }
      if (row.type === 'Change Request' && row.status === 'pending_approval') {
        items.push({ label: 'Approve Request', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('approve', row) });
        items.push({ label: 'Reject Request', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('reject', row) });
      }
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'logId', label: 'LOG ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'type', label: 'TYPE', render: (v) => <span style={{ color: '#334155', fontWeight: 500 }}>{v}</span> },
    { key: 'title', label: 'TITLE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'linkedWbsActivityId', label: 'RELATED WBS', render: (v) => <span style={{ color: '#64748B' }}>{refName(v, 'activityName')}</span> },
    { key: 'raisedBy', label: 'RAISED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'dateRaised', label: 'DATE RAISED', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'priority', label: 'PRIORITY', render: (v) => <PriorityText value={v} /> },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setViewId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDecide]);

  const viewActions = (record) => {
    const items = menuItems(record);
    return (
      <>
        {items.filter((i) => i.label !== 'Edit Log Entry').map((item) => (
          <SecondaryButton key={item.label} icon={item.icon} onClick={() => { item.action(); }}>{item.label}</SecondaryButton>
        ))}
        {canUpdate && editableRow(record) && <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => { setViewId(null); setFormFor(record); }}>Edit Log</SecondaryButton>}
      </>
    );
  };

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected entries exported` : 'Project logs exported'), message ? 'error' : 'success');
  };

  const tiles = [
    { label: 'Physical Progress', value: summary ? `${summary.physicalProgress}%` : '—', sub: 'Against project scope', icon: <FiActivity size={16} />, tone: 'blue' },
    { label: 'Financial Budget', value: summary ? `${compactMoney(summary.totalDisbursed)} / ${compactMoney(summary.approvedBudget)}` : '—', sub: 'Budget utilized', icon: <FiCreditCard size={16} />, tone: 'purple' },
    { label: 'Project Health', value: summary ? summary.health : '—', sub: 'Overall delivery', icon: <FiCheck size={16} />, tone: 'green' },
    { label: 'Open Project Logs', value: summary ? summary.openLogs : '—', sub: 'Risks, issues & changes', icon: <FiFolder size={16} />, tone: 'amber' },
  ];

  const confirmCopy = {
    start: { title: 'Start Work on This Issue?', message: 'The issue moves to In Progress.', label: 'Start Work', method: 'start', done: 'Issue moved to in progress' },
    approve: { title: 'Approve Change Request?', message: 'The change request is marked approved.', label: 'Approve Request', method: 'approve', done: 'Change request approved' },
  };
  const reasonCopy = {
    resolve: { title: 'Mark Issue as Resolved?', label: 'Resolution notes', button: 'Mark Resolved', method: 'resolve', done: 'Issue marked resolved', danger: false },
    mitigate: { title: 'Mark Risk as Mitigated?', label: 'Mitigation notes', button: 'Mark Mitigated', method: 'mitigate', done: 'Risk marked mitigated', danger: false },
    occurred: { title: 'Mark Risk as Occurred?', label: 'What happened', button: 'Mark Occurred', method: 'markOccurred', done: 'Risk marked occurred', danger: true },
    reject: { title: 'Reject Change Request?', label: 'Reason for rejection', button: 'Reject Request', method: 'reject', done: 'Change request rejected', danger: true },
  };
  const summaryRows = (row) => [['Entry', row.title], ['Log ID', row.logId], ['Type', row.type]];

  const filterFields = [
    { key: 'type', label: 'Type', options: LOG_TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS.map((p) => ({ value: p, label: p })) },
    { key: 'dateFrom', label: 'Raised from', type: 'date' },
    { key: 'dateTo', label: 'Raised to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatTiles tiles={tiles} loading={progress.loading} error={Boolean(progress.error)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 600 }}>Physical Progress vs Financial Progress</h3>
          <Legend items={[
            { label: 'Physical Progress (%)', color: '#1D4ED8', value: latest ? `${latest.physicalProgress}%` : undefined },
            { label: 'Financial Progress (%)', color: '#EF4444', value: latest ? `${latest.financialProgress}%` : undefined },
          ]}
          />
          <DataState loading={progress.loading} error={progress.error} empty={!trend.length} emptyText="No progress data yet.">
            <LineChart labels={trend.map((t) => t.label)} series={[{ label: 'Physical Progress', color: '#1D4ED8', values: trend.map((t) => t.physicalProgress) }, { label: 'Financial Progress', color: '#EF4444', values: trend.map((t) => t.financialProgress) }]} />
          </DataState>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Budget vs Actual Cost</h3>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#64748B' }}>Compare planned budget against actual project expenditure</p>
          <Legend items={[{ label: 'Budget', color: '#EF4444', square: true }, { label: 'Actual Cost', color: '#1D4ED8', square: true }]} />
          <DataState loading={progress.loading} error={progress.error} empty={!trend.length} emptyText="No cost data yet.">
            <PairedBarChart labels={trend.map((t) => t.label)} a={{ label: 'Budget', color: '#EF4444', values: trend.map((t) => t.budget) }} b={{ label: 'Actual Cost', color: '#1D4ED8', values: trend.map((t) => t.actualCost) }} />
          </DataState>
        </div>
      </div>

      <ListCard
        list={list}
        columns={columns}
        emptyText="No log entries yet."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search Log ID, Type..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && open && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Log Entry</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Log Entries" subtitle="Narrow the log by type, status and priority." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <LogFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          projectId={projectId}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {viewId && <ViewLogDrawer id={viewId} refreshKey={refreshKey + localKey} canUpdate={canUpdate} actions={viewActions} onClose={() => setViewId(null)} />}

      {confirm && confirmCopy[confirm.type] && (
        <ConfirmModal
          title={confirmCopy[confirm.type].title}
          message={confirmCopy[confirm.type].message}
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          confirmLabel={confirmCopy[confirm.type].label}
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction(confirmCopy[confirm.type].method, [confirm.row._id], confirmCopy[confirm.type].done)}
        />
      )}
      {confirm && reasonCopy[confirm.type] && (
        <ReasonModal
          title={reasonCopy[confirm.type].title}
          detail={<RecordSummary rows={summaryRows(confirm.row)} />}
          label={reasonCopy[confirm.type].label}
          confirmLabel={reasonCopy[confirm.type].button}
          danger={reasonCopy[confirm.type].danger}
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(notes) => doAction(reasonCopy[confirm.type].method, [confirm.row._id, notes], reasonCopy[confirm.type].done)}
        />
      )}
    </div>
  );
}
