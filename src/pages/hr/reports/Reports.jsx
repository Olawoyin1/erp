import { useState, useEffect } from 'react';
import {
  FiUsers, FiTarget, FiTrendingUp, FiGrid, FiBookOpen, FiClock, FiAward, FiArrowUpRight, FiArrowDownRight,
} from 'react-icons/fi';
import { reportService } from '../../../services/hr.service';
import { apiError } from '../../../services/apiHelpers';

// ─── SVG Line Chart (headcount trend) ─────────────────────────────────────────
function LineChart({ series }) {
  if (!series?.length) return null;

  const values = series.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 400, H = 140, PAD = 14;
  const stepX = series.length > 1 ? (W - PAD * 2) / (series.length - 1) : 0;
  const pts = series.map((s, i) => ({
    x: series.length > 1 ? PAD + i * stepX : W / 2,
    y: H - PAD - ((s.value - min) / range) * (H - PAD * 2),
    ...s,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 170, overflow: 'visible' }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={PAD} y1={PAD + f * (H - PAD * 2)} x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
            stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,3" />
        ))}
        {pts.length > 1 && (
          <path d={`${pathD} L ${pts[pts.length - 1].x},${H - PAD} L ${pts[0].x},${H - PAD} Z`} fill="#1D4ED8" fillOpacity="0.06" />
        )}
        <path d={pathD} fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#1D4ED8"><title>{`${p.label}: ${p.value}`}</title></circle>
            <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="9" fill="#475569">{p.value}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#94A3B8', fontSize: '0.75rem' }}>
        {series.map((s) => <span key={s.label}>{s.label}</span>)}
      </div>
    </div>
  );
}

function BarList({ series }) {
  const colours = ['#1E3A8A', '#7C3AED', '#2563EB', '#F59E0B', '#059669', '#DC2626'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {series.map((row, i) => (
        <div key={row.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: '#334155', gap: 12 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</span>
            <span style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap' }}>
              {row.value}%{row.count != null ? <span style={{ color: '#94A3B8', fontWeight: 400 }}> ({row.count} {row.count === 1 ? 'holder' : 'holders'})</span> : null}
            </span>
          </div>
          <div style={{ height: 8, width: '100%', backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(0, Math.min(row.value, 100))}%`, backgroundColor: colours[i % colours.length], borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTile() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 4, width: '50%', marginBottom: 16 }} />
      <div style={{ height: 28, backgroundColor: '#E2E8F0', borderRadius: 4, width: '40%', marginBottom: 8 }} />
      <div style={{ height: 10, backgroundColor: '#F1F5F9', borderRadius: 4, width: '70%' }} />
    </div>
  );
}

const TILE_CONFIG = {
  total_employees:      { label: 'TOTAL EMPLOYEES',     icon: FiUsers,      bg: '#EFF6FF', color: '#1D4ED8' },
  recruitment_success:  { label: 'RECRUITMENT SUCCESS', icon: FiTarget,     bg: '#EEF2FF', color: '#4F46E5' },
  annual_turnover:      { label: 'ANNUAL TURNOVER',     icon: FiTrendingUp, bg: '#ECFDF5', color: '#059669', lowerIsBetter: true },
  active_departments:   { label: 'ACTIVE DEPARTMENTS',  icon: FiGrid,       bg: '#F5F3FF', color: '#7C3AED' },
  training_compliance:  { label: 'TRAINING COMPLIANCE', icon: FiBookOpen,   bg: '#ECFDF5', color: '#059669' },
  attendance_rate:      { label: 'ATTENDANCE RATE',     icon: FiClock,      bg: '#FAF5FF', color: '#7C3AED' },
  expiring_certs:       { label: 'EXPIRING CERTS',      icon: FiAward,      bg: '#FFF7ED', color: '#EA580C', alert: true },
};

function ChangeLine({ change, lowerIsBetter }) {
  if (!change) return null;
  const up = change.value > 0;
  const flat = change.value === 0;
  const good = flat ? null : lowerIsBetter ? !up : up;
  const colour = flat ? '#64748B' : good ? '#059669' : '#DC2626';
  const Icon = up ? FiArrowUpRight : FiArrowDownRight;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: colour }}>
      {!flat && <Icon size={12} />}
      <span style={{ fontWeight: 600 }}>{up ? '+' : ''}{change.value}{change.unit === 'pp' ? ' pts' : '%'}</span>
      <span style={{ color: '#94A3B8' }}>{change.label}</span>
    </div>
  );
}

export default function Reports() {
  const [state, setState] = useState({ loading: true, error: '', tiles: [], charts: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    reportService.get()
      .then((r) => {
        if (!cancelled) setState({ loading: false, error: '', tiles: r.data?.data?.tiles || [], charts: r.data?.data?.charts || [] });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: apiError(err, 'Failed to load HR reports'), tiles: [], charts: [] });
      });
    return () => { cancelled = true; };
  }, [attempt]);

  const retry = () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    setAttempt((n) => n + 1);
  };

  const { loading, error, tiles, charts } = state;
  const headcountChart = charts.find((c) => c.key === 'headcount_trend');
  const certChart = charts.find((c) => c.key === 'certification_validity');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports - Human Resources</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Track workforce trends, operational performance, and HR analytics
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>{error}</span>
          <button className="btn btn-secondary" onClick={retry}>Try again</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonTile key={i} />)
          : tiles.map((tile) => {
            const cfg = TILE_CONFIG[tile.key] || { label: String(tile.label || '').toUpperCase(), icon: FiGrid, bg: '#F1F5F9', color: '#64748B' };
            const Icon = cfg.icon;
            return (
              <div key={tile.key} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{cfg.label}</span>
                  <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} />
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: cfg.alert && tile.value > 0 ? '#EA580C' : '#0F172A', marginBottom: 6 }}>
                  {tile.value}{tile.unit || ''}
                </div>
                <ChangeLine change={tile.change} lowerIsBetter={cfg.lowerIsBetter} />
                {tile.hint && <div style={{ fontSize: '0.75rem', color: cfg.alert && tile.value > 0 ? '#DC2626' : '#94A3B8' }}>{tile.hint}</div>}
              </div>
            );
          })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>
              {headcountChart?.title || 'Workforce headcount'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              {headcountChart?.subtitle || 'Rolling monthly headcounts'}
            </p>
          </div>
          {loading ? (
            <div style={{ height: 180, backgroundColor: '#F8FAFC', borderRadius: 8 }} />
          ) : headcountChart?.series?.length ? (
            <LineChart series={headcountChart.series} />
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
              No headcount data available
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{certChart?.title || 'Certification validity'}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              {certChart?.subtitle || 'Share of holders of each certificate whose copy is still valid'}
            </p>
          </div>
          {loading ? (
            <div style={{ height: 180, backgroundColor: '#F8FAFC', borderRadius: 8 }} />
          ) : certChart?.series?.length ? (
            <BarList series={certChart.series} />
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem', textAlign: 'center' }}>
              No certificates have been recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
