import { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiCheckCircle, FiX, FiPauseCircle, FiPlayCircle, FiEdit2, FiUserPlus, FiSend } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { FormField, Textarea } from '../../../components/ui/FormField';
import { titleCase } from '../../../services/apiHelpers';
import { btnPrimary, btnCancel } from './recruitmentConstants';

export function StatusPill({ status, styles }) {
  const s = styles[status] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: titleCase(status) };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #F1F5F9' }}>{label}</div>
      {children}
    </div>
  );
}

export function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.84rem', color: '#1E293B', fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</div>
    </div>
  );
}

const ICONS = { check: FiCheckCircle, x: FiX, pause: FiPauseCircle, play: FiPlayCircle, edit: FiEdit2, convert: FiUserPlus, send: FiSend };

export function RowActionsMenu({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!actions?.length) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <FiMoreVertical size={15} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 1200, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)', minWidth: 190, padding: 6 }}>
          {actions.map((act) => {
            const Icon = ICONS[act.icon];
            return (
              <button key={act.action} type="button" className="menu-item-hover"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(act.action); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, color: act.danger ? '#DC2626' : '#1E293B', fontFamily: 'var(--font)', textAlign: 'left' }}>
                {Icon && <Icon size={14} />}
                {act.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** `onConfirm(reason)` resolves to an error message string when the server refuses, otherwise nothing. */
export function ReasonModal({ onClose, onConfirm, title, subtitle, placeholder, btnLabel, btnColor = '#DC2626' }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setSaving(true);
    const message = await onConfirm(reason.trim());
    setSaving(false);
    if (message) setError(message);
  };
  const blocked = saving || !reason.trim();
  return (
    <Modal isOpen onClose={onClose} title={title} maxWidth="440px"
      footer={
        <>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={submit} disabled={blocked}
            style={{ ...btnPrimary, backgroundColor: btnColor, opacity: blocked ? 0.5 : 1, cursor: blocked ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Working…' : btnLabel}
          </button>
        </>
      }>
      <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>{subtitle}</p>
      <FormField label="Reason" required error={error}>
        <Textarea value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} placeholder={placeholder} rows={3} />
      </FormField>
    </Modal>
  );
}
