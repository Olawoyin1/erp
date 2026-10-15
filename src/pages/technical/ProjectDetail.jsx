import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiEdit2, FiShare2 } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { projectService } from '../../services/technical.service';
import { DataState, PageHeader, SecondaryButton, TabBar, PrimaryButton } from '../procurement/shared/ProcUi';
import ProjectFormDrawer from './shared/ProjectForm';
import { ProjectActionDialog } from './shared/ProjectActions';
import { TechBadge } from './shared/TechUi';
import { useRecord } from './shared/techHooks';
import { downloadFile } from './shared/techUtils';
import OverviewTab from './project/OverviewTab';
import InspectionsTab from './project/InspectionsTab';
import WbsTab from './project/WbsTab';
import GanttTab from './project/GanttTab';
import TasksTab from './project/TasksTab';
import ProgressTab from './project/ProgressTab';
import DiaryTab from './project/DiaryTab';
import TimesheetsTab from './project/TimesheetsTab';
import ImagesTab from './project/ImagesTab';
import ResourceRequestsPanel from './resources/ResourceRequestsPanel';
import EngineeringDocumentsPanel from './documents/EngineeringDocumentsPanel';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const { record: project, error, loading } = useRecord(projectService, id, refreshKey);

  const canUpdate = usePermission('technical.project.update');
  const canExport = usePermission('technical.project.export');
  const allowed = {
    overview: usePermission('technical.project.view'),
    inspection: usePermission('technical.siteinspection.view'),
    wbs: usePermission('technical.wbsactivity.view'),
    gantt: usePermission('technical.wbsactivity.view'),
    tasks: usePermission('core.task.view'),
    progress: usePermission('technical.projectlog.view'),
    resources: usePermission('technical.resourcerequest.view'),
    diary: usePermission('technical.sitediary.view'),
    timesheets: usePermission('technical.timesheet.view'),
    documents: usePermission('technical.engineeringdocument.view'),
    images: usePermission('technical.project.view'),
  };

  const [active, setActive] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [exporting, setExporting] = useState(false);

  const refresh = () => setRefreshKey((k) => k + 1);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'inspection', label: 'Site Inspection' },
    { id: 'wbs', label: 'WBS' },
    { id: 'gantt', label: 'Gantt Chart' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'progress', label: 'Progress Tracking' },
    { id: 'resources', label: 'Resource Allocation' },
    { id: 'diary', label: 'Site Diary' },
    { id: 'timesheets', label: 'Timesheets' },
    { id: 'documents', label: 'Documents' },
    { id: 'images', label: 'Images' },
  ].filter((tab) => allowed[tab.id]);
  const current = tabs.some((t) => t.id === active) ? active : tabs[0]?.id;

  const exportReport = async () => {
    setExporting(true);
    const message = await downloadFile(() => projectService.exportReport(id), `project-report-${project.projectId}.xlsx`);
    setExporting(false);
    showToast(message || 'Project report downloaded', message ? 'error' : 'success');
  };

  const tabProps = { project, refreshKey, showToast, onChanged: refresh };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Projects" subtitle="Portfolio of all company projects — execution, progress, cost, resources" />

      <DataState loading={loading} error={error} empty={!loading && !error && !project} emptyText="Project not found." onRetry={refresh}>
        {project && (
          <>
            <div className="card" style={{ padding: '20px 24px', background: '#F5F8FF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <button type="button" className="icon-btn" aria-label="Back to projects" onClick={() => navigate('/technical/projects')} style={{ marginTop: 2, background: '#1D4ED8', color: '#fff', borderRadius: '50%', width: 32, height: 32 }}>
                    <FiArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>{project.projectName}</h2>
                    <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 10 }}>
                      <span>{project.projectId}</span> <span style={{ color: '#CBD5E1' }}>•</span> <span style={{ color: '#3B82F6' }}>{project.clientId?.clientName || ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: 6 }}>{project.projectType}</span>
                      <TechBadge status={project.status} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {canUpdate && project.status !== 'completed' && <PrimaryButton icon={<FiEdit2 size={14} />} onClick={() => setEditing(true)}>Edit Project</PrimaryButton>}
                  {canExport && <SecondaryButton icon={<FiShare2 size={14} />} onClick={() => setDialog('share')}>Share Progress</SecondaryButton>}
                  {canExport && <SecondaryButton icon={<FiDownload size={14} />} onClick={exportReport} disabled={exporting}>{exporting ? 'Exporting…' : 'Export Report'}</SecondaryButton>}
                </div>
              </div>
            </div>

            <TabBar tabs={tabs} active={current} onChange={setActive} />

            {current === 'overview' && <OverviewTab {...tabProps} />}
            {current === 'inspection' && <InspectionsTab {...tabProps} />}
            {current === 'wbs' && <WbsTab {...tabProps} />}
            {current === 'gantt' && <GanttTab {...tabProps} />}
            {current === 'tasks' && <TasksTab {...tabProps} />}
            {current === 'progress' && <ProgressTab {...tabProps} />}
            {current === 'resources' && <ResourceRequestsPanel projectId={project._id} showToast={showToast} />}
            {current === 'diary' && <DiaryTab {...tabProps} />}
            {current === 'timesheets' && <TimesheetsTab {...tabProps} />}
            {current === 'documents' && <EngineeringDocumentsPanel projectId={project._id} showToast={showToast} />}
            {current === 'images' && <ImagesTab {...tabProps} />}

            {editing && (
              <ProjectFormDrawer
                project={project}
                onClose={() => setEditing(false)}
                onSaved={(message) => { setEditing(false); showToast(message, 'success'); refresh(); }}
              />
            )}
            {dialog && (
              <ProjectActionDialog
                action={dialog}
                project={project}
                onClose={() => setDialog(null)}
                onDone={(message) => { setDialog(null); showToast(message, 'success'); refresh(); }}
              />
            )}
          </>
        )}
      </DataState>
    </div>
  );
}
