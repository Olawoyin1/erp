import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FormField, Input } from '../../components/ui/FormField';
import { authService } from '../../services/auth.service';
import { endSession } from '../../services/apiClient';
import { apiError } from '../../services/apiHelpers';
import { validateNewPassword, PASSWORD_HINT } from '../auth/passwordRules';
import { ErrorBanner, FooterButtons, NoticeBanner, PanelHeader, SectionCard } from './settingsShared';
import { detailErrors } from './settingsUtils';

const EMPTY = { current: '', newPwd: '', confirm: '' };

function PasswordField({ label, name, value, shown, onToggle, onChange, error, placeholder }) {
  return (
    <FormField label={label} required error={error}>
      <div style={{ position: 'relative' }}>
        <Input name={name} type={shown ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} error={!!error} style={{ paddingRight: 40 }} autoComplete={name === 'current' ? 'current-password' : 'new-password'} />
        <div onClick={onToggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94A3B8', display: 'flex' }}>
          {shown ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </div>
      </div>
    </FormField>
  );
}

export default function PasswordTab() {
  const [form, setForm] = useState(EMPTY);
  const [show, setShow] = useState({ current: false, newPwd: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setFormError('');
  };
  const toggle = (key) => () => setShow((p) => ({ ...p, [key]: !p[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const checked = validateNewPassword(form.newPwd, form.confirm);
    const errs = { newPwd: checked.password, confirm: checked.confirm };
    if (!form.current) errs.current = 'Enter your current password';
    if (!errs.newPwd && form.newPwd === form.current) errs.newPwd = 'Choose a password different from the current one';
    if (errs.current || errs.newPwd || errs.confirm) { setErrors(errs); return; }

    setSaving(true);
    try {
      await authService.changePassword(form.current, form.newPwd);
      // The server ends every session of this account on a password change, including this one.
      endSession('Your password was changed. Please sign in with your new password.');
    } catch (err) {
      const fields = detailErrors(err);
      setErrors({ current: fields.currentPassword, newPwd: fields.newPassword });
      setFormError(fields.currentPassword || fields.newPassword ? '' : apiError(err, 'Could not change the password'));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PanelHeader title="Change Password" subtitle="Update your account password. You will need your current password to make changes" />
      <NoticeBanner>After you change your password you are signed out on every device and sign in again with the new one.</NoticeBanner>
      <SectionCard title="Password">
        <ErrorBanner message={formError} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <PasswordField label="Current Password" name="current" value={form.current} shown={show.current} onToggle={toggle('current')} onChange={handleChange} error={errors.current} placeholder="Enter your current password" />
          <PasswordField label="New Password" name="newPwd" value={form.newPwd} shown={show.newPwd} onToggle={toggle('newPwd')} onChange={handleChange} error={errors.newPwd} placeholder="Create your new password" />
          <PasswordField label="Confirm Password" name="confirm" value={form.confirm} shown={show.confirm} onToggle={toggle('confirm')} onChange={handleChange} error={errors.confirm} placeholder="Re-enter your password" />
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>{PASSWORD_HINT}</p>
      </SectionCard>
      <FooterButtons onDiscard={() => { setForm(EMPTY); setErrors({}); setFormError(''); }} saving={saving} dirty={!!(form.current || form.newPwd || form.confirm)} saveLabel="Change Password" />
    </form>
  );
}
