import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiUpload, FiPlus, FiEye, FiEdit, FiCheck, FiX, FiArrowRight, FiFileText, FiTrash2 } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import RowMenu from '../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { selectCurrentUser } from '../../store/authSlice';
import { requisitionsSlice } from '../../store/procurement/slices';
import { apiError } from '../../services/apiHelpers';
import { purchaseRequisitionService } from '../../services/procurement.service';
import {
  CATEGORIES, PRIORITIES, UNITS, countFilters, csvMoney, fieldErrorsOf, formatDate, fromKobo, money, refId, refName,
  statusLabel, toKobo, toQuantity, toOptions, uploadStagedFiles, ymd,
} from './shared/procUtils';
import { useExport, useLookups, useProcList, useRecord, useRunAction, useSelection } from './shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, PageHeader, Panel,
  PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusBadge, StatusLine, TwoCol, ViewHeader,
} from './shared/ProcUi';
import { AttachField, AttachToRecordDialog, DocumentList } from './shared/ProcExtras';
import RfqFormModal from './shared/RfqForm';

const EXPORT_COLUMNS = [
  { label: 'Requisition ID', value: (r) => r.requisitionId },
  { label: 'Requested Material/Service', value: (r) => r.requestedMaterialService },
  { label: 'Category', value: (r) => r.category },
  { label: 'Department', value: (r) => refName(r.departmentId, 'name') },
  { label: 'Requested By', value: (r) => refName(r.requestedBy, 'fullName') },
  { label: 'Priority', value: (r) => r.priority },
  { label: 'Quantity', value: (r) => r.quantity },
  { label: 'Unit', value: (r) => r.unit },
  { label: 'Estimated Budget (NGN)', value: (r) => csvMoney(r.estimatedBudget) },
  { label: 'Request Date', value: (r) => ymd(r.requestDate) },
  { label: 'Required Date', value: (r) => ymd(r.requiredDate) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'converted_to_rfq', label: 'Converted to RFQ' },
  { value: 'rejected', label: 'Rejected' },
];

function blankForm(myEmployeeId) {
  return {
    material: '', category: 'Materials', department: '', quantity: '', unit: 'Pieces', budget: '', project: '',
    priority: 'Medium', requestedBy: myEmployeeId || '', requiredDate: '', justification: '',
  };
}

function formFromRecord(r) {
  return {
    material: r.requestedMaterialService || '', category: r.category || 'Materials', department: refId(r.departmentId),
    quantity: String(r.quantity ?? ''), unit: r.unit || 'Pieces', budget: fromKobo(r.estimatedBudget), project: refId(r.projectId),
    priority: r.priority || 'Medium', requestedBy: refId(r.requestedBy), requiredDate: ymd(r.requiredDate), justification: r.justification || '',
  };
}

