import ModuleTasks from '../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1D4ED8',
  formStyle: 'drawer',
  viewStyle: 'drawer',
  fields: { related: false, startDate: true, status: false, attachments: true },
  columns: ['taskNo', 'title', 'assignee', 'priority', 'dueDate', 'status'],
};

export default function HSETasks() {
  return (
    <ModuleTasks
      module="hse"
      title="Tasks- HSE"
      subtitle="HSE workstream tasks and follow-ups"
      config={CONFIG}
    />
  );
}
