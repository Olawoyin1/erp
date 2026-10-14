import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FiPlus, FiEye, FiEdit2, FiCreditCard, FiSend, FiDownload, FiX, FiCheck, FiUnlock, FiDollarSign, FiAlertTriangle, FiFileText, FiClock,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import { usePermission } from '../../hooks/usePermission';
import { apiError, populatedName } from '../../services/apiHelpers';
import { financialStatementService, invoiceService, payableService } from '../../services/finance.service';
import { invoicesSlice, payablesSlice } from '../../store/finance/slices';
import {
  Choice, ConfirmModal, DataState, DetailGrid, DrawerStatusBar, Field, FilterDrawer, FormBody, FormError, ListToolbar, MoneyInput, Note,
  PageHeader, Panel, PrimaryButton, ReasonModal, SecondaryButton, SimpleTable, StatTiles, StatusBadge, TabBar, Tag, TwoCol,
} from './shared/FinanceUi';
import { AttachField, DocumentUploads, HistoryList } from './shared/FinanceRecordExtras';
import {
  compactMoney, countFilters, csvMoney, downloadFile, exportRowsCsv, fieldErrorsOf, formatDate, fromKobo, money, statValue, statusLabel,
  toKobo, uploadStagedFiles, ymd,
} from './shared/financeUtils';
import { useAccountOptions, useGoodsReceiptOptions, useProjectOptions, usePurchaseOrderOptions, useVendorOptions } from './shared/useRefOptions';
import { useFinanceList, useRunAction } from './shared/useFinanceList';
import { useRecord } from './shared/useRecord';
import RecordPaymentModal from './shared/RecordPaymentModal';
import InvoiceDrawer from './shared/InvoiceDrawer';

const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];
const PAYMENT_TERMS = ['Due on receipt', 'Net 15 Days', 'Net 30 Days', 'Net 45 Days', 'Net 60 Days'];
const PAYABLE_STATUSES = ['unpaid', 'partially_paid', 'overdue', 'paid', 'void'];
const INVOICE_STATUSES = ['issued', 'partially_paid', 'overdue', 'paid', 'cancelled'];
const OPEN_PAYABLE = ['unpaid', 'partially_paid', 'overdue'];
const OPEN_INVOICE = ['issued', 'partially_paid', 'overdue'];

const refId = (v) => (v && typeof v === 'object' ? v._id : v) || '';
const personName = (p) => (p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '—');
const kobo = (text) => (text === '' ? 0 : toKobo(text));

/* ───────────────────────────── Payable form ───────────────────────────── */

