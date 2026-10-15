import { FiAlertTriangle, FiCheckCircle, FiCreditCard, FiList, FiTool } from 'react-icons/fi';
import { projectService } from '../../../services/technical.service';
import { DataState, DetailGrid, Panel, StatTiles } from '../../procurement/shared/ProcUi';
import { ProgressBar, TechBadge } from '../shared/TechUi';
import { useFetched } from '../shared/techHooks';
import { compactMoney, formatDate, initials, money, refName, statusLabel } from '../shared/techUtils';

const FINANCIAL_TONE = { 'On Track': 'completed', Watch: 'at_risk', Overspending: 'delayed' };
const MILESTONE_LABEL = { pending: 'Not Started', in_progress: 'In Progress', completed: 'Completed', on_hold: 'On Hold', delayed: 'Delayed' };

const card = { padding: 24 };
const heading = { margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: '#0F172A' };

export default function OverviewTab({ project, refreshKey }) {
  const progress = useFetched(() => projectService.progress(project._id), project._id, refreshKey);
  const milestones = useFetched(() => projectService.milestones(project._id), project._id, refreshKey);
  const summary = progress.data && !Array.isArray(progress.data) ? progress.data.summary : null;
  const currency = project.currency || 'NGN';
  const next = summary?.nextMilestone;

  const tiles = [
    { label: 'Physical Progress', value: summary ? `${summary.physicalProgress}%` : '—', sub: 'Overall project completion', icon: <FiCheckCircle size={16} />, tone: 'green' },
    {
      label: 'Budget Utilization',
      value: summary ? `${summary.budgetUtilization}%` : '—',
      sub: summary ? `${compactMoney(summary.totalDisbursed)} of ${compactMoney(summary.approvedBudget)} used` : '',
      icon: <FiCreditCard size={16} />,
      tone: 'purple',
    },
    { label: 'Open Work Orders', value: summary ? summary.openWorkActivities : '—', sub: 'Pending execution', icon: <FiTool size={16} />, tone: 'amber' },
    { label: 'Open Risks', value: summary ? summary.openRisks : '—', sub: 'Require attention', icon: <FiAlertTriangle size={16} />, tone: 'red' },
    { label: 'Next Milestone', value: next ? formatDate(next.endDate) : 'None', sub: next ? next.activityName : 'No milestone scheduled', icon: <FiList size={16} />, tone: 'blue' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatTiles tiles={tiles} loading={progress.loading} error={Boolean(progress.error)} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={card}>
            <h3 style={{ ...heading, marginBottom: 16 }}>Project Information</h3>
            <DetailGrid
              items={[
                ['Project ID', project.projectId],
                ['Project name', project.projectName],
                ['Client', refName(project.clientId, 'clientName')],
                ['Client email', project.clientEmail],
                ['Project type', project.projectType],
                ['Contract type', project.contractType],
                ['Location', project.location],
                ['Project manager', refName(project.projectManagerId, 'fullName')],
                ['Technical lead', refName(project.technicalLeadId, 'fullName')],
                ['Start date', formatDate(project.startDate)],
                ['Planned completion', formatDate(project.plannedCompletion)],
                ['Status', statusLabel(project.status)],
                ['Budget', money(project.approvedBudget, currency)],
              ]}
            />
          </div>

          <Panel title="Project description & scope">{project.description || 'No description entered.'}</Panel>

          <div className="card" style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 style={heading}>Key Engineering Milestones</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{milestones.data.length} deliverable{milestones.data.length === 1 ? '' : 's'}</span>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: '#64748B' }}>Track key engineering deliverables, contract milestones and project completion targets</p>
            <DataState loading={milestones.loading} error={milestones.error} empty={!milestones.data.length} emptyText="No milestones yet. Mark a WBS activity as a milestone to list it here.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {milestones.data.map((m) => (
                  <div key={m._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{m.activityName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{formatDate(m.endDate)}</div>
                      </div>
                      <TechBadge status={m.status} label={MILESTONE_LABEL[m.status]} />
                    </div>
                    <ProgressBar value={m.progressPercent} color={m.status === 'completed' ? '#22C55E' : '#3B82F6'} />
                  </div>
                ))}
              </div>
            </DataState>
          </div>
        </div>

        <div style={{ flex: '0 0 340px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={card}>
            <h3 style={heading}>Financial Budget Summary</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: '#64748B' }}>Track approved budgets and spending</p>
            <div style={{ background: '#1D4ED8', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 8 }}>Total approved CAPEX</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{money(project.approvedBudget, currency)}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)' }}>Authorised project account: {project.projectId}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[['Total disbursed', summary?.totalDisbursed ?? project.totalDisbursed], ['Liquid reserve', summary?.liquidReserve]].map(([label, value]) => (
                <div key={label} style={{ padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{value == null ? '—' : compactMoney(value)}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Financial status</span>
                {summary && <TechBadge status={FINANCIAL_TONE[summary.financialStatus]} label={summary.financialStatus} />}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                {summary ? `Calculated from physical progress (${summary.physicalProgress}%) versus financial burn rate (${summary.budgetUtilization}%)` : 'Not available'}
              </div>
            </div>
          </div>

          <div className="card" style={card}>
            <h3 style={heading}>Assigned Team</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.75rem', color: '#64748B' }}>Key personnel responsible for project delivery</p>
            {project.teamMembers?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {project.teamMembers.map((member, i) => {
                  const emp = member.employeeId && typeof member.employeeId === 'object' ? member.employeeId : null;
                  const name = emp?.fullName || '—';
                  return (
                    <div key={emp?._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${i * 50}, 60%, 88%)`, color: `hsl(${i * 50}, 60%, 32%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>
                          {initials(name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{member.department || refName(emp?.departmentId, 'name')}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{member.role}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.84rem', color: '#94A3B8' }}>No team members have been assigned yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
