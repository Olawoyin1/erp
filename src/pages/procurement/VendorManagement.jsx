import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiUpload, FiPlus, FiEye, FiEdit, FiCheck, FiX, FiCheckCircle, FiShield, FiClock, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { selectCurrentUser } from '../../store/authSlice';
import { prequalificationsSlice, vendorsSlice } from '../../store/procurement/slices';
import { apiError } from '../../services/apiHelpers';
import { vendorPrequalificationService, vendorService } from '../../services/procurement.service';
import {
  countFilters, fieldErrorsOf, formatDate, money, refId, refName, statValue, statusLabel, today, toOptions, uploadStagedFiles, ymd,
} from './shared/procUtils';
import { useExport, useLookups, useProcList, useRecord, useRunAction, useSelection } from './shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, PageHeader, Panel, PrimaryButton,
  ReasonModal, RecordSummary, SecondaryButton, SimpleTable, StatTiles, StatusBadge, StatusLine, Tag, TabBar, TwoCol, ViewHeader,
} from './shared/ProcUi';
import { AttachField, AttachToRecordDialog, DocumentList } from './shared/ProcExtras';

const CATEGORY_PRESETS = [
  'Waste Disposal', 'Cement Supplier', 'Steel Supplier', 'Equipment Supplier', 'Calibration Services', 'Inspection & Certification',
  'Electrical & Instrumentation',
];
const OTHER = '__other__';

const PREQ_EXPORT = [
  { label: 'Prequalification No', value: (p) => p.prequalNo || p._id },
  { label: 'Vendor', value: (p) => p.vendorName },
  { label: 'RC Number', value: (p) => p.vendorRcNumber },
  { label: 'Category', value: (p) => p.vendorCategory },
  { label: 'Assessment Type', value: (p) => p.assessmentType },
  { label: 'Evaluator', value: (p) => refName(p.evaluatorId, 'fullName') },
  { label: 'Score', value: (p) => `${p.score}/10` },
  { label: 'Screening Date', value: (p) => ymd(p.screeningDate) },
  { label: 'Status', value: (p) => statusLabel(p.status) },
];
const AVL_EXPORT = [
  { label: 'Vendor ID', value: (v) => v.vendorId },
  { label: 'Vendor', value: (v) => v.vendorName },
  { label: 'RC Number', value: (v) => v.vendorRcNumber },
  { label: 'Approved Categories', value: (v) => (v.approvedCategories || []).join('; ') },
  { label: 'Approval Date', value: (v) => ymd(v.approvalDate) },
  { label: 'Status', value: (v) => statusLabel(v.status) },
  { label: 'Failed Inspections', value: (v) => v.failedInspectionCount || 0 },
];

const PREQ_STATUS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const AVL_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
];

