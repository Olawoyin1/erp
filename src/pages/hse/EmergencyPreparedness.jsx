import { useState } from 'react';
import Toast, { useToast } from '../../components/ui/Toast';
import { useAnyPermission, usePermission } from '../../hooks/usePermission';
import { PageHeader, TabBar } from '../procurement/shared/ProcUi';
import PlansTab from './emergency/PlansTab';
import ContactsTab from './emergency/ContactsTab';

export default function EmergencyPreparedness() {
  const canPlans = usePermission('hse.emergencyplan.view');
  const canContacts = usePermission('hse.emergencycontact.view');
  const either = useAnyPermission('hse.emergencyplan.view', 'hse.emergencycontact.view');
  const [tab, setTab] = useState(canPlans ? 'plans' : 'contacts');
  const { toast, showToast, hideToast } = useToast();

  const tabs = [
    ...(canPlans ? [{ id: 'plans', label: 'Emergency Plans' }] : []),
    ...(canContacts ? [{ id: 'contacts', label: 'Contact Register' }] : []),
  ];
  const active = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Emergency Preparedness" subtitle="Manage emergency plans and maintain key emergency contact information" />

      {!either && <div style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Your role does not include access to emergency plans or contacts.</div>}
      {tabs.length > 0 && <TabBar tabs={tabs} active={active} onChange={setTab} />}

      {active === 'plans' && <PlansTab showToast={showToast} />}
      {active === 'contacts' && <ContactsTab showToast={showToast} />}
    </div>
  );
}
