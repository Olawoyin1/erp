import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiCreditCard,
  FiShield,
  FiCheckCircle,
  FiUploadCloud,
  FiFileText,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';

import {
  fetchDashboardOverview,
  fetchRecentActivity,
  selectDashboardOverview,
  selectDashboardActivity,
  selectOverviewLoading,
  selectActivityLoading,
  selectOverviewError,
  selectActivityError,
} from '../../store/dashboard/dashboardSlice';
import { usePermission } from '../../hooks/usePermission';
import { koboToNaira } from '../../hooks/useKobo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Map tile keys to icon + colour class
const TILE_CONFIG = {
  active_projects:  { icon: <FiShoppingCart size={16} />, colorClass: 'icon-orange', label: 'ACTIVE PROJECTS' },
  total_revenue:    { icon: <FiCreditCard size={16} />,   colorClass: 'icon-blue',   label: 'TOTAL REVENUE' },
  hse_compliance:   { icon: <FiShield size={16} />,       colorClass: 'icon-green',  label: 'HSE COMPLIANCE' },
  open_pos:         { icon: <FiShoppingCart size={16} />, colorClass: 'icon-purple', label: 'OPEN POS' },
};

// Format a tile value depending on the key
function formatTileValue(key, value) {
  if (key === 'total_revenue') return koboToNaira(value, { compact: true });
  if (key === 'hse_compliance') return `${value}%`;
  return value;
}

// Map activity action strings to an icon + colours
function activityStyle(action = '') {
  const a = action.toLowerCase();
  if (a.includes('approved') || a.includes('complete') || a.includes('signed') || a.includes('paid'))
    return { icon: <FiCheckCircle size={16} />, bg: '#dcfce7', color: '#16a34a' };
  if (a.includes('upload') || a.includes('submit') || a.includes('create') || a.includes('register'))
    return { icon: <FiUploadCloud size={16} />, bg: '#dbeafe', color: '#2563eb' };
  if (a.includes('overdue') || a.includes('reject') || a.includes('fail') || a.includes('alert'))
    return { icon: <FiAlertCircle size={16} />, bg: '#fee2e2', color: '#ef4444' };
  return { icon: <FiFileText size={16} />, bg: '#f1f5f9', color: '#475569' };
}

// Relative time string from ISO date
function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ─── SVG chart helpers ────────────────────────────────────────────────────────
const SVG_W = 650;
const SVG_H = 220;
const PAD_X = 35;
const PAD_Y = 25;

