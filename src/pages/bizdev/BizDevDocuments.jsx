import ModuleDocuments from '../../components/documents/ModuleDocuments';

const CONFIG = {
  variant: 'controlled',
  showStats: true,
  categories: [
    'Corporate Profile',
    'Capability Statement',
    'Marketing Material',
    'Proposal',
    'SOP',
    'Guideline',
    'Template',
    'Checklist',
    'Tender Document',
    'Contract',
    'Report',
    'Other',
  ],
  uploadTitle: 'Upload BD Document',
  uploadSubtitle: 'Add a reusable business development document',
  titlePlaceholder: 'e.g Proposal Writing Guide',
};

export default function BizDevDocuments() {
  return (
    <ModuleDocuments
      module="businessdev"
      title="BD Documents"
      subtitle="Store and manage reusable business development templates, policies, and reference documents"
      config={CONFIG}
    />
  );
}
