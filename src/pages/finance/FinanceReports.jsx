import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDownload, FiArrowRight, FiAlertCircle, FiDollarSign, FiShoppingBag, FiTrendingUp, FiCreditCard, FiFileText } from 'react-icons/fi';
import { usePermission } from '../../hooks/usePermission';
import { apiError } from '../../services/apiHelpers';
import { financeReportService, financialStatementService } from '../../services/finance.service';
import { DatePicker } from '../../components/ui/FormField';
import { Choice, DataState, Field, Note, PageHeader, SecondaryButton, Skeleton, TabBar, Tag } from './shared/FinanceUi';
import { LineChart, PieChart } from './shared/FinanceCharts';
import { compactMoney, downloadFile, money, today } from './shared/financeUtils';
import { useLegalEntityOptions, useProjectOptions } from './shared/useRefOptions';

const CASH_FLOW_MONTHS = 12;

/** Loads one document through `load()` whenever `key` changes; `loading` is true until the current key has answered. */
function useRemote(load, key, enabled = true) {
  const [state, setState] = useState({ key: null, data: null, error: '' });
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    load()
      .then((res) => { if (!cancelled) setState({ key, data: res.data?.data ?? null, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ key, data: null, error: apiError(err, 'Could not load the report') }); });
    return () => { cancelled = true; };
    // `load` is rebuilt every render; the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  const mine = state.key === key;
  return { data: mine ? state.data : null, error: mine ? state.error : '', loading: enabled && !mine };
}

/* ───────────────────────────── Overview ───────────────────────────── */

const TILE_META = {
  total_revenue: { icon: <FiDollarSign size={15} />, bg: '#DBEAFE', fg: '#1E40AF' },
  total_expenses: { icon: <FiShoppingBag size={15} />, bg: '#EDE9FE', fg: '#5B21B6' },
  net_profit: { icon: <FiTrendingUp size={15} />, bg: '#DCFCE7', fg: '#166534' },
  outstanding_ar: { icon: <FiCreditCard size={15} />, bg: '#FEF3C7', fg: '#92400E' },
};

function ReportTile({ tile }) {
  const meta = TILE_META[tile.key] || TILE_META.total_revenue;
  const change = tile.changePct;
  const up = change != null && change >= 0;
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{tile.label}</span>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, color: meta.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{meta.icon}</span>
      </div>
      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A' }} title={money(tile.value)}>{compactMoney(tile.value)}</span>
      <span style={{ fontSize: '0.72rem', display: 'flex', gap: 4, alignItems: 'center' }}>
        {change == null ? (
          <span style={{ color: '#94A3B8' }}>No figure for last month to compare</span>
        ) : (
          <>
            <span style={{ color: up ? '#16A34A' : '#DC2626', fontWeight: 600 }}>{up ? '↗' : '↘'} {up ? '+' : ''}{change}%</span>
            <span style={{ color: '#94A3B8' }}>vs last month</span>
          </>
        )}
      </span>
    </div>
  );
}

function ChartCard({ title, subtitle, legend, children }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {legend}
      </div>
      {children}
    </div>
  );
}

const LegendDot = ({ color, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: '#475569' }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />{label}
  </span>
);

function ProjectRow({ row }) {
  const spent = Math.min(100, row.percentSpent);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(200px, 1.6fr) 120px', gap: 20, alignItems: 'center', padding: '14px 0', borderTop: '1px solid #F1F5F9' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <Tag>{row.projectId || row.budgetId}</Tag>
          {row.redAlert && <Tag tone="red"><FiAlertCircle size={10} style={{ verticalAlign: '-1px' }} /> Red Alert</Tag>}
        </div>
        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A' }}>{row.projectId ? `${row.projectId} · ` : ''}{row.project}</div>
        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Client: {row.client || '—'}</div>
      </div>
      <div>
        <div style={{ height: 8, borderRadius: 4, background: '#FB3F55', overflow: 'hidden' }} title={`${row.percentSpent}% of the budget spent`}>
          <div style={{ width: `${spent}%`, height: '100%', background: '#1E40AF' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#334155', marginTop: 6 }}>
          <span>Budget: <strong>{compactMoney(row.approvedBudget)}</strong></span>
          <span>Spent: <strong>{compactMoney(row.actualSpend)}</strong></span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: row.redAlert ? '#DC2626' : '#0F172A' }}>{row.percentSpent}% <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#64748B' }}>spent</span></div>
        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Margin Left: {compactMoney(row.marginLeft)}</div>
      </div>
    </div>
  );
}

