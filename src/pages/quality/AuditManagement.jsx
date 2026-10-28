import { useState } from 'react';
import { FiPlus, FiEye, FiDownload, FiEdit, FiPlay, FiCheck, FiUpload, FiCalendar, FiLock, FiAlertCircle, FiList, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermission';
import { qmsAuditsSlice } from '../../store/quality/slices';
import { apiError } from '../../services/apiHelpers';
import { qualityAuditService } from '../../services/quality.service';
import { countFilters, fieldErrorsOf, formatDate, statValue, statusLabel, ymd } from '../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, PageHeader, Panel,
  PrimaryButton, RecordSummary, SecondaryButton, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../procurement/shared/ProcUi';
import { AttachField, AttachToRecordDialog } from '../procurement/shared/ProcExtras';
import { HistoryTimeline, Pill } from '../administration/shared/AdmUi';
import { FileList } from '../hse/shared/hseUi';
import { idOf, nameOf, openSignedDownload, toFileRows } from '../hse/shared/hseUtils';
import { useQualityLookups } from '../hse/shared/useScreenLookups';

const AUDIT_TYPES = ['Internal Quality Audit', 'External Client Audit', 'Supplier/Vendor Audit', 'ISO Audit'];
const STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 'overdue', label: 'Overdue' },
];
const STATUS_TONE = { scheduled: 'purple', in_progress: 'sky', completed: 'green', closed: 'slate', overdue: 'red' };
const SECTIONS = ['departments', 'locations', 'employees', 'vendors', 'clients'];
const FILE_KINDS = { checklist: 'Checklist', report: 'Audit report' };

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;
const dateRangeText = (row) => `${formatDate(row.startDate)} to ${formatDate(row.endDate)}`;

