import { useState } from 'react';
import { FiPlus, FiEye, FiDownload, FiRefreshCw, FiArchive, FiCheck, FiSearch } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermissions } from '../../../hooks/usePermission';
import { hsePlansSlice } from '../../../store/hse/slices';
import { apiError } from '../../../services/apiHelpers';
import { emergencyPlanService } from '../../../services/hse.service';
import { countFilters, fieldErrorsOf, formatDate, statusLabel, ymd } from '../../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useRunAction, useSelection } from '../../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel,
  PrimaryButton, ReasonModal, RecordSummary, SecondaryButton, StatusLine, TwoCol,
} from '../../procurement/shared/ProcUi';
import { AttachField } from '../../procurement/shared/ProcExtras';
import { HistoryTimeline, Pill } from '../../administration/shared/AdmUi';
import { FileList } from '../shared/hseUi';
import { nameOf, openSignedDownload, toFileRows } from '../shared/hseUtils';
import { useHseLookups } from '../shared/useScreenLookups';

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'archived', label: 'Archived' },
];
const STATUS_TONE = { active: 'green', under_review: 'amber', archived: 'slate' };
const FORM_SECTIONS = ['employees', 'locations', 'planCategories'];
const FILTER_SECTIONS = ['locations', 'planCategories'];
const ALL_SITES = 'all';

const Status = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;
const locationName = (ref) => (ref ? nameOf(ref) : 'All Sites');

