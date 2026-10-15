import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiBriefcase, FiCheckCircle, FiCreditCard, FiPlus, FiUpload } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { projectsSlice } from '../../store/technical/slices';
import { projectService } from '../../services/technical.service';
import { ListCard, ListToolbar, PageHeader, PrimaryButton, SecondaryButton, StatTiles, FilterDrawer } from '../procurement/shared/ProcUi';
import { AttachToRecordDialog } from '../procurement/shared/ProcExtras';
import ProjectFormDrawer from './shared/ProjectForm';
import { ProjectActionDialog } from './shared/ProjectActions';
import { projectMenuItems } from './shared/projectMenu';
import { ProgressBar, RowActions, TechBadge } from './shared/TechUi';
import { useSelection, useTechExport, useTechList, useTechLookups } from './shared/techHooks';
import {
  PROJECT_STATUS_OPTIONS, PROJECT_TYPES, compactMoney, countFilters, csvMoney, downloadFile, formatDate, money, refName, searchAsQ, statusLabel, toOptions, ymd,
} from './shared/techUtils';

const EXPORT_COLUMNS = [
  { label: 'Project ID', value: (r) => r.projectId },
  { label: 'Project Name', value: (r) => r.projectName },
  { label: 'Client', value: (r) => refName(r.clientId, 'clientName') },
  { label: 'Project Manager', value: (r) => refName(r.projectManagerId, 'fullName') },
  { label: 'Budget', value: (r) => csvMoney(r.approvedBudget) },
  { label: 'Progress (%)', value: (r) => r.physicalProgress },
  { label: 'End Date', value: (r) => ymd(r.plannedCompletion) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

const attachApi = searchAsQ(projectService);
const stat = (stats, key) => (stats || []).find((s) => s.key === key);

export default function TechnicalProjects() {
  const navigate = useNavigate();
  const can = {
    create: usePermission('technical.project.create'),
    update: usePermission('technical.project.update'),
    transition: usePermission('technical.project.transition'),
    export: usePermission('technical.project.export'),
  };
  const list = useTechList(projectsSlice, { initialFilters: { status: '', projectType: '', clientId: '' } });
  const selection = useSelection();
  const exporter = useTechExport(projectService.exportList, list, selection, EXPORT_COLUMNS, 'projects.csv');
  const { lookups } = useTechLookups(['clients']);
  const { toast, showToast, hideToast } = useToast();

  const [formFor, setFormFor] = useState(null);
  const [action, setAction] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const handlers = {
    edit: (project) => setFormFor(project),
    open: (key, project) => setAction({ key, project }),
    exportReport: async (project) => {
      const message = await downloadFile(() => projectService.exportReport(project._id), `project-report-${project.projectId}.xlsx`);
      showToast(message || 'Project report downloaded', message ? 'error' : 'success');
    },
  };

  const columns = useMemo(() => [
    { key: 'projectId', label: 'PROJECT ID', render: (v) => <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{v}</span> },
    { key: 'projectName', label: 'PROJECT NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'clientId', label: 'CLIENT', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'clientName')}</span> },
    { key: 'projectManagerId', label: 'PROJECT MANAGER', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'approvedBudget', label: 'BUDGET', render: (v, row) => <span title={money(v, row.currency)}>{row.currency && row.currency !== 'NGN' ? `${row.currency} ` : ''}{compactMoney(v)}</span> },
    { key: 'physicalProgress', label: 'PROGRESS', render: (v) => <ProgressBar value={v} /> },
    { key: 'plannedCompletion', label: 'END DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => <RowActions onView={() => navigate(`/technical/projects/${row._id}`)} items={projectMenuItems(row, can, handlers)} />,
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [can.update, can.transition, can.export]);

  const onExport = async () => {
    const message = await exporter.run();
    showToast(message || (selection.ids.length ? `${selection.ids.length} selected projects exported` : 'Projects exported'), message ? 'error' : 'success');
  };

  const active = stat(list.stats, 'active_projects');
  const onSchedule = stat(list.stats, 'on_schedule');
  const budget = stat(list.stats, 'budget_utilization');
  const delayed = stat(list.stats, 'delayed_projects');
  const tiles = [
    { label: 'Active Projects', value: active ? active.value : 0, sub: `+${active?.delta ?? 0} this month`, icon: <FiBriefcase size={16} />, tone: 'blue' },
    { label: 'Projects On Schedule', value: onSchedule ? onSchedule.value : 0, sub: `${onSchedule?.percent ?? 0}% of active projects`, icon: <FiCheckCircle size={16} />, tone: 'green' },
    { label: 'Budget Utilization', value: budget ? `${compactMoney(budget.value)} / ${compactMoney(budget.total)}` : '—', sub: `${budget?.percent ?? 0}% utilized`, icon: <FiCreditCard size={16} />, tone: 'purple' },
    { label: 'Delayed Projects', value: delayed ? delayed.value : 0, sub: 'Require attention', icon: <FiAlertTriangle size={16} />, tone: 'amber' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: PROJECT_STATUS_OPTIONS },
    { key: 'projectType', label: 'Project type', options: PROJECT_TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'clientId', label: 'Client', options: toOptions(lookups.clients, 'clientName') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Projects" subtitle="Portfolio of all company projects — execution, progress, cost, resources">
        {(can.create || can.update) && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No projects found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search Project ID, Project name..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {can.create && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>New Project</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Projects" subtitle="Narrow the portfolio by status, type and client." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <ProjectFormDrawer
          key={formFor === 'new' ? 'new' : formFor._id}
          project={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); list.reload(); }}
        />
      )}

      {action && (
        <ProjectActionDialog
          action={action.key}
          project={action.project}
          onClose={() => setAction(null)}
          onDone={(message) => { setAction(null); showToast(message, 'success'); list.reload(); }}
        />
      )}

      {uploadOpen && (
        <AttachToRecordDialog
          api={attachApi}
          title="Upload Project Document"
          recordNoun="project"
          recordLabel={(r) => `${r.projectId}: ${r.projectName}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); }}
        />
      )}
    </div>
  );
}
