import { useState } from 'react';
import { FiCheckCircle, FiTool, FiClipboard, FiFileText } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { qualityReportService } from '../../services/quality.service';
import { useFetched } from '../procurement/shared/procHooks';
import { DataState, PageHeader, StatTiles } from '../procurement/shared/ProcUi';
import { Card, ExportMenu, HBars, MiniStat, MiniStatRow, MonthlyBars, ReportRow, SectionLabel, StatusList } from '../hse/shared/ReportParts';

export default function QualityReports() {
  const [nonce, setNonce] = useState(0);
  const { data: report, error, loading } = useFetched(() => qualityReportService.get(), 'report', nonce);
  const { toast, showToast, hideToast } = useToast();
  const ready = report && !Array.isArray(report);

  const tile = (key) => (report?.tiles || []).find((t) => t.key === key) || { value: 0, caption: '' };
  const tasks = ready ? report.tasks : { total: 0, resolved: 0, overdue: 0 };

  const tiles = ready
    ? [
        { label: 'AUDIT COMPLETION', value: `${tile('audit_completion_rate').value}%`, sub: tile('audit_completion_rate').caption, icon: <FiCheckCircle size={18} />, tone: 'green' },
        { label: 'CALIBRATION COMPLIANCE', value: `${tile('calibration_compliance_rate').value}%`, sub: tile('calibration_compliance_rate').caption, icon: <FiTool size={18} />, tone: 'blue' },
        { label: 'INSPECTION PASS RATE', value: `${tile('inspection_pass_rate').value}%`, sub: tile('inspection_pass_rate').caption, icon: <FiClipboard size={18} />, tone: 'amber' },
        { label: 'TEAM TASKS RESOLVED', value: `${tasks.resolved}/${tasks.total}`, sub: tasks.overdue ? `${tasks.overdue} overdue` : 'No overdue tasks', subColor: tasks.overdue ? '#DC2626' : undefined, icon: <FiFileText size={18} />, tone: 'purple' },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Reports — Quality System" subtitle="Cross-section quality performance summary">
        <ExportMenu request={(format) => qualityReportService.exportFile(format)} fileBase="quality-report" disabled={!ready} onDone={showToast} />
      </PageHeader>

      <DataState loading={loading} error={error} empty={false} onRetry={() => setNonce((n) => n + 1)}>
        {ready && (
          <>
            <StatTiles tiles={tiles} />

            <ReportRow>
              <Card title="Monthly Audits" subtitle="Audits scheduled against those completed" badge="Last 6 months">
                <MonthlyBars months={report.monthlyAudits} first={{ key: 'scheduled', label: 'Scheduled', color: '#1E40AF' }} second={{ key: 'completed', label: 'Completed', color: '#10B981' }} />
              </Card>

              <Card title="Materials Inspection" subtitle="Results of inspecting received materials" badge={`${report.inspections.total} receipts`}>
                <MiniStatRow>
                  <MiniStat label="Pending inspection" value={report.inspections.pending} caption="Awaiting a decision" />
                  <MiniStat label="Pass rate" value={`${report.inspections.passRate}%`} caption="Of inspections decided" />
                </MiniStatRow>
                <SectionLabel>Status distribution</SectionLabel>
                <StatusList rows={report.inspections.byStatus} />
              </Card>
            </ReportRow>

            <ReportRow>
              <Card title="Audit Lifecycle" subtitle="How audits progress from schedule to close-out" badge={`${report.audits.total} audits`}>
                <HBars rows={report.auditFunnel.map((f) => ({ label: f.stage, value: f.count }))} empty="No audits yet." />
                <SectionLabel>By audit type</SectionLabel>
                <HBars rows={report.audits.byType.map((t) => ({ label: t.label, value: t.count }))} empty="No audits yet." />
              </Card>

              <Card title="Calibration Status" subtitle="Where the instrument register stands">
                <MiniStatRow>
                  <MiniStat label="Instruments" value={report.calibration.total} caption="On the register" />
                  <MiniStat label="Overdue audits" value={report.audits.overdue} caption={`${report.audits.completionRate}% of audits finished`} />
                </MiniStatRow>
                <StatusList rows={report.calibration.byStatus} />
                <SectionLabel>Audit status</SectionLabel>
                <StatusList rows={report.audits.byStatus} />
              </Card>
            </ReportRow>
          </>
        )}
      </DataState>
    </div>
  );
}