function RequisitionFormModal({ record, lookups, myEmployeeId, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => (record ? formFromRecord(record) : blankForm(myEmployeeId)));
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.material.trim()) next.requestedMaterialService = 'Describe the material or service';
    if (!form.department) next.departmentId = 'Choose a department';
    if (Number.isNaN(toQuantity(form.quantity))) next.quantity = 'Enter a quantity above zero';
    if (Number.isNaN(toKobo(form.budget))) next.estimatedBudget = 'Enter the budget in naira, for example 1250000.50';
    if (!form.requiredDate) next.requiredDate = 'Choose the required date';
    if (!form.justification.trim()) next.justification = 'Give a justification';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => ({
    requestedMaterialService: form.material.trim(),
    category: form.category,
    departmentId: form.department,
    quantity: toQuantity(form.quantity),
    unit: form.unit,
    estimatedBudget: toKobo(form.budget),
    ...(form.project ? { projectId: form.project } : {}),
    priority: form.priority,
    ...(form.requestedBy ? { requestedBy: form.requestedBy } : {}),
    requiredDate: form.requiredDate,
    justification: form.justification.trim(),
  });

  const save = async (submit) => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      let saved;
      if (editing) {
        const res = await purchaseRequisitionService.update(record._id, payload());
        saved = res.data?.data;
        if (submit) await purchaseRequisitionService.submit(record._id);
      } else {
        const res = await purchaseRequisitionService.create({ ...payload(), submit });
        saved = res.data?.data;
      }
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(purchaseRequisitionService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Requisition updated' : submit ? 'Requisition submitted for approval' : 'Requisition saved as draft'}${submit && editing ? ' and submitted' : ''}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The requisition could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Requisition' : 'New Requisition'}
      subtitle={editing ? 'Only a draft can be edited.' : 'Submit a new procurement request for review and approval'}
      maxWidth="720px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <SecondaryButton onClick={() => save(false)} disabled={busy}>{editing ? 'Save Changes' : 'Save as Draft'}</SecondaryButton>
          <PrimaryButton onClick={() => save(true)} disabled={busy}>{editing ? 'Save and Submit' : 'Submit Requisition'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Requested material/service" required error={errors.requestedMaterialService}>
          <Input value={form.material} onChange={(e) => set('material', e.target.value)} placeholder="e.g. Structural Steel Beams (IPE 300)" error={Boolean(errors.requestedMaterialService)} />
        </Field>
        <TwoCol>
          <Field label="Category" required error={errors.category}>
            <Choice value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES} />
          </Field>
          <Field label="Department" required error={errors.departmentId}>
            <Choice value={form.department} onChange={(v) => set('department', v)} searchable placeholder="Select a department" options={toOptions(lookups.departments, 'name')} error={errors.departmentId} />
          </Field>
        </TwoCol>
        <TwoCol min={160}>
          <Field label="Quantity" required error={errors.quantity}>
            <Input value={form.quantity} inputMode="decimal" onChange={(e) => set('quantity', e.target.value)} error={Boolean(errors.quantity)} />
          </Field>
          <Field label="Unit" required error={errors.unit}>
            <Choice value={form.unit} onChange={(v) => set('unit', v)} options={UNITS} />
          </Field>
          <Field label="Estimated budget (₦)" required error={errors.estimatedBudget}>
            <Input value={form.budget} inputMode="decimal" onChange={(e) => set('budget', e.target.value.replace(/,/g, ''))} placeholder="0.00" error={Boolean(errors.estimatedBudget)} />
          </Field>
        </TwoCol>
        <Field label="Project" error={errors.projectId} help="Select a project if this request is project-specific.">
          <Choice
            value={form.project}
            onChange={(v) => set('project', v)}
            searchable
            placeholder="No project"
            options={[{ value: '', label: 'No project' }, ...toOptions(lookups.projects, (p) => `${p.projectId}: ${p.projectName}`)]}
          />
        </Field>
        <TwoCol>
          <Field label="Priority" required error={errors.priority}>
            <Choice value={form.priority} onChange={(v) => set('priority', v)} options={PRIORITIES} />
          </Field>
          <Field label="Requested by" error={errors.requestedBy} help="Defaults to you; choose a colleague to file on their behalf.">
            <Choice value={form.requestedBy} onChange={(v) => set('requestedBy', v)} searchable placeholder="Select an employee" options={toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)} error={errors.requestedBy} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Request date" help="Set automatically when the requisition is created.">
            <Input value={editing ? formatDate(record.requestDate) : formatDate(new Date())} disabled />
          </Field>
          <Field label="Required date" required error={errors.requiredDate}>
            <DatePicker value={form.requiredDate} onChange={(e) => set('requiredDate', e.target.value)} error={Boolean(errors.requiredDate)} />
          </Field>
        </TwoCol>
        <Field label="Justification" required error={errors.justification}>
          <Textarea rows={3} value={form.justification} onChange={(e) => set('justification', e.target.value)} error={Boolean(errors.justification)} />
        </Field>
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

