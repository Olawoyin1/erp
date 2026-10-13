import ModuleDocuments from '../../components/documents/ModuleDocuments';

const CONFIG = {
  variant: 'library',
  viewTabs: false,
  columns: ['docNo', 'title', 'category', 'uploadedBy', 'version', 'updatedAt'],
  categories: ['Requisition', 'Vendor Management', 'Tendering', 'Purchasing', 'Inventory'],
  uploadTitle: 'Upload Procurement Document',
  uploadSubtitle: 'Upload procurement forms for team access and download',
  uploadSubmitLabel: 'Upload Document',
  titlePlaceholder: 'e.g Purchase Requisition Form',
  deleteLabel: 'Delete File',
  deleteConfirmTitle: 'Delete Document?',
  deleteConfirmButton: 'Delete Document',
};

export default function ProcurementDocuments() {
  return (
    <ModuleDocuments
      module="procurement"
      title="Procurement Documents"
      subtitle="Access and manage procurement forms used across purchasing and vendor processes"
      config={CONFIG}
    />
  );
}
