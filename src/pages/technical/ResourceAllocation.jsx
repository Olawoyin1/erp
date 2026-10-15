import Toast, { useToast } from '../../components/ui/Toast';
import { PageHeader } from '../procurement/shared/ProcUi';
import ResourceRequestsPanel from './resources/ResourceRequestsPanel';

export default function ResourceAllocation() {
  const { toast, showToast, hideToast } = useToast();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Resource Allocation" subtitle="Manage resource requests, approvals, allocations, and returns across all projects" />
      <ResourceRequestsPanel showToast={showToast} />
    </div>
  );
}
