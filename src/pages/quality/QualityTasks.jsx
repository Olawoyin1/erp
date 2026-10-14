import ModuleTasks from '../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1D4ED8',
  formStyle: 'modal',
  viewStyle: 'drawer',
  markDoneLabel: 'Mark Completed',
  relatedPlaceholder: 'e.g. Audit Management',
  titlePlaceholder: 'e.g. Prepare Q2 internal audit checklist',
};

export default function QualityTasks() {
  return (
    <ModuleTasks
      module="quality"
      title="Tasks — Quality System"
      subtitle="Assign and track Quality workstream tasks"
      config={CONFIG}
    />
  );
}
