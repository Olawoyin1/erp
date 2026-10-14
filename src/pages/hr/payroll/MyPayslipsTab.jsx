import { useState, useEffect } from 'react';
import { FiDownload, FiEye } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Drawer from '../../../components/ui/Drawer';
import { payrollService } from '../../../services/hr.service';
import { apiError } from '../../../services/apiHelpers';
import { saveBlob, blobErrorMessage } from '../hrUtils';
import { money, periodLabel } from './payrollUtils';
import { TableSkeleton, LoadError } from './payrollParts';
import { PayslipDocument } from './PayslipsTab';

/** Self-service: the signed-in employee's own payslips (GET /payslips/mine), no payroll permission needed. */
export default function MyPayslipsTab({ showToast }) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    let cancelled = false;
    payrollService.myPayslips()
      .then((res) => { if (!cancelled) setState({ items: res.data?.data || [], loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ items: [], loading: false, error: apiError(err, 'Your payslips could not be loaded') }); });
    return () => { cancelled = true; };
  }, [attempt]);

  const download = async (row) => {
    try {
      const res = await payrollService.downloadMyPayslip(row._id);
      saveBlob(res.data, `payslip-${row.payslipId}.pdf`);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Download failed'), 'error');
    }
  };

  const columns = [
    { key: 'payslipId', label: 'PAYSLIP', render: (v) => <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.78rem' }}>{v}</span> },
    { key: 'p', label: 'PERIOD', render: (_, r) => periodLabel(r.periodMonth, r.periodYear) },
    { key: 'grossSalary', label: 'GROSS SALARY', render: (v) => money(v) },
    { key: 'totalDeductions', label: 'DEDUCTIONS', render: (v) => money(v) },
    { key: 'netSalary', label: 'NET SALARY', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{money(v)}</span> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View" onClick={() => setViewItem(row)}><FiEye size={15} /></button>
          <button className="icon-btn" title="Download PDF" onClick={() => download(row)}><FiDownload size={15} /></button>
        </div>
      ),
    },
  ];

  if (state.error) return <LoadError message={state.error} onRetry={() => { setState((s) => ({ ...s, loading: true, error: '' })); setAttempt((n) => n + 1); }} />;
  if (state.loading) return <TableSkeleton cols={6} />;
  return (
    <>
      <DataTable columns={columns} data={state.items} keyField="_id" emptyMessage="You have no payslips yet. They appear once a payroll run covering you is generated." />
      {viewItem && (
        <Drawer isOpen onClose={() => setViewItem(null)} title={`Payslip ${periodLabel(viewItem.periodMonth, viewItem.periodYear)}`} subtitle={viewItem.payslipId} width="760px">
          <PayslipDocument payslip={viewItem} />
        </Drawer>
      )}
    </>
  );
}
