import { useState } from 'react';
import { FiDownload, FiDollarSign, FiCheckCircle, FiTool, FiFileText } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import { adminReportService } from '../../services/admin.service';
import { compactMoney, downloadFile } from '../procurement/shared/procUtils';
import { useFetched } from '../procurement/shared/procHooks';
import { DataState, PageHeader, SecondaryButton, StatTiles } from '../procurement/shared/ProcUi';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#0EA5E9', '#64748B'];

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

const NoAccess = () => <div style={{ color: '#94A3B8', fontSize: '0.84rem', padding: '12px 0' }}>Your role does not include access to the records behind this panel.</div>;

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

function StatusList({ rows, money = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((s, i) => (
        <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.813rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#334155' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }} />{s.label}
          </span>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>
            {s.count}{money && <span style={{ color: '#94A3B8', fontWeight: 400 }}> ({compactMoney(s.value)})</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
}

export default function AdminReports() {
  const [nonce, setNonce] = useState(0);
  const { data: report, error, loading } = useFetched(() => adminReportService.get(), 'report', nonce);
  const { toast, showToast, hideToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ready = report && !Array.isArray(report);

  const exportAs = async (format) => {
    setMenuOpen(false);
    setExporting(true);
    const message = await downloadFile(() => adminReportService.exportFile(format), `administration-report.${format}`);
    setExporting(false);
    if (message) showToast(message, 'error');
    else showToast(`Administration report exported as ${format.toUpperCase()}`, 'success');
  };

  const tile = (key) => (report?.tiles || []).find((t) => t.key === key) || { value: 0, caption: '' };
  const requests = ready ? report.requests : null;
  const months = requests ? requests.monthly : [];
  const monthMax = Math.max(1, ...months.map((m) => Math.max(m.raised, m.approved)));
  const tasks = ready ? report.tasks : { total: 0, resolved: 0, overdue: 0 };

  const tiles = ready
    ? [
        { label: 'TOTAL ASSET VALUE', value: report.assets ? compactMoney(tile('asset_book_value').value) : '—', sub: tile('asset_book_value').caption, icon: <FiDollarSign size={18} />, tone: 'amber' },
        { label: 'REQUEST APPROVAL RATE', value: requests ? `${tile('request_approval_rate').value}%` : '—', sub: tile('request_approval_rate').caption, icon: <FiCheckCircle size={18} />, tone: 'green' },
        { label: 'MAINTENANCE COMPLETION', value: report.maintenance ? `${tile('maintenance_completion_rate').value}%` : '—', sub: tile('maintenance_completion_rate').caption, subColor: report.maintenance?.overdue ? '#DC2626' : undefined, icon: <FiTool size={18} />, tone: 'blue' },
        { label: 'TEAM TASKS RESOLVED', value: `${tasks.resolved}/${tasks.total}`, sub: tasks.overdue ? `${tasks.overdue} overdue` : 'No overdue tasks', subColor: tasks.overdue ? '#DC2626' : undefined, icon: <FiFileText size={18} />, tone: 'purple' },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Reports — Administration" subtitle="Consolidated view of requests, assets, maintenance, travel and disposal activity">
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
              <Card title="Monthly Requests" subtitle="Administrative requests raised against those approved or issued" badge="Last 6 months">
                {!requests ? <NoAccess /> : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, fontSize: '0.8rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: '#1E40AF', borderRadius: 2 }} />Raised</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: '#10B981', borderRadius: 2 }} />Approved or issued</span>
                    </div>
                    <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                      {months.map((m) => (
                        <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, width: '100%', justifyContent: 'center' }}>
                            <div title={`Raised: ${m.raised}`} style={{ width: '40%', backgroundColor: '#1E40AF', height: `${(m.raised / monthMax) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: m.raised ? 2 : 0 }} />
                            <div title={`Approved or issued: ${m.approved}`} style={{ width: '40%', backgroundColor: '#10B981', height: `${(m.approved / monthMax) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: m.approved ? 2 : 0 }} />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: 8 }}>{monthLabel(m.month)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card title="Maintenance Performance" subtitle="How planned facility maintenance jobs are progressing">
                {!report.maintenance ? <NoAccess /> : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      <MiniStat label="Maintenance jobs" value={report.maintenance.total} caption={`${report.maintenance.completed} completed`} />
                      <MiniStat label="Estimated cost" value={compactMoney(report.maintenance.estimatedCost)} caption="Excluding cancelled jobs" />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Status distribution</div>
                    <StatusList rows={report.maintenance.statusDistribution} money />
                  </>
                )}
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              <Card title="Request Approval Funnel" subtitle="How requests progress through the four approval steps to issue" badge={requests ? `${requests.total} requests` : undefined}>
                {!requests ? <NoAccess /> : <HBars rows={requests.funnel.map((f) => ({ label: f.stage, value: f.count }))} empty="No requests yet." />}
              </Card>

              <Card title="Travel & Movement Outcomes" subtitle="Where travel requests and equipment movements stand">
                {!report.travel ? <NoAccess /> : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      <MiniStat label="Travel approved" value={report.travel.approved} caption={`Out of ${report.travel.total} requests`} />
                      <MiniStat label="Awaiting decision" value={report.travel.awaitingDecision} caption={`${report.travel.movements.total} equipment movements`} />
                    </div>
                    <HBars rows={report.travel.byStatus.map((s) => ({ label: `Travel: ${s.label}`, value: s.count }))} empty="No travel requests yet." />
                    <div style={{ height: 14 }} />
                    <HBars rows={report.travel.movements.byStatus.map((s) => ({ label: `Movement: ${s.label}`, value: s.count }))} empty="No movements yet." />
                  </>
                )}
              </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              <Card title="Asset Register" subtitle="Fixed assets by status, with supplies needing attention">
                {!report.assets ? <NoAccess /> : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      <MiniStat label="Purchase cost" value={compactMoney(report.assets.purchaseCost)} caption="Assets not retired" />
                      <MiniStat label="Supplies to restock" value={report.assets.supplies.lowStock + report.assets.supplies.outOfStock} caption={`${report.assets.supplies.outOfStock} out of stock`} />
                    </div>
                    <StatusList rows={report.assets.byStatus} money />
                  </>
                )}
              </Card>

              <Card title="Waste Disposal" subtitle="Share of disposal records confirmed as completed">
                {!report.disposals ? <NoAccess /> : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                      <MiniStat label="Compliance rate" value={`${report.disposals.complianceRate}%`} caption={`${report.disposals.completed} of ${report.disposals.total} records`} />
                      <MiniStat label="Awaiting completion" value={report.disposals.pending} caption="Records still pending" />
                    </div>
                    <HBars rows={[{ label: 'Completed', value: report.disposals.completed }, { label: 'Pending', value: report.disposals.pending }]} empty="No disposal records yet." />
                  </>
                )}
              </Card>
            </div>
          </>
        )}
      </DataState>
    </div>
  );
}
