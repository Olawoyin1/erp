import ModuleDocuments from '../../components/documents/ModuleDocuments';

const CONFIG = {
  variant: 'plain',
  actionStyle: 'inline',
  viewTabs: false,
  columns: ['sn', 'title', 'uploadedBy', 'uploadDate'],
  defaultCategory: 'QMS Document',
  uploadTitle: 'Upload QS Document',
  uploadSubtitle: 'Upload a new Quality System document for employee reference and compliance',
  titlePlaceholder: 'e.g Internal Audit Procedure',
  searchPlaceholder: 'Search documents...',
  inlineDeleteLabel: 'Retrieve',
  deleteConfirmTitle: 'Retrieve Document?',
  deleteConfirmButton: 'Retrieve Document',
  deleteLabel: 'Retrieve',
};

export default function QMSDocuments() {
  return (
    <ModuleDocuments
      module="quality"
      title="QMS Documents"
      subtitle="Manage QMS documents for regulatory compliance and staff reference"
      config={CONFIG}
    />
  );
}