const EXPORT_COLUMNS = [
  { label: 'Audit ID', value: (r) => r.auditId },
  { label: 'Title', value: (r) => r.auditTitle },
  { label: 'Type', value: (r) => r.auditType },
  { label: 'Department', value: (r) => nameOf(r.departmentId) },
  { label: 'Location', value: (r) => nameOf(r.location) },
  { label: 'Lead Auditor', value: (r) => nameOf(r.leadAuditorId) },
  { label: 'Start Date', value: (r) => ymd(r.startDate) },
  { label: 'End Date', value: (r) => ymd(r.endDate) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

/** The header "Upload" dialog attaches the audit report to a completed audit that has none yet. */
const reportApi = {
  list: (params) => qualityAuditService.list({ ...params, status: 'completed', reportAttached: false }),
  uploadAttachment: (id, file) => qualityAuditService.uploadReport(id, file),
};

function AuditFormModal({ record, onClose, onSaved }) {
  const editing = Boolean(record);
  const { lookups, loading: lookupsLoading, error: lookupsError } = useQualityLookups(SECTIONS);
  const [form, setForm] = useState(() => ({
    auditType: record?.auditType || 'Internal Quality Audit',
    auditTitle: record?.auditTitle || '',
    departmentId: record ? idOf(record.departmentId) : '',
    location: record ? idOf(record.location) : '',
    leadAuditorId: record ? idOf(record.leadAuditorId) : '',
    startDate: record ? ymd(record.startDate) : '',
    endDate: record ? ymd(record.endDate) : '',
    auditObjective: record?.auditObjective || '',
    relatedVendorId: record ? idOf(record.relatedVendorId) : '',
    relatedClientId: record ? idOf(record.relatedClientId) : '',
  }));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.auditTitle.trim()) next.auditTitle = 'Enter the audit title';
    if (!form.departmentId) next.departmentId = 'Choose the department';
    if (!form.location) next.location = 'Choose the location';
    if (!form.leadAuditorId) next.leadAuditorId = 'Choose the lead auditor';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.endDate) next.endDate = 'Choose the end date';
    if (form.startDate && form.endDate && form.startDate > form.endDate) next.endDate = 'End date must be on or after the start date';
    if (!form.auditObjective.trim()) next.auditObjective = 'State the audit objective';
    if (form.auditType === 'Supplier/Vendor Audit' && !form.relatedVendorId) next.relatedVendorId = 'Choose the vendor being audited';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const fields = {
        auditType: form.auditType,
        auditTitle: form.auditTitle.trim(),
        departmentId: form.departmentId,
        location: form.location,
        leadAuditorId: form.leadAuditorId,
        startDate: form.startDate,
        endDate: form.endDate,
        auditObjective: form.auditObjective.trim(),
        relatedVendorId: form.auditType === 'Supplier/Vendor Audit' ? form.relatedVendorId : '',
        relatedClientId: form.auditType === 'External Client Audit' ? form.relatedClientId : '',
      };
      if (editing) {
        await qualityAuditService.update(record._id, fields, files[0]);
        onSaved('Audit updated');
      } else {
        const res = await qualityAuditService.create(fields, files[0]);
        onSaved(`Audit ${res.data?.data?.auditId || ''} scheduled`.replace('  ', ' '));
      }
    } catch (err) {
      setError(apiError(err, 'The audit could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Audit' : 'Schedule Audit'}
      subtitle={editing ? undefined : 'Create an audit schedule and assign the responsible auditor'}
      width="660px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy || lookupsLoading}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Schedule Audit'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <FormError message={lookupsError} />
        <TwoCol>
          <Field label="Audit ID" help={editing ? undefined : 'Assigned automatically when the audit is scheduled.'}>
            <Input value={editing ? record.auditId : 'Assigned on save'} disabled />
          </Field>
          <Field label="Audit type" required error={errors.auditType}>
            <Choice value={form.auditType} onChange={(v) => set('auditType', v)} options={AUDIT_TYPES.map((t) => ({ value: t, label: t }))} />
          </Field>
        </TwoCol>
        <Field label="Audit title" required error={errors.auditTitle}>
          <Input value={form.auditTitle} onChange={(e) => set('auditTitle', e.target.value)} placeholder="e.g. Q2 Internal Quality Audit — Welding Processes" error={Boolean(errors.auditTitle)} />
        </Field>
        <TwoCol>
          <Field label="Department" required error={errors.departmentId}>
            <Choice value={form.departmentId} onChange={(v) => set('departmentId', v)} searchable placeholder="Select department" options={(lookups.departments || []).map((d) => ({ value: d._id, label: d.name }))} error={errors.departmentId} />
          </Field>
          <Field label="Location" required error={errors.location}>
            <Choice value={form.location} onChange={(v) => set('location', v)} searchable placeholder="Select location" options={(lookups.locations || []).map((l) => ({ value: l._id, label: l.name }))} error={errors.location} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Lead auditor" required error={errors.leadAuditorId}>
            <Choice value={form.leadAuditorId} onChange={(v) => set('leadAuditorId', v)} searchable placeholder="Select lead auditor" options={(lookups.employees || []).map((e) => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))} error={errors.leadAuditorId} />
          </Field>
          <Field label="Start date" required error={errors.startDate}>
            <DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="End date" required error={errors.endDate}>
            <DatePicker value={form.endDate} onChange={(e) => set('endDate', e.target.value)} error={Boolean(errors.endDate)} />
          </Field>
          {form.auditType === 'Supplier/Vendor Audit' && (
            <Field label="Vendor audited" required error={errors.relatedVendorId}>
              <Choice value={form.relatedVendorId} onChange={(v) => set('relatedVendorId', v)} searchable placeholder="Select vendor" options={(lookups.vendors || []).map((v) => ({ value: v._id, label: v.vendorName }))} error={errors.relatedVendorId} />
            </Field>
          )}
          {form.auditType === 'External Client Audit' && (
            <Field label="Client (optional)" error={errors.relatedClientId}>
              <Choice value={form.relatedClientId} onChange={(v) => set('relatedClientId', v)} searchable placeholder="Select client" options={(lookups.clients || []).map((c) => ({ value: c._id, label: c.clientName }))} error={errors.relatedClientId} />
            </Field>
          )}
        </TwoCol>
        <Field label="Audit objective" required error={errors.auditObjective}>
          <Textarea rows={3} value={form.auditObjective} onChange={(e) => set('auditObjective', e.target.value)} placeholder="Evaluate compliance with HSE procedures, permit-to-work requirements..." error={Boolean(errors.auditObjective)} />
        </Field>
        <Field label="Audit checklist (optional)">
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function UploadReportModal({ audit, onClose, onSaved }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!files.length) { setError('Choose the audit report to upload.'); return; }
    setBusy(true);
    setError('');
    try {
      await qualityAuditService.uploadReport(audit._id, files[0]);
      onSaved('Audit report uploaded');
    } catch (err) {
      setError(apiError(err, 'The report could not be uploaded'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Upload Audit Report"
      subtitle="The findings document for a completed audit"
      width="500px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy} icon={<FiUpload size={14} />}>{busy ? 'Uploading…' : 'Upload Report'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <RecordSummary rows={[['Audit', audit.auditId], ['Title', audit.auditTitle]]} />
        <Field label="Audit report" required>
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function RescheduleModal({ audit, onClose, onSaved }) {
  const [form, setForm] = useState({ startDate: '', endDate: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.startDate) next.startDate = 'Choose the new start date';
    if (!form.endDate) next.endDate = 'Choose the new end date';
    if (form.startDate && form.endDate && form.startDate > form.endDate) next.endDate = 'End date must be on or after the start date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await qualityAuditService.reschedule(audit._id, form);
      onSaved('Audit rescheduled');
    } catch (err) {
      setError(apiError(err, 'The audit could not be rescheduled'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Reschedule Audit"
      subtitle="Choose new dates for the overdue audit"
      width="500px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy} icon={<FiCalendar size={14} />}>{busy ? 'Saving…' : 'Reschedule'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <RecordSummary rows={[['Audit', audit.auditId], ['Title', audit.auditTitle], ['Current dates', dateRangeText(audit)]]} />
        <TwoCol>
          <Field label="New start date" required error={errors.startDate}>
            <DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} error={Boolean(errors.startDate)} />
          </Field>
          <Field label="New end date" required error={errors.endDate}>
            <DatePicker value={form.endDate} onChange={(e) => set('endDate', e.target.value)} error={Boolean(errors.endDate)} />
          </Field>
        </TwoCol>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewAuditModal({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(qualityAuditService, id, refreshKey);
  const [tab, setTab] = useState('details');
  return (
    <Drawer isOpen onClose={onClose} title="" width="660px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading audit…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiList size={22} />} title={record.auditTitle} subtitle={`${record.auditType} • ${record.auditId}`} />
          <StatusLine status={<Status status={record.status} />}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions(record)}</div>
          </StatusLine>
          <TabBar tabs={[{ id: 'details', label: 'Details' }, { id: 'history', label: 'History' }]} active={tab} onChange={setTab} />
          {tab === 'details' && (
            <>
              <DetailGrid
                items={[
                  ['Audit title', record.auditTitle],
                  ['Audit ID', record.auditId],
                  ['Audit type', record.auditType],
                  ['Department', nameOf(record.departmentId)],
                  ['Location', nameOf(record.location)],
                  ['Lead auditor', nameOf(record.leadAuditorId)],
                  ['Start date', formatDate(record.startDate)],
                  ['End date', formatDate(record.endDate)],
                  record.relatedVendorId ? ['Vendor audited', nameOf(record.relatedVendorId, 'vendorName')] : null,
                  record.relatedClientId ? ['Client', nameOf(record.relatedClientId, 'clientName')] : null,
                  ['Status', statusLabel(record.status)],
                ]}
              />
              <Panel title="Audit objective">{record.auditObjective}</Panel>
              <FileList
                files={toFileRows(record.files)}
                kinds={FILE_KINDS}
                download={(file) => openSignedDownload(() => qualityAuditService.downloadFile(record._id, file.id))}
                empty={record.status === 'completed' ? 'No documents yet. Upload the audit report to close the audit.' : 'No documents attached.'}
              />
            </>
          )}
          {tab === 'history' && <HistoryTimeline key={`${record._id}-${refreshKey}`} load={qualityAuditService.history} id={record._id} title="Audit history" />}
        </div>
      )}
    </Drawer>
  );
}

function SortLabel({ label, order, active, onToggle }) {
  return (
    <button type="button" onClick={onToggle} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {label}
      {active && order === 'asc' ? <FiArrowUp size={12} /> : <FiArrowDown size={12} style={{ opacity: active ? 1 : 0.45 }} />}
    </button>
  );
}

export default function AuditManagement() {
  const { can } = usePermissions();
  const canCreate = can('quality.audit.create');
  const canUpdate = can('quality.audit.update');
  const canDecide = can('quality.audit.decide');
  const canExport = can('quality.audit.export');

  const list = useProcList(qmsAuditsSlice, { initialFilters: { status: '', auditType: '', dateFrom: '', dateTo: '', sort: '', order: '' } });
  const run = useRunAction(qmsAuditsSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const exporter = useExport(qualityAuditService, list, selection, EXPORT_COLUMNS, 'quality-audits.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [reportFor, setReportFor] = useState(null);
  const [rescheduleFor, setRescheduleFor] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const overdue = statValue(list.stats, 'overdue');
  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };
  const open = (type, row) => { setActionError(''); setConfirm({ type, row }); };

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

  const downloadReport = async (row) => {
    try {
      const detail = await qualityAuditService.get(row._id);
      const file = (detail.data?.data?.files || []).find((f) => f.kind === 'report');
      if (!file) { showToast('No audit report has been uploaded for this audit', 'error'); return; }
      const problem = await openSignedDownload(() => qualityAuditService.downloadFile(row._id, file.id));
      if (problem) showToast(problem, 'error');
    } catch (err) {
      showToast(apiError(err, 'Download failed'), 'error');
    }
  };

  const menuItems = (row) => {
    const items = [];
    const editable = row.status === 'scheduled';
    if (editable && canUpdate) items.push({ label: 'Edit Audit', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (editable && canDecide) items.push({ label: 'Mark In Progress', icon: <FiPlay size={14} color="#2563EB" />, action: () => doAction('start', [row._id], 'Audit marked in progress') });
    if (row.status === 'overdue' && canDecide) items.push({ label: 'Reschedule', icon: <FiCalendar size={14} color="#64748B" />, action: () => setRescheduleFor(row) });
    if ((row.status === 'in_progress' || row.status === 'overdue') && canDecide) items.push({ label: 'Mark as Completed', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('complete', row) });
    if (row.status === 'completed' && canDecide && !row.reportAttached) items.push({ label: 'Upload Report', icon: <FiUpload size={14} color="#64748B" />, action: () => setReportFor(row) });
    if (row.status === 'completed' && canDecide && row.reportAttached) items.push({ label: 'Close Audit', icon: <FiLock size={14} color="#16A34A" />, color: '#16A34A', action: () => open('close', row) });
    return items;
  };

  const toggleSort = () => list.applyFilters({ ...list.filters, sort: 'startDate', order: list.filters.sort === 'startDate' && list.filters.order === 'asc' ? 'desc' : 'asc' });

  const columns = [
    { key: 'auditId', label: 'AUDIT ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'auditTitle', label: 'TITLE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'auditType', label: 'TYPE', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'location', label: 'LOCATION', render: (v) => <span style={{ color: '#334155' }}>{nameOf(v)}</span> },
    { key: 'leadAuditorId', label: 'LEAD AUDITOR', render: (v) => <span style={{ color: '#334155' }}>{nameOf(v)}</span> },
    { key: 'startDate', label: <SortLabel label="AUDIT DATE" order={list.filters.order} active={list.filters.sort === 'startDate'} onToggle={toggleSort} />, render: (_, row) => <span style={{ color: '#64748B' }}>{dateRangeText(row)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Audit" aria-label="View audit" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {row.reportAttached && <button type="button" className="icon-btn" title="Download audit report" aria-label="Download audit report" onClick={() => downloadReport(row)} style={{ color: '#64748B', cursor: 'pointer' }}><FiDownload size={16} /></button>}
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
  ];

  const viewActions = (record) => (
    <>
      {canDecide && record.status === 'scheduled' && <PrimaryButton icon={<FiPlay size={14} />} onClick={() => doAction('start', [record._id], 'Audit marked in progress')}>Mark as In Progress</PrimaryButton>}
      {canDecide && (record.status === 'in_progress' || record.status === 'overdue') && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('complete', record)}>Mark as Completed</PrimaryButton>}
      {canDecide && record.status === 'overdue' && <SecondaryButton icon={<FiCalendar size={14} />} onClick={() => setRescheduleFor(record)}>Reschedule</SecondaryButton>}
      {canDecide && record.status === 'completed' && !record.reportAttached && <PrimaryButton icon={<FiUpload size={14} />} onClick={() => setReportFor(record)}>Upload Report</PrimaryButton>}
      {canDecide && record.status === 'completed' && record.reportAttached && <PrimaryButton icon={<FiLock size={14} />} onClick={() => open('close', record)}>Close Audit</PrimaryButton>}
      {canUpdate && record.status === 'scheduled' && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected audits exported` : 'Audits exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'auditType', label: 'Audit type', options: AUDIT_TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'dateFrom', label: 'Starts from', type: 'date' },
    { key: 'dateTo', label: 'Starts to', type: 'date' },
  ];

  const filterCount = countFilters({ ...list.filters, sort: '', order: '' });
  const summary = (row) => <RecordSummary rows={[['Audit', row.auditId], ['Title', row.auditTitle]]} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Audit Management" subtitle="Plan, schedule, and track quality system audits across projects and operations">
        {canDecide && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      <TabBar tabs={[{ id: 'schedule', label: 'Audit Schedule' }]} active="schedule" onChange={() => {}} />

      {overdue > 0 && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 18px', backgroundColor: '#FFF1F2', border: '1px solid #FFE4E6', borderLeft: '4px solid #E11D48', borderRadius: 8, color: '#BE123C', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiAlertCircle size={18} color="#E11D48" />
            <span><strong>{overdue} audit{overdue === 1 ? ' is' : 's are'} overdue.</strong> Schedule immediately to maintain QMS compliance.</span>
          </div>
          <button type="button" onClick={() => list.applyFilters({ ...list.filters, status: 'overdue' })} style={{ border: 'none', background: 'none', color: '#BE123C', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
            View Overdue →
          </button>
        </div>
      )}

      <ListCard
        list={list}
        columns={columns}
        emptyText="No audits found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search Audit ID, Type ..."
            onFilter={() => setFilterOpen(true)}
            filterCount={filterCount}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Schedule Audit</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Audits"
        subtitle="Narrow the audits by status, type and start date."
        fields={filterFields}
        values={list.filters}
        onApply={(next) => list.applyFilters({ ...next, sort: list.filters.sort, order: list.filters.order })}
      />

      {formFor && (
        <AuditFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}
      {reportFor && <UploadReportModal audit={reportFor} onClose={() => setReportFor(null)} onSaved={(message) => { setReportFor(null); showToast(message, 'success'); refresh(); }} />}
      {rescheduleFor && <RescheduleModal audit={rescheduleFor} onClose={() => setRescheduleFor(null)} onSaved={(message) => { setRescheduleFor(null); showToast(message, 'success'); refresh(); }} />}
      {uploadOpen && (
        <AttachToRecordDialog
          api={reportApi}
          title="Upload Audit Report"
          recordNoun="completed audit"
          recordLabel={(row) => `${row.auditId} — ${row.auditTitle}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewAuditModal id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}

      {confirm?.type === 'complete' && (
        <ConfirmModal
          title="Mark Audit as Completed?"
          message="Confirm that the audit has been carried out. You can then upload the audit report."
          detail={summary(confirm.row)}
          confirmLabel="Mark as Completed"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('complete', [confirm.row._id], 'Audit marked completed')}
        />
      )}
      {confirm?.type === 'close' && (
        <ConfirmModal
          title="Close Audit?"
          message="The audit report is attached. Closing the audit finishes it."
          detail={summary(confirm.row)}
          confirmLabel="Close Audit"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('close', [confirm.row._id], 'Audit closed')}
        />
      )}
    </div>
  );
}
