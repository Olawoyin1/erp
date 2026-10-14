import { useState } from 'react';
import { FiDownload, FiDollarSign, FiTarget, FiCheckCircle, FiFileText } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { procurementReportService } from '../../services/procurement.service';
import { compactMoney, downloadFile, money } from './shared/procUtils';
import { useFetched } from './shared/procHooks';
import { DataState, PageHeader, SecondaryButton, StatTiles } from './shared/ProcUi';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#0EA5E9', '#64748B'];

const tileOf = (report, key) => (report?.tiles || []).find((t) => t.key === key)?.value ?? 0;
const chartOf = (report, key) => (report?.charts || []).find((c) => c.key === key)?.series || [];

function Card({ title, subtitle, badge, children }) {
  return (
    <div className="card" style={{ padding: 24, backgroundColor: '#FFFFFF', borderRadius: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h3>
        {badge && <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', padding: '3px 10px', borderRadius: 12, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>{badge}</span>}
      </div>
      {subtitle && <p style={{ color: '#64748B', fontSize: '0.8rem', margin: '0 0 18px' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function MiniStat({ label, value, caption }) {
  return (
    <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>{caption}</div>}
    </div>
  );
}

function HBars({ rows, format = (v) => v, empty = 'No data yet.' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <div style={{ color: '#94A3B8', fontSize: '0.84rem', padding: '12px 0' }}>{empty}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((row, i) => (
        <div key={row.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', marginBottom: 6, gap: 8 }}>
            <span style={{ color: '#334155', fontWeight: 500 }}>{row.label}</span>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>{format(row.value)}</span>
          </div>
          <div style={{ width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(row.value / max) * 100}%`, height: '100%', backgroundColor: COLORS[i % COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
}

export default function ProcurementReports() {
  const [nonce, setNonce] = useState(0);
  const { data: report, error, loading } = useFetched(() => procurementReportService.get(), 'report', nonce);
  const { toast, showToast, hideToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ready = report && !Array.isArray(report);

  const exportAs = async (format) => {
    setMenuOpen(false);
    setExporting(true);
    const message = await downloadFile(() => procurementReportService.exportFile(format), `procurement-report.${format}`);
    setExporting(false);
    if (message) showToast(message, 'error');
    else showToast(`Procurement report exported as ${format.toUpperCase()}`, 'success');
  };

  const months = ready ? report.monthlyPoValue : [];
  const monthMax = Math.max(1, ...months.map((m) => m.acknowledged + m.pipeline));
  const tasks = ready ? report.tasks : { total: 0, resolved: 0, overdue: 0 };

  const tiles = ready
    ? [
        { label: 'TOTAL PO VALUE', value: compactMoney(tileOf(report, 'total_po_value')), sub: `${tileOf(report, 'open_requisitions')} open requisitions`, icon: <FiDollarSign size={18} />, tone: 'blue' },
        { label: 'RFQ AWARD RATE', value: `${tileOf(report, 'rfq_award_rate')}%`, sub: `${report.rfqPerformance.submittedRfqs} RFQs issued or later`, icon: <FiTarget size={18} />, tone: 'purple' },
        { label: 'ON-TIME DELIVERY RATE', value: `${tileOf(report, 'on_time_delivery_rate')}%`, sub: `${tileOf(report, 'active_vendors')} active vendors`, icon: <FiCheckCircle size={18} />, tone: 'green' },
        { label: 'TEAM TASKS RESOLVED', value: `${tasks.resolved}/${tasks.total}`, sub: tasks.overdue ? `${tasks.overdue} overdue` : 'No overdue tasks', subColor: tasks.overdue ? '#DC2626' : undefined, icon: <FiFileText size={18} />, tone: 'amber' },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Reports — Procurement" subtitle="Monitor procurement performance through operational reports and procurement analytics">
        <div style={{ position: 'relative' }}>
          <SecondaryButton icon={<FiDownload size={15} />} onClick={() => setMenuOpen((o) => !o)} disabled={exporting || !ready}>{exporting ? 'Exporting…' : 'Export'}</SecondaryButton>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 60, minWidth: 160 }}>
              {['csv', 'xlsx'].map((format) => (
                <div key={format} className="menu-item-hover" onClick={() => exportAs(format)} style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', cursor: 'pointer' }}>
                  Export as {format.toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </PageHeader>

      <DataState loading={loading} error={error} empty={false} onRetry={() => setNonce((n) => n + 1)}>
        {ready && (
          <>
            <StatTiles tiles={tiles} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              <Card title="Monthly Purchase Order Value" subtitle="Orders acknowledged by the vendor against orders still awaiting acknowledgement" badge="Last 6 months">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, fontSize: '0.8rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: '#10B981', borderRadius: 2 }} />Acknowledged</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: '#1E40AF', borderRadius: 2 }} />Awaiting acknowledgement</span>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                  {months.map((m) => (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, width: '100%', justifyContent: 'center' }}>
                        <div title={`Acknowledged: ${money(m.acknowledged)}`} style={{ width: '40%', backgroundColor: '#10B981', height: `${(m.acknowledged / monthMax) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: m.acknowledged ? 2 : 0 }} />
                        <div title={`Awaiting acknowledgement: ${money(m.pipeline)}`} style={{ width: '40%', backgroundColor: '#1E40AF', height: `${(m.pipeline / monthMax) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: m.pipeline ? 2 : 0 }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: 8 }}>{monthLabel(m.month)}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="RFQ Performance" subtitle="How sourcing requests are progressing and what they were awarded for">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <MiniStat label="Submitted RFQs" value={report.rfqPerformance.submittedRfqs} caption="Issued, evaluated, awarded or cancelled" />
                  <MiniStat label="Awarded value" value={compactMoney(report.rfqPerformance.awardedValue)} caption="Winning quotations" />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Status distribution</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.rfqPerformance.statusDistribution.map((s, i) => (
                    <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.813rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }} />{s.label}
                      </span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{s.count} RFQ <span style={{ color: '#94A3B8', fontWeight: 400 }}>({compactMoney(s.value)})</span></span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              <Card title="Procurement Pipeline Funnel" subtitle="How requisitions progress to orders, acknowledgement and delivery" badge={`${report.pipelineFunnel[0]?.count ?? 0} requisitions`}>
                <HBars rows={report.pipelineFunnel.map((f) => ({ label: f.stage, value: f.count }))} />
              </Card>

              <Card title="Purchase Order Outcomes" subtitle="Where purchase orders stand with vendors">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <MiniStat label="Acknowledged" value={report.poOutcomes.acknowledged} caption={`Out of ${report.poOutcomes.totalTracked} orders`} />
                  <MiniStat label="Awaiting acknowledgement" value={report.poOutcomes.awaitingAcknowledgement} caption={`${report.poOutcomes.cancelled} cancelled`} />
                </div>
                <HBars rows={report.poOutcomes.byStatus.map((s) => ({ label: s.label, value: s.value }))} format={compactMoney} />
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              <Card title="Purchase Order Value by Category" subtitle="Non-cancelled orders">
                <HBars rows={chartOf(report, 'po_value_by_category').map((s) => ({ label: s.label, value: s.value }))} format={compactMoney} empty="No purchase orders yet." />
              </Card>
              <Card title="Requisitions by Category" subtitle="Every requisition raised">
                <HBars rows={chartOf(report, 'requisitions_by_category').map((s) => ({ label: s.label, value: s.value }))} empty="No requisitions yet." />
              </Card>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