function PayableFormModal({ payable, perms, onClose, onSaved }) {
  const editing = Boolean(payable);
  const run = useRunAction(payablesSlice);
  const [form, setForm] = useState(() => (editing ? {
    vendor: refId(payable.vendor), project: refId(payable.project), poId: refId(payable.poId), grnId: refId(payable.grnId),
    invoiceNo: payable.invoiceNo, invoiceDate: ymd(payable.invoiceDate), dueDate: ymd(payable.dueDate),
    currency: payable.currency || 'NGN', exchangeRate: payable.currency !== 'NGN' ? String(payable.exchangeRate) : '',
    grossAmount: fromKobo(payable.grossAmount), vat: fromKobo(payable.vat), wht: fromKobo(payable.wht),
    paymentTerms: payable.paymentTerms || '', description: payable.description || '', expenseAccount: refId(payable.expenseAccount),
    directPurchaseReason: payable.directPurchaseReason || '', receiptOverrideReason: payable.receiptOverrideReason || '',
  } : {
    vendor: '', project: '', poId: '', grnId: '', invoiceNo: '', invoiceDate: '', dueDate: '', currency: 'NGN', exchangeRate: '',
    grossAmount: '', vat: '', wht: '', paymentTerms: 'Net 30 Days', description: '', expenseAccount: '', directPurchaseReason: '', receiptOverrideReason: '',
  }));
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const vendors = useVendorOptions();
  const projects = useProjectOptions();
  const orders = usePurchaseOrderOptions(form.vendor, Boolean(form.vendor));
  const receipts = useGoodsReceiptOptions(form.poId, Boolean(form.poId));
  const expenseAccounts = useAccountOptions({ category: 'Expense' });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const locked = editing && payable.payments.length > 0;
  const foreign = form.currency !== 'NGN';
  const net = kobo(form.grossAmount) + kobo(form.vat) - kobo(form.wht);
  const order = orders.options.find((o) => o.value === form.poId);
  const goodsOrder = order && ['Materials', 'Equipment'].includes(order.category);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.vendor) next.vendor = 'Select a vendor';
    if (!form.invoiceNo.trim()) next.invoiceNo = 'Enter the vendor invoice number';
    if (!form.invoiceDate) next.invoiceDate = 'Choose the invoice date';
    if (!form.dueDate) next.dueDate = 'Choose the due date';
    ['grossAmount', 'vat', 'wht'].forEach((k) => { if (form[k] !== '' && (Number.isNaN(toKobo(form[k])) || toKobo(form[k]) < 0)) next[k] = 'Enter a valid amount'; });
    if (form.grossAmount === '' || !(toKobo(form.grossAmount) > 0)) next.grossAmount = next.grossAmount || 'Enter the gross amount';
    if (foreign && form.exchangeRate !== '' && !(Number(form.exchangeRate) > 0)) next.exchangeRate = 'Enter a positive rate';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    const body = {
      vendor: form.vendor, invoiceNo: form.invoiceNo.trim(), invoiceDate: form.invoiceDate, dueDate: form.dueDate,
      grossAmount: kobo(form.grossAmount), vat: kobo(form.vat), wht: kobo(form.wht), currency: form.currency,
    };
    if (form.project) body.project = form.project;
    if (form.poId) body.poId = form.poId;
    if (form.grnId) body.grnId = form.grnId;
    if (foreign && form.exchangeRate !== '') body.exchangeRate = Number(form.exchangeRate);
    if (form.paymentTerms) body.paymentTerms = form.paymentTerms;
    if (form.description.trim()) body.description = form.description.trim();
    if (form.expenseAccount) body.expenseAccount = form.expenseAccount;
    if (!form.poId && form.directPurchaseReason.trim()) body.directPurchaseReason = form.directPurchaseReason.trim();
    if (form.poId && form.receiptOverrideReason.trim()) body.receiptOverrideReason = form.receiptOverrideReason.trim();

    let payload = body;
    if (editing) {
      payload = {};
      Object.entries(body).forEach(([k, v]) => {
        const current = payable[k];
        const same = ['vendor', 'project', 'poId', 'grnId', 'expenseAccount'].includes(k) ? refId(current) === v
          : ['invoiceDate', 'dueDate'].includes(k) ? ymd(current) === v
          : String(current ?? '') === String(v ?? '');
        if (!same) payload[k] = v;
      });
      if (Object.keys(payload).length === 0) { onSaved('No changes to save', []); return; }
    }
    setBusy(true);
    const result = editing ? await run('update', payable._id, payload) : await run('create', payload);
    if (!result.ok) {
      setBusy(false);
      setErrors(fieldErrorsOf(result.payload));
      setFormError(result.error);
      return;
    }
    let failed = [];
    if (files.length && result.data?._id) failed = await uploadStagedFiles(payableService, result.data._id, files);
    setBusy(false);
    onSaved(editing ? 'Payable updated successfully' : `Payable ${result.data?.payableId || ''} recorded`, failed);
  };

  return (
    <Modal isOpen onClose={onClose} title={editing ? `Edit Payable ${payable.payableId}` : 'Record Payable'} subtitle="Record a supplier invoice for payment processing" maxWidth="720px">
      <FormBody onSubmit={submit}>
        {locked && <Note tone="amber">A payment has been made on this payable, so its amounts are locked.</Note>}
        {!editing && <Note>A second person must approve a new vendor invoice before it can be paid (you cannot approve your own).</Note>}
        <TwoCol>
          <Field label="Payable ID"><Input value={editing ? payable.payableId : 'Assigned on save'} disabled /></Field>
          <Field label="Vendor" required error={errors.vendor}>
            <Choice value={form.vendor} onChange={(v) => { set('vendor', v); set('poId', ''); set('grnId', ''); }} options={vendors.options} searchable placeholder={vendors.loading ? 'Loading vendors…' : 'Select vendor'} error={errors.vendor} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Project" error={errors.project}><Choice value={form.project} onChange={(v) => set('project', v)} options={[{ value: '', label: 'No project' }, ...projects.options]} searchable placeholder={projects.loading ? 'Loading…' : 'Select project'} /></Field>
          <Field label="Purchase order" error={errors.poId} help={form.vendor ? 'Optional. Choose the order this invoice bills.' : 'Choose the vendor first.'}>
            <Choice value={form.poId} onChange={(v) => { set('poId', v); set('grnId', ''); }} options={[{ value: '', label: 'No purchase order (direct purchase)' }, ...orders.options]} searchable disabled={!form.vendor} placeholder="Select order" />
          </Field>
        </TwoCol>
        {form.poId && (
          <Field label={goodsOrder ? 'Goods receipt (required: must have passed inspection)' : 'Goods receipt'} error={errors.grnId}>
            <Choice value={form.grnId} onChange={(v) => set('grnId', v)} options={[{ value: '', label: 'None' }, ...receipts.options]} searchable placeholder={receipts.loading ? 'Loading…' : 'Select goods receipt'} />
          </Field>
        )}
        <TwoCol>
          <Field label="Invoice no" required error={errors.invoiceNo}><Input value={form.invoiceNo} onChange={(e) => set('invoiceNo', e.target.value)} error={Boolean(errors.invoiceNo)} /></Field>
          <Field label="Currency"><Choice value={form.currency} onChange={(v) => set('currency', v)} options={CURRENCIES} disabled={locked} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Invoice date" required error={errors.invoiceDate}><DatePicker value={form.invoiceDate} onChange={(e) => set('invoiceDate', e.target.value)} error={Boolean(errors.invoiceDate)} /></Field>
          <Field label="Due date" required error={errors.dueDate}><DatePicker value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} error={Boolean(errors.dueDate)} /></Field>
        </TwoCol>
        {foreign && (
          <Field label="Exchange rate (NGN per 1)" error={errors.exchangeRate} help="Leave blank to use the exchange-rate table. A foreign invoice with no rate is refused.">
            <Input value={form.exchangeRate} inputMode="decimal" onChange={(e) => set('exchangeRate', e.target.value)} disabled={locked} error={Boolean(errors.exchangeRate)} />
          </Field>
        )}
        <TwoCol>
          <Field label="Gross amount" required error={errors.grossAmount}><MoneyInput value={form.grossAmount} onChange={(v) => set('grossAmount', v)} disabled={locked} error={errors.grossAmount} /></Field>
          <Field label="VAT" error={errors.vat}><MoneyInput value={form.vat} onChange={(v) => set('vat', v)} disabled={locked} error={errors.vat} /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="WHT (we withhold)" error={errors.wht}><MoneyInput value={form.wht} onChange={(v) => set('wht', v)} disabled={locked} error={errors.wht} /></Field>
          <Field label="Net amount"><Input value={net >= 0 ? money(net, form.currency) : '—'} disabled /></Field>
        </TwoCol>
        <TwoCol>
          <Field label="Payment terms"><Choice value={form.paymentTerms} onChange={(v) => set('paymentTerms', v)} options={PAYMENT_TERMS} placeholder="Select terms" /></Field>
          <Field label="Expense account" help="Leave blank to use the default expense account."><Choice value={form.expenseAccount} onChange={(v) => set('expenseAccount', v)} options={[{ value: '', label: 'Default expense account' }, ...expenseAccounts.options]} searchable placeholder="Select account" /></Field>
        </TwoCol>
        {!form.poId && (
          <Field label="Direct purchase reason" error={errors.directPurchaseReason} help="Required when there is no purchase order and the amount is above the direct-purchase limit.">
            <Textarea rows={2} value={form.directPurchaseReason} onChange={(e) => set('directPurchaseReason', e.target.value)} />
          </Field>
        )}
        {form.poId && perms.override && (
          <Field label="Receipt override reason" error={errors.receiptOverrideReason} help="Only needed to record a goods invoice without a passed goods receipt.">
            <Textarea rows={2} value={form.receiptOverrideReason} onChange={(e) => set('receiptOverrideReason', e.target.value)} />
          </Field>
        )}
        <Field label="Description (optional)"><Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Supply of structural steel materials for Phase 2 construction." /></Field>
        {perms.attach && !editing && <Field label="Attach documents (optional)"><AttachField files={files} onChange={setFiles} disabled={busy} /></Field>}
        <FormError message={formError} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Record Payable'}</PrimaryButton>
        </div>
      </FormBody>
    </Modal>
  );
}

