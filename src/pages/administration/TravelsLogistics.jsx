import { useState } from 'react';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { PageHeader, TabBar } from '../procurement/shared/ProcUi';
import { useAdminLookups } from './shared/admHooks';
import TravelRequestsTab from './travel/TravelRequestsTab';
import MovementsTab from './travel/MovementsTab';

export default function TravelsLogistics() {
  const { can } = usePermissions();
  const tabs = [
    ...(can('administration.travelrequest.view') ? [{ id: 'travel', label: 'Travel Requests' }] : []),
    ...(can('administration.movement.view') ? [{ id: 'movements', label: 'Equipment Movement' }] : []),
  ];
  const [chosen, setChosen] = useState('travel');
  const active = tabs.some((t) => t.id === chosen) ? chosen : tabs[0]?.id;
  const { lookups } = useAdminLookups(['me', 'departments', 'locations', 'employees']);
  const { toast, showToast, hideToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Travel & Logistics" subtitle="Track travel, movements and allowances" />
      <TabBar tabs={tabs} active={active} onChange={setChosen} />
      {active === 'travel' && <TravelRequestsTab lookups={lookups} me={lookups.me} showToast={showToast} />}
      {active === 'movements' && <MovementsTab lookups={lookups} me={lookups.me} showToast={showToast} />}
    </div>
  );
}
