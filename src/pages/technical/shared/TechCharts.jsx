import { compactMoney } from './techUtils';

const W = 520;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 46 };
const innerW = W - PAD.left - PAD.right;
const innerH = H - PAD.top - PAD.bottom;

export function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748B', marginBottom: 8 }}>
      {items.map((item) => (
        <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: item.square ? 2 : '50%', background: item.color, display: 'inline-block' }} />
          {item.label}{item.value != null ? ` — ${item.value}` : ''}
        </span>
      ))}
    </div>
  );
}

/** Lines of 0-100 percentages across the labelled months. `series`: [{ label, color, values }]. */
export function LineChart({ labels, series }) {
  const x = (i) => PAD.left + (labels.length <= 1 ? innerW / 2 : (i / (labels.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Progress by month">
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="#E2E8F0" strokeDasharray="4 4" />
          <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{tick}%</text>
        </g>
      ))}
      {labels.map((label, i) => <text key={`${label}-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">{label}</text>)}
      {series.map((s) => (
        <g key={s.label}>
          <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color}><title>{`${s.label} ${labels[i]}: ${v}%`}</title></circle>)}
        </g>
      ))}
    </svg>
  );
}

function niceMax(value) {
  if (value <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Paired bars (money in whole kobo) per month. `a` and `b`: { label, color, values }. */
export function PairedBarChart({ labels, a, b }) {
  const max = niceMax(Math.max(0, ...a.values, ...b.values));
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const groupW = innerW / Math.max(1, labels.length);
  const barW = Math.min(18, groupW / 3);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Budget against actual cost by month">
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(max * tick)} y2={y(max * tick)} stroke="#E2E8F0" strokeDasharray="4 4" />
          <text x={PAD.left - 8} y={y(max * tick) + 4} textAnchor="end" fontSize="10" fill="#94A3B8">{compactMoney(max * tick).replace('₦', '')}</text>
        </g>
      ))}
      {labels.map((label, i) => {
        const cx = PAD.left + groupW * i + groupW / 2;
        return (
          <g key={`${label}-${i}`}>
            <rect x={cx - barW - 1} y={y(a.values[i])} width={barW} height={Math.max(0, PAD.top + innerH - y(a.values[i]))} rx="2" fill={a.color}><title>{`${a.label} ${label}: ${compactMoney(a.values[i])}`}</title></rect>
            <rect x={cx + 1} y={y(b.values[i])} width={barW} height={Math.max(0, PAD.top + innerH - y(b.values[i]))} rx="2" fill={b.color}><title>{`${b.label} ${label}: ${compactMoney(b.values[i])}`}</title></rect>
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="#94A3B8">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}