function Overview() {
  const navigate = useNavigate();
  const canProjects = usePermission('technical.project.view');
  const [reloadKey, setReloadKey] = useState(0);
  const { data, loading, error } = useRemote(() => financeReportService.get({ months: CASH_FLOW_MONTHS }), `overview:${reloadKey}`);

  const cashFlow = useMemo(() => {
    const series = data?.charts?.find((c) => c.key === 'cash_flow')?.series || [];
    return series.map((p) => ({ label: p.label, short: p.label.split(' ')[0], a: p.inflow || 0, b: p.outflow || 0 }));
  }, [data]);
  const departments = data?.charts?.find((c) => c.key === 'top_spending_departments')?.series || [];
  const noCash = cashFlow.every((p) => p.a === 0 && p.b === 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-busy="true">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => <div key={i} className="card" style={{ padding: 18 }}><Skeleton height={64} /></div>)}
        </div>
        <div className="card" style={{ padding: 20 }}><Skeleton height={240} /></div>
      </div>
    );
  }
  if (error) return <DataState error={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        {(data?.tiles || []).map((tile) => <ReportTile key={tile.key} tile={tile} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <ChartCard
          title="Cash Flow"
          subtitle={`Inflows vs. Outflows — last ${CASH_FLOW_MONTHS} months`}
          legend={<div style={{ display: 'flex', gap: 12 }}><LegendDot color="#1E40AF" label="Inflow" /><LegendDot color="#FB3F55" label="Outflow" /></div>}
        >
          {noCash ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>No payments were received or made in this period.</div>
          ) : (
            <LineChart points={cashFlow} names={{ a: 'Inflow', b: 'Outflow' }} />
          )}
        </ChartCard>
        <ChartCard title="Top Spending Departments" subtitle="Departments with the highest approved expenditure">
          {departments.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>No approved spending has been recorded yet.</div>
          ) : (
            <PieChart slices={departments} />
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Active Projects — Cost vs Budget"
        legend={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <LegendDot color="#1E40AF" label="Cost" /><LegendDot color="#FB3F55" label="Budget" />
            {canProjects && (
              <button type="button" onClick={() => navigate('/technical/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font)' }}>
                View all projects <FiArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      >
        {(data?.projectCostVsBudget || []).length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>No active project budgets yet.</div>
        ) : (
          <div>{data.projectCostVsBudget.map((row) => <ProjectRow key={row.budgetId} row={row} />)}</div>
        )}
      </ChartCard>
    </div>
  );
}

/* ───────────────────────── Financial statements ───────────────────────── */

const KINDS = [
  { id: 'income', label: 'Profit & Loss (P&L)', title: 'STATEMENT OF COMPREHENSIVE INCOME (P&L)', call: 'incomeStatement', file: 'income-statement', range: true },
  { id: 'balance', label: 'Balance Sheet', title: 'STATEMENT OF FINANCIAL POSITION', call: 'balanceSheet', file: 'balance-sheet', range: false },
  { id: 'cashflow', label: 'Cash Flow', title: 'CASH FLOW STATEMENT', call: 'cashFlow', file: 'cash-flow', range: true },
  { id: 'aging', label: 'Aging Analysis', title: 'AGING ANALYSIS', call: null, file: 'aging', range: false },
  { id: 'trial', label: 'Trial Balance', title: 'TRIAL BALANCE', call: 'trialBalance', file: 'trial-balance', range: false },
];

const PERIODS = [
  { value: 'month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This year' },
  { value: 'last_year', label: 'Last year' },
  { value: 'custom', label: 'Custom dates' },
];

const pad = (n) => String(n).padStart(2, '0');
const dateText = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function periodDates(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === 'month') return { from: dateText(y, m, 1), to: today() };
  if (period === 'last_month') {
    const lastY = m === 0 ? y - 1 : y;
    const lastM = m === 0 ? 11 : m - 1;
    return { from: dateText(lastY, lastM, 1), to: dateText(lastY, lastM, new Date(lastY, lastM + 1, 0).getDate()) };
  }
  if (period === 'quarter') return { from: dateText(y, Math.floor(m / 3) * 3, 1), to: today() };
  if (period === 'last_year') return { from: dateText(y - 1, 0, 1), to: dateText(y - 1, 11, 31) };
  return { from: dateText(y, 0, 1), to: today() };
}

const cellStyle = { padding: '9px 14px' };
const amountCell = { ...cellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

function StatementTable({ head, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
        {head && (
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 600 }}>
              {head.map((h) => <th key={h.label} style={{ ...cellStyle, textAlign: h.right ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h.label}</th>)}
            </tr>
          </thead>
        )}
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const LineRow = ({ line }) => (
  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
    <td style={{ ...cellStyle, color: '#64748B', width: 80 }}>{line.accountCode}</td>
    <td style={cellStyle}>{line.accountName}</td>
    <td style={amountCell}>{money(line.amount)}</td>
  </tr>
);

const TotalRow = ({ label, value, tone = 'slate', span = 2 }) => {
  const tones = { slate: { bg: '#F8FAFC', fg: '#0F172A', border: '#E2E8F0' }, green: { bg: '#F0FDF4', fg: '#16A34A', border: '#DCFCE7' }, blue: { bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' }, red: { bg: '#FEF2F2', fg: '#DC2626', border: '#FECACA' } };
  const t = tones[tone];
  return (
    <tr style={{ background: t.bg, color: t.fg, fontWeight: 700, borderTop: `2px solid ${t.border}` }}>
      <td colSpan={span} style={cellStyle}>{label}</td>
      <td style={amountCell}>{money(value)}</td>
    </tr>
  );
};

const SectionRow = ({ label }) => (
  <tr><td colSpan={3} style={{ ...cellStyle, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.05em', color: '#0F172A', paddingTop: 16 }}>{label}</td></tr>
);

const Empty = ({ text }) => <tr><td colSpan={3} style={{ ...cellStyle, color: '#94A3B8' }}>{text}</td></tr>;

function IncomeStatement({ data }) {
  return (
    <StatementTable head={[{ label: 'CODE' }, { label: 'ACCOUNT' }, { label: 'AMOUNT', right: true }]}>
      <SectionRow label="REVENUE" />
      {data.revenue.length ? data.revenue.map((l) => <LineRow key={l.accountCode} line={l} />) : <Empty text="No revenue posted in this period." />}
      <TotalRow label="TOTAL REVENUE" value={data.totalRevenue} />
      <SectionRow label="EXPENSES" />
      {data.expenses.length ? data.expenses.map((l) => <LineRow key={l.accountCode} line={l} />) : <Empty text="No expenses posted in this period." />}
      <TotalRow label="TOTAL EXPENSES" value={data.totalExpenses} />
      <TotalRow label="NET PROFIT / (LOSS)" value={data.netProfit} tone={data.netProfit < 0 ? 'red' : 'blue'} />
    </StatementTable>
  );
}

function BalanceSheet({ data }) {
  const side = (title, color, lines, extra, total, totalLabel, tone) => (
    <div>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', borderBottom: `2px solid ${color}`, paddingBottom: 6, margin: '0 0 6px' }}>{title}</h4>
      <StatementTable>
        {lines.length ? lines.map((l) => <LineRow key={l.accountCode} line={l} />) : <Empty text="Nothing posted." />}
        {extra}
        <TotalRow label={totalLabel} value={total} tone={tone} />
      </StatementTable>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {side('ASSETS', '#1D4ED8', data.assets, null, data.totalAssets, 'TOTAL ASSETS', 'blue')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {side('LIABILITIES', '#7C3AED', data.liabilities, null, data.totalLiabilities, 'TOTAL LIABILITIES', 'slate')}
          {side('EQUITY', '#16A34A', data.equity, (
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={cellStyle} />
              <td style={cellStyle}>Current earnings (not yet closed to retained earnings)</td>
              <td style={amountCell}>{money(data.currentEarnings)}</td>
            </tr>
          ), data.totalEquity, 'TOTAL EQUITY', 'green')}
        </div>
      </div>
      <Note tone={data.balanced ? 'green' : 'red'}>
        {data.balanced ? 'The balance sheet balances: total assets equal total liabilities plus equity.' : 'The balance sheet does not balance. Review the ledger before relying on these figures.'}
      </Note>
    </div>
  );
}

function CashFlowStatement({ data }) {
  const empty = data.receipts.length === 0 && data.payments.length === 0 && data.openingCash === 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {empty && <Note tone="amber">No bank movements were found. Cash flow reads the bank account mapped in Finance Settings; make sure one is set and has postings in this period.</Note>}
      <StatementTable head={[{ label: 'CODE' }, { label: 'ACTIVITY' }, { label: 'AMOUNT', right: true }]}>
        <TotalRow label="OPENING CASH" value={data.openingCash} />
        <SectionRow label="CASH RECEIVED (BY SOURCE)" />
        {data.receipts.length ? data.receipts.map((l) => <LineRow key={l.accountCode} line={l} />) : <Empty text="No receipts in this period." />}
        <TotalRow label="TOTAL RECEIPTS" value={data.totalReceipts} tone="green" />
        <SectionRow label="CASH PAID (BY PURPOSE)" />
        {data.payments.length ? data.payments.map((l) => <LineRow key={l.accountCode} line={l} />) : <Empty text="No payments in this period." />}
        <TotalRow label="TOTAL PAYMENTS" value={data.totalPayments} tone="red" />
        <TotalRow label="CLOSING CASH" value={data.closingCash} tone="blue" />
      </StatementTable>
    </div>
  );
}

function AgingStatement({ rows, partyLabel }) {
  const sum = (key) => rows.reduce((s, r) => s + r[key], 0);
  const buckets = [['current', 'CURRENT'], ['d1_30', '1-30 DAYS'], ['d31_60', '31-60 DAYS'], ['d61_90', '61-90 DAYS'], ['d90plus', '90+ DAYS']];
  return (
    <StatementTable head={[{ label: partyLabel }, ...buckets.map(([, l]) => ({ label: l, right: true })), { label: 'TOTAL', right: true }]}>
      {rows.length === 0 && <tr><td colSpan={7} style={{ ...cellStyle, color: '#94A3B8', textAlign: 'center' }}>Nothing is outstanding.</td></tr>}
      {rows.map((r) => (
        <tr key={r.party} style={{ borderBottom: '1px solid #F1F5F9' }}>
          <td style={{ ...cellStyle, fontWeight: 600 }}>{r.party}</td>
          {buckets.map(([key]) => <td key={key} style={{ ...amountCell, color: key === 'd90plus' && r[key] > 0 ? '#DC2626' : undefined }}>{money(r[key])}</td>)}
          <td style={{ ...amountCell, fontWeight: 600 }}>{money(r.total)}</td>
        </tr>
      ))}
      {rows.length > 0 && (
        <tr style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, borderTop: '2px solid #BFDBFE' }}>
          <td style={cellStyle}>TOTAL</td>
          {buckets.map(([key]) => <td key={key} style={amountCell}>{money(sum(key))}</td>)}
          <td style={amountCell}>{money(sum('total'))}</td>
        </tr>
      )}
    </StatementTable>
  );
}

function TrialBalance({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StatementTable head={[{ label: 'CODE' }, { label: 'ACCOUNT' }, { label: 'CATEGORY' }, { label: 'DEBIT', right: true }, { label: 'CREDIT', right: true }]}>
        {data.rows.length === 0 && <tr><td colSpan={5} style={{ ...cellStyle, color: '#94A3B8', textAlign: 'center' }}>Nothing has been posted to the ledger yet.</td></tr>}
        {data.rows.map((r) => (
          <tr key={r.accountCode} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <td style={{ ...cellStyle, color: '#64748B' }}>{r.accountCode}</td>
            <td style={cellStyle}>{r.accountName}</td>
            <td style={cellStyle}>{r.category}</td>
            <td style={amountCell}>{r.debit ? money(r.debit) : '—'}</td>
            <td style={amountCell}>{r.credit ? money(r.credit) : '—'}</td>
          </tr>
        ))}
        <tr style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, borderTop: '2px solid #BFDBFE' }}>
          <td colSpan={3} style={cellStyle}>TOTAL</td>
          <td style={amountCell}>{money(data.totalDebit)}</td>
          <td style={amountCell}>{money(data.totalCredit)}</td>
        </tr>
      </StatementTable>
      <Note tone={data.balanced ? 'green' : 'red'}>{data.balanced ? 'Total debits equal total credits.' : 'Total debits and credits differ. Review the ledger.'}</Note>
    </div>
  );
}

function Statements() {
  const [kind, setKind] = useState('income');
  const [agingSide, setAgingSide] = useState('receivables');
  const [period, setPeriod] = useState('year');
  const [range, setRange] = useState(() => periodDates('year'));
  const [entity, setEntity] = useState('');
  const [project, setProject] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');
  const entities = useLegalEntityOptions();
  const projects = useProjectOptions('');
  const active = KINDS.find((k) => k.id === kind);

  const params = useMemo(() => {
    const p = { to: range.to };
    if (active.range) p.from = range.from;
    if (entity) p.entity = entity;
    if (project) p.project = project;
    return active.id === 'aging' ? {} : p;
  }, [active, range, entity, project]);

  const call = active.id === 'aging'
    ? (format) => (agingSide === 'receivables' ? financialStatementService.agedReceivables({}, format) : financialStatementService.agedPayables({}, format))
    : (format) => financialStatementService[active.call](params, format);
  const fileBase = active.id === 'aging' ? (agingSide === 'receivables' ? 'aged-receivables' : 'aged-payables') : active.file;

  const requestKey = `${kind}:${agingSide}:${JSON.stringify(params)}:${reloadKey}`;
  const { data, loading, error } = useRemote(() => call(), requestKey);

  const changePeriod = (value) => {
    setPeriod(value);
    if (value !== 'custom') setRange(periodDates(value));
  };
  const changeDate = (key, value) => {
    setPeriod('custom');
    setRange((r) => ({ ...r, [key]: value }));
  };

  const download = async (format) => {
    setExporting(format);
    setExportError('');
    const failure = await downloadFile(() => call(format), `${fileBase}.${format}`);
    if (failure) setExportError(failure);
    setExporting('');
  };

  const rangeText = active.range ? `${range.from} to ${range.to}` : active.id === 'aging' ? `as at ${today()}` : `as at ${range.to}`;

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              style={{
                padding: '8px 14px', borderRadius: 6, fontWeight: 600, fontSize: '0.813rem', cursor: 'pointer', fontFamily: 'var(--font)',
                border: kind === k.id ? '1px solid #1D4ED8' : '1px solid #E2E8F0', background: kind === k.id ? '#EFF6FF' : '#FFFFFF', color: kind === k.id ? '#1D4ED8' : '#64748B',
              }}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <SecondaryButton icon={<FiFileText size={14} />} onClick={() => download('csv')} disabled={Boolean(exporting)}>{exporting === 'csv' ? 'Exporting…' : 'CSV'}</SecondaryButton>
          <SecondaryButton icon={<FiDownload size={14} />} onClick={() => download('xlsx')} disabled={Boolean(exporting)}>{exporting === 'xlsx' ? 'Exporting…' : 'Export Excel'}</SecondaryButton>
          <SecondaryButton icon={<FiDownload size={14} />} onClick={() => download('pdf')} disabled={Boolean(exporting)}>{exporting === 'pdf' ? 'Preparing…' : 'Print / PDF'}</SecondaryButton>
        </div>
      </div>

      {active.id === 'aging' ? (
        <div style={{ maxWidth: 260 }}>
          <Field label="Aging of">
            <Choice value={agingSide} onChange={setAgingSide} options={[{ value: 'receivables', label: 'Receivables (clients)' }, { value: 'payables', label: 'Payables (vendors)' }]} />
          </Field>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <Field label="Period"><Choice value={period} onChange={changePeriod} options={PERIODS} /></Field>
          {active.range && <Field label="From"><DatePicker value={range.from} onChange={(e) => changeDate('from', e.target.value)} /></Field>}
          <Field label={active.range ? 'To' : 'As at'}><DatePicker value={range.to} onChange={(e) => changeDate('to', e.target.value)} /></Field>
          <Field label="Legal entity"><Choice value={entity} onChange={setEntity} options={[{ value: '', label: 'All entities' }, ...entities.options]} placeholder="All entities" /></Field>
          <Field label="Project"><Choice value={project} onChange={setProject} options={[{ value: '', label: 'All projects' }, ...projects.options]} searchable placeholder="All projects" /></Field>
        </div>
      )}
      {exportError && <Note tone="red">{exportError}</Note>}

      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{kind === 'aging' ? `${active.title}: ${agingSide === 'receivables' ? 'RECEIVABLES' : 'PAYABLES'}` : active.title}</h3>
        <div style={{ fontSize: '0.813rem', color: '#64748B', marginTop: 4 }}>{rangeText} · Currency: NGN (base currency)</div>
      </div>

      <DataState loading={loading} error={error} empty={false} onRetry={() => setReloadKey((k) => k + 1)}>
        {data && kind === 'income' && <IncomeStatement data={data} />}
        {data && kind === 'balance' && <BalanceSheet data={data} />}
        {data && kind === 'cashflow' && <CashFlowStatement data={data} />}
        {data && kind === 'aging' && <AgingStatement rows={data} partyLabel={agingSide === 'receivables' ? 'CLIENT' : 'VENDOR'} />}
        {data && kind === 'trial' && <TrialBalance data={data} />}
      </DataState>
    </div>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────── */

export default function FinanceReports() {
  const canOverview = usePermission('finance.reports.view');
  const canStatements = usePermission('finance.statement.view');
  const [tab, setTab] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const tabs = [
    ...(canOverview ? [{ id: 'overview', label: 'Overview' }] : []),
    ...(canStatements ? [{ id: 'statements', label: 'Financial Statements' }] : []),
  ];
  const current = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

  const exportOverview = async () => {
    setExporting(true);
    setExportError('');
    const failure = await downloadFile(() => financeReportService.download({ months: CASH_FLOW_MONTHS }, 'xlsx'), 'finance-reports.xlsx');
    if (failure) setExportError(failure);
    setExporting(false);
  };

  if (tabs.length === 0) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view finance reports.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader title="Reports- Accounts & Finance" subtitle="Comprehensive financial reports to monitor performance, compliance, budgets, and cash flow across the organisation">
        {canOverview && current === 'overview' && (
          <SecondaryButton icon={<FiDownload size={14} />} onClick={exportOverview} disabled={exporting}>{exporting ? 'Exporting…' : 'Export'}</SecondaryButton>
        )}
      </PageHeader>
      {exportError && <Note tone="red">{exportError}</Note>}
      {tabs.length > 1 && <TabBar tabs={tabs} active={current} onChange={setTab} />}
      {current === 'overview' && <Overview />}
      {current === 'statements' && <Statements />}
    </div>
  );
}
