import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiEye, FiCheck, FiX, FiFileText, FiSlash, FiPackage, FiDownload, FiPaperclip } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
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
  Choice, ConfirmModal, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar,
  PageHeader, PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusBadge, Tag, TwoCol,
} from '../procurement/shared/ProcUi';
import { AttachField } from '../procurement/shared/ProcExtras';
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

// The department the request is filed under: the signed-in person's own department; when their account has none,
// the department that matches the module whose Requests page they are on (e.g. "finance" -> "Finance and Accounts"; `|` separates alternatives).
function defaultDepartmentId(me, departments, moduleName) {
  if (me?.departmentId) return me.departmentId;
  if (!moduleName) return '';
  const needles = moduleName.toLowerCase().split('|');
  const match = (departments || []).find((d) => needles.some((n) => String(d.name || '').toLowerCase().includes(n)));
  return match?._id || '';
}

function NewRequestModal({ me, employees, departments, moduleName, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', category: 'Office Supplies', quantity: '', unit: 'Units', requestedBy: me?.employeeId || '', requiredDate: '', urgency: 'routine', purpose: '',
    departmentId: defaultDepartmentId(me, departments, moduleName),
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
        ...(form.departmentId ? { departmentId: form.departmentId } : {}),
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
        <Field label="Department" error={errors.departmentId}>
          {me?.departmentId ? (
            <Input value={me.departmentName || ''} disabled />
          ) : (
            <Choice value={form.departmentId} onChange={(v) => set('departmentId', v)} searchable placeholder="Select a department" options={toOptions(departments, 'name')} error={errors.departmentId} />
          )}
        </Field>
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

// ─── Urgency pill ─────────────────────────────────────────────────────────────
const URGENCY_STYLES = {
  critical: { bg: '#FEE2E2', color: '#DC2626' },
  urgent:   { bg: '#FEF3C7', color: '#D97706' },
  routine:  { bg: '#F1F5F9', color: '#64748B' },
};
function UrgencyPill({ value }) {
  const s = URGENCY_STYLES[value] || URGENCY_STYLES.routine;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
      {statusLabel(value)}
    </span>
  );
}

// ─── History item (matches HR Requests style) ─────────────────────────────────
function HistoryItem({ color, title, titleColor = '#0F172A', subtitle, when }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: -25, top: 0, width: 16, height: 16, borderRadius: '50%', backgroundColor: color, border: '3px solid #fff' }} />
      <div style={{ fontSize: '0.85rem', color: titleColor, fontWeight: 600 }}>{title}</div>
      {subtitle ? <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{subtitle}</div> : null}
      {when ? <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>{formatDate(when)}</div> : null}
    </div>
  );
}

