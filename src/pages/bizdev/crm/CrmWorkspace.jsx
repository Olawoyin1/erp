import { useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import Toast, { useToast } from '../../../components/ui/Toast';
import { useAnyPermission, usePermission } from '../../../hooks/usePermission';
import { interactionService, opportunityService } from '../../../services/bizdev.service';
import { PageHeader, SecondaryButton, TabBar } from '../../procurement/shared/ProcUi';
import { AttachToRecordDialog } from '../../procurement/shared/ProcExtras';
import { formatDate } from '../shared/bizUtils';
import ClientsTab from './ClientsTab';
import InteractionsTab from './InteractionsTab';
import OpportunitiesTab from './OpportunitiesTab';

/**
 * "CRM - Client Pipeline": Clients, Interactions and Opportunities as tabs of one page, as designed.
 * `initialTab` lets the three existing routes open on their own tab; tabs the user cannot view are not shown.
 */
export default function CrmWorkspace({ initialTab = 'clients' }) {
  const canClients = usePermission('businessdev.client.view');
  const canInteractions = usePermission('businessdev.interaction.view');
  const canOpportunities = usePermission('businessdev.opportunity.view');
  const canAttachInteraction = useAnyPermission('businessdev.interaction.create', 'businessdev.interaction.update');
  const canAttachOpportunity = useAnyPermission('businessdev.opportunity.create', 'businessdev.opportunity.update');
  const { toast, showToast, hideToast } = useToast();

  const tabs = [
    ...(canClients ? [{ id: 'clients', label: 'Clients' }] : []),
    ...(canInteractions ? [{ id: 'interactions', label: 'Interactions' }] : []),
    ...(canOpportunities ? [{ id: 'opportunities', label: 'Opportunities' }] : []),
  ];
  const [state, setState] = useState({ tab: initialTab, nonce: 0, newOpportunityFor: '', interactionsFor: '' });
  const [uploadOpen, setUploadOpen] = useState(false);
  const active = tabs.some((t) => t.id === state.tab) ? state.tab : tabs[0]?.id;

  const go = (patch) => setState((s) => ({ ...s, nonce: s.nonce + 1, newOpportunityFor: '', interactionsFor: '', ...patch }));
  const canUpload = (active === 'interactions' && canAttachInteraction) || (active === 'opportunities' && canAttachOpportunity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="CRM — Client Pipeline" subtitle="Clients, interactions and weighted opportunities">
        {canUpload && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      {tabs.length === 0 && <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>You do not have access to any CRM tab.</div>}
      {tabs.length > 0 && <TabBar tabs={tabs} active={active} onChange={(tab) => go({ tab })} />}

      {active === 'clients' && <ClientsTab key={`c${state.nonce}`} notify={showToast} onNewOpportunity={(clientId) => go({ tab: 'opportunities', newOpportunityFor: clientId })} />}
      {active === 'interactions' && <InteractionsTab key={`i${state.nonce}`} notify={showToast} initialClientId={state.interactionsFor} />}
      {active === 'opportunities' && (
        <OpportunitiesTab
          key={`o${state.nonce}`}
          notify={showToast}
          initialNewForClient={state.newOpportunityFor}
          onViewInteractions={(clientId) => go({ tab: 'interactions', interactionsFor: clientId })}
        />
      )}

      {uploadOpen && active === 'interactions' && (
        <AttachToRecordDialog
          api={interactionService}
          title="Upload Interaction Document"
          recordNoun="interaction"
          recordLabel={(i) => `${i.clientName || 'Client'} — ${i.type} on ${formatDate(i.date)}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message); }}
        />
      )}
      {uploadOpen && active === 'opportunities' && (
        <AttachToRecordDialog
          api={opportunityService}
          title="Upload Opportunity Document"
          recordNoun="opportunity"
          recordLabel={(o) => `${o.opportunityId} — ${o.title}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message); }}
        />
      )}
    </div>
  );
}
