import { useState } from 'react';
import { FiDownload, FiDollarSign, FiTarget, FiCheckCircle, FiFileText } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { bizdevReportService } from '../../services/bizdev.service';
import { compactMoney, downloadFile, money } from './shared/bizUtils';
import { useFetched } from './shared/bizHooks';
import { DataState, PageHeader, SecondaryButton, StatTiles } from '../procurement/shared/ProcUi';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#0EA5E9', '#64748B'];
const FUNNEL_COLORS = { lead: '#1E3A8A', contacted: '#2563EB', meeting_held: '#7C3AED', proposal_discussed: '#F59E0B', qualified: '#10B981', converted_to_tender: '#0EA5E9', lost: '#EF4444' };
const FUNNEL_LABELS = { lead: 'Lead Intake', contacted: 'Contacted', meeting_held: 'Meeting Held', proposal_discussed: 'Proposal Discussed', qualified: 'Qualified', converted_to_tender: 'Converted to Tender', lost: 'Lost' };

const tileOf = (report, key) => (report?.tiles || []).find((t) => t.key === key);

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

function Bar({ label, count, percent, color, right }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', marginBottom: 6, gap: 8 }}>
        <span style={{ color: '#334155', fontWeight: 500 }}>{label}</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>{right ?? count}</span>
      </div>
      <div style={{ width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, percent))}%`, height: '100%', backgroundColor: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
}

const changeText = (tile, unit, suffix) => {
  if (tile?.change == null) return suffix;
  return `${tile.change >= 0 ? '+' : ''}${tile.change}${unit} ${suffix}`;
};

export default function BizDevReports() {
  const [nonce, setNonce] = useState(0);
  const { data: report, error, loading } = useFetched(() => bizdevReportService.get(), 'report', nonce);
  const { toast, showToast, hideToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ready = report && !Array.isArray(report);

  const exportAs = async (format) => {
    setMenuOpen(false);
    setExporting(true);
    const message = await downloadFile(() => bizdevReportService.exportFile(format), `business-development-report.${format}`);
    setExporting(false);
    if (message) showToast(message, 'error');
    else showToast(`Business development report exported as ${format.toUpperCase()}`, 'success');
  };

  const months = ready ? report.monthlyRevenueWon : [];
  const monthMax = Math.max(1, ...months.map((m) => Math.max(m.awarded, m.pipeline)));
  const tasks = ready ? report.tasks : { total: 0, resolved: 0, overdue: 0 };
  const pipeline = tileOf(report, 'total_pipeline_value');
  const conversion = tileOf(report, 'opportunity_conversion');
  const success = tileOf(report, 'rfq_proposal_success');

  const tiles = ready
    ? [
        { label: 'TOTAL PIPELINE VALUE', value: compactMoney(pipeline?.value), sub: changeText(pipeline, '%', 'new pipeline vs last year'), subColor: pipeline?.change < 0 ? '#DC2626' : '#16A34A', icon: <FiDollarSign size={18} />, tone: 'amber' },
        { label: 'OPPORTUNITY CONVERSION', value: `${conversion?.value ?? 0}%`, sub: changeText(conversion, ' pts', 'vs last year'), subColor: conversion?.change < 0 ? '#DC2626' : '#16A34A', icon: <FiTarget size={18} />, tone: 'blue' },
        { label: 'RFQ PROPOSAL SUCCESS', value: `${success?.value ?? 0}%`, sub: changeText(success, ' pts', 'vs last year'), subColor: success?.change < 0 ? '#DC2626' : '#16A34A', icon: <FiCheckCircle size={18} />, tone: 'green' },
        { label: 'TEAM TASKS RESOLVED', value: `${tasks.resolved}/${tasks.total}`, sub: tasks.overdue ? `${tasks.overdue} overdue` : 'No overdue tasks', subColor: tasks.overdue ? '#DC2626' : undefined, icon: <FiFileText size={18} />, tone: 'purple' },
      ]
    : [];

  const funnelBase = ready ? report.conversionFunnel[0]?.count || 0 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Reports — Business Development" subtitle="Consolidated view of tender, client and deadline activity.">
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
              <Card title="Monthly Revenue Won" subtitle="Value of tenders awarded against new pipeline added" badge="Last 6 months">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, fontSize: '0.8rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: '#FF4D5E', borderRadius: 2 }} />Awarded</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: '#1E40AF', borderRadius: 2 }} />Pipeline</span>
                </div>
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                  {months.map((m) => (
                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, width: '100%', justifyContent: 'center' }}>
                        <div title={`Awarded: ${money(m.awarded)}`} style={{ width: '40%', backgroundColor: '#FF4D5E', height: `${(m.awarded / monthMax) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: m.awarded ? 2 : 0 }} />
                        <div title={`Pipeline: ${money(m.pipeline)}`} style={{ width: '40%', backgroundColor: '#1E40AF', height: `${(m.pipeline / monthMax) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: m.pipeline ? 2 : 0 }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: 8 }}>{monthLabel(m.month)}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="RFQ Performance" subtitle="RFQ feedback speed and accuracy analysis pipeline">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <MiniStat label="Submitted RFQs" value={report.rfqPerformance.submittedRfqs} caption="Quotations sent to clients" />
                  <MiniStat label="RFQ value YTD" value={compactMoney(report.rfqPerformance.rfqValueYtd)} caption="Logged this year" />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Status distribution volume</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {report.rfqPerformance.statusDistribution.map((s, i) => (
                    <div key={s.stage} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.813rem' }}>
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
              <Card title="Commercial Conversion Pipeline Funnel" subtitle="Survival rates of opportunities from registration to close sign-off" badge={`${report.conversionTotal} cases`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {report.conversionFunnel.map((f) => (
                    <Bar key={f.stage} label={`${FUNNEL_LABELS[f.stage] || f.stage} (${f.percentOfTotal}%)`} count={f.count} percent={funnelBase ? (f.count / funnelBase) * 100 : 0} color={FUNNEL_COLORS[f.stage] || '#64748B'} />
                  ))}
                </div>
              </Card>

              <Card title="Tender Outcome Analysis" subtitle="Win ratio breakdown and bidding outcome metrics">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <MiniStat label="Overall bids won" value={report.tenderOutcome.won} caption={`Out of ${report.tenderOutcome.totalTracked} tracked`} />
                  <MiniStat label="Awaiting decision" value={report.tenderOutcome.awaitingDecision} caption="Bids submitted" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {report.tenderOutcome.byStage.map((s, i) => (
                    <Bar
                      key={s.stage}
                      label={`${s.label} (${s.count})`}
                      count={s.count}
                      right={compactMoney(s.value)}
                      percent={report.tenderOutcome.totalTracked ? (s.count / report.tenderOutcome.totalTracked) * 100 : 0}
                      color={s.stage === 'won' ? '#16A34A' : s.stage === 'lost' ? '#EF4444' : COLORS[i % COLORS.length]}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
