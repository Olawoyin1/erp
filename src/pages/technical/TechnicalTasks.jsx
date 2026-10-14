import ModuleTasks from '../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1D4ED8',
  formStyle: 'modal',
  viewStyle: 'drawer',
  deleteLabel: 'Cancel Task',
  statKeys: ['total_tasks', 'due_this_week', 'completed', 'overdue_tasks'],
  fields: { related: false, startDate: true, project: true, status: false, attachments: true },
  columns: ['taskNo', 'project', 'title', 'activity', 'assignee', 'priority', 'dueDate', 'status'],
};

export default function TechnicalTasks() {
  return (
    <ModuleTasks
      module="technical"
      title="Tasks - Technical"
      subtitle="Monitor task assignments, progress, and completion across all projects"
      config={CONFIG}
    />
  );
}
