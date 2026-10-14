import ModuleTasks from '../../../components/tasks/ModuleTasks';

const CONFIG = {
  accent: '#1D4ED8',
  formStyle: 'drawer',
  viewStyle: 'drawer',
  relatedOptions: ['Employee Onboarding', 'Employee Records', 'Attendance', 'Staff Induction'],
};

export default function Tasks() {
  return (
    <ModuleTasks
      module="hr"
      title="Tasks — Human Resources"
      subtitle="Operational tasks across HR functions"
      config={CONFIG}
    />
  );
}
