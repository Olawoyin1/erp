import { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiAlertCircle, FiRefreshCw, FiInbox } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import SelectUi from '../../../components/ui/Select';
import { FormField, Input, Textarea } from '../../../components/ui/FormField';
import { statusLabel } from './financeUtils';

const TONES = {
  green:  { bg: '#DCFCE7', fg: '#166534' },
  blue:   { bg: '#DBEAFE', fg: '#1E40AF' },
  amber:  { bg: '#FEF3C7', fg: '#92400E' },
  red:    { bg: '#FEE2E2', fg: '#991B1B' },
  purple: { bg: '#EDE9FE', fg: '#5B21B6' },
  slate:  { bg: '#F1F5F9', fg: '#475569' },
};

const STATUS_TONE = {
  active: 'green', approved: 'green', paid: 'green', posted: 'green', reconciled: 'green', mitigated: 'green',
  settled: 'green', filed: 'blue', reviewed: 'blue', issued: 'blue', partially_paid: 'blue', submitted: 'blue',
  open: 'blue', signed: 'purple', incorporated: 'purple', under_review: 'amber', pending_approval: 'amber',
  pending_filing: 'amber', pending: 'amber', in_progress: 'amber', unpaid: 'amber', expiring_soon: 'amber',
  posting: 'amber', reversing: 'amber', draft: 'slate', closed: 'slate', cancelled: 'slate', void: 'slate',
  inactive: 'slate', reversed: 'red', rejected: 'red', overdue: 'red', expired: 'red', high: 'red',
  medium: 'amber', low: 'blue',
};

export function StatusBadge({ status, label }) {
  const tone = TONES[STATUS_TONE[String(status).toLowerCase()] || 'slate'];
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600, background: tone.bg, color: tone.fg, whiteSpace: 'nowrap' }}>
      {label || statusLabel(status)}
    </span>
  );
}

export function Tag({ children, tone = 'slate' }) {
  const t = TONES[tone] || TONES.slate;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: t.bg, color: t.fg }}>{children}</span>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0 0' }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 14, style }) {
  return <div style={{ width, height, borderRadius: 6, background: 'linear-gradient(90deg,#F1F5F9,#E2E8F0,#F1F5F9)', ...style }} />;
}

/** Tiles from the design: small caps label, big number, caption, coloured icon square. */
export function StatTiles({ tiles, loading, error }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
      {tiles.map((tile) => {
        const tone = TONES[tile.tone] || TONES.slate;
        return (
          <div key={tile.label} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{tile.label}</span>
              {tile.icon && (
                <span style={{ width: 28, height: 28, borderRadius: 8, background: tone.bg, color: tone.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tile.icon}
                </span>
              )}
            </div>
            {loading ? (
              <Skeleton width={90} height={26} />
            ) : (
              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A' }}>{error ? '—' : tile.value}</span>
            )}
            {tile.sub && <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{error ? 'Unavailable' : tile.sub}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 2, flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          style={{
            padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: active === tab.id ? '2px solid #1D4ED8' : '2px solid transparent',
            color: active === tab.id ? '#1D4ED8' : '#64748B', fontFamily: 'var(--font)',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function ListToolbar({ search, onSearch, placeholder, onFilter, filterCount = 0, onExport, exporting, children }) {
  return (
    <div className="table-toolbar">
      <div className="table-toolbar-search">
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 36, width: '100%' }} />
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
      </div>
      <div className="table-toolbar-actions">
        {onFilter && (
          <button type="button" className="btn btn-secondary" onClick={onFilter} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            <FiFilter size={14} /> Filter{filterCount > 0 ? ` (${filterCount})` : ''}
          </button>
        )}
        {onExport && (
          <button type="button" className="btn btn-secondary" onClick={onExport} disabled={exporting} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            <FiDownload size={14} /> {exporting ? 'Exporting…' : 'Export'}
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function PrimaryButton({ children, icon, onClick, disabled, type = 'button', style }) {
  return (
    <button
      type={type}
      className="btn btn-primary"
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none', opacity: disabled ? 0.6 : 1, ...style }}
    >
      {icon}{children}
    </button>
  );
}

export function SecondaryButton({ children, icon, onClick, disabled, type = 'button', danger, style }) {
  return (
    <button
      type={type}
      className="btn btn-secondary"
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? 0.6 : 1, ...(danger ? { color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' } : {}), ...style }}
    >
      {icon}{children}
    </button>
  );
}

/** Loading skeleton, error with retry, or empty state; renders children once there is data. */
export function DataState({ loading, error, empty, emptyText = 'No records found.', onRetry, children }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }} aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={38} />)}
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 0', color: '#991B1B' }}>
        <FiAlertCircle size={22} />
        <span style={{ fontSize: '0.875rem' }}>{error}</span>
        {onRetry && <SecondaryButton onClick={onRetry} icon={<FiRefreshCw size={13} />}>Try again</SecondaryButton>}
      </div>
    );
  }
  if (empty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '32px 0', color: '#94A3B8' }}>
        <FiInbox size={24} />
        <span style={{ fontSize: '0.875rem' }}>{emptyText}</span>
      </div>
    );
  }
  return children;
}

/** Select that reports the chosen value (the ui Select reports an event-like object). */
export function Choice({ value, onChange, options, placeholder, searchable, disabled, error }) {
  return (
    <SelectUi
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      placeholder={placeholder}
      searchable={searchable}
      disabled={disabled}
      error={Boolean(error)}
    />
  );
}

/** Naira text input: digits, one decimal point, two decimals. The caller keeps the text and converts with `toKobo`. */
export function MoneyInput({ value, onChange, placeholder = '0.00', disabled, error }) {
  return (
    <Input
      value={value}
      inputMode="decimal"
      disabled={disabled}
      error={Boolean(error)}
      placeholder={placeholder}
      onChange={(e) => {
        const next = e.target.value.replace(/,/g, '');
        if (next === '' || /^\d*\.?\d{0,2}$/.test(next)) onChange(next);
      }}
    />
  );
}

export function Field({ label, required, error, help, children, style }) {
  return <FormField label={label} required={required} error={error} helpText={help} style={style}>{children}</FormField>;
}

export function TwoCol({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>{children}</div>;
}

export function FormBody({ children, onSubmit }) {
  return (
    <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {children}
    </form>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 12px', borderRadius: 6, fontSize: '0.82rem' }}>
      {message}
    </div>
  );
}

export function Note({ children, tone = 'blue' }) {
  const t = TONES[tone];
  return (
    <div style={{ background: t.bg, color: t.fg, padding: '10px 12px', borderRadius: 6, fontSize: '0.8rem', lineHeight: 1.5 }}>{children}</div>
  );
}

/** Label/value pairs in two columns, as in the View drawers of the designs. */
export function DetailGrid({ items }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label} style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: '0.86rem', color: '#0F172A', wordBreak: 'break-word' }}>{value === '' || value == null ? '—' : value}</div>
        </div>
      ))}
    </div>
  );
}

