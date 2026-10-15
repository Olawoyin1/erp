import { useCallback, useMemo, useState } from 'react';
import { FiEdit2, FiList, FiPlus, FiTrash2 } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { wbsService } from '../../../services/technical.service';
import { wbsSlice } from '../../../store/technical/slices';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, RecordSummary, SecondaryButton, TwoCol,
  ViewHeader,
} from '../../procurement/shared/ProcUi';
import { ProgressBar, RowActions, TechBadge } from '../shared/TechUi';
import { useRecord, useRunAction, useSelection, useTechExport, useTechList, useTechLookups } from '../shared/techHooks';
import { WBS_PHASES, countFilters, fieldErrorsOf, formatDate, refId, refName, statusLabel, toOptions, ymd } from '../shared/techUtils';

const STATUS_OPTIONS = ['pending', 'in_progress', 'on_hold', 'delayed', 'completed'].map((value) => ({ value, label: statusLabel(value) }));
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Hot'];

const EXPORT_COLUMNS = [
  { label: 'WBS Code', value: (r) => r.wbsCode },
  { label: 'Activity', value: (r) => r.activityName },
  { label: 'Phase', value: (r) => r.phase },
  { label: 'Assigned To', value: (r) => refName(r.assignedTo, 'fullName') },
  { label: 'Progress (%)', value: (r) => r.progressPercent },
  { label: 'Start Date', value: (r) => ymd(r.startDate) },
  { label: 'End Date', value: (r) => ymd(r.endDate) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

/** Depth of a WBS code: "1.0" is 0, "2.1" is 1, "2.1.1" is 2. */
const depthOf = (code) => Math.max(0, String(code).replace(/\.0$/, '').split('.').length - 1);

const durationText = (start, end) => {
  if (!start || !end) return '';
  const days = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000));
  return `${days} Day${days === 1 ? '' : 's'}`;
};

function Toggle({ label, help, checked, onChange }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
      <span>
        <span style={{ display: 'block', fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{help}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: '#1D4ED8', marginTop: 4 }} />
    </label>
  );
}

/**
 * Add Activity, Edit Activity, Add Sub-Activity or Edit Sub-Activity. `activity` is the record being edited; `parent` is the
 * activity a new sub-activity goes under.
 */
