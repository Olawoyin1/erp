import { useState } from 'react';

const TONES = { danger: '#DC2626', primary: '#1D4ED8', success: '#16A34A' };

/**
 * Compact confirmation dialog. With `requireReason` the confirm button stays disabled until a reason is typed,
 * and `error` (the server's refusal message) is shown inside the dialog so the user can correct and retry.
 */
export default function ConfirmDialog({ open, ...props }) {
  return open ? <ConfirmDialogBody {...props} /> : null;
}

function ConfirmDialogBody({
  title,
  description,
  subject,
  subjectDetail,
  confirmLabel = 'Confirm',
  icon,
  tone = 'primary',
  requireReason = false,
  reasonLabel = 'Reason',
  busy = false,
  error = '',
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const color = TONES[tone] || TONES.primary;
  const blocked = busy || (requireReason && !reason.trim());

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'var(--font)' }}>
      <div onClick={busy ? undefined : onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} />
      <div role="dialog" aria-modal="true" style={{ position: 'relative', zIndex: 2001, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>{description}</div>
        </div>
        {subject && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>{subject}</div>
            {subjectDetail && <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{subjectDetail}</div>}
          </div>
        )}
        {requireReason && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', marginBottom: 6 }}>
              {reasonLabel} <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add reason..."
              rows={3}
              maxLength={2000}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '0.875rem', fontFamily: 'var(--font)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#0F172A' }}
            />
          </div>
        )}
        {error && (
          <div role="alert" style={{ marginBottom: 16, padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#B91C1C', fontSize: '0.82rem', lineHeight: 1.5 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={busy} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={blocked}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: color, color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.6 : 1 }}
          >
            {icon} {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