function buildChartPaths(series) {
  if (!series?.length) return { revPath: '', tgtPath: '', getX: () => 0, getY: () => 0, maxY: 1 };

  const revenues = series.map((s) => s.revenue / 100); // kobo → naira (then we'll scale)
  const targets  = series.map((s) => s.target  / 100);
  const maxVal   = Math.max(...revenues, ...targets, 1);
  // Round up to a nice number for the Y axis ceiling
  const maxY = Math.ceil(maxVal / 1_000_000) * 1_000_000; // nearest million

  const chartW = SVG_W - PAD_X * 2;
  const chartH = SVG_H - PAD_Y * 2;
  const n = series.length;

  const getX = (i) => PAD_X + (i * chartW) / Math.max(n - 1, 1);
  const getY = (val) => PAD_Y + chartH - (val * chartH) / maxY;

  const smooth = (pts) =>
    pts.reduce((acc, val, i, arr) => {
      const x = getX(i), y = getY(val);
      if (i === 0) return `M ${x},${y}`;
      const px = getX(i - 1), py = getY(arr[i - 1]);
      const cpx = px + (x - px) / 2;
      return `${acc} C ${cpx},${py} ${cpx},${y} ${x},${y}`;
    }, '');

  return {
    revPath: smooth(revenues),
    tgtPath: smooth(targets),
    getX, getY,
    maxY,
    revenues, targets,
  };
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ h = 20, w = '100%', r = 6, style = {} }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardOverview() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const overview        = useSelector(selectDashboardOverview);
  const activity        = useSelector(selectDashboardActivity);
  const overviewLoading = useSelector(selectOverviewLoading);
  const activityLoading = useSelector(selectActivityLoading);
  const overviewError = useSelector(selectOverviewError);
  const activityError = useSelector(selectActivityError);
  const canSeeActivity = usePermission('core.auditlog.view');
  const canSeeProjects = usePermission('technical.project.view');

  const loadAll = () => {
    dispatch(fetchDashboardOverview());
    if (canSeeActivity) dispatch(fetchRecentActivity({ page: 1, limit: 4 }));
  };

  useEffect(() => {
    dispatch(fetchDashboardOverview());
    if (canSeeActivity) dispatch(fetchRecentActivity({ page: 1, limit: 4 }));
  }, [dispatch, canSeeActivity]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const tiles    = overview?.tiles ?? [];
  const series   = overview?.activeContracts?.series ?? [];
  const projects = overview?.activeProjectsCostVsBudget ?? [];

  const { revPath, tgtPath, getX, getY, maxY, revenues = [], targets = [] } =
    buildChartPaths(series);

  const totalRevenue = overview?.activeContracts?.totalRevenue ?? 0;
  const totalTarget  = overview?.activeContracts?.totalTarget  ?? 0;
  const revShare     = overview?.activeContracts?.revenueShare ?? 0;
  const tgtShare     = overview?.activeContracts?.targetShare  ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-page-container">
      {/* shimmer keyframe */}
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Page Header */}
      <div className="dashboard-header-section">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">
          Monitor all of your business operations and integrations from here.
        </p>
      </div>

      {overviewError && (
        <div role="alert" style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#B91C1C', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>{overviewError.message}</span>
          <button onClick={loadAll} style={{ background: 'none', border: 'none', color: '#B91C1C', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* ── Top 4 KPI Tiles ────────────────────────────────────────────────── */}
      <div className="dashboard-kpi-grid">
        {overviewLoading && !overview
          ? [1, 2, 3, 4].map((k) => (
              <div key={k} className="kpi-card" style={{ gap: 12 }}>
                <Skeleton h={14} w="60%" />
                <Skeleton h={32} w="50%" />
                <Skeleton h={12} w="40%" />
              </div>
            ))
          : tiles.map((tile) => {
              const cfg = TILE_CONFIG[tile.key] ?? { icon: <FiCreditCard size={16} />, colorClass: 'icon-blue' };
              return (
                <div key={tile.key} className="kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-label">{cfg.label ?? tile.label.toUpperCase()}</span>
                    <div className={`kpi-icon-badge ${cfg.colorClass}`}>{cfg.icon}</div>
                  </div>
                  <div className="kpi-value">{formatTileValue(tile.key, tile.value)}</div>
                  {/* API has no delta/trend field — the backend docs confirm this by design */}
                  <div className="kpi-trend trend-neutral" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Live data
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Middle Grid ───────────────────────────────────────────────────── */}
      <div className="dashboard-middle-grid">

        {/* Active Contracts chart */}
        <div className="dashboard-card main-chart-card">
          <div className="chart-card-header">
            <h2 className="card-title">Active Contracts</h2>
            {overviewLoading && (
              <FiRefreshCw size={14} style={{ color: '#94a3b8', animation: 'spin 1s linear infinite' }} />
            )}
          </div>

          {overviewLoading && !overview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
              <Skeleton h={14} w="55%" />
              <Skeleton h={180} />
            </div>
          ) : (
            <>
              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-dot dot-blue" />
                  <span className="legend-label">Total Revenue</span>
                  <span className="legend-value">{koboToNaira(totalRevenue, { compact: true })}</span>
                  <span className="legend-bullet">•</span>
                  <span className="legend-pct">{revShare}%</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot dot-red" />
                  <span className="legend-label">Total Target</span>
                  <span className="legend-value">{koboToNaira(totalTarget, { compact: true })}</span>
                  <span className="legend-bullet">•</span>
                  <span className="legend-pct">{tgtShare}%</span>
                </div>
              </div>

              <div className="svg-chart-wrapper">
                {series.length > 0 ? (
                  <>
                    <svg
                      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                      className="dashboard-svg-chart"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Grid lines */}
                      {[maxY, maxY / 2, 0].map((val) => {
                        const y = getY(val);
                        return (
                          <g key={val}>
                            <line x1={PAD_X} y1={y} x2={SVG_W - PAD_X} y2={y}
                              stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                            <text x={SVG_W - 5} y={y + 4} fill="#94a3b8"
                              fontSize="10" fontWeight="500" textAnchor="end">
                              {koboToNaira(val * 100, { compact: true })}
                            </text>
                          </g>
                        );
                      })}

                      {/* Lines */}
                      <path d={revPath} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
                      <path d={tgtPath} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />

                      {/* Interactive dots */}
                      {series.map((s, i) => {
                        const cx = getX(i);
                        const cyRev = getY(revenues[i]);
                        const cyTgt = getY(targets[i]);
                        const hov = hoveredPoint === i;
                        return (
                          <g key={i}
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}>
                            <circle cx={cx} cy={cyRev} r={hov ? 5 : 3} fill="#1d4ed8" stroke="#fff" strokeWidth={hov ? 2 : 1} />
                            <circle cx={cx} cy={cyTgt} r={hov ? 5 : 3} fill="#ef4444" stroke="#fff" strokeWidth={hov ? 2 : 1} />
                            {hov && (
                              <>
                                <line x1={cx} y1={PAD_Y} x2={cx} y2={SVG_H - PAD_Y}
                                  stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="1" />
                                {/* Tooltip */}
                                <rect x={cx - 52} y={PAD_Y - 44} width={104} height={38} rx={6}
                                  fill="#1e293b" opacity={0.9} />
                                <text x={cx} y={PAD_Y - 28} fill="#fff" fontSize="10" textAnchor="middle">
                                  {s.label}
                                </text>
                                <text x={cx} y={PAD_Y - 14} fill="#93c5fd" fontSize="9" textAnchor="middle">
                                  Rev: {koboToNaira(s.revenue, { compact: true })}  Tgt: {koboToNaira(s.target, { compact: true })}
                                </text>
                              </>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* X-axis labels */}
                    <div className="chart-x-labels">
                      {series.map((s, i) => (
                        <span key={i} className="x-label-item">{s.label}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No contract data available yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activity-card">
          <div className="activity-card-header">
            <h2 className="card-title">Recent Activity</h2>
            {canSeeActivity && (
              <button
                className="view-all-link"
                onClick={() => navigate('/settings?tab=audit')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View All <FiArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="activity-list">
            {!canSeeActivity ? (
              <div style={{ padding: '32px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                The company activity feed is shown to roles with audit-log access. Your own alerts are in the bell above.
              </div>
            ) : activityError && !activity.length ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#B91C1C', fontSize: '0.85rem' }}>
                {activityError.message}
                <div>
                  <button onClick={() => dispatch(fetchRecentActivity({ page: 1, limit: 4 }))} style={{ marginTop: 8, background: 'none', border: 'none', color: '#B91C1C', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
                </div>
              </div>
            ) : activityLoading && !activity.length
              ? [1, 2, 3, 4].map((k) => (
                  <div key={k} className="activity-item">
                    <Skeleton h={32} w={32} r={8} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton h={12} w="85%" />
                      <Skeleton h={10} w="30%" />
                    </div>
                  </div>
                ))
              : activity.length > 0
              ? activity.map((act) => {
                  const style = activityStyle(act.action);
                  return (
                    <div key={act._id} className="activity-item">
                      <div className="activity-icon-badge"
                        style={{ backgroundColor: style.bg, color: style.color }}>
                        {style.icon}
                      </div>
                      <div className="activity-content">
                        {/* label is a pre-built human-readable string from the API */}
                        <p className="activity-text">{act.label}</p>
                        <span className="activity-time">{relativeTime(act.occurredAt)}</span>
                      </div>
                    </div>
                  );
                })
              : (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No recent activity yet.
                </div>
              )}
          </div>
        </div>
      </div>

      {/* ── Active Projects — Cost vs Budget ──────────────────────────────── */}
      <div className="dashboard-card cost-budget-card">
        <div className="cost-budget-header">
          <h2 className="card-title">Active Projects &mdash; Cost vs Budget</h2>
          {canSeeProjects && (
            <button
              className="view-all-link"
              onClick={() => navigate('/technical/projects')}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all projects <FiArrowRight size={14} />
            </button>
          )}
        </div>

        {overviewLoading && !overview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            {[1, 2, 3].map((k) => <Skeleton key={k} h={72} />)}
          </div>
        ) : projects.length > 0 ? (
          <div className="project-rows-list">
            {projects.map((prj, idx) => (
              <div key={prj.projectId ?? idx} className="project-row-card">
                <div className="project-info-col">
                  <div className="project-badges-row">
                    <span className="project-code-badge">{prj.projectId}</span>
                    {prj.redAlert && (
                      <span className="project-alert-badge">
                        <FiAlertCircle size={12} />
                        Red Alert
                      </span>
                    )}
                  </div>
                  <h3 className="project-title-name">
                    {prj.projectId} · {prj.project}
                  </h3>
                  <span className="project-client-name">
                    Client: <strong>{prj.client || '—'}</strong>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="project-progress-col">
                  <div className="project-progress-bar">
                    <div
                      className="progress-spent-fill"
                      style={{ width: `${Math.min(prj.percentSpent, 100)}%` }}
                    />
                    <div
                      className="progress-budget-fill"
                      style={{ width: `${Math.max(0, 100 - prj.percentSpent)}%` }}
                    />
                  </div>
                  <div className="progress-labels-row">
                    <span className="label-budget">
                      Budget: {koboToNaira(prj.approvedBudget, { compact: true })}
                    </span>
                    <span className="label-spent">
                      Spent: {koboToNaira(prj.actualSpend, { compact: true })}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="project-stats-col">
                  <div className="stat-spent-pct">
                    <strong>{prj.percentSpent}%</strong>{' '}
                    <span className="text-muted">spent</span>
                  </div>
                  <div className="stat-margin-left">
                    Margin Left: {koboToNaira(prj.marginLeft, { compact: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            No active project budgets found.
          </div>
        )}
      </div>
    </div>
  );
}
