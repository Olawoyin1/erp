export const JOB_STATUS_STYLES = {
  open:         { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Open' },
  paused:       { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', label: 'Paused' },
  interviewing: { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', label: 'Interviewing' },
  closed:       { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Closed' },
};

export const STAGE_STYLES = {
  applied:    { bg: '#F1F5F9', color: '#475569',  border: '#E2E8F0', label: 'Applied' },
  screening:  { bg: '#FFF7ED', color: '#EA580C',  border: '#FED7AA', label: 'Screening' },
  assessment: { bg: '#EFF6FF', color: '#2563EB',  border: '#BFDBFE', label: 'Assessment' },
  interview:  { bg: '#EFF6FF', color: '#2563EB',  border: '#BFDBFE', label: 'Interview' },
  offer:      { bg: '#F5F3FF', color: '#7C3AED',  border: '#DDD6FE', label: 'Offer' },
  hired:      { bg: '#F0FDF4', color: '#16A34A',  border: '#BBF7D0', label: 'Hired' },
  rejected:   { bg: '#FEF2F2', color: '#DC2626',  border: '#FECACA', label: 'Rejected' },
};

/** What the advance button says at each stage (labels from the design). */
export const ADVANCE_LABEL = {
  applied: 'Start Screening',
  screening: 'Move to Assessment',
  assessment: 'Move to Interview',
  interview: 'Send Offer Letter',
  offer: 'Mark as Hired',
};

export const btnPrimary = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 7, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' };
export const btnCancel  = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 7, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' };
export function btnOutline(color, bg, border) {
  return { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 7, border: `1px solid ${border}`, backgroundColor: bg, color, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' };
}
