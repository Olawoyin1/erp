import { useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { settingsService } from '../../services/settings.service';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import Loaded from './Loaded';
import { ErrorBanner, FooterButtons, NoticeBanner, PanelHeader, SectionCard, ToggleSwitch } from './settingsShared';
import { detailErrors, shallowEqual } from './settingsUtils';

const LANGUAGES = ['English', 'French', 'Arabic'];
const TIME_ZONES = ['Africa/Lagos', 'Europe/London', 'America/New_York', 'Asia/Dubai'];
const DATE_FORMATS = ['DD MMM YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];
const CURRENCIES = [
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'EUR', label: 'EUR — Euro' },
];
const TIMEOUTS = [
  { value: '15', label: '15 Minutes' },
  { value: '30', label: '30 Minutes' },
  { value: '60', label: '1 Hour' },
  { value: '120', label: '2 Hours' },
  { value: '240', label: '4 Hours' },
];

const withCurrent = (options, current) => {
  if (current == null || current === '') return options;
  const has = options.some((o) => (typeof o === 'string' ? o : o.value) === current);
  return has ? options : [...options, current];
};

function CompanyForm({ settings, canEdit, showToast }) {
  const initial = {
    organisationName: settings.organisationName || '',
    organisationDisplayName: settings.organisationDisplayName || '',
    taxId: settings.taxId || '',
    registeredAddress: settings.registeredAddress || '',
    contactEmail: settings.contactEmail || '',
    contactPhone: settings.contactPhone || '',
    defaultLanguage: settings.defaultLanguage || 'English',
    defaultTimeZone: settings.defaultTimeZone || 'Africa/Lagos',
    dateFormat: settings.dateFormat || 'DD MMM YYYY',
    defaultCurrency: settings.defaultCurrency || 'NGN',
    twoFactorAuthEnabled: !!settings.twoFactorAuthEnabled,
    sessionTimeoutMinutes: String(settings.sessionTimeoutMinutes || 30),
  };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setFormError('');
  };
  const text = (name) => (e) => set(name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.organisationName.trim()) errs.organisationName = 'Organisation name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) errs.contactEmail = 'Enter a valid email address';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {};
    Object.keys(form).forEach((key) => {
      if (form[key] === saved[key]) return;
      payload[key] = typeof form[key] === 'string' ? form[key].trim() : form[key];
    });
    if (payload.sessionTimeoutMinutes) payload.sessionTimeoutMinutes = Number(payload.sessionTimeoutMinutes);

    setSaving(true);
    try {
      await settingsService.updateCompany(payload);
      setSaved({ ...form });
      showToast('Company settings saved', 'success');
    } catch (err) {
      const fields = detailErrors(err);
      setErrors(fields);
      const message = apiError(err, 'Could not save the settings');
      setFormError(message);
      if (err.response?.status === 422 && payload.twoFactorAuthEnabled) setForm((p) => ({ ...p, twoFactorAuthEnabled: saved.twoFactorAuthEnabled }));
    } finally {
      setSaving(false);
    }
  };

  const ro = !canEdit;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {ro && <NoticeBanner>You can see these settings but your role cannot change them.</NoticeBanner>}
      <ErrorBanner message={formError} />

      <SectionCard title="Company Information">
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', margin: '0 0 10px 0' }}>Company Logo</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
              {(form.organisationName || 'P').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <button type="button" disabled title="Logo upload is not available yet" style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#94A3B8', fontSize: '0.78rem', fontWeight: 500, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiUpload size={12} /> Upload Photo
              </button>
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>Logo upload is not available yet. The email header uses the company name.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Organisation Name" required error={errors.organisationName}><Input value={form.organisationName} onChange={text('organisationName')} disabled={ro} error={!!errors.organisationName} maxLength={200} /></FormField>
          <FormField label="Organisation Display Name" error={errors.organisationDisplayName}><Input value={form.organisationDisplayName} onChange={text('organisationDisplayName')} disabled={ro} maxLength={200} /></FormField>
          <FormField label="Tax ID / Registration Number" error={errors.taxId}><Input value={form.taxId} onChange={text('taxId')} disabled={ro} maxLength={100} /></FormField>
          <FormField label="Registered Address" error={errors.registeredAddress}><Input value={form.registeredAddress} onChange={text('registeredAddress')} disabled={ro} maxLength={500} /></FormField>
          <FormField label="Contact Email" required error={errors.contactEmail}><Input type="email" value={form.contactEmail} onChange={text('contactEmail')} disabled={ro} error={!!errors.contactEmail} /></FormField>
          <FormField label="Contact Phone" error={errors.contactPhone}><Input value={form.contactPhone} onChange={text('contactPhone')} disabled={ro} /></FormField>
          <FormField label="Default Language"><Select value={form.defaultLanguage} onChange={text('defaultLanguage')} options={withCurrent(LANGUAGES, form.defaultLanguage)} disabled={ro} /></FormField>
          <FormField label="Default Time Zone"><Select value={form.defaultTimeZone} onChange={text('defaultTimeZone')} options={withCurrent(TIME_ZONES, form.defaultTimeZone)} disabled={ro} /></FormField>
          <FormField label="Date Format"><Select value={form.dateFormat} onChange={text('dateFormat')} options={withCurrent(DATE_FORMATS, form.dateFormat)} disabled={ro} /></FormField>
          <FormField label="Default Currency"><Select value={form.defaultCurrency} onChange={text('defaultCurrency')} options={withCurrent(CURRENCIES, form.defaultCurrency)} disabled={ro} /></FormField>
        </div>
      </SectionCard>

      <SectionCard title="System Preferences">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Two-Factor Authentication</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: form.twoFactorAuthEnabled ? '#DCFCE7' : '#F1F5F9', color: form.twoFactorAuthEnabled ? '#16A34A' : '#94A3B8', textTransform: 'uppercase' }}>{form.twoFactorAuthEnabled ? 'On' : 'Off'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>Require all users to enter a 6-digit code emailed to them when signing in. Applied company-wide. It can only be switched on once email delivery is configured on the server.</p>
          </div>
          <ToggleSwitch checked={form.twoFactorAuthEnabled} onChange={(v) => set('twoFactorAuthEnabled', v)} disabled={ro} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0' }}>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Session Timeout</span>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>Automatically sign out users who have been inactive for this long.</p>
          </div>
          <div style={{ minWidth: 160 }}>
            <Select value={form.sessionTimeoutMinutes} onChange={text('sessionTimeoutMinutes')} options={withCurrent(TIMEOUTS, form.sessionTimeoutMinutes)} disabled={ro} />
          </div>
        </div>
      </SectionCard>

      {!ro && <FooterButtons onDiscard={() => { setForm(saved); setErrors({}); setFormError(''); }} saving={saving} dirty={!shallowEqual(form, saved)} />}
    </form>
  );
}

export default function CompanyTab({ showToast }) {
  const canEdit = usePermission('core.settings.update');
  const api = useApi(() => settingsService.getCompany(), []);
  return (
    <div>
      <PanelHeader title="Company & Security" subtitle="Manage company information and organisation-wide security settings" />
      <Loaded api={api} rows={6}>
        {(settings) => <CompanyForm key={settings.updatedAt} settings={settings} canEdit={canEdit} showToast={showToast} />}
      </Loaded>
    </div>
  );
}
