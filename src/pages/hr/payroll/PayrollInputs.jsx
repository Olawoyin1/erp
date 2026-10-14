import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiDollarSign, FiUsers, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import Toast, { useToast } from '../../../components/ui/Toast';
import { fetchPayrollStats, selectPayrollStats } from '../../../store/hr/payrollSlice';
import { usePermission } from '../../../hooks/usePermission';
import { money } from './payrollUtils';
import StructuresTab from './StructuresTab';
import TaxDefsTab from './TaxDefsTab';
import PayslipsTab from './PayslipsTab';
import RunsTab from './RunsTab';
import StatutoryTab from './StatutoryTab';
import MyPayslipsTab from './MyPayslipsTab';

function StatCard({ label, value, sub, icon: Icon, bg, color }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} /></div>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{sub}</div>
    </div>
  );
}

export default function PayrollInputs() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const stats = useSelector(selectPayrollStats);
  const canView = usePermission('hr.payroll.view');
  const canSeeStatutory = canView;
  const [statsError, setStatsError] = useState('');

  const tabs = [
    ...(canView ? [
      { key: 'structure', label: 'Payroll Structure' },
      { key: 'tax', label: 'Tax Definitions' },
      { key: 'payslips', label: 'Payslips' },
      { key: 'runs', label: 'Payroll Runs' },
    ] : []),
    ...(canSeeStatutory ? [{ key: 'statutory', label: 'Statutory Configuration' }] : []),
    { key: 'mine', label: 'My Payslips' },
  ];
  const [chosen, setChosen] = useState('');
  const active = tabs.some((t) => t.key === chosen) ? chosen : tabs[0].key;

  const loadStats = useCallback(() => {
    if (!canView) return;
    dispatch(fetchPayrollStats()).then((r) => setStatsError(fetchPayrollStats.rejected.match(r) ? (r.payload?.message || 'Failed to load payroll figures') : ''));
  }, [dispatch, canView]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const monthLabel = stats ? new Date(stats.periodYear, stats.periodMonth - 1).toLocaleString('en-GB', { month: 'long' }) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Payroll Inputs</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage salary structures, tax rules, payslips, and payroll processing across the organisation</p>
      </div>

      {canView && (
        <>
          {statsError && <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.82rem' }}>{statsError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            <StatCard label="TOTAL PAYROLL COST" value={stats ? money(stats.totalPayrollCost) : '…'} sub={`Net pay across live runs for ${monthLabel || 'the current month'}`} icon={FiDollarSign} bg="#EFF6FF" color="#2563EB" />
            <StatCard label="EMPLOYEES ON PAYROLL" value={stats ? stats.employeesOnPayroll : '…'} sub="Employees paid in the current cycle" icon={FiUsers} bg="#F5F3FF" color="#7C3AED" />
            <StatCard label="PENDING APPROVAL" value={stats ? stats.pendingApproval : '…'} sub="Payroll batches awaiting approval" icon={FiAlertTriangle} bg="#FFF7ED" color="#EA580C" />
            <StatCard label="PROCESSED PAYROLLS" value={stats ? stats.processedThisYear : '…'} sub="Payroll successfully processed this year" icon={FiCheckCircle} bg="#F0FDF4" color="#16A34A" />
          </div>
        </>
      )}

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: 8, overflowX: 'auto' }}>
          {tabs.map((tab) => {
            const on = active === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => setChosen(tab.key)}
                style={{ padding: '10px 16px', fontFamily: 'var(--font)', fontSize: '0.875rem', fontWeight: on ? 600 : 500, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', color: on ? '#1D4ED8' : '#64748B', borderBottom: on ? '2px solid #1D4ED8' : '2px solid transparent', marginBottom: -1 }}>
                {tab.label}
              </button>
            );
          })}
        </div>
        {active === 'structure' && <StructuresTab showToast={showToast} />}
        {active === 'tax' && <TaxDefsTab showToast={showToast} />}
        {active === 'payslips' && <PayslipsTab showToast={showToast} />}
        {active === 'runs' && <RunsTab showToast={showToast} onChanged={loadStats} />}
        {active === 'statutory' && <StatutoryTab showToast={showToast} />}
        {active === 'mine' && <MyPayslipsTab showToast={showToast} />}
      </div>
    </div>
  );
}
