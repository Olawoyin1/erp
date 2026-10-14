import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiArrowLeft, FiPlus, FiEye, FiEdit2, FiMoreVertical, FiCheck, FiX, FiDownload, FiFileText, FiAlertCircle } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, Textarea, DatePicker, FileUpload } from '../../../components/ui/FormField';
import { trainingService } from '../../../services/hr.service';
import { apiError, formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf, fullName, ymd } from '../hrUtils';
import MultiEmployeePicker from '../MultiEmployeePicker';
import { StatusBadge } from './trainingUi';
import { OUTCOME_STYLES, OUTCOME_OPTIONS } from './trainingConstants';

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

function OutcomePill({ value }) {
  const s = OUTCOME_STYLES[value] || OUTCOME_STYLES.under_evaluation;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

function ParticipantMenu({ items }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)} onBlur={() => setTimeout(() => setOpen(false), 150)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, backgroundColor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', borderRadius: 8, padding: 4, minWidth: 170 }}>
          {items.map((item) => (
            <div key={item.label} className="menu-item-hover" onMouseDown={() => { item.onClick(); setOpen(false); }}
              style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 4 }}>
              <FiEdit2 size={13} /> {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Record outcome / re-evaluate ─────────────────────────────────────────────
function OutcomeModal({ training, participant, reEvaluate, onClose, onSaved }) {
  const attended = participant.attended;
  const [form, setForm] = useState(() => ({
    outcomeStatus: reEvaluate ? '' : participant.outcomeStatus && participant.outcomeStatus !== 'not_applicable' ? participant.outcomeStatus : 'under_evaluation',
    operationalFeedback: reEvaluate ? '' : participant.operationalFeedback || '',
    reason: '',
    completionDate: ymd(participant.completionDate) || ymd(training.endDate),
    expiryDate: ymd(participant.expiryDate),
  }));
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const employeeId = idOf(participant.employeeId);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const options = attended ? OUTCOME_OPTIONS.filter((o) => o.value !== 'not_applicable') : OUTCOME_OPTIONS.filter((o) => o.value === 'not_applicable' || o.value === 'under_evaluation');

  const submit = async () => {
    const next = {};
    if (!form.outcomeStatus) next.outcomeStatus = 'Choose the outcome';
    if (!form.operationalFeedback.trim()) next.operationalFeedback = 'Enter the notes or operational feedback';
    if (reEvaluate && !form.reason.trim()) next.reason = 'Give the reason for the re-evaluation';
    if (form.expiryDate && form.completionDate && form.expiryDate < form.completionDate) next.expiryDate = 'Must be after the completion date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setFormError('');
    try {
      let certificateAttachmentId;
      if (file) {
        const up = await trainingService.uploadCertificate(training._id, employeeId, file);
        certificateAttachmentId = up.data?.data?._id;
      }
      const body = {
        outcomeStatus: form.outcomeStatus,
        operationalFeedback: form.operationalFeedback.trim(),
        ...(form.completionDate ? { completionDate: form.completionDate } : {}),
        ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
        ...(certificateAttachmentId ? { certificateAttachmentId } : {}),
      };
      if (reEvaluate) await trainingService.reEvaluate(training._id, employeeId, { ...body, reason: form.reason.trim() });
      else await trainingService.evaluate(training._id, employeeId, body);
      onSaved(reEvaluate ? 'Outcome re-evaluated' : 'Outcome recorded');
    } catch (err) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(err) }));
      setFormError(apiError(err, 'The outcome could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  const emp = participant.employeeId || {};
  return (
    <Modal isOpen onClose={onClose} title={reEvaluate ? 'Re-evaluate Outcome' : 'Record Outcome'} maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Employee"><Input value={emp.fullName || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
          <FormField label="Employee ID"><Input value={emp.employeeId || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
        </div>
        {!attended && <div style={{ fontSize: '0.8rem', color: '#B45309' }}>This participant is not marked as attended, so only Under Evaluation or Not Applicable can be recorded.</div>}
        <FormField label={reEvaluate ? 'New outcome status' : 'Outcome status'} required error={errors.outcomeStatus}>
          <Select value={form.outcomeStatus} placeholder="Select outcome" error={!!errors.outcomeStatus} onChange={(e) => set('outcomeStatus', e.target.value)} options={options} />
        </FormField>
        <FormField label="Notes / operational feedback" required error={errors.operationalFeedback}>
          <Textarea rows={4} value={form.operationalFeedback} error={!!errors.operationalFeedback} onChange={(e) => set('operationalFeedback', e.target.value)} />
        </FormField>
        {reEvaluate && (
          <FormField label="Reason for re-evaluation" required error={errors.reason}>
            <Textarea rows={3} value={form.reason} error={!!errors.reason} onChange={(e) => set('reason', e.target.value)} />
          </FormField>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Completion date" error={errors.completionDate}>
            <DatePicker value={form.completionDate} onChange={(e) => set('completionDate', e.target.value)} />
          </FormField>
          <FormField label="Certificate expiry date" error={errors.expiryDate} helpText="A Value Created outcome records a certification">
            <DatePicker value={form.expiryDate} min={form.completionDate || undefined} error={!!errors.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
          </FormField>
        </div>
        <FormField label={participant.certificateFileName ? `Certificate (current: ${participant.certificateFileName})` : 'Certificate (optional)'} error={errors.certificateAttachmentId}>
          <FileUpload value={file} onChange={setFile} accept=".pdf,.png,.jpg,.jpeg" maxSizeText="Up to 50MB" subtext="PDF, PNG or JPG" />
        </FormField>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>The evaluator and the evaluation date are recorded automatically from your account.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Outcome'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── View outcome ─────────────────────────────────────────────────────────────
function OutcomeDrawer({ training, participant, canEvaluate, onClose, onReEvaluate, showToast }) {
  const emp = participant.employeeId || {};
  const download = async () => {
    try {
      const res = await trainingService.certificateUrl(training._id, idOf(participant.employeeId));
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the certificate'), 'error');
    }
  };
  const settled = participant.outcomeStatus === 'value_created' || participant.outcomeStatus === 'value_not_yet_observed';
  return (
    <Drawer isOpen onClose={onClose} title={emp.fullName || 'Participant'} subtitle={`${training.title} • ${emp.employeeId || ''}`} width="520px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>Status: <OutcomePill value={participant.outcomeStatus} /></div>
        {canEvaluate && settled && (
          <button onClick={() => onReEvaluate(participant)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
            <FiEdit2 size={13} /> Re-evaluate
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, border: '1px solid #E2E8F0', borderRadius: 8, padding: 18 }}>
        {[
          ['EMPLOYEE', emp.fullName], ['EMPLOYEE ID', emp.employeeId],
          ['DEPARTMENT', emp.departmentId?.name], ['POSITION', emp.position],
          ['PROVIDER', training.providerName], ['COURSE / TRAINING', training.title],
          ['COMPLETION DATE', formatDate(participant.completionDate)], ['EXPIRY DATE', participant.expiryDate ? formatDate(participant.expiryDate) : 'No expiry'],
          ['VALIDITY PERIOD', training.validityPeriod || 'No expiry'], ['ATTENDED', participant.attended ? 'Yes' : 'No'],
          ['EVALUATED BY', fullName(participant.evaluatedBy)], ['DATE EVALUATED', formatDate(participant.evaluatedAt)],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>{value || '—'}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, marginTop: 16 }}>
        <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, marginBottom: 6 }}>NOTES / OPERATIONAL FEEDBACK</div>
        <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{participant.operationalFeedback || 'No feedback recorded.'}</div>
        {participant.reEvaluationReason && (
          <>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, margin: '12px 0 6px' }}>REASON FOR RE-EVALUATION</div>
            <div style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{participant.reEvaluationReason}</div>
          </>
        )}
      </div>
      <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginTop: 16 }}>
        <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, marginBottom: 8 }}>CERTIFICATE</div>
        {participant.certificateFileName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}><FiFileText size={14} /> {participant.certificateFileName}</span>
            <button onClick={download} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#1D4ED8', cursor: 'pointer', fontSize: '0.8rem' }}><FiDownload size={13} /> Download</button>
          </div>
        ) : <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>No certificate uploaded.</div>}
      </div>
    </Drawer>
  );
}

