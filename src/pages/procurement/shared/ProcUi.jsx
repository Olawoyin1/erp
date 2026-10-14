import { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiAlertCircle, FiRefreshCw, FiInbox } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import SelectUi from '../../../components/ui/Select';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import { FormField, Input, Textarea } from '../../../components/ui/FormField';
import { statusLabel } from './procUtils';

const TONES = {
  green:  { bg: '#DCFCE7', fg: '#166534' },
  blue:   { bg: '#DBEAFE', fg: '#1E40AF' },
  sky:    { bg: '#E0F2FE', fg: '#0369A1' },
  amber:  { bg: '#FEF3C7', fg: '#92400E' },
  red:    { bg: '#FEE2E2', fg: '#991B1B' },
  purple: { bg: '#EDE9FE', fg: '#5B21B6' },
  slate:  { bg: '#F1F5F9', fg: '#475569' },
};

const STATUS_TONE = {
  draft: 'slate', pending_approval: 'amber', approved: 'green', converted_to_rfq: 'sky', rejected: 'red',
  issued: 'sky', under_evaluation: 'amber', awarded: 'purple', cancelled: 'red', acknowledged: 'green',
  in_production: 'amber', ready_for_shipment: 'purple', customs_clearance: 'amber', in_transit: 'sky', delivered: 'green', delayed: 'red',
  passed: 'green', pending: 'amber', failed: 'red', completed: 'green', completing: 'amber',
  in_stock: 'green', low_stock: 'amber', out_of_stock: 'red', active: 'green', suspended: 'amber', inactive: 'slate',
  Hot: 'red', High: 'red', Medium: 'amber', Low: 'sky',
};

export function StatusBadge({ status, label }) {
  const tone = TONES[STATUS_TONE[status] || 'slate'];
  return (
    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: tone.bg, color: tone.fg, whiteSpace: 'nowrap' }}>
      {label || statusLabel(status)}
    </span>
  );
}

export function Tag({ children, tone = 'slate' }) {
  const t = TONES[tone] || TONES.slate;
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: t.bg, color: t.fg }}>{children}</span>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0' }}>{subtitle}</p>}
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
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{tile.label}</span>
              {tile.icon && (
                <span style={{ width: 32, height: 32, borderRadius: 8, background: tone.bg, color: tone.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tile.icon}
                </span>
              )}
            </div>
            {loading ? <Skeleton width={90} height={26} /> : <span style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0F172A' }}>{error ? '—' : tile.value}</span>}
            {tile.sub && <span style={{ fontSize: '0.75rem', color: tile.subColor || '#64748B' }}>{error ? 'Unavailable' : tile.sub}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          style={{
            padding: '10px 22px', fontSize: '0.875rem', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: active === tab.id ? '2.5px solid #1E3A8A' : '2.5px solid transparent',
            color: active === tab.id ? '#1E3A8A' : '#64748B', fontFamily: 'var(--font)',
          }}
        >
          {tab.label}
        </button>
      ))}
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
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#1E3A8A', color: '#FFFFFF', borderRadius: 8, fontWeight: 600, border: 'none', padding: '9px 18px', opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
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
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '9px 16px', opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...(danger ? { color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' } : {}), ...style }}
    >
      {icon}{children}
    </button>
  );
}

export function ListToolbar({ search, onSearch, placeholder, onFilter, filterCount = 0, onExport, exporting, selectedCount = 0, children }) {
  return (
    <div className="table-toolbar" style={{ padding: '16px 24px' }}>
      <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
        <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} style={{ paddingLeft: 36 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {onFilter && (
          <SecondaryButton onClick={onFilter} icon={<FiFilter size={15} />}>
            Filter{filterCount > 0 ? ` (${filterCount})` : ''}
          </SecondaryButton>
        )}
        {onExport && (
          <SecondaryButton onClick={onExport} disabled={exporting} icon={<FiDownload size={15} />}>
            {exporting ? 'Exporting…' : selectedCount > 0 ? `Export (${selectedCount})` : 'Export'}
          </SecondaryButton>
        )}
        {children}
      </div>
    </div>
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

/** The table card used on every list page: toolbar slot, skeleton / error / empty states, the table and the pager. */
export function ListCard({ toolbar, list, columns, emptyText, keyField = '_id', onRowClick, selection }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'visible', backgroundColor: '#FFFFFF', borderRadius: 12 }}>
      {toolbar}
      <div style={{ padding: '0 24px 16px' }}>
        <DataState loading={list.loading} error={list.error} empty={!list.items.length} emptyText={emptyText} onRetry={list.reload}>
          <DataTable
            columns={columns}
            data={list.items}
            keyField={keyField}
            onRowClick={onRowClick}
            emptyMessage={emptyText}
            selectable={Boolean(selection)}
            selectedIds={selection ? selection.ids : []}
            onSelectRow={selection ? selection.toggle : undefined}
            onSelectAll={selection ? () => selection.toggleAll(list.items.map((r) => r[keyField])) : undefined}
          />
        </DataState>
        {!list.loading && !list.error && list.meta && list.meta.totalPages > 1 && (
          <Pagination currentPage={list.page} totalPages={list.meta.totalPages} onPageChange={list.setPage} />
        )}
      </div>
    </div>
  );
}

