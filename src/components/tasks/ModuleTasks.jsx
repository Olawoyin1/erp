import { useCallback, useState } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiEdit2, FiCheck, FiPlay, FiTrash2, FiGrid, FiList,
  FiFileText, FiClock, FiCalendar, FiAlertTriangle, FiCheckCircle,
} from 'react-icons/fi';
import DataTable from '../ui/DataTable';
import Pagination from '../ui/Pagination';
import Badge from '../ui/Badge';
import Drawer from '../ui/Drawer';
import Modal from '../ui/Modal';
import RowMenu from '../ui/RowMenu';
import Toast from '../ui/Toast';
import { FormField, Input, Select } from '../ui/FormField';
import { tasksService } from '../../services/tasks.service';
import { apiError } from '../../services/apiHelpers';
import { usePermission } from '../../hooks/usePermission';
import { blobErrorMessage, displayDate, personName, saveBlob } from '../documents/fileHelpers';
import { useModuleTasks, PAGE_SIZE } from './useModuleTasks';
import TaskForm from './TaskForm';
import TaskDetail from './TaskDetail';
import TaskBoard from './TaskBoard';
import { ALL_PRIORITIES, PRIORITY_LABEL, PRIORITY_STYLE, STATUS_LABEL, displayStatus } from './taskUtils';

const TILE_ICONS = {
  total_tasks: { icon: FiFileText, bg: '#EFF6FF', color: '#2563EB' },
  in_progress: { icon: FiClock, bg: '#ECFDF5', color: '#10B981' },
  due_this_week: { icon: FiCalendar, bg: '#FAF5FF', color: '#7C3AED' },
  overdue_tasks: { icon: FiAlertTriangle, bg: '#FEF2F2', color: '#EF4444' },
  completed: { icon: FiCheckCircle, bg: '#ECFDF5', color: '#059669' },
};

const DEFAULT_CONFIG = {
  accent: '#1D4ED8',
  formStyle: 'drawer',
  viewStyle: 'drawer',
  layout: 'standard',
  statKeys: ['total_tasks', 'in_progress', 'due_this_week', 'overdue_tasks'],
  boardToggle: true,
  headerExport: false,
  addLabel: 'Task',
  deleteLabel: 'Delete Task',
  searchPlaceholder: 'Search tasks...',
  emptyMessage: 'No tasks found.',
  labels: { title: 'TASK NAME', assignee: 'ASSIGNED OFFICER', due: 'TARGET DUE DATE', description: 'TASK DESCRIPTION' },
  fields: { related: true, startDate: true, project: false, status: false, attachments: true },
  columns: ['taskNo', 'title', 'assignee', 'related', 'priority', 'dueDate', 'status'],
  columnLabels: {},
};

function mergeConfig(config = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    labels: { ...DEFAULT_CONFIG.labels, ...config.labels },
    fields: { ...DEFAULT_CONFIG.fields, ...config.fields },
  };
}

