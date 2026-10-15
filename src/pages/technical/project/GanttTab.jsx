import { useCallback, useMemo, useState } from 'react';
import { FiDownload, FiFilter, FiSearch } from 'react-icons/fi';
import { Input } from '../../../components/ui/FormField';
import { wbsService } from '../../../services/technical.service';
import { DataState, FilterDrawer, SecondaryButton } from '../../procurement/shared/ProcUi';
import { TechBadge } from '../shared/TechUi';
import { useFetched } from '../shared/techHooks';
import { WBS_PHASES, countFilters, downloadFile, formatDate, initials, refName, statusLabel } from '../shared/techUtils';

const DAY = 86400000;
const BAR = { completed: '#22C55E', in_progress: '#60A5FA', pending: '#94A3B8', on_hold: '#FB923C', delayed: '#EF4444' };
const STATUS_OPTIONS = ['pending', 'in_progress', 'on_hold', 'delayed', 'completed'].map((value) => ({ value, label: statusLabel(value) }));
const depthOf = (code) => Math.max(0, String(code).replace(/\.0$/, '').split('.').length - 1);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Read-only schedule of the project's work activities: bars positioned by their dates, filled by progress. */
export default function GanttTab({ project, refreshKey, showToast }) {
  const projectId = project._id;
  const wbs = useFetched(() => wbsService.list(projectId, {}), projectId, refreshKey);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', phase: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return wbs.data.filter((a) => (
      (!filters.status || a.status === filters.status)
      && (!filters.phase || a.phase === filters.phase)
      && (!needle || a.activityName.toLowerCase().includes(needle) || a.wbsCode.toLowerCase().includes(needle))
    ));
  }, [wbs.data, search, filters]);

  const range = useMemo(() => {
    const all = wbs.data;
    const times = all.flatMap((a) => [new Date(a.startDate).getTime(), new Date(a.endDate).getTime()]);
    times.push(new Date(project.startDate).getTime(), new Date(project.plannedCompletion).getTime());
    const first = new Date(Math.min(...times));
    const last = new Date(Math.max(...times));
    const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
    const end = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1);
    const months = [];
    for (let t = start; t < end; ) {
      const d = new Date(t);
      const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
      months.push({ label: `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`, from: t, to: next });
      t = next;
    }
    return { start, end, months };
  }, [wbs.data, project.startDate, project.plannedCompletion]);

  const total = range.end - range.start;
  const pct = (time) => Math.min(100, Math.max(0, ((time - range.start) / total) * 100));
  const todayPct = pct(now);
  const showToday = now >= range.start && now <= range.end;

  const exportCsv = useCallback(async () => {
    setExporting(true);
    const message = await downloadFile(() => wbsService.exportList(projectId, { format: 'csv' }), 'schedule.csv');
    setExporting(false);
    showToast(message || 'Schedule exported', message ? 'error' : 'success');
  }, [projectId, showToast]);

  const milestones = wbs.data.filter((a) => a.isMilestone).length;
  const critical = wbs.data.filter((a) => a.isCriticalPath).length;
  const overall = project.status === 'delayed' ? 'Delayed' : project.status === 'at_risk' ? 'At Risk' : project.status === 'on_hold' ? 'On Hold' : project.status === 'completed' ? 'Completed' : 'On Track';

  return (
    <div className="card" style={{ padding: 0, borderRadius: 12 }}>
      <div className="table-toolbar" style={{ padding: '16px 24px' }}>
        <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
          <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities..." style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryButton icon={<FiFilter size={15} />} onClick={() => setFilterOpen(true)}>Filter{countFilters(filters) ? ` (${countFilters(filters)})` : ''}</SecondaryButton>
          <SecondaryButton icon={<FiDownload size={15} />} onClick={exportCsv} disabled={exporting}>{exporting ? 'Exporting…' : 'Export'}</SecondaryButton>
        </div>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <DataState loading={wbs.loading} error={wbs.error} empty={!rows.length} emptyText={wbs.data.length ? 'No activities match the filter.' : 'No activities yet. Add work packages in the WBS tab.'}>
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <div style={{ minWidth: 900 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 220px 170px 130px 1fr', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>
                <div style={{ padding: '10px 12px' }}>WBS</div>
                <div style={{ padding: '10px 12px' }}>ACTIVITY</div>
                <div style={{ padding: '10px 12px' }}>ASSIGNED TO</div>
                <div style={{ padding: '10px 12px' }}>STATUS</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${range.months.length}, 1fr)` }}>
                  {range.months.map((m) => <div key={m.from} style={{ padding: '10px 4px', textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>{m.label}</div>)}
                </div>
              </div>
              {rows.map((a, i) => {
                const left = pct(new Date(a.startDate).getTime());
                const right = pct(new Date(a.endDate).getTime() + DAY);
                const width = Math.max(1.2, right - left);
                const name = refName(a.assignedTo, 'fullName');
                return (
                  <div key={a._id} style={{ display: 'grid', gridTemplateColumns: '60px 220px 170px 130px 1fr', borderBottom: '1px solid #F1F5F9', background: i % 2 ? '#FAFAFA' : '#fff', alignItems: 'center' }}>
                    <div style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#1D4ED8', fontWeight: 600 }}>{a.wbsCode}</div>
                    <div style={{ padding: '10px 12px', paddingLeft: 12 + depthOf(a.wbsCode) * 14, fontSize: '0.82rem', fontWeight: a.parentActivityId ? 400 : 700, color: '#0F172A' }}>
                      {a.activityName}
                      {a.isMilestone && <span title="Milestone" style={{ color: '#D97706', marginLeft: 6 }}>◆</span>}
                      {a.isCriticalPath && <span style={{ marginLeft: 6, fontSize: '0.62rem', background: '#FEE2E2', color: '#B91C1C', padding: '1px 5px', borderRadius: 3 }}>CRITICAL</span>}
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#334155' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#E0E7FF', color: '#3730A3', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(name)}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    </div>
                    <div style={{ padding: '10px 12px' }}><TechBadge status={a.status} /></div>
                    <div style={{ position: 'relative', height: 34, borderLeft: '1px solid #E2E8F0' }}>
                      <div title={`${formatDate(a.startDate)} to ${formatDate(a.endDate)} • ${a.progressPercent}%`} style={{ position: 'absolute', top: 9, left: `${left}%`, width: `${width}%`, height: 16, borderRadius: 4, background: `${BAR[a.status] || BAR.pending}55`, overflow: 'hidden' }}>
                        <div style={{ width: `${a.progressPercent}%`, height: '100%', background: BAR[a.status] || BAR.pending, color: '#fff', fontSize: '0.62rem', fontWeight: 700, lineHeight: '16px', paddingLeft: 4, whiteSpace: 'nowrap' }}>
                          {a.progressPercent > 0 ? `${a.progressPercent}%` : ''}
                        </div>
                      </div>
                      {showToday && <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPct}%`, borderLeft: '2px solid #F87171', pointerEvents: 'none' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', padding: '12px 4px 0', fontSize: '0.75rem', color: '#64748B' }}>
            <strong style={{ letterSpacing: '0.05em' }}>LEGEND</strong>
            {[['Completed', BAR.completed], ['In Progress', BAR.in_progress], ['Pending', BAR.pending], ['Delayed', BAR.delayed]].map(([label, color]) => (
              <span key={label}><span style={{ display: 'inline-block', width: 22, height: 8, background: color, borderRadius: 3, marginRight: 6 }} />{label}</span>
            ))}
            <span style={{ color: '#D97706' }}>◆ Milestone</span>
            <span style={{ color: '#EF4444' }}>| Today ({formatDate(new Date(now).toISOString())})</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '12px 4px 0', fontSize: '0.78rem', color: '#64748B' }}>
            <span>Visible Activities: <strong style={{ color: '#0F172A' }}>{rows.length}</strong></span>
            <span>Milestones: <strong style={{ color: '#0F172A' }}>{milestones}</strong></span>
            <span>Critical Path Activities: <strong style={{ color: '#0F172A' }}>{critical}</strong></span>
            <span>Overall Schedule Status: <TechBadge status={overall === 'On Track' ? 'completed' : project.status} label={overall} /></span>
          </div>
          <div style={{ padding: '8px 4px 0', fontSize: '0.72rem', color: '#94A3B8' }}>Read-only. Editing is handled from the WBS tab.</div>
        </DataState>
      </div>

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Schedule" subtitle="Show a subset of the activities." fields={[{ key: 'status', label: 'Status', options: STATUS_OPTIONS }, { key: 'phase', label: 'Phase', options: WBS_PHASES.map((p) => ({ value: p, label: p })) }]} values={filters} onApply={setFilters} />
    </div>
  );
}