function PayableDrawer({ payableId, perms, myId, refreshKey, onClose, onAction }) {
  const [tab, setTab] = useState('details');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { record: p, loading, error } = useRecord(payableService, payableId, refreshKey);
  const own = p && p.createdBy && String(refId(p.createdBy)) === String(myId);
  const open = p && OPEN_PAYABLE.includes(p.status);

  const exportReceipt = async () => {
    setExporting(true);
    setExportError('');
    const failure = await downloadFile(() => payableService.pdf(payableId), `${p?.payableId || 'payable'}.pdf`);
    if (failure) setExportError(failure);
    setExporting(false);
  };

  return (
    <Drawer isOpen onClose={onClose} title={p ? populatedName(p.vendor) : 'Payable'} subtitle={p?.payableId} width="580px" footer={<SecondaryButton style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</SecondaryButton>}>
      <DataState loading={loading} error={error} empty={!loading && !error && !p}>
        {p && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DrawerStatusBar status={<StatusBadge status={p.status} />}>
              {open && p.approvalStatus === 'pending' && perms.approve && !own && <PrimaryButton icon={<FiCheck size={13} />} onClick={() => onAction('approve', p)}>Approve</PrimaryButton>}
              {open && p.holdReason && perms.approve && <SecondaryButton icon={<FiUnlock size={13} />} onClick={() => onAction('release', p)}>Release hold</SecondaryButton>}
              {open && perms.decide && p.approvalStatus === 'approved' && !p.holdReason && <SecondaryButton icon={<FiCreditCard size={13} />} onClick={() => onAction('pay', p)}>Record Payment</SecondaryButton>}
              {p.payments.length > 0 && <SecondaryButton icon={<FiDownload size={13} />} onClick={exportReceipt} disabled={exporting}>{exporting ? 'Exporting…' : 'Export Receipt'}</SecondaryButton>}
            </DrawerStatusBar>
            {exportError && <FormError message={exportError} />}
            {open && p.approvalStatus === 'pending' && <Note tone="amber">{own ? 'You recorded this invoice, so a different person must approve it before it can be paid.' : 'Awaiting a second person\'s approval before payment.'}</Note>}
            {open && p.holdReason && <Note tone="amber">Payment on hold: {p.holdReason}</Note>}
            {p.voidReason && <Note tone="amber">Voided: {p.voidReason}</Note>}
            <TabBar tabs={[{ id: 'details', label: 'Invoice Details' }, { id: 'payments', label: `Payment History (${p.payments.length})` }, { id: 'history', label: 'Activity' }]} active={tab} onChange={setTab} />
            {tab === 'details' && (
              <>
                <DetailGrid items={[
                  ['Payable ID', p.payableId],
                  ['Vendor', populatedName(p.vendor)],
                  ['Project', p.project ? populatedName(p.project) : '—'],
                  ['Invoice no', p.invoiceNo],
                  ['Invoice date', formatDate(p.invoiceDate)],
                  ['Due date', formatDate(p.dueDate)],
                  ['Currency', p.currency !== 'NGN' ? `${p.currency} (rate ${p.exchangeRate})` : p.currency],
                  ['Gross amount', money(p.grossAmount, p.currency)],
                  ['VAT', money(p.vat, p.currency)],
                  ['WHT', money(p.wht, p.currency)],
                  ['Net payable', money(p.netAmount, p.currency)],
                  ['Payment terms', p.paymentTerms || '—'],
                  ['Amount paid', money(p.amountPaid, p.currency)],
                  ['Outstanding balance', money(p.outstanding, p.currency)],
                  ['Purchase order', p.poId ? p.poId.poNo : '—'],
                  ['Goods receipt', p.grnId ? `${p.grnId.grnNo} (${p.grnId.status})` : '—'],
                  ['Approval', p.approvalStatus === 'approved' ? `Approved by ${personName(p.approvedBy)}` : 'Pending second approval'],
                  ['Recorded by', personName(p.createdBy)],
                ]} />
                {p.directPurchaseReason && <Panel title="Direct purchase reason">{p.directPurchaseReason}</Panel>}
                {p.receiptOverrideReason && <Panel title="Receipt override reason">{p.receiptOverrideReason}</Panel>}
                <Panel title="Description">{p.description || 'No description recorded.'}</Panel>
                <DocumentUploads key={p._id} api={payableService} id={p._id} canEdit={perms.attach} />
              </>
            )}
            {tab === 'payments' && (
              p.payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <strong>No Payment History</strong>
                  <span style={{ fontSize: '0.82rem', color: '#64748B' }}>No payments have been recorded for this payable yet.</span>
                  {open && perms.decide && p.approvalStatus === 'approved' && !p.holdReason && <PrimaryButton icon={<FiPlus size={13} />} onClick={() => onAction('pay', p)}>Record Payment</PrimaryButton>}
                </div>
              ) : (
                <SimpleTable
                  columns={[
                    { key: 'paymentDate', label: 'Payment date', render: (r) => formatDate(r.paymentDate) },
                    { key: 'amount', label: 'Amount', render: (r) => money(r.amount, p.currency) },
                    { key: 'method', label: 'Method', render: (r) => r.method || '—' },
                    { key: 'reference', label: 'Reference', render: (r) => r.reference || r.note || '—' },
                    { key: 'bankAccount', label: 'Account', render: (r) => (r.bankAccount ? `${r.bankAccount.accountCode} – ${r.bankAccount.accountName}` : 'Default') },
                  ]}
                  rows={p.payments.map((x) => ({ ...x, key: String(x.paymentId) }))}
                />
              )
            )}
            {tab === 'history' && <HistoryList key={p._id + refreshKey} api={payableService} id={p._id} />}
          </div>
        )}
      </DataState>
    </Drawer>
  );
}

