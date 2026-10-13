import React, { useState } from 'react';
import Toast, { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/FormField';
import {
  FiUser,
  FiLock,
  FiBell,
  FiShield,
  FiCheckCircle,
  FiDollarSign,
  FiCpu,
  FiEye,
  FiEyeOff,
  FiUpload,
  FiPlus,
  FiEdit2,
  FiX,
} from 'react-icons/fi';

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'profile',       label: 'Profile' },
  { key: 'password',      label: 'Change Password' },
  { key: 'notification',  label: 'Notification' },
  { key: 'company',       label: 'Company & Security' },
  { key: 'approvals',     label: 'Approvals & Compliance' },
  { key: 'finance',       label: 'Finance Configuration' },
  { key: 'system',        label: 'System Configuration' },
];

// ─── Toggle Switch Component ──────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        backgroundColor: checked ? '#1D4ED8' : '#CBD5E1',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────
function NotifRow({ label, desc, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{label}</span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: checked ? '#DCFCE7' : '#F1F5F9',
            color: checked ? '#16A34A' : '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}>
            {checked ? 'On' : 'Off'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{desc}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const isActive = status === 'Active';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4,
      fontSize: '0.72rem', fontWeight: 600,
      backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
      color: isActive ? '#16A34A' : '#DC2626',
    }}>
      {status}
    </span>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div style={{
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '20px 24px',
      marginBottom: 20,
      backgroundColor: '#FFFFFF',
    }}>
      {title && (
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 16px 0' }}>{title}</h3>
      )}
      {children}
    </div>
  );
}

// ─── Footer Buttons ───────────────────────────────────────────────────────────
function FooterButtons({ onDiscard, onSave, saveLabel = 'Save Changes' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
      <button
        onClick={onDiscard}
        style={{ padding: '9px 20px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#475569', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
      >
        Discard Changes
      </button>
      <button
        onClick={onSave}
        style={{ padding: '9px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
      >
        {saveLabel}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB PANELS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ showToast }) {
  const [form, setForm] = useState({
    firstName: 'Admin', lastName: 'User',
    email: 'admin@pgsl.com', jobTitle: 'System Administrator',
    department: 'System-wide',
  });
  const h = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const DEPARTMENTS = ['System-wide', 'Human Resources', 'Finance & Accounts', 'Administration', 'Technical', 'HSE', 'Quality System', 'Procurement', 'Business Development'];

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>General</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>Update your personal information</p>

      <SectionCard title="Profile Photo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', backgroundColor: '#1D4ED8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: '1rem', fontWeight: 700, flexShrink: 0,
          }}>
            AU
          </div>
          <div>
            <button style={{
              padding: '7px 16px', borderRadius: 6, border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.813rem', fontWeight: 500, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <FiUpload size={13} /> Upload Photo
            </button>
            <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>JPG or PNG, max 2 MB. Square images work best.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="First Name">
            <Input name="firstName" value={form.firstName} onChange={h} />
          </FormField>
          <FormField label="Last Name">
            <Input name="lastName" value={form.lastName} onChange={h} />
          </FormField>
          <FormField label="Work Email">
            <Input name="email" value={form.email} onChange={h} readOnly style={{ backgroundColor: '#F8FAFC', color: '#94A3B8' }} />
          </FormField>
          <FormField label="Job Title">
            <Input name="jobTitle" value={form.jobTitle} onChange={h} />
          </FormField>
          <FormField label="Department">
            <Select name="department" value={form.department} onChange={h} options={DEPARTMENTS} />
          </FormField>
        </div>
        <div style={{ marginTop: 16 }}>
          <FormField label="Role">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '4px 10px', borderRadius: 4, backgroundColor: '#F1F5F9', fontSize: '0.813rem', fontWeight: 600, color: '#0F172A' }}>Super Admin</span>
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Read-only — managed by system</span>
            </div>
          </FormField>
        </div>
      </SectionCard>

      <FooterButtons
        onDiscard={() => showToast('Changes discarded', 'info')}
        onSave={() => showToast('Profile updated successfully', 'success')}
      />
    </div>
  );
}

// ─── Change Password Tab ──────────────────────────────────────────────────────
function ChangePasswordTab({ showToast }) {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPwd: false, confirm: false });
  const h = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const EyeToggle = ({ field }) => (
    <div onClick={() => setShow((p) => ({ ...p, [field]: !p[field] }))} style={{ cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
      {show[field] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>Change Password</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>Update your account password. You will need your current password to make changes</p>

      <SectionCard title="Password">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Current Password" required>
            <div style={{ position: 'relative' }}>
              <Input name="current" type={show.current ? 'text' : 'password'} value={form.current} onChange={h} placeholder="Enter your current password" style={{ paddingRight: 40 }} />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}><EyeToggle field="current" /></div>
            </div>
          </FormField>
          <FormField label="New Password" required>
            <div style={{ position: 'relative' }}>
              <Input name="newPwd" type={show.newPwd ? 'text' : 'password'} value={form.newPwd} onChange={h} placeholder="Create your new password" style={{ paddingRight: 40 }} />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}><EyeToggle field="newPwd" /></div>
            </div>
          </FormField>
          <FormField label="Confirm Password" required>
            <div style={{ position: 'relative' }}>
              <Input name="confirm" type={show.confirm ? 'text' : 'password'} value={form.confirm} onChange={h} placeholder="Re-enter your password" style={{ paddingRight: 40 }} />
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}><EyeToggle field="confirm" /></div>
            </div>
          </FormField>
        </div>
      </SectionCard>

      <FooterButtons
        onDiscard={() => { setForm({ current: '', newPwd: '', confirm: '' }); showToast('Changes discarded', 'info'); }}
        onSave={() => showToast('Password updated successfully', 'success')}
        saveLabel="Reset Password"
      />
    </div>
  );
}

