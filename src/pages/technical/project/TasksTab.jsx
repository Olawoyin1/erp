import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiCheck, FiCheckCircle, FiEdit2, FiFileText, FiAlertTriangle, FiGrid, FiList, FiPlay, FiPlus, FiTrash2 } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import TaskBoard from '../../../components/tasks/TaskBoard';
import TaskDetail from '../../../components/tasks/TaskDetail';
import { ALL_PRIORITIES, PRIORITY_LABEL, PRIORITY_STYLE, STATUS_LABEL, toDateInput } from '../../../components/tasks/taskUtils';
import { personName } from '../../../components/documents/fileHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { projectTaskService } from '../../../services/technical.service';
import { projectTasksSlice } from '../../../store/technical/slices';
import {
  Choice, ConfirmModal, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PrimaryButton, RecordSummary, SecondaryButton, StatTiles, TwoCol,
} from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import FilesPanel from '../shared/TechFiles';
import { RowActions, TechBadge } from '../shared/TechUi';
import { useProjectActivities, useRunAction, useSelection, useTechExport, useTechList } from '../shared/techHooks';
import { countFilters, fieldErrorsOf, formatDate, refId, refName, statValue, uploadStagedFiles, ymd } from '../shared/techUtils';

const DETAIL_CONFIG = {
  viewStyle: 'drawer',
  labels: { title: 'TASK NAME', assignee: 'ASSIGNED OFFICER', due: 'TARGET DUE DATE', description: 'TASK DESCRIPTION' },
  fields: { related: false, startDate: true, project: true, status: false, attachments: true },
};

const EXPORT_COLUMNS = [
  { label: 'Task ID', value: (r) => r.taskNo },
  { label: 'Task', value: (r) => r.title },
  { label: 'Linked Activity', value: (r) => refName(r.linkedActivityId, 'activityName') },
  { label: 'Assigned To', value: (r) => personName(r.assigneeId) },
  { label: 'Priority', value: (r) => PRIORITY_LABEL[r.priority] || r.priority },
  { label: 'Due Date', value: (r) => ymd(r.dueDate) },
  { label: 'Status', value: (r) => STATUS_LABEL[r.status] || r.status },
];

const taskStatus = (task) => {
  if (task.isOverdue && task.status !== 'done') return { status: 'overdue', label: 'Overdue' };
  if (task.status === 'done') return { status: 'completed', label: 'Done' };
  if (task.status === 'in_progress') return { status: 'in_progress', label: 'In Progress' };
  return { status: 'pending', label: 'To Do' };
};

function PriorityPill({ priority }) {
  const style = PRIORITY_STYLE[priority] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: style.bg, color: style.color, padding: '3px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600 }}>{PRIORITY_LABEL[priority] || priority}</span>;
}