// ─── View Request Drawer ──────────────────────────────────────────────────────
function ViewRequestDrawer({ id, refreshKey, onClose, canApproveNow, ownRequest, canUpload, onApprove, onReject, onComplete, onCancel, busy }) {
  const { showToast } = useToast();
  const { record, error, loading } = useRecord(adminRequestService, id, refreshKey);
  const [tab, setTab] = useState('details');
  const [fileState, setFileState] = useState({ id: null, files: [], loading: false });

  // load attachments when record arrives
  useState(() => {});
  const loadFiles = (recordId) => {
    if (!recordId || fileState.id === recordId) return;
    setFileState({ id: recordId, files: [], loading: true });
    adminRequestService.attachments(recordId)
      .then((r) => setFileState({ id: recordId, files: r.data?.data || [], loading: false }))
      .catch(() => setFileState({ id: recordId, files: [], loading: false }));
  };
  if (record?._id && fileState.id !== record._id) loadFiles(record._id);

  const files = fileState.id === record?._id ? fileState.files : [];
  const filesLoading = fileState.loading;

  const openFile = async (file) => {
    try {
      const res = await adminRequestService.attachmentUrl(record._id, file._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const remaining = record && record.status === 'pending' && record.currentStep
    ? CHAIN.slice(CHAIN.indexOf(record.currentStep)).map((s) => STEP_LABELS[s])
    : [];

  const canAct = record && canApproveNow(record) && !ownRequest(record);
  const isOwn = record && ownRequest(record);

  const detailRows = record ? [
    ['Request ID', record.requestId],
    ['Request', record.requestTitle],
    ['Request type', record.requestType],
    ['Quantity', record.quantity != null ? `${record.quantity} ${record.unit || ''}`.trim() : '—'],
    ['Requested by', refName(record.requestedBy, 'fullName')],
    ['Department', refName(record.departmentId, 'name')],
    ['Request date', formatDate(record.submittedAt)],
    ['Required date', formatDate(record.requiredDate)],
    ['Urgency', <UrgencyPill key="u" value={record.urgency} />],
    ['Status', <RequestStatus key="s" row={record} />],
  ] : [];

  return (
    <Drawer isOpen onClose={onClose} title="View Request" width="520px">
      {loading && <div style={{ padding: 24, color: '#64748B', fontSize: '0.875rem' }}>Loading request…</div>}
      {error && <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.82rem', margin: '0 0 16px' }}>{error}</div>}

      {record && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{record.requestTitle || record.requestType}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
              {refName(record.requestedBy, 'fullName')} &bull; {record.requestId}
            </p>
          </div>

          {/* Action bar — pending */}
          {record.status === 'pending' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Waiting on <strong style={{ color: '#0F172A' }}>{STEP_LABELS[record.currentStep] || 'review'}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {canAct && (
                  <button onClick={() => onApprove(record)} disabled={busy}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#10B981', color: '#fff', borderRadius: 6, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                    <FiCheck size={14} /> Approve
                  </button>
                )}
                {record.status === 'pending' && !ownRequest(record) && (
                  <button onClick={() => onReject(record)} disabled={busy}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: 6, border: '1px solid #FECACA', cursor: busy ? 'not-allowed' : 'pointer' }}>
                    <FiX size={14} /> Reject
                  </button>
                )}
                {canUpload(record) && (
                  <button onClick={() => onCancel(record)} disabled={busy}
                    style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#fff', color: '#64748B', borderRadius: 6, border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                    Cancel request
                  </button>
                )}
              </div>
              {isOwn && (
                <div style={{ flexBasis: '100%', fontSize: '0.75rem', color: '#B45309' }}>You raised this request — a different approver must decide it.</div>
              )}
            </div>
          )}

          {/* Action bar — approved */}
          {record.status === 'approved' && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => onComplete(record)} disabled={busy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px', fontSize: '0.85rem', backgroundColor: '#10B981', color: '#fff', borderRadius: 6, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                <FiCheck size={14} /> Mark as Issued
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
            {[['details', 'Details'], ['history', 'Approval History']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #1D4ED8' : '2px solid transparent', color: tab === key ? '#1D4ED8' : '#64748B', fontWeight: tab === key ? 600 : 400, cursor: 'pointer', fontSize: '0.9rem' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Details tab */}
          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                {detailRows.map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {record.description && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Purpose</div>
                  <div style={{ fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{record.description}</div>
                </div>
              )}

              {record.status === 'rejected' && record.rejectionReason && (
                <div style={{ backgroundColor: '#FEF2F2', padding: 16, borderRadius: 8, border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '0.75rem', color: '#991B1B', textTransform: 'uppercase', marginBottom: 8 }}>Rejection reason</div>
                  <div style={{ fontSize: '0.875rem', color: '#991B1B' }}>{record.rejectionReason}</div>
                </div>
              )}

              {record.status === 'cancelled' && (
                <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Cancellation</div>
                  <div style={{ fontSize: '0.875rem', color: '#334155' }}>{record.cancelReason || 'The request was withdrawn.'}</div>
                </div>
              )}

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Attached documents</div>
                {filesLoading ? (
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Loading…</div>
                ) : files.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No documents attached.</div>
                ) : files.map((f) => (
                  <div key={f._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: 6, marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#0F172A' }}>
                      <FiPaperclip size={14} /> {f.originalName}
                    </span>
                    <button className="icon-btn" title="Open" onClick={() => openFile(f)}><FiDownload size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div style={{ position: 'relative', borderLeft: '2px solid #E2E8F0', paddingLeft: 16, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <HistoryItem color="#1E3A8A" title="Request submitted" subtitle={`Submitted by ${refName(record.requestedBy, 'fullName')}`} when={record.submittedAt} />
              {(record.approvals || []).map((approval, i) => (
                <HistoryItem key={`${approval.step}-${i}`} color="#10B981"
                  title={STEP_LABELS[approval.step] || statusLabel(approval.step)}
                  subtitle={`Approved by ${refName(approval.by, 'fullName')}`}
                  when={approval.at} />
              ))}
              {record.status === 'pending' && record.currentStep && (
                <HistoryItem color="#F59E0B" title={STEP_LABELS[record.currentStep]} subtitle="Waiting for reviewer" />
              )}
              {remaining.slice(1).map((step) => (
                <HistoryItem key={step} color="#E2E8F0" title={step} subtitle="Pending" />
              ))}
              {record.status === 'rejected' && (
                <HistoryItem color="#EF4444" titleColor="#DC2626" title="Rejected" subtitle={record.rejectionReason || ''} />
              )}
              {record.status === 'cancelled' && (
                <HistoryItem color="#94A3B8" title="Cancelled" subtitle={record.cancelReason || ''} when={record.cancelledAt} />
              )}
              {record.status === 'approved' && (
                <HistoryItem color="#10B981" title="Fully approved" subtitle="Ready to be marked as issued" />
              )}
              {record.status === 'completed' && (
                <HistoryItem color="#10B981" title="Issued" subtitle="Items issued to requester" />
              )}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

/**
 * The one Administrative Requests page. Administration shows it as Administration > Administrative Requests; every other
 * module shows the same page and data as its own Requests entry and passes `module` (its name) so the department of the
 * new request is pre-filled. The server decides what the person sees: their own requests, their department's if they
 * head it, or every department's if they run the desk.
 */
export default function AdministrativeRequests({ module: moduleName = '' }) {
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
          departments={lookups.departments}
          moduleName={moduleName}
          onClose={() => setFormOpen(false)}
          onSaved={(message) => { setFormOpen(false); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && (
        <ViewRequestDrawer
          id={viewId}
          refreshKey={refreshKey}
          onClose={() => setViewId(null)}
          canApproveNow={canApproveNow}
          ownRequest={ownRequest}
          canUpload={canAttach}
          busy={busy}
          onApprove={(record) => open('approve', record)}
          onReject={(record) => open('reject', record)}
          onComplete={(record) => open('complete', record)}
          onCancel={(record) => open('cancel', record)}
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
