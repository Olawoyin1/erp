import { useState } from 'react';
import Toast, { useToast } from '../../../components/ui/Toast';
import { useAnyPermission } from '../../../hooks/usePermission';
import JobPostingsTab from './JobPostingsTab';
import CandidatesTab from './CandidatesTab';

export default function Recruitment() {
  const canSeeJobs = useAnyPermission('hr.jobposting.view');
  const canSeeCandidates = useAnyPermission('hr.candidate.view');
  const [chosenTab, setChosenTab] = useState('');
  const { toast, showToast, hideToast } = useToast();

  const tabs = [
    ...(canSeeJobs ? [{ key: 'jobPostings', label: 'Job Postings' }] : []),
    ...(canSeeCandidates ? [{ key: 'candidates', label: 'Candidates' }] : []),
  ];
  const activeTab = tabs.some((t) => t.key === chosenTab) ? chosenTab : tabs[0]?.key;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Recruitment</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
          Oversee recruitment activities, job postings, and candidate selection workflows
        </p>
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: 8 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => setChosenTab(tab.key)}
                style={{ padding: '10px 16px', fontFamily: 'var(--font)', fontSize: '0.875rem', fontWeight: isActive ? 600 : 500, background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#1D4ED8' : '#64748B', borderBottom: isActive ? '2px solid #1D4ED8' : '2px solid transparent', marginBottom: -1 }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'jobPostings' && <JobPostingsTab showToast={showToast} />}
        {activeTab === 'candidates' && <CandidatesTab showToast={showToast} />}
        {!activeTab && <div style={{ padding: 24, color: '#94A3B8', textAlign: 'center' }}>You do not have access to job postings or candidates.</div>}
      </div>
    </div>
  );
}