/** Assign Task / Edit Task for this project (the project is fixed; the activity must belong to it). */
function TaskFormModal({ project, task, onClose, onSaved }) {
  const editing = Boolean(task);
  const activities = useProjectActivities(project._id);
  const [assignees, setAssignees] = useState([]);
  const [assigneeError, setAssigneeError] = useState('');
  const [form, setForm] = useState(() => ({
    title: task?.title || '',
    activityId: refId(task?.linkedActivityId),
    assigneeId: refId(task?.assigneeId),
    startDate: toDateInput(task?.startDate),
    dueDate: toDateInput(task?.dueDate),
    priority: task?.priority || 'medium',
    description: task?.description || '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    let cancelled = false;
    projectTaskService.assignees({ limit: 100 })
      .then((res) => { if (!cancelled) setAssignees(res.data?.data || []); })
      .catch((err) => { if (!cancelled) setAssigneeError(apiError(err, 'Could not load the list of people')); });
    return () => { cancelled = true; };
  }, []);

  const assigneeOptions = useMemo(() => {
    const options = assignees.map((u) => ({ value: u._id, label: u.fullName }));
    const current = task?.assigneeId;
    if (current && typeof current === 'object' && !options.some((o) => o.value === current._id)) options.unshift({ value: current._id, label: personName(current) });
    return options;
  }, [assignees, task]);

  const save = async () => {
    setError('');
    const next = {};
    if (form.title.trim().length < 3) next.title = 'Task name must be at least 3 characters';
    if (!form.assigneeId) next.assigneeId = 'Choose who this task is assigned to';
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) next.startDate = 'Start date must be on or before the due date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const optional = (value) => (value || (editing ? null : undefined));
    const body = {
      title: form.title.trim(),
      assigneeId: form.assigneeId,
      priority: form.priority,
      projectId: project._id,
      linkedActivityId: optional(form.activityId),
      startDate: optional(form.startDate),
      dueDate: optional(form.dueDate),
      description: optional(form.description.trim()),
    };
    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
    try {
      let saved;
      if (editing) saved = (await projectTaskService.update(task._id, body)).data?.data;
      else saved = (await projectTaskService.create({ ...body, module: 'technical' })).data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(projectTaskService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Task updated successfully' : 'Task assigned successfully'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The task could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Task' : 'Assign Task'}
      width="580px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Assign Task'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Task name" required error={errors.title}><Input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={300} error={Boolean(errors.title)} /></Field>
        <TwoCol>
          <Field label="Project" required><Input value={project.projectName} disabled /></Field>
          <Field label="Linked activity (optional)" error={errors.linkedActivityId}>
            <Choice value={form.activityId} onChange={(v) => set('activityId', v)} searchable placeholder={activities.loading ? 'Loading…' : 'No linked activity'} options={[{ value: '', label: 'No linked activity' }, ...activities.options]} error={errors.linkedActivityId || activities.error} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Assigned officer" required error={errors.assigneeId}>
            <Choice value={form.assigneeId} onChange={(v) => set('assigneeId', v)} searchable placeholder="Select" options={assigneeOptions} error={errors.assigneeId || assigneeError} />
          </Field>
          <Field label="Start date" error={errors.startDate}><DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Target due date" error={errors.dueDate}><DatePicker value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} error={Boolean(errors.dueDate)} /></Field>
          <Field label="Priority" required error={errors.priority}>
            <Choice value={form.priority} onChange={(v) => set('priority', v)} options={ALL_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))} />
          </Field>
        </TwoCol>
        <Field label="Task description" error={errors.description}><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Insert notes on deliverables…" maxLength={2000} /></Field>
        {editing
          ? <FilesPanel key={task._id} api={projectTaskService} id={task._id} title="Attach documents" canUpload canRemove />
          : <Field label="Attach documents"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

export default function TasksTab({ project, showToast }) {
  const projectId = project._id;
  const canCreate = usePermission('core.task.create');
  const canUpdate = usePermission('core.task.update');
  const canDelete = usePermission('core.task.delete');
  const open = project.status !== 'completed';

  const fixed = useMemo(() => ({ projectId }), [projectId]);
  const list = useTechList(projectTasksSlice, { initialFilters: { status: '', priority: '', overdue: '' }, fixed, sort: { sort: 'dueDate', order: 'asc' } });
  const run = useRunAction(projectTasksSlice);
  const selection = useSelection();
  const exporter = useTechExport(projectTaskService.exportList, list, selection, EXPORT_COLUMNS, 'project-tasks.csv');

  const [view, setView] = useState('table');
  const [board, setBoard] = useState({ state: 'loading', data: { todo: [], in_progress: [], done: [] }, error: '' });
  const [boardKey, setBoardKey] = useState(0);
  const [formFor, setFormFor] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const boardParams = useMemo(() => {
    const p = { projectId };
    if (list.params.q) p.q = list.params.q;
    if (list.params.priority) p.priority = list.params.priority;
    if (list.params.overdue) p.overdue = list.params.overdue;
    return p;
  }, [projectId, list.params.q, list.params.priority, list.params.overdue]);

  useEffect(() => {
    if (view !== 'board') return undefined;
    let cancelled = false;
    projectTaskService.board(boardParams)
      .then((res) => { if (!cancelled) setBoard({ state: 'ready', data: { todo: [], in_progress: [], done: [], ...(res.data?.data || {}) }, error: '' }); })
      .catch((err) => { if (!cancelled) setBoard((b) => ({ ...b, state: 'error', error: apiError(err, 'The task board could not be loaded') })); });
    return () => { cancelled = true; };
  }, [view, boardParams, boardKey]);

  const refresh = useCallback(() => { list.reload(); setBoardKey((k) => k + 1); }, [list]);

  const changeStatus = async (task, status) => {
    const res = await run('setStatus', task._id, status);
    if (res.ok) { showToast(`Task moved to ${STATUS_LABEL[status]}`, 'success'); refresh(); return true; }
    showToast(res.error, 'error');
    return false;
  };

  const moveOnBoard = async (task, status) => {
    const previous = board.data;
    setBoard((b) => ({ ...b, data: { ...previous, [task.status]: previous[task.status].filter((t) => t._id !== task._id), [status]: [{ ...task, status }, ...previous[status]] } }));
    const res = await run('setStatus', task._id, status);
    if (res.ok) { showToast(`Task moved to ${STATUS_LABEL[status]}`, 'success'); refresh(); } else { setBoard((b) => ({ ...b, data: previous })); showToast(res.error, 'error'); }
  };

  const remove = async () => {
    setBusy(true);
    setActionError('');
    const res = await run('remove', removing._id);
    setBusy(false);
    if (res.ok) { showToast('Task cancelled', 'success'); setRemoving(null); setDetailId(null); refresh(); } else setActionError(res.error);
  };

  const menuItems = (row) => {
    const items = [];
    if (canUpdate && row.status !== 'done') {
      items.push({ label: 'Edit Task', icon: <FiEdit2 size={14} color="#64748B" />, action: () => setFormFor(row) });
      if (row.status === 'todo') items.push({ label: 'Start Task', icon: <FiPlay size={14} color="#2563EB" />, action: () => changeStatus(row, 'in_progress') });
      items.push({ label: 'Mark as Done', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => changeStatus(row, 'done') });
    }
    if (canDelete) items.push({ label: 'Cancel Task', icon: <FiTrash2 size={14} color="#DC2626" />, color: '#DC2626', action: () => { setActionError(''); setRemoving(row); } });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'taskNo', label: 'TASK ID', render: (v, row) => <button type="button" onClick={() => setDetailId(row._id)} style={{ background: 'none', border: 'none', padding: 0, color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}>{v}</button> },
    { key: 'title', label: 'TASK', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'linkedActivityId', label: 'LINKED ACTIVITY', render: (v) => <span style={{ color: '#64748B' }}>{refName(v, 'activityName')}</span> },
    { key: 'assigneeId', label: 'ASSIGNED TO', render: (v) => personName(v) },
    { key: 'priority', label: 'PRIORITY', render: (v) => <PriorityPill priority={v} /> },
    { key: 'dueDate', label: 'DUE DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (_, row) => { const s = taskStatus(row); return <TechBadge status={s.status} label={s.label} />; } },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => <RowActions onView={() => setDetailId(row._id)} items={menuItems(row)} /> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDelete]);

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected tasks exported` : 'Tasks exported'), message ? 'error' : 'success');
  };

  const tiles = [
    { label: 'Total Tasks', value: statValue(list.stats, 'total_tasks'), sub: 'All assigned activities', icon: <FiFileText size={16} />, tone: 'blue' },
    { label: 'Due This Week', value: statValue(list.stats, 'due_this_week'), sub: 'Upcoming deadlines', icon: <FiCalendar size={16} />, tone: 'purple' },
    { label: 'Completed', value: statValue(list.stats, 'completed'), sub: 'Successfully delivered', icon: <FiCheckCircle size={16} />, tone: 'green' },
    { label: 'Overdue Tasks', value: statValue(list.stats, 'overdue_tasks'), sub: 'Past due date', icon: <FiAlertTriangle size={16} />, tone: 'amber' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: [{ value: 'todo', label: 'To Do' }, { value: 'in_progress', label: 'In Progress' }, { value: 'done', label: 'Done' }] },
    { key: 'priority', label: 'Priority', options: ALL_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] })) },
    { key: 'overdue', label: 'Overdue', options: [{ value: 'true', label: 'Overdue only' }] },
  ];

  const toggle = (
    <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
      {[['board', FiGrid, 'Board view'], ['table', FiList, 'List view']].map(([key, Icon, label]) => (
        <button key={key} type="button" title={label} aria-label={label} onClick={() => setView(key)} style={{ border: 'none', background: view === key ? '#fff' : 'transparent', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', color: view === key ? '#1D4ED8' : '#64748B', display: 'flex' }}>
          <Icon size={16} />
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      {view === 'table' ? (
        <ListCard
          list={list}
          columns={columns}
          emptyText="No tasks found."
          selection={selection}
          toolbar={(
            <ListToolbar
              search={list.searchText}
              onSearch={list.onSearch}
              placeholder="Search tasks..."
              onFilter={() => setFilterOpen(true)}
              filterCount={countFilters(list.filters)}
              onExport={onExport}
              exporting={exporter.exporting}
              selectedCount={exporter.selectedCount}
            >
              {canCreate && open && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Task</PrimaryButton>}
              {toggle}
            </ListToolbar>
          )}
        />
      ) : (
        <div className="card" style={{ padding: 0, borderRadius: 12 }}>
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search tasks..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters({ priority: list.filters.priority, overdue: list.filters.overdue })}
            onExport={onExport}
            exporting={exporter.exporting}
          >
            {canCreate && open && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Task</PrimaryButton>}
            {toggle}
          </ListToolbar>
          <div style={{ padding: '0 24px 16px' }}>
            {board.state === 'error' && <FormError message={board.error} />}
            <TaskBoard board={board.data} loading={board.state === 'loading'} canMove={canUpdate} onOpen={(task) => setDetailId(task._id)} onMove={moveOnBoard} />
          </div>
        </div>
      )}

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Tasks" subtitle="Narrow the tasks by status and priority." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <TaskFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          project={project}
          task={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      <TaskDetail
        taskId={detailId}
        config={DETAIL_CONFIG}
        onClose={() => setDetailId(null)}
        onEdit={(task) => { setDetailId(null); setFormFor(task); }}
        onStatusChange={changeStatus}
        notify={(message, type) => showToast(message, type)}
      />

      {removing && (
        <ConfirmModal
          title="Cancel Task?"
          message="This permanently removes the task and its attached documents."
          detail={<RecordSummary rows={[['Task', removing.title], ['Task ID', removing.taskNo]]} />}
          confirmLabel="Cancel Task"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setRemoving(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
