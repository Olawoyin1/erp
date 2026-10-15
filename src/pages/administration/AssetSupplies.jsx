import { useState } from 'react';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { PageHeader, TabBar } from '../procurement/shared/ProcUi';
import { useAdminLookups } from './shared/admHooks';
import FixedAssetsTab from './assets/FixedAssetsTab';
import SuppliesTab from './assets/SuppliesTab';

export default function AssetSupplies() {
  const { can } = usePermissions();
  const tabs = [
    ...(can('administration.asset.view') ? [{ id: 'assets', label: 'Fixed Assets' }] : []),
    ...(can('administration.supplyitem.view') ? [{ id: 'supplies', label: 'Office Supplies' }] : []),
  ];
  const [chosen, setChosen] = useState('assets');
  const active = tabs.some((t) => t.id === chosen) ? chosen : tabs[0]?.id;
  const { lookups } = useAdminLookups(['me', 'departments', 'locations', 'employees']);
  const { toast, showToast, hideToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Assets & Supplies" subtitle="Track fixed assets and office supplies across all PGSL locations" />
      <TabBar tabs={tabs} active={active} onChange={setChosen} />
      {active === 'assets' && <FixedAssetsTab lookups={lookups} me={lookups.me} showToast={showToast} />}
      {active === 'supplies' && <SuppliesTab lookups={lookups} showToast={showToast} />}
    </div>
  );
}
