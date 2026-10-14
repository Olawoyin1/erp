
const TONES = {
  error: { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
  success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' },
};

/** Inline message box used on the sign-in and password screens. */
export function AuthAlert({ tone = 'error', children }) {
  if (!children) return null;
  const t = TONES[tone];
  return (
    <div role="alert" style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 8 }}>
      <p style={{ margin: 0, fontSize: '0.82rem', color: t.color, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

/** Show / hide icon for a password field. */
export function EyeToggle({ shown, onToggle }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" onClick={onToggle} style={{ cursor: 'pointer' }}
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      {shown ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#DC2626' }}>{children}</p>;
}