// ─── Add participants ─────────────────────────────────────────────────────────
function AddParticipantsDrawer({ training, enrolledIds, onClose, onSaved }) {
  const [selected, setSelected] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const count = Object.keys(selected).length;
  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await trainingService.enroll(training._id, Object.keys(selected));
      onSaved(`${count} participant(s) enrolled`);
    } catch (err) {
      setError(apiError(err, 'Failed to enrol'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer isOpen onClose={onClose} title="Add Participants" subtitle={training.title} width="520px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, padding: '9px 16px' }}>Cancel</button>
          <button onClick={submit} disabled={!count || saving} style={{ flex: 1, padding: '9px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: !count || saving ? 0.6 : 1 }}>
            {saving ? 'Enrolling…' : `Enrol ${count || ''}`}
          </button>
        </>
      }>
      {error && <div style={{ padding: '10px 12px', marginBottom: 12, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>{error}</div>}
      <MultiEmployeePicker selected={selected} onChange={setSelected} disabledIds={enrolledIds} maxHeight={420} />
    </Drawer>
  );
}

// ─── Participants page ────────────────────────────────────────────────────────
export default function TrainingParticipants({ training, onBack, showToast, onChanged }) {
  const canUpdate = usePermission('hr.training.update');
  const canEvaluate = usePermission('hr.training.evaluate');
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    trainingService.getParticipants(training._id)
      .then((res) => { if (!cancelled) setState({ items: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ items: [], loading: false, error: apiError(err, 'Failed to load participants') }); });
    return () => { cancelled = true; };
  }, [training._id, attempt]);

  const markable = ['active', 'completed', 'evaluation'].includes(training.status);
  const evaluable = ['completed', 'evaluation'].includes(training.status);
  const enrollable = ['scheduled', 'active'].includes(training.status);

  const toggleAttendance = async (p) => {
    const eid = idOf(p.employeeId);
    setBusyId(eid);
    try {
      await trainingService.markAttendance(training._id, eid, !p.attended);
      reload();
    } catch (err) {
      showToast(apiError(err, 'Attendance could not be saved'), 'error');
    } finally {
      setBusyId('');
    }
  };

  const q = search.trim().toLowerCase();
  const rows = state.items.filter((p) => {
    const e = p.employeeId || {};
    return !q || e.fullName?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q) || e.departmentId?.name?.toLowerCase().includes(q);
  });

  const th = { padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button onClick={onBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
        <FiArrowLeft size={16} /> Back to Training
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{training.title}</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>{training.trainingId} <StatusBadge status={training.status} /></p>
        </div>
        {canUpdate && enrollable && (
          <button onClick={() => setAddOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={14} /> Add Participants
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative', maxWidth: 380 }}>
          <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee, id, department…" style={{ paddingLeft: 36 }} />
        </div>
        {state.error ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            {state.error} <button className="btn btn-secondary" style={{ marginLeft: 12 }} onClick={() => { setState((s) => ({ ...s, loading: true, error: '' })); reload(); }}>Try again</button>
          </div>
        ) : state.loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>Loading participants…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>{state.items.length ? 'No participants match your search.' : 'No participants enrolled yet.'}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                {['Employee ID', 'Employee', 'Department', 'Attendance', 'Status', 'Actions'].map((h) => <th key={h} style={th}>{h.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const e = p.employeeId || {};
                const eid = idOf(p.employeeId);
                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{e.employeeId || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: '#0F172A' }}>{e.fullName || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{e.departmentId?.name || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {canUpdate && markable ? (
                        <input type="checkbox" checked={!!p.attended} disabled={busyId === eid} onChange={() => toggleAttendance(p)} style={{ width: 16, height: 16, accentColor: '#1D4ED8', cursor: 'pointer' }} />
                      ) : p.attended ? <FiCheck color="#059669" /> : <FiX color={training.status === 'scheduled' ? '#CBD5E1' : '#DC2626'} />}
                    </td>
                    <td style={{ padding: '12px 16px' }}><OutcomePill value={p.outcomeStatus} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="icon-btn" title="View outcome" onClick={() => setViewing(p)}><FiEye size={15} /></button>
                        <ParticipantMenu items={[
                          ...(canEvaluate && evaluable && (p.outcomeStatus === 'under_evaluation' || p.outcomeStatus === 'not_applicable') ? [{ label: 'Record Outcome', onClick: () => setOutcome({ participant: p, reEvaluate: false }) }] : []),
                          ...(canEvaluate && evaluable && (p.outcomeStatus === 'value_created' || p.outcomeStatus === 'value_not_yet_observed') ? [{ label: 'Re-evaluate', onClick: () => setOutcome({ participant: p, reEvaluate: true }) }] : []),
                        ]} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!evaluable && state.items.length > 0 && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>Outcomes can be recorded once the training is completed.</p>
        )}
      </div>

      {addOpen && (
        <AddParticipantsDrawer training={training} enrolledIds={state.items.map((p) => idOf(p.employeeId))} onClose={() => setAddOpen(false)}
          onSaved={(message) => { setAddOpen(false); showToast(message, 'success'); reload(); onChanged(); }} />
      )}
      {outcome && (
        <OutcomeModal training={training} participant={outcome.participant} reEvaluate={outcome.reEvaluate} onClose={() => setOutcome(null)}
          onSaved={(message) => { setOutcome(null); setViewing(null); showToast(message, 'success'); reload(); }} />
      )}
      {viewing && (
        <OutcomeDrawer training={training} participant={state.items.find((p) => p._id === viewing._id) || viewing} canEvaluate={canEvaluate && evaluable} showToast={showToast}
          onClose={() => setViewing(null)} onReEvaluate={(p) => { setViewing(null); setOutcome({ participant: p, reEvaluate: true }); }} />
      )}
    </div>
  );
}