function PriorityPill({ priority }) {
  const style = PRIORITY_STYLE[priority] || { bg: '#F1F5F9', color: '#64748B' };
  return (
    <span style={{ backgroundColor: style.bg, color: style.color, padding: '3px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
      {PRIORITY_LABEL[priority] || priority}
    </span>
  );
}

function SkeletonRows({ columns }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {Array.from({ length: 6 }).map((_, row) => (
          <tr key={row}>
            {Array.from({ length: columns }).map((__, cell) => (
              <td key={cell} style={{ padding: '12px 16px' }}>
                <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: cell === 1 ? '80%' : '55%' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const outlineButton = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' };

export default function ModuleTasks({ module, title, subtitle, config: pageConfig }) {
  const config = mergeConfig(pageConfig);
  const canCreate = usePermission('core.task.create');
  const canUpdate = usePermission('core.task.update');
  const canDelete = usePermission('core.task.delete');

  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = 'success') => setToast({ message, type }), []);
  const hideToast = useCallback(() => setToast(null), []);

  const [view, setView] = useState('table');
  const data = useModuleTasks(module, view);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState({ priority: '', status: '' });
  const [formState, setFormState] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const closeForm = () => setFormState(null);

  const afterWrite = async () => {
    setSelectedIds([]);
    await data.reload();
  };

  const changeStatus = async (task, status) => {
    try {
      await tasksService.setStatus(task._id, status);
      notify(`Task moved to ${STATUS_LABEL[status]}`, 'success');
      await afterWrite();
      return true;
    } catch (err) {
      notify(apiError(err, 'Failed to update task status'), 'error');
      return false;
    }
  };

  const moveOnBoard = async (task, status) => {
    const previous = data.board;
    const moved = { ...task, status };
    data.setBoard({
      ...previous,
      [task.status]: previous[task.status].filter((t) => t._id !== task._id),
      [status]: [moved, ...previous[status]],
    });
    try {
      await tasksService.setStatus(task._id, status);
      notify(`Task moved to ${STATUS_LABEL[status]}`, 'success');
      await data.reload();
    } catch (err) {
      data.setBoard(previous);
      notify(apiError(err, 'Failed to update task status'), 'error');
    }
  };

  const markSelectedDone = async () => {
    setBusy(true);
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await tasksService.setStatus(id, 'done');
      } catch {
        failed += 1;
      }
    }
    setBusy(false);
    notify(failed ? `${failed} of ${selectedIds.length} tasks could not be updated` : 'Selected tasks marked as Done', failed ? 'error' : 'success');
    await afterWrite();
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await tasksService.remove(deleting._id);
      notify('Task removed', 'success');
      setDeleting(null);
      if (detailId === deleting._id) setDetailId(null);
      await afterWrite();
    } catch (err) {
      notify(apiError(err, 'Failed to remove task'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = { ...data.buildParams(), sort: data.sort.field, order: data.sort.order };
      if (data.filters.status && data.filters.status !== 'overdue') params.status = data.filters.status;
      const res = await tasksService.exportCsv(params);
      saveBlob(res, `${module}-tasks.csv`);
    } catch (err) {
      notify(await blobErrorMessage(err, 'Failed to export tasks'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const sortLabel = (field, text) => (
    <button
      type="button"
      onClick={() => data.toggleSort(field)}
      style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textTransform: 'inherit', letterSpacing: 'inherit' }}
    >
      {text} {data.sort.field === field ? (data.sort.order === 'asc' ? '↑' : '↓') : '⇅'}
    </button>
  );

  const rowMenuItems = (row) => {
    const items = [];
    if (canUpdate && row.status !== 'done') {
      items.push({ label: 'Edit Task', icon: <FiEdit2 size={14} />, action: () => setFormState({ mode: 'edit', task: row }) });
      if (row.status === 'todo') items.push({ label: 'Start Task', icon: <FiPlay size={14} />, action: () => changeStatus(row, 'in_progress') });
      items.push({ label: config.markDoneLabel || 'Mark as Done', icon: <FiCheck size={14} />, color: '#16A34A', action: () => changeStatus(row, 'done') });
    }
    if (canDelete) items.push({ label: config.deleteLabel, icon: <FiTrash2 size={14} />, color: '#DC2626', action: () => setDeleting(row) });
    return items;
  };

  const allColumns = {
    taskNo: { key: 'taskNo', label: 'TASK ID', render: (v, row) => (
      <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setDetailId(row._id)}>{v}</span>
    ) },
    title: { key: 'title', label: config.columnLabels.title || 'TASK', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    project: { key: 'projectId', label: 'PROJECT NAME', render: (v) => <span style={{ color: '#334155' }}>{v?.projectName || '—'}</span> },
    activity: { key: 'linkedActivityId', label: 'LINKED ACTIVITY', render: (v) => <span style={{ color: '#64748B' }}>{v?.activityName || '—'}</span> },
    assignee: { key: 'assigneeId', label: 'ASSIGNED TO', render: (v) => personName(v) },
    related: { key: 'relatedTo', label: 'RELATED TO', render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    priority: { key: 'priority', label: sortLabel('priority', 'PRIORITY'), render: (v) => <PriorityPill priority={v} /> },
    dueDate: { key: 'dueDate', label: sortLabel('dueDate', 'DUE DATE'), render: (v) => displayDate(v) },
    status: { key: 'status', label: sortLabel('status', 'STATUS'), render: (_, row) => <Badge status={displayStatus(row)} /> },
  };
  const columns = [
    ...config.columns.map((name) => allColumns[name]),
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const items = rowMenuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <button className="icon-btn" title="View Task" onClick={() => setDetailId(row._id)}><FiEye size={15} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
  ];

  const statByKey = Object.fromEntries(data.stats.map((s) => [s.key, s]));
  const filterCount = Object.values(data.filters).filter(Boolean).length;

  const openFilter = () => { setDraftFilters(data.filters); setFilterOpen(true); };
  const addButton = canCreate && (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => setFormState({ mode: 'create' })}
      style={{ backgroundColor: config.accent, color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, fontWeight: 600 }}
    >
      <FiPlus size={14} /> {config.addLabel}
    </button>
  );
  const exportButton = (
    <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={exporting} style={outlineButton}>
      <FiDownload size={14} /> {exporting ? 'Exporting…' : 'Export'}
    </button>
  );

  const hasRows = view === 'board'
    ? Object.values(data.board).some((list) => list.length)
    : data.items.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>{subtitle}</p>
        </div>
        {config.headerExport && (
          <div style={{ display: 'flex', gap: 8 }}>
            {exportButton}
            {addButton}
          </div>
        )}
      </div>

      {config.statKeys.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${config.statKeys.length}, 1fr)`, gap: 16 }}>
          {config.statKeys.map((key) => {
            const stat = statByKey[key];
            const tile = TILE_ICONS[key];
            const Icon = tile.icon;
            return (
              <div key={key} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat?.label || key.replace(/_/g, ' ')}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: tile.bg, color: tile.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} />
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{stat ? stat.value : '—'}</div>
                <div style={{ fontSize: '0.75rem', color: key === 'overdue_tasks' ? '#DC2626' : '#64748B' }}>{stat?.qualifier || ''}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={data.search} onChange={(e) => data.setSearch(e.target.value)} placeholder={config.searchPlaceholder} style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button type="button" className="btn btn-secondary" onClick={openFilter} style={outlineButton}>
              <FiFilter size={14} /> Filter{filterCount ? ` (${filterCount})` : ''}
            </button>
            {!config.headerExport && exportButton}
            {!config.headerExport && addButton}
            {config.boardToggle && (
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 3 }}>
                {[['board', FiGrid, 'Board view'], ['table', FiList, 'List view']].map(([key, Icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    title={label}
                    onClick={() => setView(key)}
                    style={{ border: 'none', background: view === key ? '#fff' : 'transparent', padding: '6px 8px', borderRadius: 6, cursor: 'pointer', color: view === key ? config.accent : '#64748B', display: 'flex' }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedIds.length > 0 && view === 'table' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', backgroundColor: '#F0F9FF', borderRadius: 8, fontSize: '0.813rem', color: '#0F172A' }}>
            <span>{selectedIds.length} selected</span>
            {canUpdate && (
              <button type="button" onClick={markSelectedDone} disabled={busy} style={{ background: 'none', border: 'none', color: '#16A34A', fontWeight: 600, cursor: 'pointer' }}>
                Mark as Done
              </button>
            )}
            <button type="button" onClick={() => setSelectedIds([])} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>Clear</button>
          </div>
        )}

        {data.error ? (
          <div style={{ padding: 16, borderRadius: 8, backgroundColor: '#FEF2F2', color: '#991B1B', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span>{data.error}</span>
            <button type="button" className="btn btn-secondary" onClick={data.reload}>Retry</button>
          </div>
        ) : data.loading && !hasRows ? (
          <SkeletonRows columns={columns.length + 1} />
        ) : view === 'board' ? (
          hasRows ? (
            <TaskBoard board={data.board} loading={data.loading} canMove={canUpdate} onOpen={(task) => setDetailId(task._id)} onMove={moveOnBoard} />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>{config.emptyMessage}</div>
          )
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data.items}
              selectable
              selectedIds={selectedIds}
              onSelectRow={(id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))}
              onSelectAll={() => setSelectedIds(selectedIds.length === data.items.length ? [] : data.items.map((t) => t._id))}
              keyField="_id"
              emptyMessage={config.emptyMessage}
            />
            {data.meta && data.meta.total > PAGE_SIZE && (
              <Pagination currentPage={data.page} totalPages={data.meta.totalPages} onPageChange={data.setPage} />
            )}
          </>
        )}
      </div>

      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Tasks"
        width="400px"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => { data.setFilters({ priority: '', status: '' }); setFilterOpen(false); }}>Clear</button>
            <button type="button" className="btn btn-primary" style={{ backgroundColor: config.accent, color: '#fff', border: 'none' }} onClick={() => { data.setFilters(draftFilters); setFilterOpen(false); }}>Apply</button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="PRIORITY">
            <Select
              value={draftFilters.priority}
              onChange={(e) => setDraftFilters((f) => ({ ...f, priority: e.target.value }))}
              options={[{ value: '', label: 'All priorities' }, ...(config.priorities || ALL_PRIORITIES).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))]}
            />
          </FormField>
          <FormField label="STATUS">
            <Select
              value={draftFilters.status}
              onChange={(e) => setDraftFilters((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'todo', label: 'To Do' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />
          </FormField>
        </div>
      </Drawer>

      <TaskForm
        open={!!formState}
        mode={formState?.mode}
        task={formState?.task}
        module={module}
        config={config}
        onClose={closeForm}
        onSaved={() => { closeForm(); afterWrite(); }}
        notify={notify}
      />

      <TaskDetail
        taskId={detailId}
        config={config}
        onClose={() => setDetailId(null)}
        onEdit={(task) => { setDetailId(null); setFormState({ mode: 'edit', task }); }}
        onStatusChange={changeStatus}
        notify={notify}
      />

      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={`${config.deleteLabel}?`}
        maxWidth="440px"
        footer={(
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleting(null)}>Keep Task</button>
            <button type="button" onClick={confirmDelete} disabled={busy} style={{ padding: '8px 20px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Removing…' : config.deleteLabel}
            </button>
          </>
        )}
      >
        <p style={{ margin: 0, color: '#475569' }}>
          This permanently removes the task and its attached documents. This cannot be undone.
        </p>
        <p style={{ margin: '12px 0 0', fontWeight: 600, color: '#0F172A' }}>{deleting?.taskNo} — {deleting?.title}</p>
      </Modal>
    </div>
  );
}