// ─── Notification Tab ─────────────────────────────────────────────────────────
function NotificationTab({ showToast }) {
  const [my, setMy] = useState({ task: false, approval: true, system: true });
  const [company, setCompany] = useState({ task: false, approval: true, statusChange: true, certExpiry: true, permitSusp: true, rejection: true });

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>Notifications</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>Control which notifications you receive and how they are delivered</p>

      <SectionCard title="My Notifications">
        <NotifRow label="Task Assignment" desc="Send an email when a task is assigned to a user" checked={my.task} onChange={(v) => setMy((p) => ({ ...p, task: v }))} />
        <NotifRow label="Approval Request" desc="Notify me when something needs my approval" checked={my.approval} onChange={(v) => setMy((p) => ({ ...p, approval: v }))} />
        <NotifRow label="System Alert" desc="Notify on system errors, maintenance windows, and critical events" checked={my.system} onChange={(v) => setMy((p) => ({ ...p, system: v }))} />
      </SectionCard>

      <SectionCard title="Company-Wide Notifications">
        <NotifRow label="Task Assignment" desc="Enable email notifications for task assignments" checked={company.task} onChange={(v) => setCompany((p) => ({ ...p, task: v }))} />
        <NotifRow label="Approval Request" desc="Enable email notifications when approval is required" checked={company.approval} onChange={(v) => setCompany((p) => ({ ...p, approval: v }))} />
        <NotifRow label="Request/Project Status Change" desc="Enable email notifications for status changes" checked={company.statusChange} onChange={(v) => setCompany((p) => ({ ...p, statusChange: v }))} />
        <NotifRow label="Certificate/Document Expiry" desc="Enable email notifications for expiring certificates/documents" checked={company.certExpiry} onChange={(v) => setCompany((p) => ({ ...p, certExpiry: v }))} />
        <NotifRow label="Permit Suspension" desc="Enable email notifications when a permit is suspended" checked={company.permitSusp} onChange={(v) => setCompany((p) => ({ ...p, permitSusp: v }))} />
        <NotifRow label="Candidate Rejection Email" desc="Enable automatic email to be sent to candidates when marked as Rejected, company-wide" checked={company.rejection} onChange={(v) => setCompany((p) => ({ ...p, rejection: v }))} />
      </SectionCard>

      <FooterButtons
        onDiscard={() => showToast('Changes discarded', 'info')}
        onSave={() => showToast('Notification preferences saved', 'success')}
      />
    </div>
  );
}