/* ───────────────────────────── Payables tab ───────────────────────────── */

function PayablesTab({ perms, myId, onChanged, showToast, refreshKey }) {
  const list = useFinanceList(payablesSlice, { initialFilters: { status: '', vendor: '' }, withStats: false });
  const run = useRunAction(payablesSlice);
  const vendors = useVendorOptions();
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [formFor, setFormFor] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  useEffect(() => { if (refreshKey) reload(); }, [refreshKey, reload]);
  const refreshAll = () => { reload(); onChanged(); setLocalKey((k) => k + 1); };

  const afterSave = (message, failedUploads) => {
    setFormFor(null);
    setPayFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, 'success');
  };

  const simple = async (method, p, message, ...extra) => {
    setBusy(true);
    setActionError('');
    const result = await run(method, p._id, ...extra);
    setBusy(false);
    if (!result.ok) { setActionError(result.error); return; }
    setDialog(null);
    refreshAll();
    showToast(message, 'success');
  };

  const handleAction = (kind, p) => {
    setActionError('');
    if (kind === 'edit') setFormFor(p);
    else if (kind === 'pay') setPayFor(p);
    else setDialog({ kind, p });
  };

  const exportReceipt = async (p) => {
    const failure = await downloadFile(() => payableService.pdf(p._id), `${p.payableId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'payables.csv',
        fetchPage: (n) => payableService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Payable ID', value: (r) => r.payableId },
          { label: 'Vendor', value: (r) => populatedName(r.vendor) },
          { label: 'Project', value: (r) => (r.project ? populatedName(r.project) : '') },
          { label: 'Invoice No', value: (r) => r.invoiceNo },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Gross Amount', value: (r) => csvMoney(r.grossAmount) },
          { label: 'VAT', value: (r) => csvMoney(r.vat) },
          { label: 'WHT', value: (r) => csvMoney(r.wht) },
          { label: 'Net Amount', value: (r) => csvMoney(r.netAmount) },
          { label: 'Outstanding', value: (r) => csvMoney(r.outstanding) },
          { label: 'Due Date', value: (r) => ymd(r.dueDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
          { label: 'Approval', value: (r) => r.approvalStatus },
        ],
      });
      showToast(`Exported ${count} payable${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const menuFor = (p) => {
    const open = OPEN_PAYABLE.includes(p.status);
    const own = p.createdBy && String(refId(p.createdBy)) === String(myId);
    const items = [];
    if (open && p.approvalStatus === 'pending' && perms.approve && !own) items.push({ label: 'Approve for Payment', icon: <FiCheck size={14} />, color: '#16A34A', action: () => handleAction('approve', p) });
    if (open && p.holdReason && perms.approve) items.push({ label: 'Release Hold', icon: <FiUnlock size={14} />, action: () => handleAction('release', p) });
    if (open && perms.decide && p.approvalStatus === 'approved' && !p.holdReason) items.push({ label: 'Record Payment', icon: <FiCreditCard size={14} />, action: () => handleAction('pay', p) });
    if (open && perms.update) items.push({ label: 'Edit Record', icon: <FiEdit2 size={14} />, action: () => handleAction('edit', p) });
    if (open && perms.decide && p.payments.length === 0) items.push({ label: 'Void Payable', icon: <FiX size={14} />, color: '#DC2626', action: () => handleAction('void', p) });
    if (p.payments.length > 0) items.push({ label: 'Export Receipt', icon: <FiDownload size={14} />, action: () => exportReceipt(p) });
    return items;
  };

  const columns = [
    { key: 'payableId', label: 'PAYABLE ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'vendor', label: 'VENDOR', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{populatedName(v)}</span> },
    { key: 'project', label: 'PROJECT', render: (v) => (v ? populatedName(v) : '—') },
    { key: 'invoiceNo', label: 'INVOICE' },
    { key: 'grossAmount', label: 'GROSS AMOUNT', render: (v, row) => money(v, row.currency) },
    { key: 'wht', label: 'WHT', render: (v, row) => money(v, row.currency) },
    { key: 'netAmount', label: 'NET AMOUNT', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (v) => formatDate(v) },
    {
      key: 'status', label: 'STATUS',
      render: (v, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <StatusBadge status={v} />
          {OPEN_PAYABLE.includes(v) && row.holdReason && <Tag tone="red">On hold</Tag>}
          {OPEN_PAYABLE.includes(v) && !row.holdReason && row.approvalStatus === 'pending' && <Tag tone="amber">Awaiting approval</Tag>}
        </div>
      ),
    },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = menuFor(row);
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View payable" aria-label="View payable"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search payable ID, vendor, invoice no, project…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting}>
        {perms.create && <PrimaryButton icon={<FiPlus size={14} />} onClick={() => setFormFor('new')}>Record Payable</PrimaryButton>}
      </ListToolbar>
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No payables found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No payables found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />

      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Payables" subtitle="Filter by settlement status and vendor"
        fields={[
          { key: 'status', label: 'Payment status', options: PAYABLE_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' },
          { key: 'approvalStatus', label: 'Approval', options: [{ value: 'pending', label: 'Awaiting approval' }, { value: 'approved', label: 'Approved' }], allLabel: 'All' },
          { key: 'vendor', label: 'Vendor', options: vendors.options.map((v) => ({ value: v.value, label: v.label })), allLabel: 'All vendors' },
        ]}
        values={{ approvalStatus: '', ...list.filters }} onApply={list.applyFilters}
      />
      {viewId && <PayableDrawer payableId={viewId} perms={perms} myId={myId} refreshKey={localKey} onClose={() => setViewId(null)} onAction={handleAction} />}
      {formFor && <PayableFormModal payable={formFor === 'new' ? null : formFor} perms={perms} onClose={() => setFormFor(null)} onSaved={afterSave} />}
      {payFor && <RecordPaymentModal kind="payment" slice={payablesSlice} api={payableService} record={payFor} canAttach={perms.attach} onClose={() => setPayFor(null)} onSaved={afterSave} />}

      {dialog?.kind === 'approve' && (
        <ConfirmModal title="Approve for payment?" message="This is the second-person approval. After it, payments can be recorded against this vendor invoice." detail={`${dialog.p.payableId} – ${populatedName(dialog.p.vendor)}`} confirmLabel="Approve" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={() => simple('approve', dialog.p, `${dialog.p.payableId} approved for payment`)} />
      )}
      {dialog?.kind === 'release' && (
        <ReasonModal title="Release payment hold?" message="The goods on the linked order failed inspection. Releasing the hold lets this invoice be paid." detail={dialog.p.payableId} label="Reason for releasing the hold" confirmLabel="Release Hold" busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={(reason) => simple('releaseHold', dialog.p, 'Payment hold released', reason)} />
      )}
      {dialog?.kind === 'void' && (
        <ReasonModal title="Void payable?" message="The booking is reversed. A payable that has been paid against cannot be voided." detail={`${dialog.p.payableId} – ${populatedName(dialog.p.vendor)}`} label="Reason for voiding" confirmLabel="Void Payable" danger busy={busy} error={actionError} onClose={() => setDialog(null)} onConfirm={(reason) => simple('void', dialog.p, 'Payable voided', reason)} />
      )}
    </div>
  );
}

/* ───────────────────────────── Receivables tab ───────────────────────────── */

function ReceivablesTab({ perms, onChanged, showToast, refreshKey }) {
  const list = useFinanceList(invoicesSlice, { initialFilters: { status: '' }, withStats: false });
  const run = useRunAction(invoicesSlice);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [payFor, setPayFor] = useState(null);
  const [remindFor, setRemindFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [localKey, setLocalKey] = useState(0);
  const { reload } = list;

  useEffect(() => { if (refreshKey) reload(); }, [refreshKey, reload]);
  const refreshAll = () => { reload(); onChanged(); setLocalKey((k) => k + 1); };

  const afterSave = (message, failedUploads) => {
    setPayFor(null);
    refreshAll();
    if (failedUploads?.length) showToast(`${message}. Some documents were not uploaded: ${failedUploads.join('; ')}`, 'error');
    else showToast(message, 'success');
  };

  const remind = async () => {
    setBusy(true);
    setActionError('');
    const result = await run('sendReminder', remindFor._id);
    setBusy(false);
    if (!result.ok) { setActionError(result.error); return; }
    setRemindFor(null);
    refreshAll();
    showToast('Payment reminder sent', 'success');
  };

  const handleAction = (kind, inv) => {
    setActionError('');
    if (kind === 'pay') setPayFor(inv);
  };

  const exportReceipt = async (inv) => {
    const failure = await downloadFile(() => invoiceService.pdf(inv._id), `${inv.invoiceId}.pdf`);
    if (failure) showToast(failure, 'error');
  };

  const exportList = async () => {
    setExporting(true);
    try {
      const count = await exportRowsCsv({
        filename: 'receivables.csv',
        fetchPage: (n) => invoiceService.list({ ...list.params, page: n, limit: 100 }),
        columns: [
          { label: 'Receivable ID', value: (r) => r.invoiceId },
          { label: 'Client', value: (r) => populatedName(r.client) },
          { label: 'Project', value: (r) => (r.project ? populatedName(r.project) : '') },
          { label: 'Currency', value: (r) => r.currency },
          { label: 'Invoice Amount', value: (r) => csvMoney(r.netReceivable) },
          { label: 'Outstanding', value: (r) => csvMoney(r.outstanding) },
          { label: 'Due Date', value: (r) => ymd(r.dueDate) },
          { label: 'Status', value: (r) => statusLabel(r.status) },
        ],
      });
      showToast(`Exported ${count} receivable${count === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      showToast(apiError(err, 'Export failed'), 'error');
    }
    setExporting(false);
  };

  const menuFor = (inv) => {
    const items = [];
    if (OPEN_INVOICE.includes(inv.status) && perms.invoiceDecide) {
      items.push({ label: 'Record Payment', icon: <FiCreditCard size={14} />, action: () => handleAction('pay', inv) });
      items.push({ label: 'Payment Reminder', icon: <FiSend size={14} />, action: () => { setActionError(''); setRemindFor(inv); } });
    }
    if (inv.status !== 'cancelled') items.push({ label: 'Export Receipt', icon: <FiDownload size={14} />, action: () => exportReceipt(inv) });
    return items;
  };

  const columns = [
    { key: 'invoiceId', label: 'RECEIVABLE ID', render: (v, row) => <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setViewId(row._id)}>{v}</span> },
    { key: 'client', label: 'CLIENT', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{populatedName(v)}</span> },
    { key: 'project', label: 'PROJECT', render: (v) => (v ? populatedName(v) : '—') },
    { key: 'netReceivable', label: 'INVOICE AMOUNT', render: (v, row) => money(v, row.currency) },
    { key: 'outstanding', label: 'OUTSTANDING', render: (v, row) => <span style={{ fontWeight: 600 }}>{money(v, row.currency)}</span> },
    { key: 'dueDate', label: 'DUE DATE', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const entries = menuFor(row);
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <button type="button" className="icon-btn" onClick={() => setViewId(row._id)} title="View receivable" aria-label="View receivable"><FiEye size={15} /></button>
            {entries.length > 0 && <RowMenu items={entries} />}
          </div>
        );
      },
    },
  ];

  return (
    <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
      <ListToolbar search={list.searchText} onSearch={list.onSearch} placeholder="Search receivable ID, client, project…" onFilter={() => setFilterOpen(true)} filterCount={countFilters(list.filters)} onExport={exportList} exporting={exporting} />
      <DataState loading={list.loading && list.items.length === 0} error={list.error} empty={!list.loading && list.items.length === 0} emptyText="No receivables found." onRetry={list.reload}>
        <DataTable columns={columns} data={list.items} keyField="_id" emptyMessage="No receivables found." />
      </DataState>
      <Pagination currentPage={list.meta?.page || list.page} totalPages={list.meta?.totalPages || 1} onPageChange={list.setPage} />
      <FilterDrawer
        isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Receivables" subtitle="Filter by settlement status"
        fields={[{ key: 'status', label: 'Payment status', options: INVOICE_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })), allLabel: 'All statuses' }]}
        values={list.filters} onApply={list.applyFilters}
      />
      {viewId && <InvoiceDrawer invoiceId={viewId} idLabel="Receivable ID" perms={{ decide: perms.invoiceDecide, attach: perms.invoiceDecide }} refreshKey={localKey} onClose={() => setViewId(null)} onAction={handleAction} />}
      {payFor && <RecordPaymentModal kind="receipt" slice={invoicesSlice} api={invoiceService} record={payFor} canAttach={perms.invoiceDecide} onClose={() => setPayFor(null)} onSaved={afterSave} />}
      {remindFor && (
        <ConfirmModal title="Send payment reminder?" message="The client's contact is emailed a reminder (when external email is enabled for the company)." detail={`${remindFor.invoiceId} – outstanding ${money(remindFor.outstanding, remindFor.currency)}`} confirmLabel="Send Reminder" busy={busy} error={actionError} onClose={() => setRemindFor(null)} onConfirm={remind} />
      )}
    </div>
  );
}

/* ───────────────────────────── Page ───────────────────────────── */

export default function AccountsPayableReceivable() {
  const { toast, showToast, hideToast } = useToast();
  const myId = useSelector((s) => s.auth.user?._id);
  const canPayables = usePermission('finance.payable.view');
  const canReceivables = usePermission('finance.invoice.view');
  const canStatements = usePermission('finance.statement.view');
  const canCreate = usePermission('finance.payable.create');
  const canUpdate = usePermission('finance.payable.update');
  const canDecide = usePermission('finance.payable.decide');
  const perms = {
    create: canCreate,
    update: canUpdate,
    approve: usePermission('finance.payable.approve'),
    decide: canDecide,
    override: usePermission('finance.payable.override'),
    attach: canCreate || canUpdate || canDecide,
    invoiceDecide: usePermission('finance.invoice.decide'),
  };
  const tabs = [
    canPayables && { id: 'payables', label: 'Payables' },
    canReceivables && { id: 'receivables', label: 'Receivables' },
  ].filter(Boolean);
  const [tab, setTab] = useState(null);
  const active = tab && tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;
  const [stats, setStats] = useState({ payables: [], receivables: [], loading: true, error: false });
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      canPayables ? payableService.stats().then((r) => r.data?.data || []) : Promise.resolve([]),
      canReceivables ? invoiceService.stats().then((r) => r.data?.data || []) : Promise.resolve([]),
    ])
      .then(([p, r]) => { if (!cancelled) setStats({ payables: p, receivables: r, loading: false, error: false }); })
      .catch(() => { if (!cancelled) setStats({ payables: [], receivables: [], loading: false, error: true }); });
    return () => { cancelled = true; };
  }, [canPayables, canReceivables, refreshKey]);

  const onChanged = () => setRefreshKey((k) => k + 1);

  const exportAging = async () => {
    setExporting(true);
    const call = active === 'receivables' ? financialStatementService.agedReceivables : financialStatementService.agedPayables;
    const failure = await downloadFile(() => call({}, 'xlsx'), active === 'receivables' ? 'aged-receivables.xlsx' : 'aged-payables.xlsx');
    if (failure) showToast(failure, 'error');
    else showToast('Aging report exported', 'success');
    setExporting(false);
  };

  const tiles = [
    { label: 'Total payable', value: compactMoney(statValue(stats.payables, 'outstanding_amount')), sub: 'Outstanding vendor obligations', icon: <FiDollarSign size={15} />, tone: 'green' },
    { label: 'Total receivables', value: compactMoney(statValue(stats.receivables, 'outstanding_amount')), sub: 'Outstanding client payments', icon: <FiFileText size={15} />, tone: 'amber' },
    { label: 'Overdue payables', value: compactMoney(statValue(stats.payables, 'overdue_amount')), sub: 'Past due vendor payments', icon: <FiAlertTriangle size={15} />, tone: 'red' },
    { label: 'Overdue receivables', value: compactMoney(statValue(stats.receivables, 'overdue_amount')), sub: 'Past due client invoices', icon: <FiClock size={15} />, tone: 'blue' },
  ];

  if (!tabs.length) return <div className="card" style={{ padding: 24, color: '#64748B' }}>You do not have permission to view payables or receivables.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Accounts Payable & Receivable" subtitle="Track vendor obligations, client receivables, payment status, and outstanding balances">
        {canStatements && <SecondaryButton icon={<FiDownload size={14} />} onClick={exportAging} disabled={exporting}>{exporting ? 'Exporting…' : 'Export Aging'}</SecondaryButton>}
      </PageHeader>
      <StatTiles tiles={tiles} loading={stats.loading} error={stats.error} />
      <TabBar tabs={tabs} active={active} onChange={setTab} />
      {active === 'payables' && <PayablesTab perms={perms} myId={myId} onChanged={onChanged} showToast={showToast} refreshKey={0} />}
      {active === 'receivables' && <ReceivablesTab perms={perms} onChanged={onChanged} showToast={showToast} refreshKey={0} />}
    </div>
  );
}
