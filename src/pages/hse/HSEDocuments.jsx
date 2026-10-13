import ModuleDocuments from '../../components/documents/ModuleDocuments';

const CONFIG = {
  variant: 'plain',
  actionStyle: 'inline',
  viewTabs: false,
  columns: ['sn', 'title', 'uploadedBy', 'uploadDate'],
  defaultCategory: 'HSE Document',
  uploadTitle: 'Upload HSE Document',
  uploadSubtitle: 'Upload a new HSE document for employee reference and compliance',
  titlePlaceholder: 'e.g Permit to Work Procedure',
  searchPlaceholder: 'Search documents...',
  inlineDeleteLabel: 'Retrieve',
  deleteConfirmTitle: 'Retrieve Document?',
  deleteConfirmButton: 'Retrieve Document',
  deleteLabel: 'Retrieve',
};

export default function HSEDocuments() {
  return (
    <ModuleDocuments
      module="hse"
      title="HSE Documents"
      subtitle="Manage HSE documents for regulatory compliance and staff reference"
      config={CONFIG}
    />
  );
}