function ActivityFormDrawer({ projectId, activity, parent, onClose, onSaved }) {
  const editing = Boolean(activity);
  const sub = Boolean(parent) || Boolean(activity?.parentActivityId);
  const parentRow = parent || (activity?.parentActivityId && typeof activity.parentActivityId === 'object' ? activity.parentActivityId : null);
  const { lookups } = useTechLookups(['employees']);
  const [form, setForm] = useState(() => ({
    activityName: activity?.activityName || '',
    phase: activity?.phase || 'Planning',
    assignedTo: refId(activity?.assignedTo),
    priority: activity?.priority || 'Medium',
    startDate: ymd(activity?.startDate),
    endDate: ymd(activity?.endDate),
    description: activity?.description || '',
    isCriticalPath: Boolean(activity?.isCriticalPath),
    isMilestone: Boolean(activity?.isMilestone),
    status: activity?.status || 'pending',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const employeeOptions = useMemo(() => {
    const options = toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`);
    const current = activity?.assignedTo;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: current.fullName });
    return options;
  }, [lookups.employees, activity]);

  const save = async () => {
    setError('');
    const next = {};
    if (!form.activityName.trim()) next.activityName = 'Enter the activity name';
    if (!form.assignedTo) next.assignedTo = 'Choose who is assigned';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.endDate) next.endDate = 'Choose the end date';
    if (form.startDate && form.endDate && form.startDate > form.endDate) next.startDate = 'Start date must be on or before the end date';
    if (!form.description.trim()) next.description = 'Add a description';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = {
      activityName: form.activityName.trim(),
      phase: form.phase,
      assignedTo: form.assignedTo,
      priority: form.priority,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description.trim(),
      isCriticalPath: form.isCriticalPath,
      isMilestone: form.isMilestone,
    };
    try {
      if (editing) await wbsService.update(activity._id, { ...body, status: form.status });
      else if (parent) await wbsService.addSubActivity(projectId, parent._id, body);
      else await wbsService.create(projectId, body);
      onSaved(editing ? (sub ? 'Sub-activity updated' : 'Activity updated') : sub ? 'Sub-activity added' : 'Activity added');
    } catch (err) {
      setError(apiError(err, 'The activity could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  const noun = sub ? 'Sub-Activity' : 'Activity';
  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? `Edit ${noun}` : `Add ${noun}`}
      subtitle={sub && !editing ? 'Create a child activity under the selected work package' : !editing ? 'Create a new work package, activity, or milestone for this project' : undefined}
      width="520px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : `Save ${noun}`}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        {sub && parentRow && (
          <TwoCol min={200}>
            <Field label="Parent activity"><Input value={parentRow.activityName} disabled /></Field>
            <Field label="Parent WBS"><Input value={parentRow.wbsCode} disabled /></Field>
          </TwoCol>
        )}
        <Field label={sub ? 'Sub-activity name' : 'Activity name'} required error={errors.activityName}>
          <Input value={form.activityName} onChange={(e) => set('activityName', e.target.value)} placeholder="Project Kick-off" error={Boolean(errors.activityName)} />
        </Field>
        <TwoCol min={200}>
          <Field label="Activity phase" required error={errors.phase}><Choice value={form.phase} onChange={(v) => set('phase', v)} options={WBS_PHASES} /></Field>
          <Field label="Assigned to" required error={errors.assignedTo}>
            <Choice value={form.assignedTo} onChange={(v) => set('assignedTo', v)} searchable placeholder="Select a person" options={employeeOptions} error={errors.assignedTo} />
          </Field>
        </TwoCol>
        <TwoCol min={200}>
          <Field label="Priority" required error={errors.priority}><Choice value={form.priority} onChange={(v) => set('priority', v)} options={PRIORITY_OPTIONS} /></Field>
          <Field label="Start date" required error={errors.startDate}>
            <DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} />
          </Field>
        </TwoCol>
        <TwoCol min={200}>
          <Field label="End date" required error={errors.endDate}>
            <DatePicker value={form.endDate} onChange={(e) => set('endDate', e.target.value)} error={Boolean(errors.endDate)} />
          </Field>
          <Field label="Duration"><Input value={durationText(form.startDate, form.endDate)} disabled placeholder="Calculated from the dates" /></Field>
        </TwoCol>
        {editing && (
          <Field label="Status" error={errors.status}><Choice value={form.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} /></Field>
        )}
        <Field label="Description" required error={errors.description}>
          <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add description..." error={Boolean(errors.description)} />
        </Field>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Activity configuration</div>
          <Toggle label="Critical Path Marker" help="Activities on the critical path directly affect project completion" checked={form.isCriticalPath} onChange={(v) => set('isCriticalPath', v)} />
          <Toggle label="Milestone" help="Represents a key project checkpoint" checked={form.isMilestone} onChange={(v) => set('isMilestone', v)} />
        </div>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewActivityDrawer({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(wbsService, id, refreshKey);
  const parent = record?.parentActivityId && typeof record.parentActivityId === 'object' ? record.parentActivityId : null;
  return (
    <Drawer isOpen onClose={onClose} title="" width="540px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading activity…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -8 }}>
          <ViewHeader icon={<FiList size={22} />} title={record.activityName} subtitle={`WBS ${record.wbsCode} • ${refName(record.assignedTo, 'fullName')}`}>
            {actions(record)}
          </ViewHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#64748B' }}>
            Status: <TechBadge status={record.status} /> <TechBadge status={record.priority} label={record.priority} />
          </div>
          <ProgressBar value={record.progressPercent} color={record.status === 'completed' ? '#22C55E' : '#3B82F6'} />
          <DetailGrid
            items={[
              parent && ['Parent activity', parent.activityName],
              parent && ['Parent WBS', parent.wbsCode],
              ['Activity name', record.activityName],
              ['Activity phase', record.phase],
              ['Assigned to', refName(record.assignedTo, 'fullName')],
              ['Priority', record.priority],
              ['Start date', formatDate(record.startDate)],
              ['End date', formatDate(record.endDate)],
              ['Duration', `${record.durationDays} day${record.durationDays === 1 ? '' : 's'}`],
            ]}
          />
          <Panel title="Description">{record.description || 'No description entered.'}</Panel>
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Activity configuration</div>
            {[['Critical Path Marker', 'Activities on the critical path directly affect project completion', record.isCriticalPath], ['Milestone', 'Represents a key project checkpoint', record.isMilestone]].map(([label, help, on]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span><span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#0F172A' }}>{label}</span><span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{help}</span></span>
                <input type="checkbox" checked={Boolean(on)} readOnly disabled style={{ accentColor: '#1D4ED8' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function WbsTab({ project, showToast, onChanged }) {
  const projectId = project._id;
  const canCreate = usePermission('technical.wbsactivity.create');
  const canUpdate = usePermission('technical.wbsactivity.update');
  const canDelete = usePermission('technical.wbsactivity.delete');
  const open = project.status !== 'completed';

  const fixed = useMemo(() => ({ projectId }), [projectId]);
  const list = useTechList(wbsSlice, { initialFilters: { status: '', phase: '' }, fixed, withStats: false });
  const run = useRunAction(wbsSlice);
  const selection = useSelection();
  const exportRequest = useCallback((params) => wbsService.exportList(projectId, params), [projectId]);
  const exporter = useTechExport(exportRequest, list, selection, EXPORT_COLUMNS, 'wbs-activities.csv');

  const [form, setForm] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); if (onChanged) onChanged(); };

  const remove = async () => {
    setBusy(true);
    setActionError('');
    const res = await run('remove', deleting._id);
    setBusy(false);
    if (res.ok) {
      showToast(`${deleting.parentActivityId ? 'Sub-activity' : 'Activity'} deleted`, 'success');
      setDeleting(null);
      setViewId(null);
      refresh();
    } else {
      setActionError(res.error);
    }
  };

  const menuItems = (row) => {
    const child = Boolean(row.parentActivityId);
    const items = [];
    if (canUpdate && open) items.push({ label: child ? 'Edit Sub-Activity' : 'Edit Activity', icon: <FiEdit2 size={14} color="#64748B" />, action: () => setForm({ activity: row }) });
    if (canCreate && open) items.push({ label: 'Add Sub-Activity', icon: <FiPlus size={14} color="#64748B" />, action: () => setForm({ parent: row }) });
    if (canDelete) items.push({ label: child ? 'Delete Sub-Activity' : 'Delete Activity', icon: <FiTrash2 size={14} color="#DC2626" />, color: '#DC2626', action: () => { setActionError(''); setDeleting(row); } });
    return items;
  };

  const columns = useMemo(() => [
    {
      key: 'wbsCode',
      label: 'WBS CODE',
      render: (v, row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', paddingLeft: depthOf(v) * 14 }}>
          {row.isCriticalPath ? <span title="Critical path" style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> : row.isMilestone ? <span title="Milestone" style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} /> : <span style={{ width: 8 }} />}
          {v}
        </span>
      ),
    },
    { key: 'activityName', label: 'ACTIVITY', render: (v, row) => <span style={{ fontWeight: row.parentActivityId ? 400 : 600, color: '#0F172A', paddingLeft: depthOf(row.wbsCode) * 14 }}>{v}</span> },
    { key: 'phase', label: 'PHASE', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'progressPercent', label: 'PROGRESS', render: (v, row) => <ProgressBar value={v} width={50} color={row.status === 'completed' ? '#22C55E' : '#3B82F6'} /> },
    { key: 'startDate', label: 'START DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'endDate', label: 'END DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setViewId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canCreate, canUpdate, canDelete, open]);

  const viewActions = (record) => (
    <>
      {canCreate && open && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => { setViewId(null); setForm({ parent: record }); }}>Sub-Activity</PrimaryButton>}
      {canDelete && <SecondaryButton danger icon={<FiTrash2 size={14} />} onClick={() => { setActionError(''); setDeleting(record); }}>Delete</SecondaryButton>}
      {canUpdate && open && <SecondaryButton icon={<FiEdit2 size={14} />} onClick={() => { setViewId(null); setForm({ activity: record }); }}>Edit</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected activities exported` : 'WBS exported'), message ? 'error' : 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'phase', label: 'Phase', options: WBS_PHASES.map((p) => ({ value: p, label: p })) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No activities yet. Add the first work package for this project."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search activities..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && open && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setForm({})}>Add Activity</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: '#64748B' }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', marginRight: 4 }} />Milestone Marker</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', marginRight: 4 }} />Critical Path</span>
      </div>

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Activities" subtitle="Narrow the work breakdown by status and phase." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {form && (
        <ActivityFormDrawer
          key={form.activity?._id || form.parent?._id || 'new'}
          projectId={projectId}
          activity={form.activity}
          parent={form.parent}
          onClose={() => setForm(null)}
          onSaved={(message) => { setForm(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {viewId && <ViewActivityDrawer id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}
      {deleting && (
        <ConfirmModal
          title={deleting.parentActivityId ? 'Delete Sub-Activity?' : 'Delete Activity?'}
          message="This cannot be undone. An activity that still has sub-activities cannot be deleted."
          detail={<RecordSummary rows={[['Activity', deleting.activityName], ['WBS code', deleting.wbsCode]]} />}
          confirmLabel="Delete"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