function ViewRequisitionModal({ id, refreshKey, actions, canDecide, ownRequest, canUpload, onClose }) {
  const { record, error, loading } = useRecord(purchaseRequisitionService, id, refreshKey);
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="760px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading requisition…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiFileText size={22} />} title={record.requestedMaterialService} subtitle={`${refName(record.requestedBy, 'fullName')} • ${record.requisitionId}`}>
            {actions(record)}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          {record.status === 'pending_approval' && canDecide && ownRequest(record) && (
            <Note tone="amber">You raised this requisition, so another approver has to decide it.</Note>
          )}
          <DetailGrid
            items={[
              ['Requested material/service', record.requestedMaterialService],
              ['Category', record.category],
              ['Requisition ID', record.requisitionId],
              ['Department', refName(record.departmentId, 'name')],
              ['Quantity', `${record.quantity} ${record.unit}`],
              ['Estimated budget', money(record.estimatedBudget)],
              ['Priority', record.priority],
              ['Project', record.projectId ? `${record.projectId.projectId || ''} ${record.projectId.projectName || ''}`.trim() : 'General'],
              ['Requested by', refName(record.requestedBy, 'fullName')],
              ['Request date', formatDate(record.requestDate)],
              ['Required date', formatDate(record.requiredDate)],
              ['Status', statusLabel(record.status)],
            ]}
          />
          <Panel title="Justification">{record.justification || 'No justification entered.'}</Panel>
          {record.status === 'rejected' && <Panel title="Rejection reason" tone="red">{record.rejectionReason || 'No reason was recorded.'}</Panel>}
          <DocumentList key={record._id} api={purchaseRequisitionService} id={record._id} canUpload={canUpload && ['draft', 'pending_approval'].includes(record.status)} />
        </div>
      )}
    </Modal>
  );
}