// ─── Company & Security Tab ───────────────────────────────────────────────────
function CompanySecurityTab({ showToast }) {
  const [form, setForm] = useState({
    orgName: 'PGSL', orgDisplayName: 'PGSL Engineering & Services',
    taxId: 'RC-0012345', address: 'Plot 44B, Trans Amadi Industrial Layout, Port Harcour...',
    email: 'info@pgsl.com', phone: '+234 803 456 7890',
    language: 'English', timezone: 'Africa/Lagos',
    dateFormat: 'DD MMM YYYY', currency: 'NGN — Nigerian Naira',
  });
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes');
  const h = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>Company & Security</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>Manage company information and organisation-wide security settings</p>

      <SectionCard title="Company Information">
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', margin: '0 0 10px 0' }}>Company Logo</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>AU</div>
            <div>
              <button style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiUpload size={12} /> Upload Photo
              </button>
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>JPG or PNG, max 2 MB. Square images work best.</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Organisation Name"><Input name="orgName" value={form.orgName} onChange={h} /></FormField>
          <FormField label="Organisation Display Name"><Input name="orgDisplayName" value={form.orgDisplayName} onChange={h} /></FormField>
          <FormField label="Tax ID / Registration Number"><Input name="taxId" value={form.taxId} onChange={h} /></FormField>
          <FormField label="Registered Address"><Input name="address" value={form.address} onChange={h} /></FormField>
          <FormField label="Contact Email"><Input name="email" value={form.email} onChange={h} /></FormField>
          <FormField label="Contact Phone"><Input name="phone" value={form.phone} onChange={h} /></FormField>
          <FormField label="Default Language"><Select name="language" value={form.language} onChange={h} options={['English', 'French', 'Arabic']} /></FormField>
          <FormField label="Default Time Zone"><Select name="timezone" value={form.timezone} onChange={h} options={['Africa/Lagos', 'Europe/London', 'America/New_York', 'Asia/Dubai']} /></FormField>
          <FormField label="Date Format"><Select name="dateFormat" value={form.dateFormat} onChange={h} options={['DD MMM YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']} /></FormField>
          <FormField label="Default Currency"><Select name="currency" value={form.currency} onChange={h} options={['NGN — Nigerian Naira', 'USD — US Dollar', 'GBP — British Pound', 'EUR — Euro']} /></FormField>
        </div>
      </SectionCard>

      <SectionCard title="System Preferences">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Two-Factor Authentication</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: twoFA ? '#DCFCE7' : '#F1F5F9', color: twoFA ? '#16A34A' : '#94A3B8', textTransform: 'uppercase' }}>{twoFA ? 'On' : 'Off'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>Require all users to verify their identity with a second factor when signing in. Applied company-wide.</p>
          </div>
          <ToggleSwitch checked={twoFA} onChange={setTwoFA} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Session Timeout</span>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>Automatically sign out inactive users after this period.</p>
          </div>
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: '0.813rem', color: '#0F172A', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none' }}
          >
            {['15 Minutes', '30 Minutes', '1 Hour', '2 Hours', '4 Hours'].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </SectionCard>

      <FooterButtons
        onDiscard={() => showToast('Changes discarded', 'info')}
        onSave={() => showToast('Company settings saved', 'success')}
      />
    </div>
  );
}

