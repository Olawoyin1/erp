import { useState } from 'react';
import { FiCreditCard, FiDownload } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { populatedName } from '../../../services/apiHelpers';
import { invoiceService } from '../../../services/finance.service';
import {
  DataState, DetailGrid, DrawerStatusBar, FormError, Panel, SecondaryButton, SimpleTable, StatusBadge, TabBar,
} from './FinanceUi';
import { DocumentUploads } from './FinanceRecordExtras';
import { downloadFile, formatDate, money } from './financeUtils';
import { useRecord } from './useRecord';

const OPEN = ['issued', 'partially_paid', 'overdue'];

/** View drawer of one invoice / receivable: details, payment history, documents, receipt PDF. */
export default function InvoiceDrawer({ invoiceId, perms, onClose, onAction, refreshKey, title = 'Invoice', idLabel = 'Invoice ID' }) {
  const [tab, setTab] = useState('details');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { record: inv, loading, error } = useRecord(invoiceService, invoiceId, refreshKey);

  const exportReceipt = async () => {
    setExporting(true);
    setExportError('');
    const failure = await downloadFile(() => invoiceService.pdf(invoiceId), `${inv?.invoiceId || 'invoice'}.pdf`);
    if (failure) setExportError(failure);
    setExporting(false);
  };

  const paid = inv ? inv.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

  return (
    <Drawer isOpen onClose={onClose} title={inv ? populatedName(inv.client) : title} subtitle={inv?.invoiceId} width="560px" footer={<SecondaryButton style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</SecondaryButton>}>
      <DataState loading={loading} error={error} empty={!loading && !error && !inv}>
        {inv && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DrawerStatusBar status={<StatusBadge status={inv.status} />}>
              {perms.decide && OPEN.includes(inv.status) && <SecondaryButton icon={<FiCreditCard size={13} />} onClick={() => onAction('pay', inv)}>Record Payment</SecondaryButton>}
              <SecondaryButton icon={<FiDownload size={13} />} onClick={exportReceipt} disabled={exporting}>{exporting ? 'Exporting…' : 'Export Receipt'}</SecondaryButton>
            </DrawerStatusBar>
            {exportError && <FormError message={exportError} />}
            <TabBar tabs={[{ id: 'details', label: 'Invoice Details' }, { id: 'payments', label: `Payment History (${inv.payments.length})` }]} active={tab} onChange={setTab} />
            {tab === 'details' && (
              <>
                <DetailGrid items={[
                  [idLabel, inv.invoiceId],
                  ['Client', populatedName(inv.client)],
                  ['Project', inv.project ? populatedName(inv.project) : '—'],
                  ['Invoice date', formatDate(inv.issueDate)],
                  ['Due date', formatDate(inv.dueDate)],
                  ['Currency', inv.currency !== 'NGN' ? `${inv.currency} (rate ${inv.exchangeRate})` : inv.currency],
                  ['Work valuation', money(inv.workValuation, inv.currency)],
                  ['VAT', money(inv.vat, inv.currency)],
                  ['WHT', money(inv.wht, inv.currency)],
                  ['Retention', money(inv.retention, inv.currency)],
                  ['Debt receivable', money(inv.netReceivable, inv.currency)],
                  ['Amount received', money(paid, inv.currency)],
                  ['Outstanding balance', money(inv.outstanding, inv.currency)],
                  ['Payment terms', inv.paymentTerms || '—'],
                ]} />
                {inv.cancellationReason && <Panel title="Cancellation reason">{inv.cancellationReason}</Panel>}
                <Panel title="Description">{inv.description || 'No description recorded.'}</Panel>
                <DocumentUploads key={inv._id} api={invoiceService} id={inv._id} canEdit={perms.attach} />
              </>
            )}
            {tab === 'payments' && (
              <SimpleTable
                empty="No payments have been recorded for this invoice yet."
                columns={[
                  { key: 'paymentDate', label: 'Payment date', render: (r) => formatDate(r.paymentDate) },
                  { key: 'amount', label: 'Amount', render: (r) => money(r.amount, inv.currency) },
                  { key: 'method', label: 'Method', render: (r) => r.method || '—' },
                  { key: 'reference', label: 'Reference', render: (r) => r.reference || r.note || '—' },
                  { key: 'bankAccount', label: 'Account', render: (r) => (r.bankAccount ? `${r.bankAccount.accountCode} – ${r.bankAccount.accountName}` : 'Default') },
                ]}
                rows={inv.payments.map((p) => ({ ...p, key: String(p.paymentId) }))}
              />
            )}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}
