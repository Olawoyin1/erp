import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiBriefcase, FiCreditCard, FiDownload, FiTool } from 'react-icons/fi';
import Toast, { useToast } from '../../components/ui/Toast';
import DataTable from '../../components/ui/DataTable';
import { usePermission } from '../../hooks/usePermission';
import { apiError } from '../../services/apiHelpers';
import { technicalReportService } from '../../services/technical.service';
import { Choice, DataState, ListToolbar, PageHeader, SecondaryButton, StatTiles } from '../procurement/shared/ProcUi';
import { Legend, LineChart, PairedBarChart } from './shared/TechCharts';
import { TechBadge } from './shared/TechUi';
import { useDebouncedValue } from './shared/techHooks';
import { PROJECT_STATUS_OPTIONS, compactMoney, downloadFile } from './shared/techUtils';

const FLAG_TONE = { None: 'None', Medium: 'Medium', High: 'High' };

export default function TechnicalReports() {
  const navigate = useNavigate();
  const canViewProject = usePermission('technical.project.view');
  const { toast, showToast, hideToast } = useToast();
  const [searchText, setSearchText] = useState('');
  const q = useDebouncedValue(searchText.trim(), 400);
  const [status, setStatus] = useState('');
  const [state, setState] = useState({ loading: true, error: '', report: null });
  const [exporting, setExporting] = useState(false);
  const [nonce, setNonce] = useState(0);

  const params = useMemo(() => ({ months: 6, ...(q ? { q } : {}), ...(status ? { status } : {}) }), [q, status]);

  useEffect(() => {
    let cancelled = false;
    technicalReportService.get(params)
      .then((res) => { if (!cancelled) setState({ loading: false, error: '', report: res.data?.data || null }); })
      .catch((err) => { if (!cancelled) setState({ loading: false, error: apiError(err, 'The technical report could not be loaded'), report: null }); });
    return () => { cancelled = true; };
  }, [params, nonce]);

  const retry = useCallback(() => { setState((s) => ({ ...s, loading: true, error: '' })); setNonce((n) => n + 1); }, []);

  const exportReport = async () => {
    setExporting(true);
    const message = await downloadFile(() => technicalReportService.exportList({ ...params, format: 'csv' }), 'technical-report.csv');
    setExporting(false);
    showToast(message || 'Technical report exported', message ? 'error' : 'success');
  };

  const { report } = state;
  const tile = (key) => (report?.tiles || []).find((t) => t.key === key);
  const active = tile('active_projects');
  const budget = tile('budget_utilization');
  const tiles = [
    { label: 'Active Projects', value: active ? active.value : 0, sub: `+${active?.delta ?? 0} this month`, icon: <FiBriefcase size={16} />, tone: 'blue' },
    { label: 'Budget Utilization', value: budget ? `${compactMoney(budget.value)} / ${compactMoney(budget.total)}` : '—', sub: `${budget?.percent ?? 0}% utilized`, icon: <FiCreditCard size={16} />, tone: 'purple' },
    { label: 'Active Resources', value: tile('active_resources')?.value ?? 0, sub: 'Currently allocated', icon: <FiTool size={16} />, tone: 'green' },
    { label: 'Open Technical Issues', value: tile('open_technical_issues')?.value ?? 0, sub: 'Requiring attention', icon: <FiAlertTriangle size={16} />, tone: 'amber' },
  ];

  const trend = report?.trend || [];
  const labels = trend.map((t) => t.label);
  const latest = trend[trend.length - 1];

  const columns = [
    {
      key: 'projectName',
      label: 'PROJECT NAME',
      render: (v, row) => (canViewProject
        ? <button type="button" onClick={() => navigate(`/technical/projects/${row._id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 500, color: '#1D4ED8', textAlign: 'left' }}>{v}</button>
        : <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>),
    },
    { key: 'client', label: 'CLIENT', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'percentPhysical', label: '% PHYSICAL', render: (v) => `${v}%` },
    { key: 'percentFinancial', label: '% FINANCIAL', render: (v) => `${v}%` },
    { key: 'divergenceFlag', label: 'DIVERGENCE FLAG', render: (v) => <TechBadge status={FLAG_TONE[v] || v} label={v} /> },
    { key: 'status', label: 'STATUS', render: (v) => <TechBadge status={v} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Reports - Technical" subtitle="Review and export technical and project performance reports across all projects">
        <SecondaryButton icon={<FiDownload size={14} />} onClick={exportReport} disabled={exporting}>{exporting ? 'Exporting…' : 'Export'}</SecondaryButton>
      </PageHeader>

      <StatTiles tiles={tiles} loading={state.loading && !report} error={Boolean(state.error)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 600 }}>Physical Progress vs Planned Progress</h3>
          <Legend items={[
            { label: 'Physical Progress (%)', color: '#1D4ED8', value: latest ? `${latest.physicalProgress}%` : undefined },
            { label: 'Planned Progress (%)', color: '#EF4444', value: latest ? `${latest.plannedProgress}%` : undefined },
          ]}
          />
          <DataState loading={state.loading && !report} error={state.error} empty={!state.loading && !trend.length} emptyText="No progress data yet." onRetry={retry}>
            <LineChart
              labels={labels}
              series={[
                { label: 'Physical Progress', color: '#1D4ED8', values: trend.map((t) => t.physicalProgress) },
                { label: 'Planned Progress', color: '#EF4444', values: trend.map((t) => t.plannedProgress) },
              ]}
            />
          </DataState>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600 }}>Budget vs Actual Cost</h3>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#64748B' }}>Compare planned budget against actual project expenditure</p>
          <Legend items={[{ label: 'Budget', color: '#EF4444', square: true }, { label: 'Actual Cost', color: '#1D4ED8', square: true }]} />
          <DataState loading={state.loading && !report} error={state.error} empty={!state.loading && !trend.length} emptyText="No cost data yet." onRetry={retry}>
            <PairedBarChart labels={labels} a={{ label: 'Budget', color: '#EF4444', values: trend.map((t) => t.budget) }} b={{ label: 'Actual Cost', color: '#1D4ED8', values: trend.map((t) => t.actualCost) }} />
          </DataState>
        </div>
      </div>

      <div className="card" style={{ padding: 0, borderRadius: 12 }}>
        <ListToolbar search={searchText} onSearch={setSearchText} placeholder="Search project, client...">
          <div style={{ width: 200 }}>
            <Choice value={status} onChange={setStatus} placeholder="All statuses" options={[{ value: '', label: 'All statuses' }, ...PROJECT_STATUS_OPTIONS]} />
          </div>
        </ListToolbar>
        <div style={{ padding: '0 24px 16px' }}>
          <DataState loading={state.loading && !report} error={state.error} empty={Boolean(report) && !report.table.length} emptyText="No projects match." onRetry={retry}>
            <DataTable columns={columns} data={report?.table || []} keyField="_id" emptyMessage="No projects match." />
          </DataState>
        </div>
      </div>
    </div>
  );
}
