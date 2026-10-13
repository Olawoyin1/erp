import ModuleDocuments from '../../components/documents/ModuleDocuments';

const CONFIG = {
  variant: 'controlled',
  showStats: true,
  categories: [
    'Travel & Logistics', 'Facility Maintenance', 'Office Assets', 'Administrative Requests', 'Internal Communications',
    'Policy', 'Procedure', 'Template', 'Form', 'Report',
  ],
  uploadTitle: 'Upload Admin Document',
  uploadSubtitle: 'Upload admin forms for employee use and internal processes',
  titlePlaceholder: 'e.g Company Travel Policy',
};

export default function Documents() {
  return (
    <ModuleDocuments
      module="administration"
      title="Admin Documents"
      subtitle="Manage company policies, administrative procedures, templates, and official documents"
      config={CONFIG}
    />
  );
}