// ─── Approvals & Compliance Tab ───────────────────────────────────────────────
function ApprovalsComplianceTab({ showToast }) {
  const [thresholds, setThresholds] = useState({ t1: '500 000', t2: '2 000 000', t3: '5 000 000' });
  const [matching, setMatching] = useState({ tolerance: '5', expiry: '30' });

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>Approvals & Compliance</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>Configure approval thresholds, matching tolerances, and document expiry windows</p>

      <SectionCard title="Fund Request Approval Thresholds">
        <p style={{ fontSize: '0.83rem', color: '#64748B', margin: '0 0 16px 0' }}>Requests above each threshold require a higher level of approval. Enter amounts in Nigerian Naira.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <FormField label="Threshold 1 (₦)">
            <Input value={thresholds.t1} onChange={(e) => setThresholds((p) => ({ ...p, t1: e.target.value }))} />
          </FormField>
          <FormField label="Threshold 2 (₦)">
            <Input value={thresholds.t2} onChange={(e) => setThresholds((p) => ({ ...p, t2: e.target.value }))} />
          </FormField>
          <FormField label="Threshold 3 (₦)">
            <Input value={thresholds.t3} onChange={(e) => setThresholds((p) => ({ ...p, t3: e.target.value }))} />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Matching & Expiry Rules">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <FormField label="3-Way Matching Discrepancy Tolerance (%)">
              <Input value={matching.tolerance} onChange={(e) => setMatching((p) => ({ ...p, tolerance: e.target.value }))} />
            </FormField>
            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiCheckCircle size={11} /> Maximum allowed variance between PO, GRN, and invoice amounts.
            </p>
          </div>
          <div>
            <FormField label="Document / Certificate Expiry Alert Window (Days)">
              <Input value={matching.expiry} onChange={(e) => setMatching((p) => ({ ...p, expiry: e.target.value }))} />
            </FormField>
            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiCheckCircle size={11} /> Days before expiry to flag a record as "Expiring Soon"
            </p>
          </div>
        </div>
      </SectionCard>

      <FooterButtons
        onDiscard={() => showToast('Changes discarded', 'info')}
        onSave={() => showToast('Approval settings saved', 'success')}
      />
    </div>
  );
}