export function Panel({ title, children }) {
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
      {title && <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{title}</div>}
      <div style={{ fontSize: '0.84rem', color: '#1E293B', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

/** Status line plus the action buttons of a View drawer. */
export function DrawerStatusBar({ status, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#F8FAFC', margin: '-24px -24px 16px', padding: '12px 24px', borderBottom: '1px solid #E2E8F0' }}>
      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Status:</span>
      {status}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

export function SimpleTable({ columns, rows, empty = 'Nothing to show.' }) {
  if (!rows.length) return <div style={{ padding: '18px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>{empty}</div>;
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', color: '#64748B', textAlign: 'left' }}>
            {columns.map((c) => <th key={c.key} style={{ padding: '10px 12px', fontWeight: 600, textAlign: c.align || 'left', whiteSpace: 'nowrap' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || row.key || i} style={{ borderTop: '1px solid #F1F5F9' }}>
              {columns.map((c) => <td key={c.key} style={{ padding: '10px 12px', textAlign: c.align || 'left' }}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Asks for a reason before a destructive or irreversible step (reject, delete, close, cancel, void, reverse). */
export function ReasonModal({
  title, message, detail, label = 'Reason', placeholder = 'Enter commentary…', confirmLabel = 'Confirm',
  danger = false, required = true, onConfirm, onClose, busy, error,
}) {
  const [reason, setReason] = useState('');
  const canSubmit = !busy && (!required || reason.trim().length > 0);
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      maxWidth="460px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <button
            type="button"
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            disabled={!canSubmit}
            onClick={() => onConfirm(reason.trim())}
            style={{ opacity: canSubmit ? 1 : 0.55, ...(danger ? {} : { backgroundColor: '#1D4ED8' }) }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {message && <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>{message}</div>}
        {detail && <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A' }}>{detail}</div>}
        <FormField label={label} required={required}>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} />
        </FormField>
        <FormError message={error} />
      </div>
    </Modal>
  );
}

export function ConfirmModal({ title, message, detail, confirmLabel = 'Confirm', danger = false, onConfirm, onClose, busy, error }) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      maxWidth="440px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} disabled={busy} onClick={onConfirm} style={danger ? {} : { backgroundColor: '#1D4ED8' }}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {message && <div style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>{message}</div>}
        {detail && <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A' }}>{detail}</div>}
        <FormError message={error} />
      </div>
    </Modal>
  );
}

/**
 * Right-hand filter panel. `fields`: [{ key, label, options: [{ value, label }] }] rendered as radio groups
 * ('' is the "all" option). Applying hands the chosen values back; Reset clears them.
 */
export function FilterDrawer({ isOpen, onClose, title, subtitle, fields, values, onApply }) {
  const [draft, setDraft] = useState(values);
  const [seen, setSeen] = useState(isOpen);
  if (isOpen !== seen) {
    setSeen(isOpen);
    if (isOpen) setDraft(values);
  }
  const empty = Object.fromEntries(fields.map((f) => [f.key, '']));
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width="420px"
      footer={(
        <>
          <SecondaryButton style={{ flex: 1 }} onClick={() => { onApply(empty); onClose(); }}>Reset</SecondaryButton>
          <PrimaryButton style={{ flex: 1, justifyContent: 'center' }} onClick={() => { onApply(draft); onClose(); }}>Apply Filters</PrimaryButton>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {fields.map((field) => (
          <FormField key={field.key} label={field.label}>
            {field.type === 'date' ? (
              <Input type="date" value={draft[field.key] || ''} onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: 6, backgroundColor: '#F8FAFC' }}>
                {[{ value: '', label: field.allLabel || 'All' }, ...field.options].map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                    <input type="radio" name={field.key} checked={(draft[field.key] || '') === opt.value} onChange={() => setDraft({ ...draft, [field.key]: opt.value })} style={{ accentColor: '#1D4ED8' }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </FormField>
        ))}
      </div>
    </Drawer>
  );
}
