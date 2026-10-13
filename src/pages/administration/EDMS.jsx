import ModuleDocuments from '../../components/documents/ModuleDocuments';

const CONFIG = {
  variant: 'register',
  canUpload: false,
  actionStyle: 'register',
  columns: ['docNo', 'title', 'department', 'version', 'status', 'lastModified', 'owner'],
  titleLabel: 'DOC TITLE',
  searchPlaceholder: 'Search by doc no...',
  emptyMessage: 'No controlled documents found.',
};

export default function EDMS() {
  return (
    <ModuleDocuments
      title="Document Management (EDMS)"
      subtitle="Centralised register of controlled documents across all PGSL sites"
      config={CONFIG}
    />
  );
}
