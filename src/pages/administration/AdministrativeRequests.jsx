import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiEye, FiCheck, FiX, FiFileText, FiSlash, FiPackage } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { selectCurrentUser } from '../../store/authSlice';
import { admRequestsSlice } from '../../store/administration/slices';
import { apiError } from '../../services/apiHelpers';
import { adminRequestService } from '../../services/admin.service';
import {
  countFilters, fieldErrorsOf, formatDate, refId, refName, statusLabel, toOptions, uploadStagedFiles, ymd,
} from '../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, PageHeader, Panel,
  PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusBadge, StatusLine, TabBar, Tag, TwoCol, ViewHeader,
} from '../procurement/shared/ProcUi';
import { AttachField, DocumentList } from '../procurement/shared/ProcExtras';
import { HistoryTimeline } from './shared/AdmUi';
import { useAdminLookups } from './shared/admHooks';

const CATEGORIES = ['Office Supplies', 'Cleaning Supplies', 'Office Equipment', 'Furniture', 'IT Equipment', 'Stationery', 'Other'];
const UNITS = ['Units', 'Pieces', 'Reams', 'Boxes', 'Packs', 'Rolls', 'Bottles', 'Sets', 'Cartons'];
const URGENCIES = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];
const URGENCY_TONE = { routine: 'slate', urgent: 'amber', critical: 'red' };

