import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiX, FiCheck, FiPaperclip, FiAlertCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { Input, FormField, Select, Textarea, DatePicker, FileUpload } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { requestService, employeeService } from '../../../services/hr.service';
import { apiError, titleCase, formatDate } from '../../../services/apiHelpers';
import { usePermissions } from '../../../hooks/usePermission';
import { selectCurrentUser } from '../../../store/authSlice';
import { errorInfo, fullName, saveBlob, blobErrorMessage } from '../hrUtils';
import { useServerList } from '../useServerList';

const ITEMS_PER_PAGE = 10;

const STEP_LABELS = {
  admin_review:       'Admin Review',
  procurement_review: 'Procurement Review',
  finance_approval:   'Finance Approval',
  final_approval:     'Final Approval',
};

const STEP_PERMISSIONS = {
  admin_review:       'administration.adminrequest.decide',
  procurement_review: 'administration.adminrequest.decide-procurement',
  finance_approval:   'administration.adminrequest.decide-finance',
  final_approval:     'administration.adminrequest.decide-final',
};

const CHAIN = Object.keys(STEP_LABELS);

const REQUEST_TYPES = ['Office Supplies', 'Cleaning Supplies', 'Office Equipment', 'Furniture', 'IT Equipment', 'Stationery', 'Other'];
const UNITS = ['Units', 'Reams', 'Pieces', 'Bottles', 'Packs', 'Rolls', 'Boxes'];
const URGENCIES = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];
const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const URGENCY_STYLES = {
  critical: { bg: '#FEE2E2', color: '#DC2626' },
  urgent:   { bg: '#FEF3C7', color: '#D97706' },
  routine:  { bg: '#F1F5F9', color: '#64748B' },
};

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: i === 2 ? '70%' : '55%' }} />
        </td>
      ))}
    </tr>
  );
}

function UrgencyPill({ value }) {
  const s = URGENCY_STYLES[value] || URGENCY_STYLES.routine;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
      {titleCase(value)}
    </span>
  );
}

function StatusCell({ row }) {
  if (row.status === 'pending') {
    return <span className="badge badge-pending">{STEP_LABELS[row.currentStep] || 'Pending'}</span>;
  }
  return <Badge status={titleCase(row.status)} />;
}

function quantityText(row) {
  if (row.quantity == null) return '—';
  return `${row.quantity}${row.unit ? ` ${row.unit}` : ''}`;
}