function PrequalFormModal({ record, lookups, myEmployeeId, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => {
    const category = record?.vendorCategory || '';
    const preset = !category || CATEGORY_PRESETS.includes(category);
    return {
      name: record?.vendorName || '',
      rc: record?.vendorRcNumber || '',
      categoryChoice: preset ? category || CATEGORY_PRESETS[0] : OTHER,
      categoryOther: preset ? '' : category,
      assessmentType: record?.assessmentType || 'Full Prequalification',
      evaluator: record ? refId(record.evaluatorId) : myEmployeeId || '',
      email: record?.email || '',
      phone: record?.phone || '',
      address: record?.physicalAddress || '',
      products: record?.productsServices || '',
      score: record ? String(record.score) : '',
      screeningDate: record ? ymd(record.screeningDate) : today(),
    };
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const category = form.categoryChoice === OTHER ? form.categoryOther.trim() : form.categoryChoice;

  const submit = async () => {
    const next = {};
    if (!form.name.trim()) next.vendorName = 'Enter the vendor name';
    if (!form.rc.trim()) next.vendorRcNumber = 'Enter the RC number';
    if (!category) next.vendorCategory = 'Choose or enter a category';
    const score = Number(form.score);
    if (!Number.isInteger(score) || score < 1 || score > 10) next.score = 'Enter a whole score from 1 to 10';
    if (!form.screeningDate) next.screeningDate = 'Choose the screening date';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    const body = {
      vendorName: form.name.trim(),
      vendorRcNumber: form.rc.trim(),
      vendorCategory: category,
      assessmentType: form.assessmentType,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.address.trim() ? { physicalAddress: form.address.trim() } : {}),
      ...(form.products.trim() ? { productsServices: form.products.trim() } : {}),
      score,
      screeningDate: form.screeningDate,
    };
    try {
      let saved;
      if (editing) {
        const res = await vendorPrequalificationService.update(record._id, body);
        saved = res.data?.data;
      } else {
        const res = await vendorPrequalificationService.create({ ...body, ...(form.evaluator ? { evaluatorId: form.evaluator } : {}) });
        saved = res.data?.data;
      }
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(vendorPrequalificationService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Prequalification updated' : 'Prequalification submitted for approval'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The prequalification could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Details' : 'New Vendor Prequalification'}
      subtitle={editing ? 'Only an assessment still pending approval can be edited.' : 'Register a new vendor for procurement and service management. The vendor joins the Approved Vendor List once the assessment is approved.'}
      maxWidth="720px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Vendor'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Vendor" required error={errors.vendorName}>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. EnviroSafe Nigeria Ltd" error={Boolean(errors.vendorName)} />
        </Field>
        <TwoCol>
          <Field label="Vendor RC number" required error={errors.vendorRcNumber} help="One vendor row per company: a second assessment with the same RC number adds a category to the same vendor.">
            <Input value={form.rc} onChange={(e) => set('rc', e.target.value)} placeholder="e.g. RC-4187" error={Boolean(errors.vendorRcNumber)} />
          </Field>
          <Field label="Vendor category" required error={errors.vendorCategory}>
            <Choice value={form.categoryChoice} onChange={(v) => set('categoryChoice', v)} options={[...CATEGORY_PRESETS, { value: OTHER, label: 'Other (type below)' }]} error={errors.vendorCategory} />
            {form.categoryChoice === OTHER && <Input style={{ marginTop: 6 }} value={form.categoryOther} onChange={(e) => set('categoryOther', e.target.value)} placeholder="Category name" />}
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Assessment type" required error={errors.assessmentType}>
            <Choice value={form.assessmentType} onChange={(v) => set('assessmentType', v)} options={['Full Prequalification', 'Re-assessment']} />
          </Field>
          <Field label="Evaluator" error={errors.evaluatorId} help={editing ? 'Fixed once the assessment is submitted.' : 'Defaults to you.'}>
            <Choice value={form.evaluator} onChange={(v) => set('evaluator', v)} searchable disabled={editing} placeholder="Select an employee" options={toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Email address" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={Boolean(errors.email)} />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
        </TwoCol>
        <Field label="Physical address" error={errors.physicalAddress}>
          <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <Field label="Products/services" error={errors.productsServices}>
          <Textarea rows={2} value={form.products} onChange={(e) => set('products', e.target.value)} />
        </Field>
        <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>Scoring checklist (1-10 index)</div>
          <TwoCol>
            <Field label="Score" required error={errors.score}>
              <Input type="number" min="1" max="10" value={form.score} onChange={(e) => set('score', e.target.value)} error={Boolean(errors.score)} />
            </Field>
            <Field label="Screening date" required error={errors.screeningDate}>
              <DatePicker value={form.screeningDate} onChange={(e) => set('screeningDate', e.target.value)} error={Boolean(errors.screeningDate)} />
            </Field>
          </TwoCol>
        </div>
        {!editing && (
          <Field label="Attach document (optional)">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewPrequalModal({ id, refreshKey, canDecide, canUpdate, onApprove, onReject, onEdit, onClose }) {
  const { record, error, loading } = useRecord(vendorPrequalificationService, id, refreshKey);
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="760px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading assessment…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader title={record.vendorName} subtitle={`${record.prequalNo || 'Prequalification'} • ${record.vendorRcNumber}`}>
            {record.status === 'pending_approval' && canDecide && (
              <>
                <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onApprove(record)}>Approve Vendor</PrimaryButton>
                <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onReject(record)}>Reject</SecondaryButton>
              </>
            )}
            {record.status === 'pending_approval' && canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(record)}>Edit</SecondaryButton>}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          <DetailGrid
            items={[
              ['Prequalification no', record.prequalNo || '—'],
              ['Vendor RC number', record.vendorRcNumber],
              ['Vendor category', record.vendorCategory],
              ['Assessment type', record.assessmentType],
              ['Evaluator', refName(record.evaluatorId, 'fullName')],
              ['Email address', record.email],
              ['Phone number', record.phone],
              ['Screening date', formatDate(record.screeningDate)],
              ['Physical address', record.physicalAddress],
              ['Score', `${record.score}/10`],
              record.vendorId ? ['Vendor on the AVL', `${refName(record.vendorId, 'vendorId')} (${statusLabel(record.vendorId.status)})`] : null,
            ]}
          />
          <Panel title="Products/services">{record.productsServices || '—'}</Panel>
          {record.approvalRemarks && <Panel title={record.status === 'rejected' ? 'Rejection remarks' : 'Approval remarks'} tone={record.status === 'rejected' ? 'red' : 'green'}>{record.approvalRemarks}</Panel>}
          <DocumentList key={record._id} api={vendorPrequalificationService} id={record._id} canUpload={canUpdate && record.status === 'pending_approval'} />
        </div>
      )}
    </Modal>
  );
}

function ViewVendorModal({ id, refreshKey, tab, onTab, canUpdate, onAction, onClose }) {
  const { record, error, loading } = useRecord(vendorService, id, refreshKey);
  const history = record?.procurementHistory || { rfqs: [], orders: [] };
  const assessment = record?.latestAssessment;
  const historyRows = [
    ...history.rfqs.map((r) => ({ _id: `rfq-${r._id}`, ref: r.rfqId, description: r.rfqTitle, date: r.issueDate, status: r.status, kind: 'RFQ' })),
    ...history.orders.map((o) => ({ _id: `po-${o._id}`, ref: o.poNo, description: `${o.procurementCategory || 'Purchase order'} (${money(o.poValue)})`, date: o.poDate, status: o.status, kind: 'PO' })),
  ];
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="760px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading vendor…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader title={record.vendorName} subtitle={`${record.vendorId} • ${record.vendorRcNumber}`}>
            {canUpdate && record.status === 'active' && (
              <>
                <SecondaryButton icon={<FiShield size={14} />} onClick={() => onAction('suspend', record)}>Suspend Vendor</SecondaryButton>
                <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onAction('inactive', record)}>Mark Inactive</SecondaryButton>
              </>
            )}
            {canUpdate && record.status !== 'active' && <PrimaryButton icon={<FiCheck size={14} />} onClick={() => onAction('reactivate', record)}>Mark Active</PrimaryButton>}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />}>
            {record.failedInspectionCount > 0 && (
              <Tag tone="red"><FiAlertTriangle size={11} style={{ verticalAlign: '-1px' }} /> {record.failedInspectionCount} failed inspection{record.failedInspectionCount === 1 ? '' : 's'}</Tag>
            )}
          </StatusLine>
          {record.status !== 'active' && record.statusReason && <Note tone="amber">Reason on record: {record.statusReason}</Note>}
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'Procurement History' }]} active={tab} onChange={onTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Vendor ID', record.vendorId],
                  ['Vendor RC number', record.vendorRcNumber],
                  ['Vendor categories', (record.approvedCategories || []).join(', ')],
                  ['Assessment type', assessment?.assessmentType],
                  ['Evaluator', assessment ? refName(assessment.evaluatorId, 'fullName') : '—'],
                  ['Email address', record.email],
                  ['Phone number', record.phone],
                  ['Screening date', assessment ? formatDate(assessment.screeningDate) : '—'],
                  ['Physical address', record.physicalAddress],
                  ['Latest score', assessment ? `${assessment.score}/10` : '—'],
                  ['Approval date', formatDate(record.approvalDate)],
                  ['Failed inspections', record.failedInspectionCount || 0],
                ]}
              />
              {record.productsServices && <Panel title="Products/services">{record.productsServices}</Panel>}
              <DocumentList key={record._id} api={vendorService} id={record._id} canUpload={canUpdate} title="Vendor documents" />
            </>
          )}
          {tab === 'history' && (
            <SimpleTable
              rows={historyRows}
              empty="No RFQs or purchase orders yet for this vendor."
              columns={[
                { key: 'ref', label: 'Reference', render: (r) => <strong style={{ color: '#1E3A8A' }}>{r.ref}</strong> },
                { key: 'description', label: 'Description' },
                { key: 'date', label: 'Date', align: 'center', render: (r) => formatDate(r.date) },
                { key: 'status', label: 'Status', align: 'right', render: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

export default function VendorManagement() {
  const canCreate = usePermission('procurement.vendorprequalification.create');
  const canUpdatePreq = usePermission('procurement.vendorprequalification.update');
  const canDecide = usePermission('procurement.vendorprequalification.decide');
  const canUpdateVendor = usePermission('procurement.vendor.update');
  const canViewPreq = usePermission('procurement.vendorprequalification.view');
  const canViewVendor = usePermission('procurement.vendor.view');
  const user = useSelector(selectCurrentUser);
  const myEmployeeId = (user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId._id : user?.employeeId) || '';

  const [activeTab, setActiveTab] = useState(canViewPreq ? 'prequalification' : 'avl');
  const preq = useProcList(prequalificationsSlice, { initialFilters: { status: '', vendorCategory: '' }, enabled: canViewPreq });
  const avl = useProcList(vendorsSlice, { initialFilters: { status: '', vendorCategory: '' }, enabled: canViewVendor });
  const runPreq = useRunAction(prequalificationsSlice);
  const runVendor = useRunAction(vendorsSlice);
  const preqSelection = useSelection();
  const avlSelection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const { lookups } = useLookups(['employees']);
  const preqExport = useExport(vendorPrequalificationService, preq, preqSelection, PREQ_EXPORT, 'vendor-prequalifications.csv');
  const avlExport = useExport(vendorService, avl, avlSelection, AVL_EXPORT, 'approved-vendor-list.csv');

  const onPreq = activeTab === 'prequalification';
  const list = onPreq ? preq : avl;
  const exporter = onPreq ? preqExport : avlExport;
  const selection = onPreq ? preqSelection : avlSelection;

  const [formFor, setFormFor] = useState(null);
  const [viewPreqId, setViewPreqId] = useState(null);
  const [viewVendorId, setViewVendorId] = useState(null);
  const [vendorTab, setVendorTab] = useState('details');
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const refresh = () => { preq.reload(); avl.reload(); setRefreshKey((k) => k + 1); };
  const ask = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const doAction = async (runner, method, args, success) => {
    setBusy(true);
    setActionError('');
    const res = await runner(method, ...args);
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

  const preqMenu = (row) => {
    const items = [];
    if (row.status === 'pending_approval') {
      if (canUpdatePreq) items.push({ label: 'Edit Vendor', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
      if (canDecide) {
        items.push({ label: 'Approve Vendor', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('approve', row) });
        items.push({ label: 'Reject Vendor', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('reject', row) });
      }
    }
    return items;
  };

  const avlMenu = (row) => {
    const items = [];
    if (!canUpdateVendor) return items;
    if (row.status === 'active') {
      items.push({ label: 'Suspend Vendor', icon: <FiShield size={14} color="#D97706" />, color: '#D97706', action: () => ask('suspend', row) });
      items.push({ label: 'Mark Inactive', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('inactive', row) });
    } else {
      items.push({ label: 'Mark Active', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('reactivate', row) });
      if (row.status === 'suspended') items.push({ label: 'Mark Inactive', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('inactive', row) });
    }
    return items;
  };

  const preqColumns = useMemo(() => [
    { key: 'prequalNo', label: 'VENDOR ID', render: (v, row) => <span style={{ fontWeight: 500, color: '#334155' }}>{v || row._id.slice(-8).toUpperCase()}</span> },
    { key: 'vendorName', label: 'VENDOR', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'vendorCategory', label: 'VENDOR CATEGORY', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'score', label: 'SCORE', align: 'center', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}/10</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = preqMenu(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Prequalification" aria-label="View prequalification" onClick={() => setViewPreqId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdatePreq, canDecide]);

  const avlColumns = useMemo(() => [
    { key: 'vendorId', label: 'VENDOR ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'vendorName', label: 'VENDOR', render: (v, row) => (
      <span style={{ fontWeight: 600, color: '#0F172A' }}>
        {v} {row.failedInspectionCount > 0 && <Tag tone="red">{row.failedInspectionCount} failed inspection{row.failedInspectionCount === 1 ? '' : 's'}</Tag>}
      </span>
    ) },
    { key: 'approvedCategories', label: 'VENDOR CATEGORY', render: (v) => <span style={{ color: '#475569' }}>{(v || []).join(', ') || '—'}</span> },
    { key: 'approvalDate', label: 'APPROVAL DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = avlMenu(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Vendor Profile" aria-label="View vendor profile" onClick={() => { setViewVendorId(row._id); setVendorTab('details'); }} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdateVendor]);

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(onPreq ? 'Prequalifications exported' : 'Vendor list exported', 'success');
  };

  const tiles = [
    { label: 'TOTAL REQUESTS', value: statValue(preq.stats, 'total_assessments'), sub: 'Vendor applications under review', icon: <FiFileText size={18} />, tone: 'blue' },
    { label: 'APPROVED VENDORS', value: statValue(avl.stats, 'approved_vendors'), sub: 'Available for procurement activities', icon: <FiCheckCircle size={18} />, tone: 'green' },
    { label: 'PENDING REVIEWS', value: statValue(preq.stats, 'pending_approval'), sub: 'Awaiting Quality and HSE assessments', icon: <FiClock size={18} />, tone: 'amber' },
    { label: 'SUSPENDED VENDORS', value: statValue(avl.stats, 'suspended_vendors'), sub: 'Temporarily restricted from procurement', subColor: '#D97706', icon: <FiShield size={18} />, tone: 'amber' },
  ];

  const filterFields = onPreq
    ? [
        { key: 'status', label: 'Status', options: PREQ_STATUS },
        { key: 'vendorCategory', label: 'Vendor category', options: CATEGORY_PRESETS.map((c) => ({ value: c, label: c })) },
      ]
    : [
        { key: 'status', label: 'Status', options: AVL_STATUS },
        { key: 'vendorCategory', label: 'Vendor category', options: CATEGORY_PRESETS.map((c) => ({ value: c, label: c })) },
      ];

  const tabs = [
    ...(canViewPreq ? [{ id: 'prequalification', label: 'Vendor Prequalification' }] : []),
    ...(canViewVendor ? [{ id: 'avl', label: 'Approved Vendor List (AVL)' }] : []),
  ];

  const changeTab = (id) => { setActiveTab(id); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Vendor Management" subtitle="Manage vendor prequalification and approved supplier records">
        {(canCreate || canUpdatePreq || canUpdateVendor) && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      <StatTiles tiles={tiles} loading={(preq.statsLoading || avl.statsLoading) && !preq.stats.length && !avl.stats.length} error={Boolean(preq.statsError && avl.statsError)} />

      <TabBar tabs={tabs} active={activeTab} onChange={changeTab} />

      <ListCard
        key={activeTab}
        list={list}
        columns={onPreq ? preqColumns : avlColumns}
        emptyText={onPreq ? 'No vendor prequalifications found.' : 'No vendors found in the AVL.'}
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder={onPreq ? 'Search by Preq. ID, vendor, RC number ...' : 'Search by Vendor ID, name ...'}
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {onPreq && canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>New Prequalification</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer
        key={activeTab}
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title={onPreq ? 'Filter Prequalifications' : 'Filter Vendors'}
        subtitle="Narrow the list."
        fields={filterFields}
        values={list.filters}
        onApply={list.applyFilters}
      />

      {formFor && (
        <PrequalFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          myEmployeeId={myEmployeeId}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); setViewPreqId(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewPreqId && (
        <ViewPrequalModal
          id={viewPreqId}
          refreshKey={refreshKey}
          canDecide={canDecide}
          canUpdate={canUpdatePreq}
          onApprove={(row) => ask('approve', row)}
          onReject={(row) => ask('reject', row)}
          onEdit={(row) => { setViewPreqId(null); setFormFor(row); }}
          onClose={() => setViewPreqId(null)}
        />
      )}

      {viewVendorId && (
        <ViewVendorModal
          id={viewVendorId}
          refreshKey={refreshKey}
          tab={vendorTab}
          onTab={setVendorTab}
          canUpdate={canUpdateVendor}
          onAction={ask}
          onClose={() => setViewVendorId(null)}
        />
      )}

      {uploadOpen && (
        <AttachToRecordDialog
          api={onPreq ? vendorPrequalificationService : vendorService}
          title={onPreq ? 'Upload Prequalification Document' : 'Upload Vendor Document'}
          recordNoun={onPreq ? 'prequalification' : 'vendor'}
          recordLabel={onPreq ? (p) => `${p.prequalNo || p._id.slice(-8).toUpperCase()}: ${p.vendorName}` : (v) => `${v.vendorId}: ${v.vendorName}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); setRefreshKey((k) => k + 1); }}
        />
      )}

      {confirm?.type === 'approve' && (
        <ReasonModal
          title="Approve Vendor?"
          message="Once approved, the vendor is added to the Approved Vendor List (or the category is added to its existing entry) and becomes available for procurement activities."
          detail={<RecordSummary rows={[['Vendor', confirm.row.vendorName], ['Category', confirm.row.vendorCategory], ['Score', `${confirm.row.score}/10`]]} />}
          label="Approval remarks"
          placeholder="Vendor meets all required qualification criteria."
          confirmLabel="Approve Vendor"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(remarks) => doAction(runPreq, 'approve', [confirm.row._id, remarks], `${confirm.row.vendorName} approved and added to the AVL`)}
        />
      )}
      {confirm?.type === 'reject' && (
        <ReasonModal
          title="Reject Vendor?"
          message="A rejected prequalification is final: the vendor has to be assessed again from a new submission."
          detail={<RecordSummary rows={[['Vendor', confirm.row.vendorName], ['Category', confirm.row.vendorCategory]]} />}
          label="Rejection remarks"
          confirmLabel="Reject Vendor"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(remarks) => doAction(runPreq, 'reject', [confirm.row._id, remarks], 'Vendor prequalification rejected')}
        />
      )}
      {confirm?.type === 'suspend' && (
        <ReasonModal
          title="Suspend Vendor?"
          message="A suspended vendor stays on the list but cannot be invited to RFQs or selected on purchase orders until reactivated."
          detail={<RecordSummary rows={[['Vendor', confirm.row.vendorName], ['Vendor ID', confirm.row.vendorId]]} />}
          label="Reason for suspension"
          confirmLabel="Suspend Vendor"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction(runVendor, 'suspend', [confirm.row._id, reason], `${confirm.row.vendorName} suspended`)}
        />
      )}
      {confirm?.type === 'inactive' && (
        <ReasonModal
          title="Mark Vendor Inactive?"
          message="An inactive vendor can no longer be used in procurement activities. The reason stays on the vendor's record."
          detail={<RecordSummary rows={[['Vendor', confirm.row.vendorName], ['Vendor ID', confirm.row.vendorId]]} />}
          label="Reason"
          confirmLabel="Mark Inactive"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction(runVendor, 'markInactive', [confirm.row._id, reason], `${confirm.row.vendorName} marked inactive`)}
        />
      )}
      {confirm?.type === 'reactivate' && (
        <ConfirmModal
          title="Mark Vendor Active?"
          message="The vendor can be invited to RFQs and selected on purchase orders again."
          detail={<RecordSummary rows={[['Vendor', confirm.row.vendorName], ['Vendor ID', confirm.row.vendorId]]} />}
          confirmLabel="Mark Active"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction(runVendor, 'reactivate', [confirm.row._id], `${confirm.row.vendorName} is active again`)}
        />
      )}
    </div>
  );
}
