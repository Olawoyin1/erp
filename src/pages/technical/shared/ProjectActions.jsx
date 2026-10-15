import { useState } from 'react';
import { FiShare2 } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { apiError } from '../../../services/apiHelpers';
import { projectService } from '../../../services/technical.service';
import { Choice, ConfirmModal, Field, FormError, PrimaryButton, ReasonModal, RecordSummary, SecondaryButton } from '../../procurement/shared/ProcUi';
import { TIMELINE_REASONS, fieldErrorsOf, formatDate, ymd } from './techUtils';

const summary = (project) => <RecordSummary rows={[['Project', project.projectName], ['Project ID', project.projectId]]} />;

function TimelineModal({ project, onClose, onDone }) {
  const [newCompletion, setNewCompletion] = useState(ymd(project.plannedCompletion));
  const [reason, setReason] = useState('');
  const [logAsChallenge, setLogAsChallenge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    const next = {};
    if (!newCompletion) next.newCompletion = 'Choose the new completion date';
    if (!reason) next.reasonForChange = 'Choose the reason for the change';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      await projectService.updateTimeline(project._id, { newCompletion, reasonForChange: reason, logAsChallenge });
      onDone('Timeline updated');
    } catch (err) {
      setError(apiError(err, 'The timeline could not be updated'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Update Timeline"
      subtitle="Moving the completion date later marks the project Delayed."
      maxWidth="480px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Update Timeline'}</PrimaryButton>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {summary(project)}
        <Field label="Current planned completion"><Input value={formatDate(project.plannedCompletion)} disabled /></Field>
        <Field label="New completion date" required error={errors.newCompletion}>
          <DatePicker value={newCompletion} onChange={(e) => setNewCompletion(e.target.value)} error={Boolean(errors.newCompletion)} />
        </Field>
        <Field label="Reason for change" required error={errors.reasonForChange}>
          <Choice value={reason} onChange={setReason} placeholder="Select a reason" options={TIMELINE_REASONS} error={errors.reasonForChange} />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: '#334155', cursor: 'pointer' }}>
          <input type="checkbox" checked={logAsChallenge} onChange={(e) => setLogAsChallenge(e.target.checked)} style={{ accentColor: '#1D4ED8' }} />
          Log this change as an Issue in the project log
        </label>
        <FormError message={error} />
      </div>
    </Modal>
  );
}

function ShareModal({ project, onClose, onDone }) {
  const [email, setEmail] = useState(project.clientEmail || '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter the email address to send the progress report to'); return; }
    setBusy(true);
    setError('');
    try {
      const res = await projectService.shareProgress(project._id, { recipientEmail: email.trim(), ...(message.trim() ? { message: message.trim() } : {}) });
      onDone(`Progress report sent to ${res.data?.data?.sentTo || email.trim()}`);
    } catch (err) {
      setError(apiError(err, 'The progress report could not be sent'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Share Progress"
      subtitle="Email the current progress summary to the client."
      maxWidth="480px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy} icon={<FiShare2 size={14} />}>{busy ? 'Sending…' : 'Send Progress Report'}</PrimaryButton>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {summary(project)}
        <Field label="Recipient email" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@company.com" /></Field>
        <Field label="Message (optional)"><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a short note for the client" /></Field>
        <FormError message={error} />
      </div>
    </Modal>
  );
}

/**
 * Renders the dialog for one project action and runs it. `action`: hold, resume, atRisk, inProgress, complete,
 * timeline or share. `onDone(message)` is called after a success; `onClose` on cancel.
 */
export function ProjectActionDialog({ action, project, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (call, message) => {
    setBusy(true);
    setError('');
    try {
      await call();
      onDone(message);
    } catch (err) {
      setError(apiError(err, 'The action failed'));
    } finally {
      setBusy(false);
    }
  };

  if (action === 'timeline') return <TimelineModal project={project} onClose={onClose} onDone={onDone} />;
  if (action === 'share') return <ShareModal project={project} onClose={onClose} onDone={onDone} />;
  if (action === 'hold') {
    return (
      <ReasonModal
        title="Put Project on Hold?"
        message="The project stays on hold until someone resumes it."
        detail={summary(project)}
        label="Reason (optional)"
        required={false}
        confirmLabel="Put on Hold"
        busy={busy}
        error={error}
        onClose={onClose}
        onConfirm={(reason) => run(() => projectService.hold(project._id, reason), 'Project put on hold')}
      />
    );
  }
  if (action === 'resume') {
    return (
      <ReasonModal
        title="Resume Project?"
        message="The project returns to In Progress."
        detail={summary(project)}
        label="Notes (optional)"
        required={false}
        confirmLabel="Resume Project"
        busy={busy}
        error={error}
        onClose={onClose}
        onConfirm={(notes) => run(() => projectService.resume(project._id, notes), 'Project resumed')}
      />
    );
  }
  const confirms = {
    atRisk: { title: 'Mark Project At Risk?', message: 'Flag this project as at risk so the team and management give it attention.', label: 'Mark At Risk', call: () => projectService.markAtRisk(project._id), done: 'Project marked at risk' },
    inProgress: { title: 'Move Project Back to In Progress?', message: 'The at-risk flag is cleared.', label: 'Mark In Progress', call: () => projectService.markInProgress(project._id), done: 'Project marked in progress' },
    complete: {
      title: 'Mark Project as Completed?',
      message: 'A project can be completed only when all its work activities are done and no client or vendor invoice is still owed. A completed project cannot be edited.',
      label: 'Mark Completed',
      call: () => projectService.complete(project._id),
      done: 'Project marked completed',
    },
  };
  const confirm = confirms[action];
  if (!confirm) return null;
  return (
    <ConfirmModal
      title={confirm.title}
      message={confirm.message}
      detail={summary(project)}
      confirmLabel={confirm.label}
      busy={busy}
      error={error}
      onClose={onClose}
      onConfirm={() => run(confirm.call, confirm.done)}
    />
  );
}
