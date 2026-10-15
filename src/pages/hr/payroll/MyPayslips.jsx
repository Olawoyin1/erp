import Toast, { useToast } from '../../../components/ui/Toast';
import MyPayslipsTab from './MyPayslipsTab';

export default function MyPayslips() {
  const { toast, showToast, hideToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>My Payslips</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>View and download your own payslips</p>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <MyPayslipsTab showToast={showToast} />
      </div>
    </div>
  );
}
