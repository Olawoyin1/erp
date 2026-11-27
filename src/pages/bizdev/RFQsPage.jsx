import Toast, { useToast } from '../../components/ui/Toast';
import { PageHeader } from '../procurement/shared/ProcUi';
import RfqsTab from './tenders/RfqsTab';

export default function RFQsPage() {
  const { toast, showToast, hideToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="RFQs"
        subtitle="Track pricing requests from receipt to quotation submission"
      />
      <RfqsTab notify={showToast} />
    </div>
  );
}