const EXPORT_COLUMNS = [
  { label: 'Plan ID', value: (r) => r.planId },
  { label: 'Plan Name', value: (r) => r.planName },
  { label: 'Category', value: (r) => r.planCategory },
  { label: 'Location', value: (r) => locationName(r.location) },
  { label: 'Review Due', value: (r) => ymd(r.reviewDate) },
  { label: 'Version', value: (r) => `v${r.version}` },
  { label: 'Owner', value: (r) => nameOf(r.planOwnerId) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function UploadPlanModal({ onClose, onSaved }) {
  const { lookups, loading: lookupsLoading, error: lookupsError } = useHseLookups(FORM_SECTIONS);
  const [form, setForm] = useState({ planCategory: '', planName: '', planOwnerId: '', reviewDate: '', location: ALL_SITES, description: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.planCategory.trim()) next.planCategory = 'Enter or choose the plan category';
    if (!form.planName.trim()) next.planName = 'Enter the plan name';
    if (!form.planOwnerId) next.planOwnerId = 'Choose the plan owner';
    if (!form.reviewDate) next.reviewDate = 'Choose the review date';
    if (!files.length) next.file = 'Attach the plan document';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await emergencyPlanService.create({
        planCategory: form.planCategory.trim(),
        planName: form.planName.trim(),
        planOwnerId: form.planOwnerId,
        reviewDate: form.reviewDate,
        location: form.location === ALL_SITES ? '' : form.location,
        description: form.description.trim(),
      }, files[0]);
      onSaved('Plan uploaded successfully');
    } catch (err) {
      setError(apiError(err, 'The plan could not be uploaded'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Upload Plan"
      subtitle="Upload an emergency response plan for employee access and operational readiness"
      width="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy || lookupsLoading}>{busy ? 'Uploading…' : 'Upload Plan'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <FormError message={lookupsError} />
        <TwoCol>
          <Field label="Plan ID" help="Assigned automatically when the plan is uploaded.">
            <Input value="Assigned on upload" disabled />
          </Field>
          <Field label="Plan category" required error={errors.planCategory}>
            <Input list="hse-plan-categories" value={form.planCategory} onChange={(e) => set('planCategory', e.target.value)} placeholder="e.g. Fire Emergency" error={Boolean(errors.planCategory)} />
            <datalist id="hse-plan-categories">{(lookups.planCategories || []).map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
        </TwoCol>
        <Field label="Plan name" required error={errors.planName}>
          <Input value={form.planName} onChange={(e) => set('planName', e.target.value)} placeholder="e.g. Fire Emergency Response Plan" error={Boolean(errors.planName)} />
        </Field>
        <TwoCol>
          <Field label="Plan owner" required error={errors.planOwnerId}>
            <Choice value={form.planOwnerId} onChange={(v) => set('planOwnerId', v)} searchable placeholder={lookupsLoading ? 'Loading…' : 'Select owner'} options={(lookups.employees || []).map((e) => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))} error={errors.planOwnerId} />
          </Field>
          <Field label="Review date" required error={errors.reviewDate}>
            <DatePicker value={form.reviewDate} onChange={(e) => set('reviewDate', e.target.value)} error={Boolean(errors.reviewDate)} />
          </Field>
        </TwoCol>
        <div style={{ maxWidth: 320 }}>
          <Field label="Location" required error={errors.location}>
            <Choice value={form.location} onChange={(v) => set('location', v)} options={[{ value: ALL_SITES, label: 'All Sites' }, ...(lookups.locations || []).map((l) => ({ value: l._id, label: l.name }))]} />
          </Field>
        </div>
        <Field label="Description (optional)" error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="This plan outlines emergency response procedures..." />
        </Field>
        <Field label="Attach documents" required error={errors.file}>
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ReplacePlanModal({ plan, onClose, onSaved }) {
  const { record } = useRecord(emergencyPlanService, plan._id);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const current = record?.files?.[0]?.fileName || '—';

  const save = async () => {
    setError('');
    const next = {};
    if (!reason.trim()) next.reason = 'Say why the plan is being replaced';
    if (!files.length) next.file = 'Attach the new version of the plan';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await emergencyPlanService.replace(plan._id, reason.trim(), files[0]);
      onSaved(`Plan replaced, now v${plan.version + 1}`);
    } catch (err) {
      setError(apiError(err, 'The plan could not be replaced'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Replace Plan"
      subtitle="Upload a newer version of this emergency plan"
      width="580px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy} icon={<FiRefreshCw size={14} />}>{busy ? 'Replacing…' : 'Replace Plan'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <TwoCol>
          <Field label="Plan ID"><Input value={plan.planId} disabled /></Field>
          <Field label="Plan category"><Input value={plan.planCategory} disabled /></Field>
        </TwoCol>
        <Field label="Plan name"><Input value={plan.planName} disabled /></Field>
        <Field label="Current file"><Input value={current} disabled /></Field>
        <Field label="Reason for replacement" required error={errors.reason}>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Updated to include new evacuation routes..." error={Boolean(errors.reason)} />
        </Field>
        <Field label="Attach documents" required error={errors.file}>
          <AttachField files={files} onChange={setFiles} multiple={false} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewPlanDrawer({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(emergencyPlanService, id, refreshKey);
  return (
    <Drawer isOpen onClose={onClose} title={record ? record.planName : 'Emergency Plan'} subtitle={record?.planId} width="520px">
      {loading && <div style={{ color: '#64748B' }}>Loading plan…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StatusLine status={<Status status={record.status} />}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions(record)}</div>
          </StatusLine>
          <DetailGrid
            items={[
              ['Plan ID', record.planId],
              ['Plan category', record.planCategory],
              ['Plan name', record.planName],
              ['Plan owner', nameOf(record.planOwnerId)],
              ['Location', locationName(record.location)],
              ['Last updated', formatDate(record.updatedAt)],
              ['Review date', formatDate(record.reviewDate)],
              ['Version', `V${record.version}`],
              ['Status', statusLabel(record.status)],
            ]}
          />
          <Panel title="Description">{record.description || 'No description was entered.'}</Panel>
          {record.status === 'archived' && <Panel title="Archive reason" tone="red">{record.archiveReason || 'No reason was recorded.'}</Panel>}
          <FileList
            files={toFileRows(record.files)}
            download={(file) => openSignedDownload(() => emergencyPlanService.downloadFile(record._id, file.id))}
            empty="No plan file is attached."
          />
          <HistoryTimeline key={`${record._id}-${refreshKey}`} load={emergencyPlanService.history} id={record._id} title="Plan history" />
        </div>
      )}
    </Drawer>
  );
}

export default function PlansTab({ showToast }) {
  const { can } = usePermissions();
  const canCreate = can('hse.emergencyplan.create');
  const canUpdate = can('hse.emergencyplan.update');
  const canExport = can('hse.emergencyplan.export');

  const list = useProcList(hsePlansSlice, { initialFilters: { status: '', planCategory: '', location: '', dateFrom: '', dateTo: '' }, withStats: false });
  const run = useRunAction(hsePlansSlice);
  const selection = useSelection();
  const exporter = useExport(emergencyPlanService, list, selection, EXPORT_COLUMNS, 'emergency-plans.csv');
  const { lookups } = useHseLookups(FILTER_SECTIONS);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceFor, setReplaceFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

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

  const downloadPlan = async (row) => {
    try {
      const detail = await emergencyPlanService.get(row._id);
      const file = (detail.data?.data?.files || [])[0];
      if (!file) { showToast('No plan file is attached to this plan', 'error'); return; }
      const problem = await openSignedDownload(() => emergencyPlanService.downloadFile(row._id, file.id));
      if (problem) showToast(problem, 'error');
    } catch (err) {
      showToast(apiError(err, 'Download failed'), 'error');
    }
  };

  const menuItems = (row) => {
    const items = [];
    if (row.status === 'active') {
      if (canUpdate) items.push({ label: 'Replace Plan', icon: <FiRefreshCw size={14} color="#64748B" />, action: () => setReplaceFor(row) });
      if (canUpdate) items.push({ label: 'Mark Under Review', icon: <FiSearch size={14} color="#64748B" />, action: () => open('review', row) });
      if (canUpdate) items.push({ label: 'Archive Plan', icon: <FiArchive size={14} color="#64748B" />, action: () => open('archive', row) });
    }
    if (row.status === 'under_review' && canUpdate) items.push({ label: 'Mark as Active', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('active', row) });
    items.push({ label: 'Download Plan', icon: <FiDownload size={14} color="#64748B" />, action: () => downloadPlan(row) });
    return items;
  };

  const columns = [
    { key: 'planId', label: 'PLAN ID', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'planName', label: 'PLAN NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'location', label: 'LOCATION', render: (v) => <span style={{ color: '#334155' }}>{locationName(v)}</span> },
    { key: 'reviewDate', label: 'REVIEW DUE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'version', label: 'VERSION', render: (v) => <span style={{ color: '#334155' }}>v{v}</span> },
    { key: 'planOwnerId', label: 'OWNER', render: (v) => <span style={{ color: '#334155' }}>{nameOf(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <Status status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="icon-btn" title="View Plan" aria-label="View plan" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
          <RowMenu items={menuItems(row)} />
        </div>
      ),
    },
  ];

  const viewActions = (record) => (
    <>
      {canUpdate && record.status === 'active' && <SecondaryButton icon={<FiRefreshCw size={14} />} onClick={() => setReplaceFor(record)}>Replace Plan</SecondaryButton>}
      {canUpdate && record.status === 'under_review' && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('active', record)}>Mark as Active</PrimaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected plans exported` : 'Emergency plans exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'planCategory', label: 'Plan category', options: (lookups.planCategories || []).map((c) => ({ value: c, label: c })) },
    { key: 'location', label: 'Location', options: [{ value: ALL_SITES, label: 'All Sites' }, ...(lookups.locations || []).map((l) => ({ value: l._id, label: l.name }))] },
    { key: 'dateFrom', label: 'Review due from', type: 'date' },
    { key: 'dateTo', label: 'Review due to', type: 'date' },
  ];

  const summary = (row) => <RecordSummary rows={[['Plan', row.planId], ['Name', row.planName]]} />;

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No emergency plans found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search Plans..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setUploadOpen(true)}>Upload Plan</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Plans" subtitle="Narrow the plans by status, category, location and review date." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {uploadOpen && <UploadPlanModal onClose={() => setUploadOpen(false)} onSaved={(message) => { setUploadOpen(false); showToast(message, 'success'); refresh(); }} />}
      {replaceFor && <ReplacePlanModal key={replaceFor._id} plan={replaceFor} onClose={() => setReplaceFor(null)} onSaved={(message) => { setReplaceFor(null); showToast(message, 'success'); refresh(); }} />}
      {viewId && <ViewPlanDrawer id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}

      {confirm?.type === 'archive' && (
        <ReasonModal
          title="Archive Plan?"
          message="An archived plan stays on record but is no longer in force."
          detail={summary(confirm.row)}
          label="Reason"
          confirmLabel="Archive Plan"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('archive', [confirm.row._id, reason], 'Plan archived')}
        />
      )}
      {confirm?.type === 'active' && (
        <ConfirmModal
          title="Mark Plan as Active?"
          message="The reviewed plan will be back in force."
          detail={summary(confirm.row)}
          confirmLabel="Mark as Active"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('markActive', [confirm.row._id], 'Plan marked active')}
        />
      )}
      {confirm?.type === 'review' && (
        <ConfirmModal
          title="Mark Plan Under Review?"
          message="Use this when the plan is being revised. It can be marked active again once the review is done."
          detail={summary(confirm.row)}
          confirmLabel="Mark Under Review"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('markUnderReview', [confirm.row._id], 'Plan marked under review')}
        />
      )}
    </>
  );
}
