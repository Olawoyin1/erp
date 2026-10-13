import ModuleDocuments from '../../../components/documents/ModuleDocuments';

const CONFIG = {
  variant: 'controlled',
  showStats: true,
  categories: [
    'Policy', 'Procedure', 'Employee Records', 'Onboarding', 'Recruitment', 'Deployment', 'Training',
    'Leave Management', 'Attendance & Timesheet', 'Payroll', 'Grievance & Discipline',
  ],
  uploadTitle: 'Upload HR Document',
  uploadSubtitle: 'Upload HR forms for employee use and internal processes',
  titlePlaceholder: 'e.g Employee Onboarding Checklist',
};

export default function HRDocuments() {
  return (
    <ModuleDocuments
      module="hr"
      title="HR Documents"
      subtitle="Access and manage HR forms used for employee and workforce processes"
      config={CONFIG}
    />
  );
}