/** Select that reports the chosen value (the ui Select reports an event-like object). */
export function Choice({ value, onChange, options, placeholder, searchable, disabled, error }) {
  return (
    <SelectUi value={value ?? ''} onChange={(e) => onChange(e.target.value)} options={options} placeholder={placeholder} searchable={searchable} disabled={disabled} error={Boolean(error)} />
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

export function TwoCol({ children, min = 220 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 14 }}>{children}</div>;
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
  const t = TONES[tone] || TONES.blue;
  return <div style={{ background: t.bg, color: t.fg, padding: '10px 12px', borderRadius: 6, fontSize: '0.8rem', lineHeight: 1.5 }}>{children}</div>;
}

/** Label/value pairs in two columns, as in the View modals of the designs. */
export function DetailGrid({ items }) {
  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px 24px' }}>
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label} style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: 4, wordBreak: 'break-word' }}>{value === '' || value == null ? '—' : value}</div>
        </div>
      ))}
    </div>
  );
}

export function Panel({ title, children, tone }) {
  const t = tone ? TONES[tone] : null;
  return (
    <div style={{ background: t ? t.bg : '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
      {title && <div style={{ fontSize: '0.72rem', color: t ? t.fg : '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{title}</div>}
      <div style={{ fontSize: '0.84rem', color: t ? t.fg : '#334155', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

/** Title block of a View modal: icon square, name, reference line and the action buttons. */
export function ViewHeader({ icon, title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon && <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>{icon}</div>}
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h3>
          {subtitle && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>}
    </div>
  );
}

export function StatusLine({ status, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#64748B', flexWrap: 'wrap' }}>
      <span>Status:</span>
      {status}
      {children}
    </div>
  );
}

export function SimpleTable({ columns, rows, empty = 'Nothing to show.', footer }) {
  if (!rows.length) return <div style={{ padding: '18px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>{empty}</div>;
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left' }}>
            {columns.map((c) => <th key={c.key} style={{ padding: '12px 16px', fontWeight: 600, textAlign: c.align || 'left', whiteSpace: 'nowrap' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._id || row.key || i} style={{ borderTop: '1px solid #F1F5F9' }}>
              {columns.map((c) => <td key={c.key} style={{ padding: '12px 16px', textAlign: c.align || 'left' }}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
        {footer}
      </table>
    </div>
  );
}

/** Asks for a reason before a destructive or irreversible step (reject, cancel, suspend). */
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
            style={{ opacity: canSubmit ? 1 : 0.55, ...(danger ? {} : { backgroundColor: '#1E3A8A' }) }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {message && <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>{message}</div>}
        {detail}
        <FormField label={label} required={required}>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} />
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
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} disabled={busy} onClick={onConfirm} style={danger ? {} : { backgroundColor: '#1E3A8A' }}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {message && <div style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>{message}</div>}
        {detail}
        <FormError message={error} />
      </div>
    </Modal>
  );
}

/** Two-line summary box inside a confirm dialog ("RFQ ID: ..., RFQ Title: ..."). */
export function RecordSummary({ rows }) {
  return (
    <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.map(([label, value]) => <div key={label}><strong>{label}:</strong> {value}</div>)}
    </div>
  );
}

/**
 * Right-hand filter panel. `fields`: [{ key, label, options: [{ value, label }] }] rendered as radio groups
 * ('' is the "all" option); `type: 'date'` renders a date input. Applying hands the chosen values back.
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
          <SecondaryButton style={{ flex: 1, justifyContent: 'center' }} onClick={() => { onApply(empty); onClose(); }}>Reset</SecondaryButton>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: 6, backgroundColor: '#F8FAFC', maxHeight: 220, overflowY: 'auto' }}>
                {[{ value: '', label: field.allLabel || 'All' }, ...field.options].map((opt) => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                    <input type="radio" name={field.key} checked={(draft[field.key] || '') === opt.value} onChange={() => setDraft({ ...draft, [field.key]: opt.value })} style={{ accentColor: '#1E3A8A' }} />
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
