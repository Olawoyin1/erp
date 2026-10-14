// Small building blocks shared by every Settings tab (kept in the design's existing look).

export function ToggleSwitch({ checked, onChange, id, disabled }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', flexShrink: 0,
        backgroundColor: checked ? '#1D4ED8' : '#CBD5E1',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
        transition: 'background-color 0.2s ease',
      }}
    >
      <div
        style={{
          width: 18, height: 18, borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: 3,
          left: checked ? 23 : 3, transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}

export function NotifRow({ label, desc, checked, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{label}</span>
          <span
            style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.3px',
              backgroundColor: checked ? '#DCFCE7' : '#F1F5F9', color: checked ? '#16A34A' : '#94A3B8',
            }}
          >
            {checked ? 'On' : 'Off'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{desc}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function StatusTag({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600,
        backgroundColor: active ? '#DCFCE7' : '#FEE2E2', color: active ? '#16A34A' : '#DC2626',
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function SectionCard({ title, subtitle, action, children }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '20px 24px', marginBottom: 20, backgroundColor: '#FFFFFF' }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            {title && <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function PanelHeader({ title, subtitle }) {
  return (
    <>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>{title}</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>{subtitle}</p>
    </>
  );
}

export function FooterButtons({ onDiscard, saving, dirty = true, saveLabel = 'Save Changes', disabled }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
      <button
        type="button"
        onClick={onDiscard}
        disabled={saving || !dirty}
        style={{ padding: '9px 20px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#475569', fontSize: '0.875rem', fontWeight: 500, cursor: saving || !dirty ? 'not-allowed' : 'pointer', opacity: dirty ? 1 : 0.5 }}
      >
        Discard Changes
      </button>
      <button
        type="submit"
        disabled={saving || !dirty || disabled}
        style={{ padding: '9px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving || !dirty || disabled ? 'not-allowed' : 'pointer', opacity: saving || !dirty || disabled ? 0.6 : 1 }}
      >
        {saving ? 'Saving...' : saveLabel}
      </button>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ margin: '0 0 16px', padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#B91C1C', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span>{message}</span>
      {onRetry && <button type="button" onClick={onRetry} style={{ background: 'none', border: 'none', color: '#B91C1C', fontWeight: 600, cursor: 'pointer' }}>Retry</button>}
    </div>
  );
}

export function NoticeBanner({ tone = 'info', children }) {
  const tones = {
    info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF' },
    warn: { bg: '#FFF7ED', border: '#FED7AA', color: '#9A3412' },
  };
  const t = tones[tone];
  return (
    <div style={{ margin: '0 0 16px', padding: '10px 14px', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.color, fontSize: '0.82rem', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export function PanelSkeleton({ rows = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ height: 44, borderRadius: 8, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
      <style>{'@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
    </div>
  );
}

export function EmptyState({ children }) {
  return <div style={{ padding: '28px 12px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>{children}</div>;
}

export function PrimaryButton({ children, onClick, disabled, type = 'button', icon }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.813rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
      {icon} {children}
    </button>
  );
}

export function LinkButton({ children, onClick, tone = 'primary', disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ fontSize: '0.8rem', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', background: 'none', padding: 0, color: tone === 'danger' ? '#DC2626' : '#1D4ED8', opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}