const STEP_LABELS = {
  admin_review: 'Admin Review',
  procurement_review: 'Procurement Review',
  finance_approval: 'Finance Approval',
  final_approval: 'Final Approval',
};
const CHAIN = Object.keys(STEP_LABELS);
const STEP_PERMISSIONS = {
  admin_review: 'administration.adminrequest.decide',
  procurement_review: 'administration.adminrequest.decide-procurement',
  finance_approval: 'administration.adminrequest.decide-finance',
  final_approval: 'administration.adminrequest.decide-final',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Issued' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

function RequestStatus({ row }) {
  if (row.status === 'pending') return <StatusBadge status="pending" label={STEP_LABELS[row.currentStep] ? `${STEP_LABELS[row.currentStep]}` : 'Pending'} />;
  if (row.status === 'completed') return <StatusBadge status="issued" label="Issued" />;
  if (row.status === 'cancelled') return <StatusBadge status="draft" label="Cancelled" />;
  return <StatusBadge status={row.status} />;
}

const EXPORT_COLUMNS = [
  { label: 'Request ID', value: (r) => r.requestId },
  { label: 'Request Type', value: (r) => r.requestType },
  { label: 'Request', value: (r) => r.requestTitle },
  { label: 'Quantity', value: (r) => (r.quantity != null ? `${r.quantity} ${r.unit || ''}`.trim() : '') },
  { label: 'Requested By', value: (r) => refName(r.requestedBy, 'fullName') },
  { label: 'Department', value: (r) => refName(r.departmentId, 'name') },
  { label: 'Request Date', value: (r) => ymd(r.submittedAt) },
  { label: 'Required Date', value: (r) => ymd(r.requiredDate) },
  { label: 'Urgency', value: (r) => statusLabel(r.urgency) },
  { label: 'Status', value: (r) => (r.status === 'completed' ? 'Issued' : statusLabel(r.status)) },
  { label: 'Current Step', value: (r) => STEP_LABELS[r.currentStep] || '' },
];

function NewRequestModal({ me, employees, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', category: 'Office Supplies', quantity: '', unit: 'Units', requestedBy: me?.employeeId || '', requiredDate: '', urgency: 'routine', purpose: '',
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.requestTitle = 'Name the item or service you are requesting';
    const qty = Number(form.quantity);
    if (form.quantity === '' || !Number.isFinite(qty) || qty <= 0) next.quantity = 'Enter a quantity above zero';
    if (!form.requestedBy) next.requestedBy = 'Choose who the request is for';
    if (!form.requiredDate) next.requiredDate = 'Choose the date you need it by';
    if (!form.purpose.trim()) next.description = 'Say why this is needed';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await adminRequestService.create({
        requestType: form.category,
        requestedBy: form.requestedBy,
        requestTitle: form.title.trim(),
        description: form.purpose.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        requiredDate: form.requiredDate,
        urgency: form.urgency,
      });
      const saved = res.data?.data;
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(adminRequestService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`Request ${saved?.requestId || ''} submitted for approval.${note}`);
    } catch (err) {
      setError(apiError(err, 'The request could not be submitted'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New Request"
      subtitle="Submit a request for review and approval"
      maxWidth="640px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit Request'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Request" required error={errors.requestTitle}>
          <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. A4 Printing Paper" error={Boolean(errors.requestTitle)} />
        </Field>
        <TwoCol min={150}>
          <Field label="Request category" required error={errors.requestType}>
            <Choice value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES} />
          </Field>
          <Field label="Quantity" required error={errors.quantity}>
            <Input type="number" min="0" step="any" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="0" error={Boolean(errors.quantity)} />
          </Field>
          <Field label="Unit" required error={errors.unit}>
            <Choice value={form.unit} onChange={(v) => set('unit', v)} options={UNITS} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Requested by" required error={errors.requestedBy}>
            {me?.employeeId ? (
              <Input value={me.fullName} disabled />
            ) : (
              <Choice value={form.requestedBy} onChange={(v) => set('requestedBy', v)} searchable placeholder="Select an employee" options={toOptions(employees, (e) => `${e.fullName} (${e.employeeId})`)} error={errors.requestedBy} />
            )}
          </Field>
          <Field label="Required date" required error={errors.requiredDate}>
            <DatePicker value={form.requiredDate} onChange={(e) => set('requiredDate', e.target.value)} error={Boolean(errors.requiredDate)} />
          </Field>
        </TwoCol>
        <Field label="Urgency" required error={errors.urgency}>
          <div style={{ maxWidth: 260 }}><Choice value={form.urgency} onChange={(v) => set('urgency', v)} options={URGENCIES} /></div>
        </Field>
        <Field label="Purpose" required error={errors.description}>
          <Textarea rows={3} value={form.purpose} onChange={(e) => set('purpose', e.target.value)} placeholder="Why is this needed?" error={Boolean(errors.description)} />
        </Field>
        <Field label="Attach document (optional)">
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewRequestModal({ id, refreshKey, actions, ownRequest, canApproveNow, canUpload, onClose }) {
  const { record, error, loading } = useRecord(adminRequestService, id, refreshKey);
  const [tab, setTab] = useState('details');
  const remaining = record && record.status === 'pending' && record.currentStep ? CHAIN.slice(CHAIN.indexOf(record.currentStep)).map((s) => STEP_LABELS[s]) : [];
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="720px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading request…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiFileText size={22} />} title={record.requestTitle} subtitle={`${refName(record.requestedBy, 'fullName')} • ${record.requestId}`}>
            {actions(record)}
          </ViewHeader>
          <StatusLine status={<RequestStatus row={record} />} />
          {record.status === 'pending' && ownRequest(record) && canApproveNow(record) && (
            <Note tone="amber">You raised this request, so another approver has to decide it.</Note>
          )}
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'Approval History' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Request ID', record.requestId],
                  ['Request', record.requestTitle],
                  ['Request type', record.requestType],
                  ['Quantity', record.quantity != null ? `${record.quantity} ${record.unit || ''}`.trim() : '—'],
                  ['Requested by', refName(record.requestedBy, 'fullName')],
                  ['Department', refName(record.departmentId, 'name')],
                  ['Request date', formatDate(record.submittedAt)],
                  ['Required date', formatDate(record.requiredDate)],
                  ['Urgency', statusLabel(record.urgency)],
                  ['Status', record.status === 'completed' ? 'Issued' : record.status === 'pending' ? `In approval: ${STEP_LABELS[record.currentStep] || 'Pending'}` : statusLabel(record.status)],
                ]}
              />
              <Panel title="Purpose">{record.description || 'No purpose was entered.'}</Panel>
              {record.status === 'rejected' && <Panel title="Rejection reason" tone="red">{record.rejectionReason || 'No reason was recorded.'}</Panel>}
              {record.status === 'cancelled' && <Panel title="Cancellation" tone="slate">{record.cancelReason || 'The request was withdrawn.'}</Panel>}
              <DocumentList key={record._id} api={adminRequestService} id={record._id} canUpload={canUpload(record)} />
            </>
          )}
          {tab === 'history' && (
            <HistoryTimeline key={`${record._id}-${refreshKey}`} load={adminRequestService.history} id={record._id} title="Approval history" pending={remaining} />
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdministrativeRequests() {
  const { can, isSuperAdmin } = usePermissions();
  const canCreate = can('administration.adminrequest.create');
  const canUpdate = can('administration.adminrequest.update');
  const canDecide = can('administration.adminrequest.decide');
  const canExport = can('administration.adminrequest.export');
  const user = useSelector(selectCurrentUser);
  const { lookups } = useAdminLookups(['me', 'departments', 'employees']);
  const me = lookups.me || null;
  const myEmployeeId = me?.employeeId || (user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId._id : user?.employeeId) || '';
  const ownRequest = (r) => Boolean(myEmployeeId) && refId(r.requestedBy) === myEmployeeId;
  const canApproveNow = (r) => r.status === 'pending' && Boolean(STEP_PERMISSIONS[r.currentStep]) && (isSuperAdmin || can(STEP_PERMISSIONS[r.currentStep]));
  const canWithdraw = (r) => r.status === 'pending' && (canUpdate || ownRequest(r));
  const canAttach = (r) => r.status === 'pending' && (canUpdate || ownRequest(r));

  const list = useProcList(admRequestsSlice, { initialFilters: { status: '', urgency: '', requestType: '', departmentId: '' }, withStats: false });
  const run = useRunAction(admRequestsSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const exporter = useExport(adminRequestService, list, selection, EXPORT_COLUMNS, 'requests.csv');

  const [formOpen, setFormOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
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
    return res.ok;
  };

  const open = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const menuItems = (row) => {
    const items = [];
    if (canApproveNow(row) && !ownRequest(row)) {
      items.push({ label: 'Approve Request', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('approve', row) });
    }
    if (row.status === 'pending' && canDecide && !ownRequest(row)) {
      items.push({ label: 'Reject Request', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => open('reject', row) });
    }
    if (row.status === 'approved' && canDecide) {
      items.push({ label: 'Mark as Issued', icon: <FiPackage size={14} color="#2563EB" />, action: () => open('complete', row) });
    }
    if (canWithdraw(row)) {
      items.push({ label: 'Cancel Request', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => open('cancel', row) });
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'requestId', label: 'REQUEST ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'requestType', label: 'REQUEST TYPE', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'requestTitle', label: 'REQUEST', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'quantity', label: 'QTY', render: (v, row) => <span style={{ color: '#334155' }}>{v != null ? `${v} ${row.unit || ''}`.trim() : '—'}</span> },
    { key: 'requestedBy', label: 'REQUESTED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'submittedAt', label: 'REQUEST DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'urgency', label: 'URGENCY', render: (v) => <Tag tone={URGENCY_TONE[v] || 'slate'}>{statusLabel(v)}</Tag> },
    { key: 'status', label: 'STATUS', render: (_, row) => <RequestStatus row={row} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Request" aria-label="View request" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [can, isSuperAdmin, myEmployeeId]);

  const viewActions = (record) => (
    <>
      {canApproveNow(record) && !ownRequest(record) && (
        <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('approve', record)}>Approve</PrimaryButton>
      )}
      {record.status === 'pending' && canDecide && !ownRequest(record) && (
        <SecondaryButton danger icon={<FiX size={14} />} onClick={() => open('reject', record)}>Reject</SecondaryButton>
      )}
      {record.status === 'approved' && canDecide && (
        <PrimaryButton icon={<FiPackage size={14} />} onClick={() => open('complete', record)}>Mark as Issued</PrimaryButton>
      )}
      {canWithdraw(record) && (
        <SecondaryButton danger icon={<FiSlash size={14} />} onClick={() => open('cancel', record)}>Cancel Request</SecondaryButton>
      )}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected requests exported` : 'Requests exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'urgency', label: 'Urgency', options: URGENCIES },
    { key: 'requestType', label: 'Request type', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'departmentId', label: 'Department', options: toOptions(lookups.departments, 'name') },
  ];

  const summary = (row) => <RecordSummary rows={[['Request', row.requestId], ['Item', row.requestTitle]]} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Requests" subtitle="Submit and track requests for materials, equipment, or supplies from the store" />

      <ListCard
        list={list}
        columns={columns}
        emptyText="No requests found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by id, request..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormOpen(true)}>New Request</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Requests" subtitle="Narrow the list by status, urgency and more." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formOpen && (
        <NewRequestModal
          me={me}
          employees={lookups.employees}
          onClose={() => setFormOpen(false)}
          onSaved={(message) => { setFormOpen(false); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && (
        <ViewRequestModal
          id={viewId}
          refreshKey={refreshKey}
          actions={viewActions}
          ownRequest={ownRequest}
          canApproveNow={canApproveNow}
          canUpload={canAttach}
          onClose={() => setViewId(null)}
        />
      )}

      {confirm?.type === 'approve' && (
        <ConfirmModal
          title="Approve Request?"
          message={`Are you sure you want to approve ${confirm.row.requestId}? Once approved, the request will move to the next stage for execution.`}
          detail={summary(confirm.row)}
          confirmLabel="Approve Request"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('approve', [confirm.row._id], 'Request approved')}
        />
      )}
      {confirm?.type === 'reject' && (
        <ReasonModal
          title="Reject Request?"
          message={`Are you sure you want to reject ${confirm.row.requestId}? A rejection reason is required and the requester will be notified.`}
          label="Reason for rejection"
          confirmLabel="Reject Request"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('reject', [confirm.row._id, reason], 'Request rejected')}
        />
      )}
      {confirm?.type === 'cancel' && (
        <ReasonModal
          title="Cancel Request?"
          message="The request is withdrawn from the approval chain and cannot be revived."
          detail={summary(confirm.row)}
          label="Reason (optional)"
          required={false}
          confirmLabel="Cancel Request"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('cancel', [confirm.row._id, reason], 'Request cancelled')}
        />
      )}
      {confirm?.type === 'complete' && (
        <ConfirmModal
          title="Mark as Issued?"
          message="Confirm that the items for this approved request have been issued to the requester."
          detail={summary(confirm.row)}
          confirmLabel="Mark as Issued"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('complete', [confirm.row._id], 'Request marked as issued')}
        />
      )}
    </div>
  );
}