// ─── Finance Configuration Tab ────────────────────────────────────────────────
function FinanceConfigTab({ showToast }) {
  const [accounts, setAccounts] = useState([
    { category: 'Assets',      start: '1000', end: '1999' },
    { category: 'Liabilities', start: '2000', end: '2999' },
    { category: 'Equity',      start: '3000', end: '3999' },
    { category: 'Revenue',     start: '4000', end: '4999' },
    { category: 'Expenses',    start: '5000', end: '5999' },
  ]);
  const [matching, setMatching] = useState({ tolerance: '5', expiry: '30' });

  const updateAccount = (idx, field, val) => {
    setAccounts((p) => p.map((a, i) => i === idx ? { ...a, [field]: val } : a));
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>Finance Configuration</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>Configure chart of accounts number ranges and registered entities</p>

      <SectionCard title="Chart of Accounts — Number Ranges">
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 16, padding: '8px 0', borderBottom: '1px solid #E2E8F0', marginBottom: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Category</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Range Start</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Range End</span>
        </div>
        {accounts.map((acc, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: 16, alignItems: 'center', padding: '8px 0', borderBottom: i < accounts.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <span style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{acc.category}</span>
            <Input value={acc.start} onChange={(e) => updateAccount(i, 'start', e.target.value)} />
            <Input value={acc.end} onChange={(e) => updateAccount(i, 'end', e.target.value)} />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Matching & Expiry Rules">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <FormField label="3-Way Matching Discrepancy Tolerance (%)">
              <Input value={matching.tolerance} onChange={(e) => setMatching((p) => ({ ...p, tolerance: e.target.value }))} />
            </FormField>
            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiCheckCircle size={11} /> Maximum allowed variance between PO, GRN, and invoice amounts.
            </p>
          </div>
          <div>
            <FormField label="Document / Certificate Expiry Alert Window (Days)">
              <Input value={matching.expiry} onChange={(e) => setMatching((p) => ({ ...p, expiry: e.target.value }))} />
            </FormField>
            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiCheckCircle size={11} /> Days before expiry to flag a record as "Expiring Soon"
            </p>
          </div>
        </div>
      </SectionCard>

      <FooterButtons
        onDiscard={() => showToast('Changes discarded', 'info')}
        onSave={() => showToast('Finance configuration saved', 'success')}
      />
    </div>
  );
}

// ─── System Configuration Tab ─────────────────────────────────────────────────
function SystemConfigTab({ showToast }) {
  const [entities, setEntities] = useState([
    { name: 'PGSL Nigeria Ltd', type: 'Parent', status: 'Active' },
    { name: 'PGSL Offshore Ltd', type: 'Subsidiary', status: 'Inactive' },
  ]);
  const [departments, setDepartments] = useState([
    { id: 'DEPT-001', name: 'Administration', status: 'Active' },
    { id: 'DEPT-001', name: 'Human Resources', status: 'Active' },
    { id: 'DEPT-001', name: 'Accounts & Finance', status: 'Active' },
    { id: 'DEPT-001', name: 'Procurement', status: 'Active' },
    { id: 'DEPT-001', name: 'Business Development', status: 'Active' },
    { id: 'DEPT-001', name: 'Technical', status: 'Active' },
    { id: 'DEPT-001', name: 'Quality System', status: 'Active' },
    { id: 'DEPT-001', name: 'HSE', status: 'Active' },
  ]);

  const [entityModal, setEntityModal] = useState(false);
  const [deptModal, setDeptModal] = useState(false);
  const [newEntity, setNewEntity] = useState({ name: '', type: 'Parent', status: 'Active' });
  const [newDept, setNewDept] = useState({ name: '', status: 'Active' });

  const addEntity = () => {
    if (!newEntity.name) return;
    setEntities((p) => [...p, { ...newEntity }]);
    setEntityModal(false);
    setNewEntity({ name: '', type: 'Parent', status: 'Active' });
    showToast('Entity added successfully', 'success');
  };

  const addDept = () => {
    if (!newDept.name) return;
    setDepartments((p) => [...p, { id: `DEPT-${String(p.length + 1).padStart(3, '0')}`, name: newDept.name, status: newDept.status }]);
    setDeptModal(false);
    setNewDept({ name: '', status: 'Active' });
    showToast('Department added successfully', 'success');
  };

  const toggleEntityStatus = (idx) => {
    setEntities((p) => p.map((e, i) => i === idx ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
  };

  const toggleDeptStatus = (idx) => {
    setDepartments((p) => p.map((d, i) => i === idx ? { ...d, status: d.status === 'Active' ? 'Inactive' : 'Active' } : d));
  };

  const tableHeaderStyle = { fontSize: '0.72rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 0' };
  const cellStyle = { fontSize: '0.85rem', color: '#0F172A', padding: '12px 0', borderBottom: '1px solid #F1F5F9' };
  const linkStyle = { fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none', padding: 0 };

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>System Configuration</h2>
      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px 0' }}>Manage core system behaviour settings</p>

      {/* Entities */}
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Entities</h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>Manage registered legal entities within the organisation.</p>
          </div>
          <button
            onClick={() => setEntityModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.813rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus size={14} /> Add Entity
          </button>
        </div>

        {/* Entities table */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: '1px solid #E2E8F0', paddingBottom: 4 }}>
          <span style={tableHeaderStyle}>Entity Name</span>
          <span style={tableHeaderStyle}>Type</span>
          <span style={tableHeaderStyle}>Status</span>
          <span style={tableHeaderStyle}>Actions</span>
        </div>
        {entities.map((e, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center' }}>
            <span style={cellStyle}>{e.name}</span>
            <span style={cellStyle}>{e.type}</span>
            <span style={cellStyle}><StatusPill status={e.status} /></span>
            <span style={cellStyle}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ ...linkStyle, color: '#1D4ED8' }}>Edit</button>
                <button style={{ ...linkStyle, color: '#DC2626' }} onClick={() => toggleEntityStatus(i)}>
                  {e.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </span>
          </div>
        ))}
      </SectionCard>

      {/* Departments */}
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Departments</h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>Manage organisational departments and their status</p>
          </div>
          <button
            onClick={() => setDeptModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.813rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus size={14} /> Department
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', borderBottom: '1px solid #E2E8F0', paddingBottom: 4 }}>
          <span style={tableHeaderStyle}>Department ID</span>
          <span style={tableHeaderStyle}>Department</span>
          <span style={tableHeaderStyle}>Status</span>
          <span style={tableHeaderStyle}>Actions</span>
        </div>
        {departments.map((d, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', alignItems: 'center' }}>
            <span style={cellStyle}>{d.id}</span>
            <span style={cellStyle}>{d.name}</span>
            <span style={cellStyle}><StatusPill status={d.status} /></span>
            <span style={cellStyle}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={{ ...linkStyle, color: '#1D4ED8' }}>Edit</button>
                <button style={{ ...linkStyle, color: '#DC2626' }} onClick={() => toggleDeptStatus(i)}>
                  {d.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </span>
          </div>
        ))}
      </SectionCard>

      {/* Add Entity Modal */}
      <Modal
        isOpen={entityModal}
        onClose={() => setEntityModal(false)}
        title="Add Entity"
        maxWidth="480px"
        footer={
          <>
            <button onClick={() => setEntityModal(false)} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button onClick={addEntity} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Add Entity</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Entity Name" required>
            <Input name="name" value={newEntity.name} onChange={(e) => setNewEntity((p) => ({ ...p, name: e.target.value }))} placeholder="e.g PGSL Offshore Ltd" />
          </FormField>
          <FormField label="Entity Type" required>
            <Select name="type" value={newEntity.type} onChange={(e) => setNewEntity((p) => ({ ...p, type: e.target.value }))} options={['Parent', 'Subsidiary', 'Joint Venture']} />
          </FormField>
          <FormField label="Status" required>
            <Select name="status" value={newEntity.status} onChange={(e) => setNewEntity((p) => ({ ...p, status: e.target.value }))} options={['Active', 'Inactive']} />
          </FormField>
        </div>
      </Modal>

      {/* Add Department Modal */}
      <Modal
        isOpen={deptModal}
        onClose={() => setDeptModal(false)}
        title="Add Department"
        maxWidth="480px"
        footer={
          <>
            <button onClick={() => setDeptModal(false)} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
            <button onClick={addDept} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Add Department</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Department ID">
            <Input value={`DEPT-${String(departments.length + 1).padStart(3, '0')}`} readOnly style={{ backgroundColor: '#F8FAFC', color: '#94A3B8' }} />
          </FormField>
          <FormField label="Department" required>
            <Input value={newDept.name} onChange={(e) => setNewDept((p) => ({ ...p, name: e.target.value }))} placeholder="" />
          </FormField>
          <FormField label="Status" required>
            <Select value={newDept.status} onChange={(e) => setNewDept((p) => ({ ...p, status: e.target.value }))} options={['Active', 'Inactive']} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const tabStyle = (key) => ({
    padding: '12px 0',
    fontSize: '0.875rem',
    fontWeight: activeTab === key ? 700 : 500,
    color: activeTab === key ? '#1D4ED8' : '#64748B',
    border: 'none',
    borderBottom: activeTab === key ? '2px solid #1D4ED8' : '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
    whiteSpace: 'nowrap',
  });

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':      return <ProfileTab showToast={showToast} />;
      case 'password':     return <ChangePasswordTab showToast={showToast} />;
      case 'notification': return <NotificationTab showToast={showToast} />;
      case 'company':      return <CompanySecurityTab showToast={showToast} />;
      case 'approvals':    return <ApprovalsComplianceTab showToast={showToast} />;
      case 'finance':      return <FinanceConfigTab showToast={showToast} />;
      case 'system':       return <SystemConfigTab showToast={showToast} />;
      default:             return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Settings</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Configure company-wide settings, approval thresholds, and system defaults used across every module
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t.key} style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTab()}
    </div>
  );
}
