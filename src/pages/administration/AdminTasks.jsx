import ModuleTasks from '../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1E3A5F',
  formStyle: 'drawer',
  viewStyle: 'drawer',
  layout: 'admin',
  assignTitle: 'Create New Task',
  createLabel: 'Create Task',
  formSubtitle: 'Assign and schedule a new operational task',
  markDoneLabel: 'Mark Done',
  relatedPlaceholder: 'e.g. Facility Maintenance, EDMS, etc...',
  descriptionPlaceholder: 'Add detailed instructions or context...',
  titlePlaceholder: 'e.g. Prepare monthly admin report',
  dueRequired: true,
  labels: { title: 'TASK TITLE', assignee: 'ASSIGNED TO', due: 'DUE DATE', description: 'DESCRIPTION' },
  fields: { related: true, startDate: false, status: true, attachments: false },
  columnLabels: { title: 'TASK' },
};

export default function AdminTasks() {
  return (
    <ModuleTasks
      module="administration"
      title="Tasks — Administration"
      subtitle="Operational tasks across admin functions"
      config={CONFIG}
    />
  );
}
