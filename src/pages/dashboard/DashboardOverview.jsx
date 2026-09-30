import React, { useState } from 'react';
import {
  FiShoppingCart,
  FiCreditCard,
  FiShield,
  FiArrowUpRight,
  FiArrowDownRight,
  FiCheckCircle,
  FiUploadCloud,
  FiFileText,
  FiAlertCircle,
  FiArrowRight,
} from 'react-icons/fi';

export default function DashboardOverview() {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Data for the Active Contracts chart
  const months = ['Mar 2023', 'Jun 2023', 'Sep 2023', 'Dec 2023', 'Mar 2024', 'Jun 2024', 'Sep 2024', 'Dec 2024'];
  const revenuePoints = [15, 14, 5, 12, 11, 11, 13, 11]; // In Millions
  const targetPoints = [10, 11, 6, 8, 12, 11, 10, 11.5]; // In Millions

  // Shaded column indices (Mar 2023 = 0, Sep 2023 = 2, Mar 2024 = 4, Sep 2024 = 6)
  const shadedCols = [0, 2, 4, 6];

  // Projects data
  const projects = [
    {
      id: 1,
      code: 'PGSL-PRJ-008',
      title: 'PGSL-PRJ-008 · Offshore Pipeline Repair',
      client: 'TotalEnergies',
      budget: 485,
      spent: 312,
      spentPct: 64,
      marginLeft: 173,
      alert: null,
    },
    {
      id: 2,
      code: 'PGSL-PRJ-008',
      title: 'PGSL-PRJ-008 · Offshore Pipeline Repair',
      client: 'TotalEnergies',
      budget: 340,
      spent: 291,
      spentPct: 86,
      marginLeft: 49,
      alert: 'Red Alert',
    },
    {
      id: 3,
      code: 'PGSL-PRJ-008',
      title: 'PGSL-PRJ-008 · Offshore Pipeline Repair',
      client: 'TotalEnergies',
      budget: 485,
      spent: 312,
      spentPct: 64,
      marginLeft: 173,
      alert: null,
    },
    {
      id: 4,
      code: 'PGSL-PRJ-008',
      title: 'PGSL-PRJ-008 · Offshore Pipeline Repair',
      client: 'TotalEnergies',
      budget: 485,
      spent: 312,
      spentPct: 64,
      marginLeft: 173,
      alert: null,
    },
  ];

  // Activities data
  const activities = [
    {
      id: 1,
      type: 'approved',
      icon: <FiCheckCircle size={16} />,
      bg: '#dcfce7',
      color: '#16a34a',
      text: 'Journey request JR-2025-117 approved by GM',
      time: '10 mins ago',
    },
    {
      id: 2,
      type: 'uploaded',
      icon: <FiUploadCloud size={16} />,
      bg: '#dbeafe',
      color: '#2563eb',
      text: 'HR Policy v3 uploaded by HR Coordinator',
      time: '1 hour ago',
    },
    {
      id: 3,
      type: 'complete',
      icon: <FiFileText size={16} />,
      bg: '#dcfce7',
      color: '#16a34a',
      text: 'Task "Q2 Audit Prep" marked complete by Ngozi Obi',
      time: '10 mins ago',
    },
    {
      id: 4,
      type: 'overdue',
      icon: <FiAlertCircle size={16} />,
      bg: '#fee2e2',
      color: '#ef4444',
      text: 'Invoice #INV-2025-041 (₦4,250,000) is overdue',
      time: '3 hrs ago',
    },
  ];

  // SVG Chart path calculation helper
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 35;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;
  const maxY = 20;

  const getX = (i) => paddingX + (i * chartW) / (months.length - 1);
  const getY = (val) => paddingY + chartH - (val * chartH) / maxY;

  // Generate smooth cubic bezier curve string
  const createSmoothPath = (pts) => {
    return pts.reduce((acc, val, i, arr) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x},${y}`;

      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1]);
      const cp1X = prevX + (x - prevX) / 2;
      const cp1Y = prevY;
      const cp2X = prevX + (x - prevX) / 2;
      const cp2Y = y;
      return `${acc} C ${cp1X},${cp1Y} ${cp2X},${cp2Y} ${x},${y}`;
    }, '');
  };

  const revenuePath = createSmoothPath(revenuePoints);
  const targetPath = createSmoothPath(targetPoints);

  return (
    <div className="dashboard-page-container">
      {/* Page Header */}
      <div className="dashboard-header-section">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        <p className="dashboard-subtitle">
          Monitor all of your business operations and integrations from here.
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="dashboard-kpi-grid">
        {/* Card 1 */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">ACTIVE PROJECTS</span>
            <div className="kpi-icon-badge icon-orange">
              <FiShoppingCart size={16} />
            </div>
          </div>
          <div className="kpi-value">24</div>
          <div className="kpi-trend trend-positive">
            <FiArrowUpRight size={14} />
            <span>+8.2%</span>
            <span className="kpi-trend-period">vs last year</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">TOTAL REVENUE</span>
            <div className="kpi-icon-badge icon-blue">
              <FiCreditCard size={16} />
            </div>
          </div>
          <div className="kpi-value">&#8358;21.24B</div>
          <div className="kpi-trend trend-positive">
            <FiArrowUpRight size={14} />
            <span>+12.5%</span>
            <span className="kpi-trend-period">vs last year</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">HSE COMPLIANCE</span>
            <div className="kpi-icon-badge icon-green">
              <FiShield size={16} />
            </div>
          </div>
          <div className="kpi-value">92%</div>
          <div className="kpi-trend trend-negative">
            <FiArrowDownRight size={14} />
            <span>-2.1%</span>
            <span className="kpi-trend-period">vs last month</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">OPEN POS</span>
            <div className="kpi-icon-badge icon-purple">
              <FiShoppingCart size={16} />
            </div>
          </div>
          <div className="kpi-value">38</div>
          <div className="kpi-trend trend-positive">
            <FiArrowUpRight size={14} />
            <span>+15.3%</span>
            <span className="kpi-trend-period">vs last month</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Active Contracts & Recent Activity */}
      <div className="dashboard-middle-grid">
        {/* Active Contracts Card */}
        <div className="dashboard-card main-chart-card">
          <div className="chart-card-header">
            <h2 className="card-title">Active Contracts</h2>
          </div>

          <div className="chart-legend-row">
            <div className="legend-item">
              <span className="legend-dot dot-blue" />
              <span className="legend-label">Total Revenue</span>
              <span className="legend-value">$ 33,023.98</span>
              <span className="legend-bullet">•</span>
              <span className="legend-pct">55%</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-red" />
              <span className="legend-label">Total Target</span>
              <span className="legend-value">$ 32,032.86</span>
              <span className="legend-bullet">•</span>
              <span className="legend-pct">45%</span>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="svg-chart-wrapper">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="dashboard-svg-chart"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Shaded vertical column backgrounds */}
              {shadedCols.map((colIdx) => {
                const x = getX(colIdx) - 22;
                return (
                  <rect
                    key={colIdx}
                    x={x}
                    y={paddingY - 5}
                    width={44}
                    height={chartH + 10}
                    rx={6}
                    fill="#f1f5f9"
                    opacity={0.7}
                  />
                );
              })}

              {/* Dashed Horizontal Grid Lines */}
              {[20, 10, 0].map((val) => {
                const y = getY(val);
                return (
                  <line
                    key={val}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Y-Axis Labels (Right Aligned) */}
              {[20, 10, 0].map((val) => {
                const y = getY(val);
                return (
                  <text
                    key={val}
                    x={svgWidth - 5}
                    y={y + 4}
                    fill="#94a3b8"
                    fontSize="11"
                    fontWeight="500"
                    textAnchor="end"
                  >
                    &#8358;{val}M
                  </text>
                );
              })}

              {/* Trend Lines */}
              <path
                d={revenuePath}
                fill="none"
                stroke="#1d4ed8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d={targetPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Interactive Points */}
              {months.map((m, i) => {
                const cx = getX(i);
                const cyRev = getY(revenuePoints[i]);
                const cyTgt = getY(targetPoints[i]);
                const isHovered = hoveredPoint === i;

                return (
                  <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}>
                    <circle cx={cx} cy={cyRev} r={isHovered ? 5 : 3} fill="#1d4ed8" stroke="#ffffff" strokeWidth={isHovered ? 2 : 1} />
                    <circle cx={cx} cy={cyTgt} r={isHovered ? 5 : 3} fill="#ef4444" stroke="#ffffff" strokeWidth={isHovered ? 2 : 1} />
                    {isHovered && (
                      <line x1={cx} y1={paddingY} x2={cx} y2={svgHeight - paddingY} stroke="#cbd5e1" strokeDasharray="2 2" strokeWidth="1" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div className="chart-x-labels">
              {months.map((m, i) => (
                <span key={i} className="x-label-item">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="dashboard-card activity-card">
          <div className="activity-card-header">
            <h2 className="card-title">Recent Activity</h2>
            <button className="view-all-link">
              View All <FiArrowRight size={14} />
            </button>
          </div>

          <div className="activity-list">
            {activities.map((act) => (
              <div key={act.id} className="activity-item">
                <div className="activity-icon-badge" style={{ backgroundColor: act.bg, color: act.color }}>
                  {act.icon}
                </div>
                <div className="activity-content">
                  <p className="activity-text">{act.text}</p>
                  <span className="activity-time">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Projects — Cost vs Budget */}
      <div className="dashboard-card cost-budget-card">
        <div className="cost-budget-header">
          <h2 className="card-title">Active Projects &mdash; Cost vs Budget</h2>
          <button className="view-all-link">
            View all projects <FiArrowRight size={14} />
          </button>
        </div>

        <div className="project-rows-list">
          {projects.map((prj) => (
            <div key={prj.id} className="project-row-card">
              <div className="project-info-col">
                <div className="project-badges-row">
                  <span className="project-code-badge">{prj.code}</span>
                  {prj.alert && (
                    <span className="project-alert-badge">
                      <FiAlertCircle size={12} />
                      {prj.alert}
                    </span>
                  )}
                </div>
                <h3 className="project-title-name">{prj.title}</h3>
                <span className="project-client-name">
                  Client: <strong>{prj.client}</strong>
                </span>
              </div>

              {/* Progress Bar & Amounts */}
              <div className="project-progress-col">
                <div className="project-progress-bar">
                  <div
                    className="progress-spent-fill"
                    style={{ width: `${prj.spentPct}%` }}
                  />
                  <div
                    className="progress-budget-fill"
                    style={{ width: `${100 - prj.spentPct}%` }}
                  />
                </div>
                <div className="progress-labels-row">
                  <span className="label-budget">Budget: &#8358;{prj.budget}M</span>
                  <span className="label-spent">Spent: &#8358;{prj.spent}M</span>
                </div>
              </div>

              {/* Percentage & Margin Left */}
              <div className="project-stats-col">
                <div className="stat-spent-pct">
                  <strong>{prj.spentPct}%</strong> <span className="text-muted">spent</span>
                </div>
                <div className="stat-margin-left">
                  Margin Left: &#8358;{prj.marginLeft}M
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
