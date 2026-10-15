import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { PageHeader, TabBar } from '../procurement/shared/ProcUi';
import TendersTab from './tenders/TendersTab';
import RfqsTab from './tenders/RfqsTab';

/** "Tender Pipeline" and "RFQs" from the designs as two tabs of one page; `?open=<tenderId>` opens a tender (used by the Opportunities tab). */
export default function RFQsTenders() {
  const canTenders = usePermission('businessdev.tender.view');
  const canRfqs = usePermission('businessdev.rfq.view');
  const [params] = useSearchParams();
  const openId = params.get('open') || '';
  const { toast, showToast, hideToast } = useToast();

  const tabs = [
    ...(canTenders ? [{ id: 'tenders', label: 'Tenders' }] : []),
    ...(canRfqs ? [{ id: 'rfqs', label: 'RFQs' }] : []),
  ];
  const [tab, setTab] = useState('tenders');
  const active = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader
        title={active === 'rfqs' ? 'RFQs' : 'Tender Pipeline'}
        subtitle={active === 'rfqs' ? 'Track pricing requests from receipt to quotation submission' : 'Track every bid from identification through award'}
      />
      {tabs.length === 0 && <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>You do not have access to tenders or RFQs.</div>}
      {tabs.length > 1 && <TabBar tabs={tabs} active={active} onChange={setTab} />}
      {active === 'tenders' && <TendersTab notify={showToast} openId={openId} />}
      {active === 'rfqs' && <RfqsTab notify={showToast} />}
    </div>
  );
}
