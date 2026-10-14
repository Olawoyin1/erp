import ModuleTasks from '../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1D4ED8',
  formStyle: 'modal',
  viewStyle: 'drawer',
  layout: 'compact',
  statKeys: [],
  boardToggle: false,
  headerExport: true,
  addLabel: 'New Task',
  assignTitle: 'Assign Finance Task',
  createLabel: 'Assign Task',
  priorities: ['high', 'medium', 'low'],
  titlePlaceholder: 'e.g. Reconcile Zenith Bank June Statement',
  descriptionPlaceholder: 'Specify requirements, files, or dependencies...',
  searchPlaceholder: 'Search deliverables, assignees...',
  emptyMessage: 'No finance tasks found.',
  dueRequired: true,
  labels: {
    title: 'DELIVERABLE TITLE',
    assignee: 'ASSIGNED PERSONNEL',
    due: 'TARGET DUE DATE',
    description: 'DETAILED DESCRIPTION',
  },
  fields: { related: false, startDate: false, status: false, attachments: false },
  columns: ['taskNo', 'title', 'assignee', 'priority', 'dueDate', 'status'],
  columnLabels: { title: 'DELIVERABLE / TASK' },
};

export default function FinanceTasks() {
  return (
    <ModuleTasks
      module="finance"
      title="Finance & Accounting Tasks"
      subtitle="Coordinate month-end closing steps, reconciliations, tax deadlines, and statutory audits"
      config={CONFIG}
    />
  );
}
