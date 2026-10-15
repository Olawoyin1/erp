import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { SecondaryButton } from '../../procurement/shared/ProcUi';
import { downloadFile } from '../../procurement/shared/procUtils';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#0EA5E9', '#64748B'];

export function Card({ title, subtitle, badge, children }) {
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

export function MiniStat({ label, value, caption }) {
  return (
    <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>{caption}</div>}
    </div>
  );
}

export function MiniStatRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>{children}</div>;
}

export function SectionLabel({ children }) {
  return <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', margin: '14px 0 10px' }}>{children}</div>;
}

/** Horizontal bars: `rows` = [{ label, value }]. */
export function HBars({ rows, empty = 'No data yet.' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <div style={{ color: '#94A3B8', fontSize: '0.84rem', padding: '12px 0' }}>{empty}</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((row, i) => (
        <div key={row.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', marginBottom: 6, gap: 8 }}>
            <span style={{ color: '#334155', fontWeight: 500 }}>{row.label}</span>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>{row.value}</span>
          </div>
          <div style={{ width: '100%', height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(row.value / max) * 100}%`, height: '100%', backgroundColor: COLORS[i % COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Coloured-dot status list: `rows` = [{ status, label, count }]. */
export function StatusList({ rows }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((s, i) => (
        <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.813rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#334155' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length] }} />{s.label}
          </span>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{s.count}</span>
        </div>
      ))}
    </div>
  );
}

const monthLabel = (key) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
};

/** Two bars per month. `months`: [{ month: 'YYYY-MM', [first.key], [second.key] }]; `first`/`second`: { key, label, color }. */
export function MonthlyBars({ months, first, second }) {
  const max = Math.max(1, ...months.map((m) => Math.max(m[first.key], m[second.key])));
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16, fontSize: '0.8rem' }}>
        {[first, second].map((s) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, backgroundColor: s.color, borderRadius: 2 }} />{s.label}</span>
        ))}
      </div>
      <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
        {months.map((m) => (
          <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, width: '100%', justifyContent: 'center' }}>
              {[first, second].map((s) => (
                <div key={s.key} title={`${s.label}: ${m[s.key]}`} style={{ width: '40%', backgroundColor: s.color, height: `${(m[s.key] / max) * 100}%`, borderRadius: '4px 4px 0 0', minHeight: m[s.key] ? 2 : 0 }} />
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginTop: 8 }}>{monthLabel(m.month)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ReportRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>{children}</div>;
}

/** The Export button of a reports page: a small CSV / XLSX menu. `request(format)` is the blob request; `onDone(message, type)` reports back. */
export function ExportMenu({ request, fileBase, disabled, onDone }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportAs = async (format) => {
    setOpen(false);
    setBusy(true);
    const message = await downloadFile(() => request(format), `${fileBase}.${format}`);
    setBusy(false);
    if (message) onDone(message, 'error');
    else onDone(`Report exported as ${format.toUpperCase()}`, 'success');
  };

  return (
    <div style={{ position: 'relative' }}>
      <SecondaryButton icon={<FiDownload size={15} />} onClick={() => setOpen((o) => !o)} disabled={busy || disabled}>{busy ? 'Exporting…' : 'Export'}</SecondaryButton>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 60, minWidth: 160 }}>
          {['csv', 'xlsx'].map((format) => (
            <div key={format} className="menu-item-hover" onClick={() => exportAs(format)} style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', cursor: 'pointer' }}>
              Export as {format.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
