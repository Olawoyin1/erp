import { useState } from 'react';
import { FiShield, FiAlertTriangle, FiActivity, FiFileText } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { hseReportService } from '../../services/hse.service';
import { useFetched } from '../procurement/shared/procHooks';
import { DataState, PageHeader, StatTiles } from '../procurement/shared/ProcUi';
import { Card, ExportMenu, HBars, MiniStat, MiniStatRow, MonthlyBars, ReportRow, SectionLabel, StatusList } from './shared/ReportParts';

export default function HSEReports() {
  const [nonce, setNonce] = useState(0);
  const { data: report, error, loading } = useFetched(() => hseReportService.get(), 'report', nonce);
  const { toast, showToast, hideToast } = useToast();
  const ready = report && !Array.isArray(report);

  const tile = (key) => (report?.tiles || []).find((t) => t.key === key) || { value: 0, caption: '' };
  const tasks = ready ? report.tasks : { total: 0, resolved: 0, overdue: 0 };

  const tiles = ready
    ? [
        { label: 'CERTIFICATE COMPLIANCE', value: `${tile('certificate_compliance_rate').value}%`, sub: tile('certificate_compliance_rate').caption, icon: <FiShield size={18} />, tone: 'green' },
        { label: 'EXPIRED CERTIFICATES', value: tile('expired_certificates').value, sub: tile('expired_certificates').caption, subColor: tile('expired_certificates').value ? '#DC2626' : undefined, icon: <FiAlertTriangle size={18} />, tone: 'red' },
        { label: 'ACTIVE EMERGENCY PLANS', value: tile('active_emergency_plans').value, sub: tile('active_emergency_plans').caption, icon: <FiActivity size={18} />, tone: 'blue' },
        { label: 'TEAM TASKS RESOLVED', value: `${tasks.resolved}/${tasks.total}`, sub: tasks.overdue ? `${tasks.overdue} overdue` : 'No overdue tasks', subColor: tasks.overdue ? '#DC2626' : undefined, icon: <FiFileText size={18} />, tone: 'purple' },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Reports — HSE" subtitle="Cross-section HSE performance summary">
        <ExportMenu request={(format) => hseReportService.exportFile(format)} fileBase="hse-report" disabled={!ready} onDone={showToast} />
      </PageHeader>

      <DataState loading={loading} error={error} empty={false} onRetry={() => setNonce((n) => n + 1)}>
        {ready && (
          <>
            <StatTiles tiles={tiles} />

            <ReportRow>
              <Card title="Monthly Certificates" subtitle="Offshore travel documents submitted against those verified" badge="Last 6 months">
                <MonthlyBars months={report.monthlyCertificates} first={{ key: 'submitted', label: 'Submitted', color: '#1E40AF' }} second={{ key: 'verified', label: 'Verified', color: '#10B981' }} />
              </Card>

              <Card title="Certificate Status" subtitle="Where every offshore travel certificate stands" badge={`${report.certificates.total} certificates`}>
                <MiniStatRow>
                  <MiniStat label="Pending verification" value={report.certificates.pending} caption="Awaiting HSE review" />
                  <MiniStat label="Compliance rate" value={`${report.certificates.complianceRate}%`} caption="Verified certificates in date" />
                </MiniStatRow>
                <SectionLabel>Status distribution</SectionLabel>
                <StatusList rows={report.certificates.byStatus} />
                <SectionLabel>By document type</SectionLabel>
                <HBars rows={report.certificates.byType.map((t) => ({ label: t.label, value: t.count }))} empty="No certificates yet." />
              </Card>
            </ReportRow>

            <ReportRow>
              <Card title="Verification Funnel" subtitle="How submitted certificates progress to being in date" badge={`${report.certificates.total} submitted`}>
                <HBars rows={report.verificationFunnel.map((f) => ({ label: f.stage, value: f.count }))} empty="No certificates yet." />
              </Card>

              <Card title="Emergency Preparedness" subtitle="Plans in force and the contact register">
                <MiniStatRow>
                  <MiniStat label="Active plans" value={report.emergency.activePlans} caption={`Out of ${report.emergency.totalPlans} plans`} />
                  <MiniStat label="Due for review" value={report.emergency.dueForReview} caption={`${report.emergency.contacts} emergency contacts`} />
                </MiniStatRow>
                <StatusList rows={report.emergency.byStatus} />
                <SectionLabel>Plans by category</SectionLabel>
                <HBars rows={report.emergency.byCategory.map((c) => ({ label: c.label, value: c.count }))} empty="No plans yet." />
              </Card>
            </ReportRow>
          </>
        )}
      </DataState>
    </div>
  );
}
