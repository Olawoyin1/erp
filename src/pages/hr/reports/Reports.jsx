import React, { useState, useEffect } from 'react';
import { hrReportService } from '../../../services/admin.service';

// ─── SVG Line Chart (headcount trend) ─────────────────────────────────────────
function LineChart({ series }) {
  if (!series?.length) return null;

  const values = series.map(s => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 400, H = 140, PAD = 10;
  const pts = series.map((s, i) => {
    const x = PAD + (i / (series.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((s.value - min) / range) * (H - PAD * 2);
    return { x, y, ...s };
  });

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160, overflow: 'visible' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={PAD} y1={PAD + f * (H - PAD * 2)} x2={W - PAD} y2={PAD + f * (H - PAD * 2)}
            stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,3" />
        ))}
        {/* Area fill */}
        <path
          d={`${pathD} L ${pts[pts.length - 1].x},${H - PAD} L ${pts[0].x},${H - PAD} Z`}
          fill="#1D4ED8" fillOpacity="0.06" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#1D4ED8" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#94A3B8', fontSize: '0.75rem' }}>
        {series.map(s => <span key={s.label}>{s.label}</span>)}
      </div>
    </div>
  );
}

// ─── Skeleton tiles ───────────────────────────────────────────────────────────
function SkeletonTile() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 4, width: '50%', marginBottom: 16 }} />
      <div style={{ height: 28, backgroundColor: '#E2E8F0', borderRadius: 4, width: '40%', marginBottom: 8 }} />
      <div style={{ height: 10, backgroundColor: '#F1F5F9', borderRadius: 4, width: '70%' }} />
    </div>
  );
}

// ─── Key → display config ─────────────────────────────────────────────────────
const TILE_CONFIG = {
  total_employees:      { label: 'TOTAL EMPLOYEES',       suffix: '',  bg: '#EFF6FF', color: '#1D4ED8' },
  recruitment_success:  { label: 'RECRUITMENT SUCCESS',   suffix: '%', bg: '#EEF2FF', color: '#4F46E5' },
  annual_turnover:      { label: 'ANNUAL TURNOVER',       suffix: '%', bg: '#FDF4FF', color: '#9333EA' },
  active_departments:   { label: 'ACTIVE DEPARTMENTS',    suffix: '',  bg: '#F5F3FF', color: '#7C3AED' },
  training_compliance:  { label: 'TRAINING COMPLIANCE',   suffix: '%', bg: '#ECFDF5', color: '#059669' },
  attendance_rate:      { label: 'ATTENDANCE RATE',       suffix: '%', bg: '#FAF5FF', color: '#7C3AED' },
  expiring_certs:       { label: 'EXPIRING CERTS (60d)',  suffix: '',  bg: '#FFF7ED', color: '#EA580C', alert: true },
};

export default function Reports() {
  const [tiles, setTiles]   = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    hrReportService.get()
      .then(r => {
        setTiles(r.data.data?.tiles || []);
        setCharts(r.data.data?.charts || []);
      })
      .catch(() => setError('Failed to load HR reports'))
      .finally(() => setLoading(false));
  }, []);

  const headcountChart = charts.find(c => c.key === 'headcount_trend');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports — Human Resources</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track workforce trends, operational performance, and HR analytics
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonTile key={i} />)
          : tiles.map((tile) => {
            const cfg = TILE_CONFIG[tile.key] || { label: tile.label, suffix: tile.unit || '', bg: '#F1F5F9', color: '#64748B' };
            const displayValue = `${tile.value}${cfg.suffix || tile.unit || ''}`;
            return (
              <div key={tile.key} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{cfg.label}</span>
                  <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: cfg.bg }} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: cfg.alert ? '#EA580C' : '#0F172A', marginBottom: 4 }}>
                  {displayValue}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tile.label}</div>
              </div>
            );
          })
        }
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Headcount trend chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>
              {headcountChart?.title || 'Workforce Headcount Trend'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              Rolling monthly headcounts
            </p>
          </div>
          {loading ? (
            <div style={{ height: 180, backgroundColor: '#F8FAFC', borderRadius: 8 }} />
          ) : headcountChart ? (
            <LineChart series={headcountChart.series} />
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
              No headcount data available
            </div>
          )}
        </div>

        {/* Summary card */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Workforce Summary</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>Key HR metrics at a glance</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ height: 12, width: '50%', backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                    <div style={{ height: 12, width: '20%', backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                  </div>
                ))
              : tiles.filter(t => ['training_compliance', 'attendance_rate', 'recruitment_success', 'annual_turnover'].includes(t.key)).map(tile => {
                  const cfg = TILE_CONFIG[tile.key] || {};
                  const pct = tile.value;
                  const isNeg = tile.key === 'annual_turnover';
                  return (
                    <div key={tile.key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: '#334155' }}>
                        <span>{cfg.label || tile.label}</span>
                        <span style={{ fontWeight: 600, color: isNeg ? '#DC2626' : '#0F172A' }}>{pct}{tile.unit || '%'}</span>
                      </div>
                      <div style={{ height: 8, width: '100%', backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: isNeg ? '#EF4444' : '#1D4ED8', borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>
    </div>
  );
}
