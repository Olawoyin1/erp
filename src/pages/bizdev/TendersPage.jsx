import { useSearchParams } from 'react-router-dom';
import Toast, { useToast } from '../../components/ui/Toast';
import { PageHeader } from '../procurement/shared/ProcUi';
import TendersTab from './tenders/TendersTab';

export default function TendersPage() {
  const [params] = useSearchParams();
  const openId = params.get('open') || '';
  const { toast, showToast, hideToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title="Tender Pipeline"
        subtitle="Track every bid from identification through award"
      />
      <TendersTab notify={showToast} openId={openId} />
    </div>
  );
}
