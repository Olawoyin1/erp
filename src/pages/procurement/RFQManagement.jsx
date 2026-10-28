import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiPlus, FiEye, FiEdit, FiCheck, FiX, FiCheckCircle, FiAward, FiFileText, FiTrash2, FiSend, FiShoppingBag } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { rfqsSlice } from '../../store/procurement/slices';
import { apiError } from '../../services/apiHelpers';
import { procurementRfqService } from '../../services/procurement.service';
import {
  CATEGORIES, countFilters, fieldErrorsOf, formatDate, fromKobo, money, refId, refName, statChange, statValue, statusLabel, toKobo, uploadStagedFiles, ymd, today,
} from './shared/procUtils';
import { useExport, useLookups, useProcList, useRecord, useRunAction, useSelection } from './shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PageHeader, PrimaryButton, ReasonModal,
  RecordSummary, SecondaryButton, StatTiles, StatusBadge, StatusLine, Tag, TabBar, TwoCol, ViewHeader,
} from './shared/ProcUi';
import { AttachField, AttachToRecordDialog, DocumentList } from './shared/ProcExtras';
import RfqFormModal from './shared/RfqForm';

const EXPORT_COLUMNS = [
  { label: 'RFQ/RFP ID', value: (r) => r.rfqId },
  { label: 'Title', value: (r) => r.rfqTitle },
  { label: 'Type', value: (r) => r.rfqRfp },
  { label: 'Category', value: (r) => r.procurementCategory },
  { label: 'Vendors Invited', value: (r) => (r.invitedVendorIds || []).length },
  { label: 'Closing Date', value: (r) => ymd(r.closingDate) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'under_evaluation', label: 'Under Evaluation' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'cancelled', label: 'Cancelled' },
];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One row per invited vendor: the logged quotation if there is one, otherwise "Awaiting". */
function responseRows(rfq) {
  const byVendor = new Map((rfq.vendorResponses || []).map((r) => [refId(r.vendorId), r]));
  return (rfq.invitedVendorIds || []).map((v) => {
    const id = refId(v);
    const response = byVendor.get(id);
    const hasQuote = response && response.quotedAmount != null;
    let state = 'Awaiting';
    if (hasQuote) state = response.complianceFlag === true ? 'Compliant' : response.complianceFlag === false ? 'Non-compliant' : 'Quoted';
    return { vendorId: id, vendorName: typeof v === 'object' ? v.vendorName : id, response: hasQuote ? response : null, state };
  });
}

