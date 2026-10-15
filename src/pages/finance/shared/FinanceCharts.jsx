import { compactMoney, money } from './financeUtils';

const PIE_COLORS = ['#1E40AF', '#FB3F55', '#FDBA4D', '#84B76F', '#1EC2C2', '#8B2FE0', '#94A3B8'];

const W = 640;
const H = 250;
const PAD = { left: 64, right: 16, top: 14, bottom: 30 };

function niceCeil(value) {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const frac = value / exp;
  const step = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return step * exp;
}

/**
 * Two-line chart with a soft area under the first line, gridlines, compact naira ticks and a tooltip on every point.
 * `points`: [{ label, a, b }] in kobo; `names`: { a, b }.
 */
export function LineChart({ points, names, colors = { a: '#1E40AF', b: '#FB3F55' } }) {
  const values = points.flatMap((p) => [p.a, p.b]);
  const top = niceCeil(Math.max(0, ...values));
  const bottom = Math.min(0, ...values) < 0 ? -niceCeil(-Math.min(...values)) : 0;
  const span = top - bottom || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - ((v - bottom) / span) * innerH;
  const line = (key) => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
  const ticks = [0, 1, 2, 3, 4].map((i) => bottom + (span / 4) * i);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cash flow line chart" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="finCashArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.a} stopOpacity="0.16" />
            <stop offset="100%" stopColor={colors.a} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#EEF2F7" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{compactMoney(t)}</text>
          </g>
        ))}
        {points.length > 1 && <path d={`${line('a')} L ${x(points.length - 1)},${y(Math.max(bottom, 0))} L ${x(0)},${y(Math.max(bottom, 0))} Z`} fill="url(#finCashArea)" />}
        <path d={line('a')} fill="none" stroke={colors.a} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={line('b')} fill="none" stroke={colors.b} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.a)} r="3.2" fill={colors.a} stroke="#fff" strokeWidth="1"><title>{`${p.label} · ${names.a}: ${money(p.a)}`}</title></circle>
            <circle cx={x(i)} cy={y(p.b)} r="3.2" fill={colors.b} stroke="#fff" strokeWidth="1"><title>{`${p.label} · ${names.b}: ${money(p.b)}`}</title></circle>
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">{p.short}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function arcPath(cx, cy, r, from, to) {
  const point = (angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

/** Pie with a legend. `slices`: [{ label, value, percent }]; the percent is printed in the legend and the tooltip. */
export function PieChart({ slices }) {
  const total = slices.reduce((s, p) => s + p.value, 0);
  let angle = -Math.PI / 2;
  const R = 92;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 200" role="img" aria-label="Top spending departments" style={{ width: 210, height: 210, flexShrink: 0 }}>
        {slices.length === 1 ? (
          <circle cx="100" cy="100" r={R} fill={PIE_COLORS[0]}><title>{`${slices[0].label}: ${money(slices[0].value)}`}</title></circle>
        ) : slices.map((s, i) => {
          const sweep = (s.value / total) * Math.PI * 2;
          const path = arcPath(100, 100, R, angle, angle + sweep);
          angle += sweep;
          return <path key={s.label} d={path} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth="1.5"><title>{`${s.label}: ${money(s.value)} (${s.percent}%)`}</title></path>;
        })}
        <circle cx="100" cy="100" r="14" fill="#fff" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 140 }}>
        {slices.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#334155' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <span style={{ color: '#64748B', fontWeight: 600 }}>{s.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
