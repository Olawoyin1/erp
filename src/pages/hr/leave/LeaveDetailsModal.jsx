import { useState, useEffect } from 'react';
import { FiUser, FiCheck, FiX, FiEdit2, FiPaperclip, FiDownload } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Textarea } from '../../../components/ui/FormField';
import { leaveService } from '../../../services/hr.service';
import { apiError, formatDate, titleCase } from '../../../services/apiHelpers';
import { fullName } from '../hrUtils';

const STATUS = {
  pending:  { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  approved: { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' },
  declined: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
};

const stamp = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-GB')} • ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const dotColor = (action) => {
  if (action.includes('approved')) return '#16A34A';
  if (action.includes('declined')) return '#DC2626';
  if (action.includes('changes')) return '#EA580C';
  return '#1E3A8A';
};

function InfoCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

/**
 * Leave request details displayed in a right-side Drawer.
 * `canDecide` is false for the person's own request. Handlers resolve to an error message or nothing.
 */
export default function LeaveDetailsDrawer({ leave, canDecide, ownRequest, onClose, onApprove, onDecline, onRequestChanges, showToast }) {
  const [showChanges, setShowChanges] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState({ id: null, items: [], error: '' });
  const leaveId = leave._id;

  useEffect(() => {
    let cancelled = false;
    leaveService.history(leaveId)
      .then((res) => { if (!cancelled) setHistory({ id: leaveId, items: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setHistory({ id: leaveId, items: [], error: apiError(err, 'History could not be loaded') }); });
    return () => { cancelled = true; };
  }, [leaveId, leave.status]);

  const loaded = history.id === leaveId;
  const isPending = leave.status === 'pending';
  const st = STATUS[leave.status] || STATUS.pending;
  const duration = leave.durationDays != null ? `${leave.durationDays} ${leave.durationDays === 1 ? 'Day' : 'Days'}` : '—';

  const run = async (fn) => {
    setBusy(true);
    setError('');
    const result = await fn();
    setBusy(false);
    if (result) setError(result);
  };

  const sendChanges = () => run(async () => {
    if (!message.trim()) return 'Describe the changes needed';
    const result = await onRequestChanges(leave, message.trim());
    if (!result) { setShowChanges(false); setMessage(''); }
    return result;
  });

  const openAttachment = async () => {
    try {
      const res = await leaveService.attachmentUrl(leaveId);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const footer = isPending && canDecide ? (
    <>
      <button disabled={busy} onClick={() => setShowChanges((v) => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', fontSize: '0.82rem', fontWeight: 500, borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}>
        <FiEdit2 size={13} /> Request Changes
      </button>
      <button disabled={busy} onClick={() => onDecline(leave)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 6, border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
        <FiX size={13} /> Decline
      </button>
      <button disabled={busy} onClick={() => run(() => onApprove(leave))}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: '#059669', color: '#fff', cursor: 'pointer' }}>
        <FiCheck size={13} /> Approve
      </button>
    </>
  ) : null;

  return (
    <Drawer isOpen onClose={onClose} title="Leave Request Details" subtitle={`${fullName(leave.employeeId)} • ${leave.leaveId}`} width="500px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Status badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', backgroundColor: st.bg, border: `1px solid ${st.border}`, borderRadius: 8, alignSelf: 'flex-start' }}>
          <FiUser size={14} style={{ color: st.color }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: st.color }}>{titleCase(leave.status)}</span>
        </div>

        {isPending && ownRequest && (
          <div style={{ fontSize: '0.78rem', color: '#92400E', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px' }}>
            You cannot approve or decline your own leave request; another approver must decide it.
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>{error}</div>
        )}

        {/* Request changes inline panel */}
        {showChanges && (
          <div style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <FormField label="What needs to change?" required>
              <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Please attach a supporting medical document." />
            </FormField>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowChanges(false)}>Cancel</button>
              <button disabled={busy} onClick={sendChanges}
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Send
              </button>
            </div>
          </div>
        )}

        {/* Details grid */}
        <div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #F1F5F9' }}>LEAVE DETAILS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
            <InfoCell label="Employee" value={fullName(leave.employeeId)} />
            <InfoCell label="Leave Type" value={leave.leaveTypeId?.name} />
            <InfoCell label="Start Date" value={formatDate(leave.startDate)} />
            <InfoCell label="End Date" value={formatDate(leave.endDate)} />
            <InfoCell label="Duration" value={`${duration} (working days)`} />
            <InfoCell label="Status" value={titleCase(leave.status)} />
            {leave.decidedBy && (
              <>
                <InfoCell label="Decided By" value={fullName(leave.decidedBy)} />
                <InfoCell label="Decided On" value={formatDate(leave.decidedAt)} />
              </>
            )}
          </div>
        </div>

        {/* Reason */}
        <div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #F1F5F9' }}>REASON</div>
          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {leave.reason || '—'}
          </div>
          {leave.declineReason && (
            <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#991B1B', padding: '8px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6 }}>
              Declined: {leave.declineReason}
            </div>
          )}
        </div>

        {/* Attachment */}
        {leave.attachmentId && (
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #F1F5F9' }}>SUPPORTING DOCUMENT</div>
            <button onClick={openAttachment}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: '0.82rem', color: '#1D4ED8', fontWeight: 500 }}>
              <FiPaperclip size={14} /> View document <FiDownload size={13} />
            </button>
          </div>
        )}

        {/* Approval history */}
        <div>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #F1F5F9' }}>APPROVAL HISTORY</div>
          {history.error ? (
            <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>{history.error}</div>
          ) : !loaded ? (
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Loading…</div>
          ) : history.items.length === 0 ? (
            <div style={{ fontSize: '0.813rem', color: '#94A3B8' }}>No history yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 16 }}>
              <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 2, backgroundColor: '#E2E8F0' }} />
              {history.items.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 3, backgroundColor: dotColor(h.action) }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{stamp(h.occurredAt)}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{h.label}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 1 }}>
                      {h.actorName ? `By ${h.actorName}` : ''}{h.reason ? `${h.actorName ? '. ' : ''}${h.reason}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Drawer>
  );
}