function LogResponseModal({ rfq, onClose, onSaved }) {
  const rows = responseRows(rfq);
  const [form, setForm] = useState({
    vendorId: '', quotationNo: '', date: today(), amount: '', currency: 'NGN', deliveryPeriod: '', terms: '', notes: '', compliance: 'yes',
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const pickVendor = (id) => {
    const existing = rows.find((r) => r.vendorId === id)?.response;
    if (!existing) {
      setForm((f) => ({ ...f, vendorId: id }));
      return;
    }
    setForm({
      vendorId: id, quotationNo: existing.vendorQuotationNo || '', date: ymd(existing.quotationDate) || today(), amount: fromKobo(existing.quotedAmount),
      currency: existing.currency || 'NGN', deliveryPeriod: existing.deliveryPeriod || '', terms: existing.proposedPaymentTerms || '', notes: existing.procurementNotes || '',
      compliance: existing.complianceFlag === false ? 'no' : 'yes',
    });
  };

  const submit = async () => {
    const next = {};
    if (!form.vendorId) next.vendorId = 'Choose the vendor that sent the quotation';
    if (!form.quotationNo.trim()) next.vendorQuotationNo = 'Enter the vendor quotation number';
    if (!form.date) next.quotationDate = 'Choose the quotation date';
    if (Number.isNaN(toKobo(form.amount)) || toKobo(form.amount) <= 0) next.quotedAmount = 'Enter the quoted amount, for example 45200000';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      await procurementRfqService.vendorResponses(rfq._id, {
        vendorId: form.vendorId,
        vendorQuotationNo: form.quotationNo.trim(),
        quotationDate: form.date,
        quotedAmount: toKobo(form.amount),
        currency: form.currency,
        ...(form.deliveryPeriod.trim() ? { deliveryPeriod: form.deliveryPeriod.trim() } : {}),
        ...(form.terms.trim() ? { proposedPaymentTerms: form.terms.trim() } : {}),
        ...(form.notes.trim() ? { procurementNotes: form.notes.trim() } : {}),
        complianceFlag: form.compliance === 'yes',
      });
      let note = '';
      if (files.length) {
        const failed = await uploadStagedFiles(procurementRfqService, rfq._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`Quotation logged from ${rows.find((r) => r.vendorId === form.vendorId)?.vendorName || 'the vendor'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The quotation could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Log Vendor Response"
      subtitle="Record a quotation received from an invited vendor. Logging again for the same vendor replaces its quotation."
      width="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save Response'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="RFQ title"><Input value={rfq.rfqTitle} disabled /></Field>
          <Field label="RFQ ID"><Input value={rfq.rfqId} disabled /></Field>
        </TwoCol>
        <Field label="Related requisition"><Input value={`${refName(rfq.relatedRequisitionId, 'requisitionId')}`} disabled /></Field>
        <Field label="Vendor" required error={errors.vendorId}>
          <Choice
            value={form.vendorId}
            onChange={pickVendor}
            placeholder="Select an invited vendor"
            options={rows.map((r) => ({ value: r.vendorId, label: `${r.vendorName}${r.response ? ' (quotation logged)' : ''}` }))}
            error={errors.vendorId}
          />
        </Field>
        <TwoCol>
          <Field label="Vendor quotation no" required error={errors.vendorQuotationNo}>
            <Input value={form.quotationNo} onChange={(e) => set('quotationNo', e.target.value)} error={Boolean(errors.vendorQuotationNo)} />
          </Field>
          <Field label="Quotation date" required error={errors.quotationDate}>
            <DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} error={Boolean(errors.quotationDate)} />
          </Field>
        </TwoCol>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
          <Field label="Quoted amount" required error={errors.quotedAmount}>
            <Input value={form.amount} inputMode="decimal" onChange={(e) => set('amount', e.target.value.replace(/,/g, ''))} placeholder="0.00" error={Boolean(errors.quotedAmount)} />
          </Field>
          <Field label="Currency" error={errors.currency}>
            <Choice value={form.currency} onChange={(v) => set('currency', v)} options={['NGN', 'USD', 'EUR', 'GBP']} />
          </Field>
        </div>
        <TwoCol>
          <Field label="Delivery period" error={errors.deliveryPeriod}>
            <Input value={form.deliveryPeriod} onChange={(e) => set('deliveryPeriod', e.target.value)} placeholder="e.g. 21 Days" />
          </Field>
          <Field label="Proposed payment terms" error={errors.proposedPaymentTerms}>
            <Input value={form.terms} onChange={(e) => set('terms', e.target.value)} placeholder="e.g. 50% advance, balance on delivery" />
          </Field>
        </TwoCol>
        <Field label="Technical compliance">
          <Choice value={form.compliance} onChange={(v) => set('compliance', v)} options={[{ value: 'yes', label: 'Compliant with the specification' }, { value: 'no', label: 'Non-compliant' }]} />
        </Field>
        <Field label="Procurement notes" error={errors.procurementNotes}>
          <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        <Field label="Attach quotation (optional)">
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewRfqModal({ id, refreshKey, tab, onTab, canDecide, canUpdate, canOrder, onAction, onLog, onCreateOrder, onClose }) {
  const { record, error, loading } = useRecord(procurementRfqService, id, refreshKey);
  const rows = record ? responseRows(record) : [];
  const awardedId = record ? refId((record.vendorResponses || []).find((r) => r.awarded)?.vendorId) : '';

  return (
    <Drawer isOpen onClose={onClose} title="RFQ / RFP Details" subtitle="Sourcing request, quotations and evaluation" width="780px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading RFQ…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader icon={<FiFileText size={22} />} title={record.rfqTitle} subtitle={`${record.rfqRfp} • ${record.rfqId}`}>
            {record.status === 'issued' && canDecide && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onAction('close', record)}>Close Bidding</PrimaryButton>}
            {['issued', 'under_evaluation'].includes(record.status) && canDecide && <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onAction('cancel', record)}>Cancel RFQ</SecondaryButton>}
            {record.status === 'awarded' && canOrder && <PrimaryButton icon={<FiShoppingBag size={14} />} onClick={() => onCreateOrder(record)}>Create Purchase Order</PrimaryButton>}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'responses', label: `Vendor Responses (${rows.filter((r) => r.response).length})` }]} active={tab} onChange={onTab} />

          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['RFQ title', record.rfqTitle],
                  ['RFQ / RFP', record.rfqRfp],
                  ['Related requisition', `${refName(record.relatedRequisitionId, 'requisitionId')}${record.relatedRequisitionId?.requestedMaterialService ? `: ${record.relatedRequisitionId.requestedMaterialService}` : ''}`],
                  ['Procurement category', record.procurementCategory],
                  ['Linked project', record.linkedProjectId ? refName(record.linkedProjectId, 'projectName') : 'None'],
                  ['Issue date', formatDate(record.issueDate)],
                  ['Closing date', formatDate(record.closingDate)],
                  ['Invited vendors', plural((record.invitedVendorIds || []).length, 'vendor')],
                  ['Delivery location', refName(record.deliveryLocation, 'name')],
                  ['Payment terms', record.paymentTerms || '—'],
                  ['Status', statusLabel(record.status)],
                  record.status === 'cancelled' ? ['Cancellation reason', record.cancellationReason || '—'] : null,
                ]}
              />
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 16px' }}>Material / Service</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center' }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(record.materialServiceSpecification || []).map((l, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 16px' }}>{l.item}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>{l.quantity}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>{l.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DocumentList key={record._id} api={procurementRfqService} id={record._id} canUpload={canUpdate && ['draft', 'issued', 'under_evaluation'].includes(record.status)} />
            </>
          )}

          {tab === 'responses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rows.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8' }}>No vendors were invited.</div>}
              {rows.map((row) => {
                const isAwarded = record.status === 'awarded' && row.vendorId === awardedId;
                const r = row.response;
                return (
                  <div key={row.vendorId} style={{ border: isAwarded ? '1.5px solid #10B981' : '1px solid #E2E8F0', background: isAwarded ? '#F0FDF4' : '#FFFFFF', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{row.vendorName}</span>
                        {isAwarded && <Tag tone="green">Awarded</Tag>}
                        <Tag tone={row.state === 'Compliant' ? 'green' : row.state === 'Awaiting' ? 'amber' : row.state === 'Non-compliant' ? 'red' : 'blue'}>{row.state}</Tag>
                      </div>
                      {r ? (
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span>Quotation {r.vendorQuotationNo || '—'} • {formatDate(r.quotationDate)}</span>
                          <span>Delivery period: <strong>{r.deliveryPeriod || '—'}</strong> • Terms: {r.proposedPaymentTerms || '—'}</span>
                          {r.procurementNotes && <span>{r.procurementNotes}</span>}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 4 }}>No quotation logged yet.</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>{r ? money(r.quotedAmount, r.currency) : '—'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>Quote value</div>
                      </div>
                      {record.status === 'under_evaluation' && canDecide && r && (
                        <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onAction('award', record, row)}>Award</PrimaryButton>
                      )}
                    </div>
                  </div>
                );
              })}
              {record.status === 'issued' && canUpdate && <SecondaryButton style={{ alignSelf: 'flex-start' }} icon={<FiPlus size={14} />} onClick={() => onLog(record)}>Log New Quotation</SecondaryButton>}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default function RFQManagement() {
  const navigate = useNavigate();
  const canCreate = usePermission('procurement.rfq.create');
  const canUpdate = usePermission('procurement.rfq.update');
  const canDelete = usePermission('procurement.rfq.delete');
  const canDecide = usePermission('procurement.rfq.decide');
  const canOrder = usePermission('procurement.purchaseorder.create');

  const list = useProcList(rfqsSlice, { initialFilters: { status: '', rfqRfp: '', procurementCategory: '', dateFrom: '', dateTo: '' } });
  const run = useRunAction(rfqsSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const { lookups } = useLookups(['projects', 'vendors', 'locations', 'approvedRequisitions']);
  const exporter = useExport(procurementRfqService, list, selection, EXPORT_COLUMNS, 'rfq-register.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [viewTab, setViewTab] = useState('details');
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [logFor, setLogFor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const doAction = async (method, args, success) => {
    setBusy(true);
    setActionError('');
    const res = await run(method, ...args);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      showToast(success, 'success');
      refresh();
    } else {
      setActionError(res.error);
      if (!confirm) showToast(res.error, 'error');
    }
  };

  const ask = (type, row, extra) => { setActionError(''); setConfirm({ type, row, ...extra }); };
  const onViewAction = (type, record, vendorRow) => ask(type, record, { vendor: vendorRow });

  const menuItems = (row) => {
    const items = [];
    if (row.status === 'draft') {
      if (canUpdate) {
        items.push({ label: 'Edit RFQ / RFP', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
        items.push({ label: 'Submit RFQ / RFP', icon: <FiSend size={14} color="#16A34A" />, action: () => doAction('issue', [row._id], 'RFQ issued to the invited vendors') });
      }
      if (canDelete) items.push({ label: 'Delete RFQ / RFP', icon: <FiTrash2 size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('delete', row) });
    }
    if (row.status === 'issued') {
      if (canUpdate) items.push({ label: 'Vendor Response', icon: <FiPlus size={14} color="#2563EB" />, action: () => setLogFor(row) });
      if (canDecide) items.push({ label: 'Close Bidding', icon: <FiCheck size={14} color="#16A34A" />, action: () => ask('close', row) });
    }
    if (['issued', 'under_evaluation'].includes(row.status) && canDecide) {
      items.push({ label: 'Cancel RFQ', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('cancel', row) });
    }
    if (row.status === 'awarded' && canOrder) {
      items.push({ label: 'Create Purchase Order', icon: <FiShoppingBag size={14} color="#2563EB" />, action: () => navigate(`/procurement/orders?fromRfq=${row._id}`) });
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'rfqId', label: 'RFQ/RFP ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'rfqTitle', label: 'TITLE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'rfqRfp', label: 'RFQ / RFP', render: (v) => <span style={{ color: '#475569', fontWeight: 500 }}>{v}</span> },
    { key: 'procurementCategory', label: 'CATEGORY', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'invitedVendorIds', label: 'VENDORS INVITED', align: 'center', render: (v) => <span style={{ fontWeight: 600, color: '#334155' }}>{(v || []).length}</span> },
    { key: 'closingDate', label: 'CLOSING DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View RFQ" aria-label="View RFQ" onClick={() => { setViewId(row._id); setViewTab('details'); }} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDelete, canDecide, canOrder]);

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast('RFQ register exported', 'success');
  };

  const tiles = [
    { label: 'TOTAL RFQS', value: statValue(list.stats, 'total_rfqs'), sub: `+${statChange(list.stats, 'total_rfqs') ?? 0} this week`, icon: <FiFileText size={18} />, tone: 'blue' },
    { label: 'AWAITING EVALUATION', value: statValue(list.stats, 'under_evaluation'), sub: `${statChange(list.stats, 'under_evaluation') ?? 0} closed today`, icon: <FiCheckCircle size={18} />, tone: 'amber' },
    { label: 'AWARDED RFQS', value: statValue(list.stats, 'awarded'), sub: `+${statChange(list.stats, 'awarded') ?? 0} this month`, icon: <FiAward size={18} />, tone: 'green' },
    { label: 'OVERDUE RFQS', value: statValue(list.stats, 'overdue_rfqs'), sub: 'Require attention', subColor: '#DC2626', icon: <FiX size={18} />, tone: 'red' },
  ];

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'rfqRfp', label: 'RFQ / RFP', options: [{ value: 'RFQ', label: 'RFQ' }, { value: 'RFP', label: 'RFP' }] },
    { key: 'procurementCategory', label: 'Procurement category', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'dateFrom', label: 'Closing from', type: 'date' },
    { key: 'dateTo', label: 'Closing to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="RFQ / RFP Management" subtitle="Manage vendor sourcing, quotations, evaluations, and contract awards from one place">
        {(canCreate || canUpdate) && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      <StatTiles tiles={tiles} loading={list.statsLoading && !list.stats.length} error={Boolean(list.statsError)} />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No RFQ or RFP records found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search RFQ/RFP Id, Title ..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Create RFQ / RFP</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter RFQs" subtitle="Narrow the register." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <RfqFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          rfq={formFor === 'new' ? null : formFor}
          lookups={lookups}
          canIssue
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {logFor && (
        <LogResponseModal
          key={logFor._id}
          rfq={logFor}
          onClose={() => setLogFor(null)}
          onSaved={(message) => { setLogFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && (
        <ViewRfqModal
          id={viewId}
          refreshKey={refreshKey}
          tab={viewTab}
          onTab={setViewTab}
          canDecide={canDecide}
          canUpdate={canUpdate}
          canOrder={canOrder}
          onAction={onViewAction}
          onLog={setLogFor}
          onCreateOrder={(record) => navigate(`/procurement/orders?fromRfq=${record._id}`)}
          onClose={() => setViewId(null)}
        />
      )}

      {uploadOpen && (
        <AttachToRecordDialog
          api={procurementRfqService}
          title="Upload RFQ Document"
          recordNoun="RFQ / RFP"
          recordLabel={(r) => `${r.rfqId}: ${r.rfqTitle}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); setRefreshKey((k) => k + 1); }}
        />
      )}

      {confirm?.type === 'close' && (
        <ConfirmModal
          title="Close Bidding?"
          message="After bidding is closed, vendors can no longer submit quotations and procurement can begin vendor evaluation."
          detail={<RecordSummary rows={[['RFQ ID', confirm.row.rfqId], ['RFQ Title', confirm.row.rfqTitle]]} />}
          confirmLabel="Close Bidding"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('closeBidding', [confirm.row._id], `Bidding closed for ${confirm.row.rfqId}`)}
        />
      )}
      {confirm?.type === 'award' && (
        <ConfirmModal
          title="Award Vendor?"
          message={`Are you sure you want to award this RFQ to ${confirm.vendor.vendorName}? Once confirmed, this vendor becomes the selected supplier and a Purchase Order can be generated from this RFQ.`}
          detail={<RecordSummary rows={[['RFQ ID', confirm.row.rfqId], ['RFQ Title', confirm.row.rfqTitle], ['Quoted', money(confirm.vendor.response?.quotedAmount, confirm.vendor.response?.currency)]]} />}
          confirmLabel="Confirm Award"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('award', [confirm.row._id, confirm.vendor.vendorId], `RFQ awarded to ${confirm.vendor.vendorName}`)}
        />
      )}
      {confirm?.type === 'cancel' && (
        <ReasonModal
          title="Cancel RFQ?"
          message="Cancelled RFQs cannot receive vendor quotations and are marked as cancelled in the procurement records."
          detail={<RecordSummary rows={[['RFQ ID', confirm.row.rfqId], ['RFQ Title', confirm.row.rfqTitle]]} />}
          label="Reason for cancellation"
          confirmLabel="Confirm Cancellation"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('cancel', [confirm.row._id, reason], `RFQ ${confirm.row.rfqId} cancelled`)}
        />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Delete RFQ?"
          message="This permanently removes the draft. Only drafts that have not been issued can be deleted."
          detail={<RecordSummary rows={[['RFQ ID', confirm.row.rfqId], ['RFQ Title', confirm.row.rfqTitle]]} />}
          confirmLabel="Delete Draft"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('remove', [confirm.row._id], `RFQ ${confirm.row.rfqId} deleted`)}
        />
      )}
    </div>
  );
}
