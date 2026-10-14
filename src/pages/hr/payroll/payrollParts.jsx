import { useState, useEffect, useRef } from 'react';
import { FiMoreVertical, FiSearch, FiAlertCircle } from 'react-icons/fi';
import { Input } from '../../../components/ui/FormField';
import { STATUS_PILL } from './payrollUtils';

export function RowMenu({ options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!options?.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: 230 }}>
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <div key={opt.label} className="menu-item-hover" onClick={() => { opt.onClick(); setOpen(false); }}
                style={{ padding: '8px 14px', fontSize: '0.813rem', color: opt.color || '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon size={13} /> {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="table-toolbar-search">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 36, width: '100%' }} />
      <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
    </div>
  );
}

export function TableSkeleton({ cols = 7, rows = 6 }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>{Array.from({ length: cols }).map((__, j) => (
            <td key={j} style={{ padding: '12px 16px' }}><div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: j === 1 ? '75%' : '55%' }} /></td>
          ))}</tr>
        ))}
      </tbody>
    </table>
  );
}

export function LoadError({ message, onRetry }) {
  return (
    <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
      <div style={{ marginBottom: 12 }}>{message}</div>
      <button className="btn btn-secondary" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function FormBanner({ message, tone = 'error' }) {
  if (!message) return null;
  const warn = tone === 'warn';
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: warn ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${warn ? '#FDE68A' : '#FECACA'}`, borderRadius: 8, color: warn ? '#92400E' : '#991B1B', fontSize: '0.8rem', lineHeight: 1.5 }}>
      <FiAlertCircle size={15} style={{ marginTop: 2, flexShrink: 0 }} /> <span>{message}</span>
    </div>
  );
}

export function Pill({ text, bg, color }) {
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, backgroundColor: bg, color, whiteSpace: 'nowrap' }}>{text}</span>;
}

export function StatusPill({ status }) {
  const s = STATUS_PILL[status] || { bg: '#F1F5F9', color: '#475569', label: status };
  return <Pill text={s.label} bg={s.bg} color={s.color} />;
}
