import Toast, { useToast } from '../../components/ui/Toast';
import { PageHeader } from '../procurement/shared/ProcUi';
import EngineeringDocumentsPanel from './documents/EngineeringDocumentsPanel';

export default function EngineeringDocuments() {
  const { toast, showToast, hideToast } = useToast();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Engineering Documents" subtitle="Manage engineering documents, reviews, approvals, and revisions across all projects" />
      <EngineeringDocumentsPanel showToast={showToast} />
    </div>
  );
}
