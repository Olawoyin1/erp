import { useState } from 'react';
import { FormField, Input } from '../../components/ui/FormField';
import { settingsService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import Loaded from './Loaded';
import { ErrorBanner, FooterButtons, NoticeBanner, NotifRow, PanelHeader, SectionCard } from './settingsShared';
import { MAIL_REPLY_TO_KEYS, detailErrors, shallowEqual } from './settingsUtils';

const MY_ROWS = [
  ['taskAssignment', 'Task Assignment', 'Send me an email when a task is assigned to me'],
  ['approvalRequest', 'Approval Request', 'Email me when something needs my approval, and the outcome of my own requests'],
  ['systemAlert', 'System Alert', 'Email me about system errors, maintenance windows and critical events'],
  ['reminders', 'Reminders', 'Email me due-date and expiry reminders (certificates, documents, deadlines). Reminders about approvals and tasks follow the two switches above.'],
];

const COMPANY_ROWS = [
  ['taskAssignment', 'Task Assignment', 'Enable email notifications for task assignments'],
  ['approvalRequest', 'Approval Request', 'Enable email notifications when approval is required'],
  ['requestProjectStatusChange', 'Request/Project Status Change', 'Enable email notifications for status changes and decisions on requests'],
  ['certificateDocumentExpiry', 'Certificate/Document Expiry', 'Enable email notifications for expiring certificates, policies, calibrations and contracts'],
  ['permitSuspension', 'Permit Suspension', 'Enable email notifications when an offshore permit is suspended or rejected'],
  ['candidateRejectionEmail', 'Candidate Rejection Email', 'Send the courteous rejection email to candidates marked as Rejected, company-wide'],
  ['dueDateReminders', 'Due-Date Reminders', 'Send the date-driven reminder emails (expiry, due and overdue). In-app reminders always stay.'],
  ['externalEmails', 'External Emails', 'Allow emails to vendors, clients and candidates. This is a kill switch: while it is off, no email leaves for anyone outside the company.'],
];

function MyPreferences({ showToast }) {
  const api = useApi(() => settingsService.getMyNotificationPrefs(), []);
  return (
    <SectionCard title="My Notifications" subtitle="Your own email preferences. You still see every notification in the bell.">
      <Loaded api={api} rows={4}>
        {(prefs) => <MyPreferencesForm prefs={prefs} showToast={showToast} />}
      </Loaded>
    </SectionCard>
  );
}

function MyPreferencesForm({ prefs, showToast }) {
  const initial = Object.fromEntries(MY_ROWS.map(([key]) => [key, !!prefs[key]]));
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await settingsService.updateMyNotificationPrefs(form);
      setSaved({ ...form });
      showToast('Your notification preferences were saved', 'success');
    } catch (err) {
      setError(apiError(err, 'Could not save your preferences'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <ErrorBanner message={error} />
      {MY_ROWS.map(([key, label, desc]) => (
        <NotifRow key={key} label={label} desc={desc} checked={form[key]} onChange={(v) => setForm((p) => ({ ...p, [key]: v }))} />
      ))}
      <FooterButtons onDiscard={() => setForm(saved)} saving={saving} dirty={!shallowEqual(form, saved)} />
    </form>
  );
}

function CompanyPreferences({ showToast, canEdit }) {
  const api = useApi(() => settingsService.getNotificationPrefs(), []);
  return (
    <SectionCard title="Company-Wide Notifications" subtitle="A switch here turns off the email only. The bell notification is always created.">
      <Loaded api={api} rows={5}>
        {(doc) => <CompanyPreferencesForm prefs={doc.notifications || doc} showToast={showToast} canEdit={canEdit} />}
      </Loaded>
    </SectionCard>
  );
}

function CompanyPreferencesForm({ prefs, showToast, canEdit }) {
  const initial = Object.fromEntries(COMPANY_ROWS.map(([key]) => [key, !!prefs[key]]));
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await settingsService.updateNotificationPrefs(form);
      setSaved({ ...form });
      showToast('Company-wide notification settings saved', 'success');
    } catch (err) {
      setError(apiError(err, 'Could not save the company-wide settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      {!canEdit && <NoticeBanner>You can see these settings but your role cannot change them.</NoticeBanner>}
      <ErrorBanner message={error} />
      {COMPANY_ROWS.map(([key, label, desc]) => (
        <NotifRow key={key} label={label} desc={desc} checked={form[key]} disabled={!canEdit} onChange={(v) => setForm((p) => ({ ...p, [key]: v }))} />
      ))}
      {canEdit && <FooterButtons onDiscard={() => setForm(saved)} saving={saving} dirty={!shallowEqual(form, saved)} />}
    </form>
  );
}

function ReplyToMailboxes({ showToast, canEdit }) {
  const api = useApi(() => settingsService.getCompany(), []);
  return (
    <SectionCard title="Reply-To Mailboxes" subtitle="All mail leaves from one sender address. Replies go to the mailbox of the module the mail belongs to, else the default one. Leave a box empty to clear it.">
      <Loaded api={api} rows={4}>
        {(doc) => <ReplyToForm current={doc.mailReplyTo || {}} showToast={showToast} canEdit={canEdit} />}
      </Loaded>
    </SectionCard>
  );
}

function ReplyToForm({ current, showToast, canEdit }) {
  const initial = Object.fromEntries(MAIL_REPLY_TO_KEYS.map(([key]) => [key, current[key] || '']));
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    MAIL_REPLY_TO_KEYS.forEach(([key]) => {
      const value = form[key].trim();
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errs[key] = 'Enter a valid email address';
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setError('');
    try {
      const body = Object.fromEntries(MAIL_REPLY_TO_KEYS.map(([key]) => [key, form[key].trim()]));
      await settingsService.updateMailReplyTo(body);
      setSaved({ ...form });
      showToast('Reply-to mailboxes saved', 'success');
    } catch (err) {
      setErrors(detailErrors(err));
      setError(apiError(err, 'Could not save the mailboxes'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate>
      <ErrorBanner message={error} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {MAIL_REPLY_TO_KEYS.map(([key, label]) => (
          <FormField key={key} label={label} error={errors[key]}>
            <Input
              type="email"
              value={form[key]}
              disabled={!canEdit}
              placeholder="mailbox@pgsl.com"
              error={!!errors[key]}
              onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: '' })); }}
            />
          </FormField>
        ))}
      </div>
      {canEdit && <FooterButtons onDiscard={() => { setForm(saved); setErrors({}); }} saving={saving} dirty={!shallowEqual(form, saved)} />}
    </form>
  );
}

export default function NotificationTab({ showToast }) {
  const canViewSettings = usePermission('core.settings.view');
  const canEditSettings = usePermission('core.settings.update');

  return (
    <div>
      <PanelHeader title="Notifications" subtitle="Control which notifications you receive and how they are delivered" />
      <MyPreferences showToast={showToast} />
      {canViewSettings && <CompanyPreferences showToast={showToast} canEdit={canEditSettings} />}
      {canViewSettings && <ReplyToMailboxes showToast={showToast} canEdit={canEditSettings} />}
    </div>
  );
}
