import ModuleTasks from '../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1E3A8A',
  formStyle: 'drawer',
  viewStyle: 'drawer',
  layout: 'admin',
  assignTitle: 'Create New Task',
  createLabel: 'Create Task',
  formSubtitle: 'Assign and schedule a new business development task',
  markDoneLabel: 'Mark Done',
  relatedPlaceholder: 'e.g. Tender, Client, Opportunity…',
  descriptionPlaceholder: 'Add detailed instructions or context…',
  titlePlaceholder: 'e.g. Follow up on TOTAL tender submission',
  dueRequired: true,
  labels: { title: 'TASK TITLE', assignee: 'ASSIGNED TO', due: 'DUE DATE', description: 'DESCRIPTION' },
  fields: { related: true, startDate: false, status: true, attachments: false },
  columnLabels: { title: 'TASK' },
};

export default function BizDevTasks() {
  return (
    <ModuleTasks
      module="businessdev"
      title="Tasks — Business Development"
      subtitle="Operational work tracked across the BD Pipeline"
      config={CONFIG}
    />
  );
}