export default function PurchaseRequests() {
  const canCreate = usePermission('procurement.requisition.create');
  const canUpdate = usePermission('procurement.requisition.update');
  const canDelete = usePermission('procurement.requisition.delete');
  const canDecide = usePermission('procurement.requisition.decide');
  const canConvert = usePermission('procurement.rfq.create');
  const user = useSelector(selectCurrentUser);
  const myEmployeeId = (user?.employeeId && typeof user.employeeId === 'object' ? user.employeeId._id : user?.employeeId) || '';
  const ownRequest = (r) => Boolean(myEmployeeId) && refId(r.requestedBy) === myEmployeeId;

  const list = useProcList(requisitionsSlice, { initialFilters: { status: '', priority: '', category: '', departmentId: '', projectId: '', dateFrom: '', dateTo: '' } });
  const run = useRunAction(requisitionsSlice);
  const selection = useSelection();
  const { toast, showToast, hideToast } = useToast();
  const { lookups } = useLookups(['departments', 'projects', 'employees', 'vendors', 'locations', 'approvedRequisitions']);
  const exporter = useExport(purchaseRequisitionService, list, selection, EXPORT_COLUMNS, 'requisitions.csv');

  const [formFor, setFormFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [convertFor, setConvertFor] = useState(null);
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

  const menuItems = (row) => {
    const items = [];
    if (row.status === 'draft') {
      if (canUpdate) {
        items.push({ label: 'Edit Requisition', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
        items.push({ label: 'Submit Requisition', icon: <FiCheck size={14} color="#16A34A" />, action: () => doAction('submit', [row._id], 'Requisition submitted for approval') });
      }
      if (canDelete) items.push({ label: 'Delete Requisition', icon: <FiTrash2 size={14} color="#DC2626" />, color: '#DC2626', action: () => { setActionError(''); setConfirm({ type: 'delete', row }); } });
    }
    if (row.status === 'pending_approval' && canDecide && !ownRequest(row)) {
      items.push({ label: 'Approve Requisition', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => { setActionError(''); setConfirm({ type: 'approve', row }); } });
      items.push({ label: 'Reject Requisition', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => { setActionError(''); setConfirm({ type: 'reject', row }); } });
    }
    if (row.status === 'approved' && canConvert) {
      items.push({ label: 'Convert to RFQ/RFP', icon: <FiArrowRight size={14} color="#2563EB" />, action: () => setConvertFor(row) });
    }
    return items;
  };

  const columns = useMemo(() => [
    { key: 'requisitionId', label: 'REQUISITION ID', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'requestedMaterialService', label: 'REQUESTED MATERIALS', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'departmentId', label: 'DEPARTMENT', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'name')}</span> },
    { key: 'requestedBy', label: 'REQUESTED BY', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'fullName')}</span> },
    { key: 'priority', label: 'PRIORITY', render: (v) => <StatusBadge status={v} label={v} /> },
    { key: 'requestDate', label: 'REQUEST DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Requisition" aria-label="View requisition" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDelete, canDecide, canConvert, myEmployeeId]);

  const viewActions = (record) => {
    return (
      <>
        {record.status === 'pending_approval' && canDecide && !ownRequest(record) && (
          <>
            <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => { setActionError(''); setConfirm({ type: 'approve', row: record }); }}>Approve Requisition</PrimaryButton>
            <SecondaryButton danger icon={<FiX size={14} />} onClick={() => { setActionError(''); setConfirm({ type: 'reject', row: record }); }}>Reject</SecondaryButton>
          </>
        )}
        {record.status === 'approved' && canConvert && (
          <PrimaryButton icon={<FiArrowRight size={14} />} onClick={() => setConvertFor(record)}>Convert to RFQ/RFP</PrimaryButton>
        )}
        {record.status === 'draft' && canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit</SecondaryButton>}
      </>
    );
  };

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected requisitions exported` : 'Requisitions exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'priority', label: 'Priority', options: PRIORITIES.map((p) => ({ value: p, label: p })) },
    { key: 'category', label: 'Category', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'departmentId', label: 'Department', options: toOptions(lookups.departments, 'name') },
    { key: 'projectId', label: 'Project', options: toOptions(lookups.projects, (p) => p.projectName) },
    { key: 'dateFrom', label: 'Requested from', type: 'date' },
    { key: 'dateTo', label: 'Requested to', type: 'date' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Requisition Tracker" subtitle="Track and manage procurement requests submitted across all departments.">
        {(canCreate || canUpdate) && (
          <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>
        )}
      </PageHeader>

      <ListCard
        list={list}
        columns={columns}
        emptyText="No requisitions found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search Requisition ID, Department ..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>New Requisition</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Requisitions" subtitle="Narrow the tracker by status, priority and more." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <RequisitionFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          myEmployeeId={myEmployeeId}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && (
        <ViewRequisitionModal
          id={viewId}
          refreshKey={refreshKey}
          actions={viewActions}
          canDecide={canDecide}
          ownRequest={ownRequest}
          canUpload={canUpdate || canCreate}
          onClose={() => setViewId(null)}
        />
      )}

      {convertFor && (
        <RfqFormModal
          requisition={convertFor}
          lookups={lookups}
          canIssue
          onClose={() => setConvertFor(null)}
          onSaved={(message) => { setConvertFor(null); setViewId(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {uploadOpen && (
        <AttachToRecordDialog
          api={purchaseRequisitionService}
          title="Upload Requisition Document"
          recordNoun="requisition"
          recordLabel={(r) => `${r.requisitionId}: ${r.requestedMaterialService}`}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); setRefreshKey((k) => k + 1); }}
        />
      )}

      {confirm?.type === 'approve' && (
        <ConfirmModal
          title="Approve Requisition?"
          message="Once approved, procurement can convert this requisition into an RFQ/RFP."
          detail={<RecordSummary rows={[['Requisition', confirm.row.requisitionId], ['Material', confirm.row.requestedMaterialService]]} />}
          confirmLabel="Approve Requisition"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('approve', [confirm.row._id], 'Requisition approved')}
        />
      )}
      {confirm?.type === 'reject' && (
        <ReasonModal
          title="Reject Requisition?"
          message="A rejected requisition cannot be edited or resubmitted; the requester has to raise a new one."
          detail={<RecordSummary rows={[['Requisition', confirm.row.requisitionId], ['Material', confirm.row.requestedMaterialService]]} />}
          label="Reason for rejection"
          confirmLabel="Reject Requisition"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('reject', [confirm.row._id, reason], 'Requisition rejected')}
        />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmModal
          title="Delete Requisition?"
          message="This permanently removes the draft."
          detail={<RecordSummary rows={[['Requisition', confirm.row.requisitionId], ['Material', confirm.row.requestedMaterialService]]} />}
          confirmLabel="Delete Draft"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('remove', [confirm.row._id], 'Requisition deleted')}
        />
      )}
    </div>
  );
}