// ─── Create Request Drawer ────────────────────────────────────────────────────
function CreateRequestDrawer({ isOpen, onClose, ownEmployee, canPickEmployee, onSaved }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    requestTitle: '', requestType: '', quantity: '', unit: 'Units', requiredDate: '',
    urgency: 'routine', description: '', requestedBy: '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (ownEmployee || !canPickEmployee) return undefined;
    let cancelled = false;
    employeeService.list({ limit: 100, status: 'active' })
      .then((r) => { if (!cancelled) setEmployees(r.data?.data || []); })
      .catch(() => { if (!cancelled) setEmployees([]); });
    return () => { cancelled = true; };
  }, [ownEmployee, canPickEmployee]);

  const requestedBy = form.requestedBy || ownEmployee?._id || '';

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.requestTitle?.trim()) next.requestTitle = 'Describe what is being requested';
    if (!form.requestType) next.requestType = 'Choose a category';
    if (form.quantity === '' || Number(form.quantity) < 0 || Number.isNaN(Number(form.quantity))) next.quantity = 'Enter a quantity';
    if (!form.unit) next.unit = 'Choose a unit';
    if (!form.requiredDate) next.requiredDate = 'Choose the date it is needed by';
    if (!requestedBy) next.requestedBy = 'Choose who the request is for';
    if (!form.description?.trim()) next.description = 'State the purpose';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await requestService.create({
        requestType: form.requestType,
        requestTitle: form.requestTitle.trim(),
        requestedBy,
        urgency: form.urgency,
        quantity: Number(form.quantity),
        unit: form.unit,
        requiredDate: form.requiredDate,
        description: form.description.trim(),
      });
      const created = res.data?.data;
      let attachFailed = '';
      if (file && created?._id) {
        try {
          await requestService.attach(created._id, file);
        } catch (err) {
          attachFailed = apiError(err, 'The document could not be attached');
        }
      }
      showToast(attachFailed ? `Request submitted, but ${attachFailed}` : 'Request submitted', attachFailed ? 'info' : 'success');
      onSaved();
    } catch (err) {
      const info = errorInfo(err, 'Failed to submit request');
      setErrors((e) => ({ ...e, ...info.fields }));
      setFormError(info.message);
    } finally {
      setSaving(false);
    }
  };

  const empOptions = employees.map((e) => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }));

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="New Request"
      subtitle="Submit a request for review and approval" width="500px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError}</span>
          </div>
        )}
        <FormField label="Request" required error={errors.requestTitle}>
          <Input value={form.requestTitle || ''} error={!!errors.requestTitle} onChange={(e) => set('requestTitle', e.target.value)} placeholder="e.g. A4 Printing Paper" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <FormField label="Request category" required error={errors.requestType}>
            <Select value={form.requestType || ''} error={!!errors.requestType} placeholder="Select category"
              onChange={(e) => set('requestType', e.target.value)} options={REQUEST_TYPES} />
          </FormField>
          <FormField label="Quantity" required error={errors.quantity}>
            <Input type="number" min="0" value={form.quantity ?? ''} error={!!errors.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Unit" required error={errors.unit}>
            <Select value={form.unit || ''} error={!!errors.unit} onChange={(e) => set('unit', e.target.value)} options={UNITS} />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Requested by" required error={errors.requestedBy}>
            {ownEmployee || !canPickEmployee ? (
              <Input value={ownEmployee?.fullName || 'Your account is not linked to an employee record'} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} />
            ) : (
              <Select value={requestedBy} searchable placeholder="Select employee" error={!!errors.requestedBy}
                onChange={(e) => set('requestedBy', e.target.value)} options={empOptions} />
            )}
          </FormField>
          <FormField label="Required date" required error={errors.requiredDate}>
            <DatePicker value={form.requiredDate || ''} error={!!errors.requiredDate} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set('requiredDate', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Urgency" required>
          <Select value={form.urgency || 'routine'} onChange={(e) => set('urgency', e.target.value)} options={URGENCIES} />
        </FormField>
        <FormField label="Purpose" required error={errors.description}>
          <Textarea rows={4} value={form.description || ''} error={!!errors.description} onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. Current stationery stock is insufficient for ongoing administrative activities." />
        </FormField>
        <FormField label="Attach document (optional)">
          <FileUpload value={file} onChange={setFile} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.dwg" maxSizeText="Up to 50MB"
            subtext="PDF, DOCX, DWG, PNG. Up to 50MB" />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Reject / Cancel reason modal ─────────────────────────────────────────────
function ReasonModal({ isOpen, request, title, verb, required, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleConfirm = async () => {
    setSaving(true);
    setError('');
    const message = await onConfirm(reason.trim());
    if (message) setError(message);
    setSaving(false);
  };
  const blocked = saving || (required && !reason.trim());
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
          {verb} <strong>{request?.requestTitle || request?.requestType}</strong>?
        </p>
        <FormField label={required ? 'Reason' : 'Reason (optional)'} required={required} error={error}>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a short explanation…" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Back</button>
          <button onClick={handleConfirm} disabled={blocked}
            style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: blocked ? 'not-allowed' : 'pointer', opacity: blocked ? 0.7 : 1 }}>
            {saving ? 'Working…' : title}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── View Request Drawer ──────────────────────────────────────────────────────
function ViewRequestDrawer({ isOpen, record, onClose, access, onApprove, onReject, onCancel, onComplete, busy }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [fileState, setFileState] = useState({ id: null, files: [] });
  const recordId = record?._id;

  useEffect(() => {
    if (!isOpen || !recordId) return undefined;
    let cancelled = false;
    requestService.attachments(recordId)
      .then((r) => { if (!cancelled) setFileState({ id: recordId, files: r.data?.data || [] }); })
      .catch(() => { if (!cancelled) setFileState({ id: recordId, files: [] }); });
    return () => { cancelled = true; };
  }, [isOpen, recordId]);

  const files = fileState.id === recordId ? fileState.files : [];
  const filesLoading = isOpen && !!recordId && fileState.id !== recordId;

  if (!record) return null;

  const openFile = async (file) => {
    try {
      const res = await requestService.attachmentUrl(record._id, file._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const decision = access.decision(record);
  const showDecisionButtons = record.status === 'pending' && access.holdsAnyDecision;

  const rows = [
    ['Request ID', record.requestId],
    ['Request', record.requestTitle || record.requestType],
    ['Request type', record.requestType],
    ['Quantity', quantityText(record)],
    ['Requested by', fullName(record.requestedBy)],
    ['Department', record.departmentId?.name || '—'],
    ['Request date', formatDate(record.submittedAt)],
    ['Required date', formatDate(record.requiredDate)],
    ['Urgency', <UrgencyPill key="u" value={record.urgency} />],
    ['Status', <StatusCell key="s" row={record} />],
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="View Request" width="500px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{record.requestTitle || record.requestType}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
            {fullName(record.requestedBy)} &bull; {record.requestId}
          </p>
        </div>
      </div>

      {record.status === 'pending' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', marginBottom: 20 }}>
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Waiting on <strong style={{ color: '#0F172A' }}>{STEP_LABELS[record.currentStep] || 'review'}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {showDecisionButtons && (
              <button onClick={() => onApprove(record)} disabled={!decision.canApprove || busy} title={decision.canApprove ? 'Approve this step' : decision.reason}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: decision.canApprove ? '#10B981' : '#CBD5E1', color: '#fff', borderRadius: 6, border: 'none', cursor: decision.canApprove ? 'pointer' : 'not-allowed' }}>
                <FiCheck size={14} /> Approve
              </button>
            )}
            {access.canReject && (
              <button onClick={() => onReject(record)} disabled={busy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: 6, border: '1px solid #FECACA', cursor: 'pointer' }}>
                <FiX size={14} /> Reject
              </button>
            )}
            {access.canCancel(record) && (
              <button onClick={() => onCancel(record)} disabled={busy}
                style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#fff', color: '#64748B', borderRadius: 6, border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                Cancel request
              </button>
            )}
          </div>
          {showDecisionButtons && !decision.canApprove && (
            <div style={{ flexBasis: '100%', fontSize: '0.75rem', color: '#B45309' }}>{decision.reason}</div>
          )}
        </div>
      )}
      {record.status === 'approved' && access.canComplete && (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => onComplete(record)} disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px', fontSize: '0.85rem', backgroundColor: '#10B981', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
            <FiCheck size={14} /> Mark completed
          </button>
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        {['details', 'history'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === tab ? '#1D4ED8' : '#64748B', fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer', fontSize: '0.9rem' }}>
            {tab === 'details' ? 'Details' : 'Approval History'}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            {rows.map(([label, value]) => (
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

      {activeTab === 'history' && (
        <div style={{ position: 'relative', borderLeft: '2px solid #E2E8F0', paddingLeft: 16, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <HistoryItem color="#1E3A8A" title="Request submitted" subtitle={`Form submitted by ${fullName(record.requestedBy)}`} when={record.submittedAt} />
          {(record.approvals || []).map((approval, i) => (
            <HistoryItem key={`${approval.step}-${i}`} color="#10B981" title={STEP_LABELS[approval.step] || titleCase(approval.step)}
              subtitle={`Approved by ${fullName(approval.by)}`} when={approval.at} />
          ))}
          {record.status === 'pending' && record.currentStep && (
            <HistoryItem color="#F59E0B" title={STEP_LABELS[record.currentStep]} subtitle="Waiting for reviewer" />
          )}
          {record.status === 'rejected' && (
            <HistoryItem color="#EF4444" titleColor="#DC2626" title="Rejected" subtitle={record.rejectionReason || ''} />
          )}
          {record.status === 'cancelled' && (
            <HistoryItem color="#94A3B8" title="Cancelled" subtitle={`${record.cancelledBy ? `By ${fullName(record.cancelledBy)}. ` : ''}${record.cancelReason || ''}`.trim()} when={record.cancelledAt} />
          )}
          {record.status === 'completed' && <HistoryItem color="#10B981" title="Marked completed" subtitle="" />}
          {record.status === 'approved' && <HistoryItem color="#10B981" title="Fully approved" subtitle="Ready to be marked completed" />}
        </div>
      )}
    </Drawer>
  );
}

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

// ─── Filter drawer ────────────────────────────────────────────────────────────
function FilterDrawer({ isOpen, onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Filter requests" width="380px"
      footer={
        <>
          <button onClick={() => { onApply({ status: '', urgency: '', requestType: '' }); onClose(); }}
            style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Status">
          <Select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} options={STATUS_FILTERS} />
        </FormField>
        <FormField label="Urgency">
          <Select value={draft.urgency} onChange={(e) => setDraft((d) => ({ ...d, urgency: e.target.value }))}
            options={[{ value: '', label: 'All urgencies' }, ...URGENCIES]} />
        </FormField>
        <FormField label="Request category">
          <Select value={draft.requestType} onChange={(e) => setDraft((d) => ({ ...d, requestType: e.target.value }))}
            options={[{ value: '', label: 'All categories' }, ...REQUEST_TYPES.map((t) => ({ value: t, label: t }))]} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Row menu ─────────────────────────────────────────────────────────────────
function RowMenu({ items, onAction, row }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!items.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#fff',
          borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
          padding: '6px 0', zIndex: 50, width: 190 }}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.action} onClick={() => { onAction(item.action, row); setOpen(false); }}
                className="menu-item-hover"
                style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color,
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon size={13} /> {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Requests() {
  const { toast, showToast, hideToast } = useToast();
  const { can, isSuperAdmin } = usePermissions();
  const user = useSelector(selectCurrentUser);
  const ownEmployeeId = idOf(user?.employeeId) || null;
  const ownUserId = user?._id || user?.id || null;

  const list = useServerList(requestService.list, { status: '', urgency: '', requestType: '' }, { limit: ITEMS_PER_PAGE });
  const { items, meta, loading, error: loadError, page, search, filters, reload } = list;
  const [selectedIds, setSelectedIds] = useState([]);
  const [ownEmployee, setOwnEmployee] = useState(null);
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen]     = useState(false);
  const [filterOpen, setFilterOpen]     = useState(false);
  const [viewRecord, setViewRecord]     = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const canCreate = can('administration.adminrequest.create');
  const canExport = can('administration.adminrequest.export');
  const holdsAnyDecision = Object.values(STEP_PERMISSIONS).some((key) => can(key));

  const access = {
    holdsAnyDecision,
    canReject: can(STEP_PERMISSIONS.admin_review),
    canComplete: can(STEP_PERMISSIONS.admin_review),
    canCancel: (row) => row.status === 'pending' && (can('administration.adminrequest.update') || (!!ownEmployeeId && idOf(row.requestedBy) === ownEmployeeId)),
    decision: (row) => {
      const needed = STEP_PERMISSIONS[row.currentStep];
      if (!needed) return { canApprove: false, reason: 'This request is no longer in the approval chain.' };
      if (ownEmployeeId && idOf(row.requestedBy) === ownEmployeeId) return { canApprove: false, reason: 'You cannot approve your own request.' };
      if (!isSuperAdmin && (row.approvals || []).some((a) => idOf(a.by) === ownUserId)) {
        return { canApprove: false, reason: 'You approved an earlier step; a different person must approve this one.' };
      }
      if (!can(needed)) return { canApprove: false, reason: `The ${STEP_LABELS[row.currentStep]} step needs the ${needed} permission.` };
      return { canApprove: true, reason: '' };
    },
  };

  useEffect(() => {
    if (!ownEmployeeId) return undefined;
    let cancelled = false;
    employeeService.get(ownEmployeeId)
      .then((r) => { if (!cancelled) setOwnEmployee(r.data?.data || { _id: ownEmployeeId, fullName: fullName(user) }); })
      .catch(() => { if (!cancelled) setOwnEmployee({ _id: ownEmployeeId, fullName: fullName(user) }); });
    return () => { cancelled = true; };
  }, [ownEmployeeId, user]);

  const refreshOpenRecord = (updated) => {
    setViewRecord((current) => (current && current._id === updated?._id ? updated : current));
  };

  const run = async (fn, successMessage, fallback) => {
    setBusy(true);
    try {
      const res = await fn();
      showToast(successMessage, 'success');
      refreshOpenRecord(res.data?.data);
      await reload();
      return '';
    } catch (err) {
      const message = apiError(err, fallback);
      showToast(message, 'error');
      return message;
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = (row) => run(() => requestService.approve(row._id),
    row.currentStep === CHAIN[CHAIN.length - 1] ? 'Final approval recorded' : 'Approved, moved to the next step', 'Failed to approve');

  const handleComplete = (row) => run(() => requestService.complete(row._id), 'Request marked as completed', 'Failed to complete the request');

  const handleRejectConfirm = async (reason) => {
    const message = await run(() => requestService.reject(rejectTarget._id, reason), 'Request rejected', 'Failed to reject');
    if (!message) setRejectTarget(null);
    return message;
  };

  const handleCancelConfirm = async (reason) => {
    const message = await run(() => requestService.cancel(cancelTarget._id, reason), 'Request cancelled', 'Failed to cancel');
    if (!message) setCancelTarget(null);
    return message;
  };

  const handleExport = async () => {
    try {
      const params = { format: 'csv' };
      if (list.activeSearch) params.q = list.activeSearch;
      if (filters.status) params.status = filters.status;
      if (filters.urgency) params.urgency = filters.urgency;
      if (filters.requestType) params.requestType = filters.requestType;
      const res = await requestService.exportList(params);
      saveBlob(res.data, 'requests.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const handleAction = (action, row) => {
    if (action === 'approve') handleApprove(row);
    else if (action === 'reject') setRejectTarget(row);
    else if (action === 'complete') handleComplete(row);
    else if (action === 'cancel') setCancelTarget(row);
  };

  const menuItems = (row) => {
    const out = [];
    if (row.status === 'pending') {
      if (holdsAnyDecision && access.decision(row).canApprove) out.push({ label: 'Approve Request', icon: FiCheck, color: '#10B981', action: 'approve' });
      if (access.canReject) out.push({ label: 'Reject Request', icon: FiX, color: '#DC2626', action: 'reject' });
      if (access.canCancel(row)) out.push({ label: 'Cancel Request', icon: FiX, color: '#DC2626', action: 'cancel' });
    }
    if (row.status === 'approved' && access.canComplete) out.push({ label: 'Mark Completed', icon: FiCheck, color: '#10B981', action: 'complete' });
    return out;
  };

  const columns = [
    { key: 'requestId',    label: 'REQUEST ID',   render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    { key: 'requestType',  label: 'REQUEST TYPE' },
    { key: 'requestTitle', label: 'REQUEST',       render: (v, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v || row.requestType}</span> },
    { key: 'quantity',     label: 'QTY',           render: (_, row) => quantityText(row) },
    { key: 'requestedBy',  label: 'REQUESTED BY',  render: (v) => fullName(v) },
    { key: 'submittedAt',  label: 'REQUEST DATE',  render: (v) => formatDate(v) },
    { key: 'urgency',      label: 'URGENCY',       render: (v) => <UrgencyPill value={v} /> },
    { key: 'status',       label: 'STATUS',        render: (_, row) => <StatusCell row={row} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewRecord(row)}><FiEye size={15} /></button>
          <RowMenu row={row} items={menuItems(row)} onAction={handleAction} />
        </div>
      ),
    },
  ];

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Requests</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Submit and track requests for materials, equipment, or supplies from the store
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setCreateOpen(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FiPlus size={14} /> New Request
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => list.setSearch(e.target.value)}
              placeholder="Search by id, request, employee…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
            {canExport && (
              <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                Export <FiDownload size={14} />
              </button>
            )}
          </div>
        </div>

        {loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            <div style={{ marginBottom: 12 }}>{loadError}</div>
            <button className="btn btn-secondary" onClick={list.hardReload}>Try again</button>
          </div>
        ) : loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map((e) => e._id))}
            keyField="_id"
            emptyMessage={search || activeFilterCount ? 'No requests match your search or filters.' : 'No requests yet.'}
          />
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={list.setPage} />
        )}
      </div>

      {createOpen && (
        <CreateRequestDrawer
          isOpen
          onClose={() => setCreateOpen(false)}
          ownEmployee={ownEmployee}
          canPickEmployee={can('hr.employee.view')}
          onSaved={() => { setCreateOpen(false); reload(); }}
        />
      )}

      <ViewRequestDrawer
        key={viewRecord?._id || 'none'}
        isOpen={!!viewRecord}
        record={viewRecord}
        onClose={() => setViewRecord(null)}
        access={access}
        busy={busy}
        onApprove={handleApprove}
        onReject={setRejectTarget}
        onCancel={setCancelTarget}
        onComplete={handleComplete}
      />

      {filterOpen && <FilterDrawer isOpen onClose={() => setFilterOpen(false)} value={filters} onApply={list.setFilters} />}

      {rejectTarget && (
        <ReasonModal
          isOpen
          request={rejectTarget}
          title="Reject Request"
          verb="Reject"
          required
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
      {cancelTarget && (
        <ReasonModal
          isOpen
          request={cancelTarget}
          title="Cancel Request"
          verb="Cancel"
          required={false}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  );
}
