
export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "var(--font, 'Geist', 'Inter', -apple-system, sans-serif)",
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {children}
      </div>

      {/* Footer */}
      <p style={{
        marginTop: 32,
        fontSize: '0.78rem',
        color: '#94A3B8',
        textAlign: 'center',
      }}>
        © 2026 PGSL. All rights reserved.
      </p>
    </div>
  );
}

// ─── Shared Auth Card ──────────────────────────────────────────────────────────
export function AuthCard({ children }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      padding: '32px 36px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    }}>
      {children}
    </div>
  );
}

// ─── Logo Block ────────────────────────────────────────────────────────────────
export function AuthLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
      <div style={{
        width: 36, height: 36,
        backgroundColor: '#1D4ED8',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {/* Grid icon */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          <rect x="10" y="2" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          <rect x="2" y="10" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
          <rect x="10" y="10" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>PGSL</div>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', lineHeight: 1.2 }}>Enterprise Resource Planning</div>
      </div>
    </div>
  );
}

// ─── Auth Input ─────────────────────────────────────────────────────────────
export function AuthInput({ label, required, type = 'text', placeholder, value, onChange, rightIcon, id, readOnly, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
          {label}
          {required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          style={{
            width: '100%',
            padding: rightIcon ? '10px 40px 10px 12px' : '10px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: 6,
            fontSize: '0.875rem',
            color: '#0F172A',
            backgroundColor: readOnly ? '#F8FAFC' : '#FFFFFF',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s ease',
            ...style,
          }}
          onFocus={(e) => { if (!readOnly) e.target.style.borderColor = '#1D4ED8'; }}
          onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; }}
        />
        {rightIcon && (
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Primary Button ──────────────────────────────────────────────────────
export function AuthButton({ children, onClick, type = 'button', disabled, variant = 'primary', style }) {
  const base = {
    width: '100%',
    padding: '11px 20px',
    borderRadius: 6,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.15s ease, background-color 0.15s ease',
    fontFamily: 'inherit',
    ...style,
  };

  if (variant === 'primary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{ ...base, backgroundColor: disabled ? '#94A3B8' : '#1D4ED8', color: '#FFFFFF' }}
        onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = '#1E40AF'; }}
        onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = '#1D4ED8'; }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0' }}
    >
      {children}
    </button>
  );
}
