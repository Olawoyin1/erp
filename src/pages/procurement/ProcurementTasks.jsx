import ModuleTasks from '../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1E3A8A',
  formStyle: 'modal',
  viewStyle: 'modal',
  relatedRequired: true,
  relatedPlaceholder: 'e.g. RFQ-2026-031',
  titlePlaceholder: 'e.g Review RFQ submissions',
  markDoneLabel: 'Mark as Done',
};

export default function ProcurementTasks() {
  return (
    <ModuleTasks
      module="procurement"
      title="Tasks — Procurement"
      subtitle="Track and manage procurement activities assigned to team members"
      config={CONFIG}
    />
  );
}
