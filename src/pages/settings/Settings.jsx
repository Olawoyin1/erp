import { useSearchParams } from 'react-router-dom';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { allows } from '../../components/layout/navConfig';
import ProfileTab from './ProfileTab';
import PasswordTab from './PasswordTab';
import NotificationTab from './NotificationTab';
import CompanyTab from './CompanyTab';
import ApprovalsTab from './ApprovalsTab';
import WorkHoursTab from './WorkHoursTab';
import FinanceTab from './FinanceTab';
import ExchangeRatesTab from './ExchangeRatesTab';
import StatutoryTab from './StatutoryTab';
import HolidaysTab from './HolidaysTab';
import SystemTab from './SystemTab';
import AuditTab from './AuditTab';
import EmailTab from './EmailTab';

// Each tab names the permission that opens it; the first three are personal and open to everyone.
const TABS = [
  { key: 'profile', label: 'Profile', Panel: ProfileTab },
  { key: 'password', label: 'Change Password', Panel: PasswordTab },
  { key: 'notification', label: 'Notification', Panel: NotificationTab },
  { key: 'company', label: 'Company & Security', Panel: CompanyTab, permission: 'core.settings.view' },
  { key: 'workhours', label: 'Work Hours', Panel: WorkHoursTab, permission: 'core.settings.view' },
  { key: 'approvals', label: 'Approvals & Compliance', Panel: ApprovalsTab, permission: 'core.settings.view' },
  { key: 'finance', label: 'Finance Configuration', Panel: FinanceTab, anyOf: ['core.settings.view', 'finance.ledger.view'] },
  { key: 'exchange', label: 'Exchange Rates', Panel: ExchangeRatesTab, permission: 'finance.exchangerate.view' },
  { key: 'statutory', label: 'Statutory Payroll', Panel: StatutoryTab, permission: 'hr.payroll.view' },
  { key: 'holidays', label: 'Public Holidays', Panel: HolidaysTab, permission: 'hr.holiday.view' },
  { key: 'system', label: 'System Configuration', Panel: SystemTab, anyOf: ['finance.legalentity.view', 'core.department.view', 'core.location.view'] },
  { key: 'email', label: 'Email Outbox', Panel: EmailTab, permission: 'core.settings.view' },
  { key: 'audit', label: 'Audit Log', Panel: AuditTab, permission: 'core.auditlog.view' },
];

export default function Settings() {
  const { toast, showToast, hideToast } = useToast();
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const visible = TABS.filter((tab) => allows(tab, can));
  const requested = searchParams.get('tab');
  const active = visible.find((tab) => tab.key === requested) || visible[0];
  const Panel = active.Panel;

  const tabStyle = (key) => ({
    padding: '12px 0',
    fontSize: '0.875rem',
    fontWeight: active.key === key ? 700 : 500,
    color: active.key === key ? '#1D4ED8' : '#64748B',
    border: 'none',
    borderBottom: active.key === key ? '2px solid #1D4ED8' : '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Settings</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Configure company-wide settings, approval thresholds, and system defaults used across every module
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 24, overflowX: 'auto' }}>
        {visible.map((tab) => (
          <button key={tab.key} style={tabStyle(tab.key)} onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}>
            {tab.label}
          </button>
        ))}
      </div>

      <Panel key={active.key} showToast={showToast} />
    </div>
  );
}
