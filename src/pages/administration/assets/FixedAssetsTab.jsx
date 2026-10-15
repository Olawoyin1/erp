import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiSend, FiCheck, FiSlash, FiTool } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermissions } from '../../../hooks/usePermission';
import { admAssetsSlice } from '../../../store/administration/slices';
import { apiError } from '../../../services/apiHelpers';
import { assetService } from '../../../services/admin.service';
import {
  countFilters, csvMoney, fieldErrorsOf, formatDate, fromKobo, money, refId, refName, statusLabel, toKobo, toOptions, today, ymd,
} from '../../procurement/shared/procUtils';
import { useExport, useFetched, useProcList, useRecord, useRunAction, useSelection } from '../../procurement/shared/procHooks';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, MoneyInput, Panel,
  PrimaryButton, ReasonModal, SecondaryButton, SimpleTable, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { Pill } from '../shared/AdmUi';

const ASSET_CATEGORIES = ['IT Equipment', 'Vehicle & Transport', 'Heavy Equipment', 'Office Furniture', 'Office Equipment', 'Generators & Power', 'Tools & Machinery', 'Other'];
const CONDITIONS = [{ value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' }];
const STATUSES = [{ value: 'active', label: 'Active' }, { value: 'in_maintenance', label: 'In Maintenance' }, { value: 'on_loan', label: 'On Loan' }];
const CONDITION_TONE = { good: 'green', fair: 'amber', poor: 'red' };
const STATUS_TONE = { active: 'green', in_maintenance: 'sky', on_loan: 'amber', retired: 'red' };

const AssetStatus = ({ status }) => <Pill tone={STATUS_TONE[status]}>{statusLabel(status)}</Pill>;

const EXPORT_COLUMNS = [
  { label: 'Asset Tag', value: (r) => r.assetTag },
  { label: 'Asset Name', value: (r) => r.assetName },
  { label: 'Category', value: (r) => r.category },
  { label: 'Custodian', value: (r) => refName(r.custodian, 'fullName') },
  { label: 'Location', value: (r) => refName(r.currentLocationId, 'name') },
  { label: 'Department', value: (r) => refName(r.departmentId, 'name') },
  { label: 'Serial No', value: (r) => r.serialNo || '' },
  { label: 'Vendor', value: (r) => r.vendor || '' },
  { label: 'Purchase Date', value: (r) => ymd(r.purchaseDate) },
  { label: 'Purchase Cost (NGN)', value: (r) => csvMoney(r.purchaseCost) },
  { label: 'Book Value (NGN)', value: (r) => csvMoney(r.currentBookValue) },
  { label: 'Condition', value: (r) => statusLabel(r.condition) },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function blankForm(me) {
  return {
    assetName: '', category: 'IT Equipment', serialNo: '', vendor: '', purchaseDate: today(), purchaseCost: '', currentLocationId: '',
    custodian: '', condition: 'good', status: 'active', warrantyExpiry: '', description: '', departmentId: me?.departmentId || '',
    manufacturer: '', model: '', depreciationRate: '15', onTheBooks: false,
  };
}

function formFromRecord(r) {
  return {
    assetName: r.assetName || '', category: r.category || 'IT Equipment', serialNo: r.serialNo || '', vendor: r.vendor || '',
    purchaseDate: ymd(r.purchaseDate), purchaseCost: fromKobo(r.purchaseCost), currentLocationId: refId(r.currentLocationId),
    custodian: refId(r.custodian), condition: r.condition || 'good', status: r.status === 'retired' ? 'active' : r.status,
    warrantyExpiry: ymd(r.warrantyExpiry), description: r.description || '', departmentId: refId(r.departmentId),
    manufacturer: r.manufacturer || '', model: r.model || '', depreciationRate: '15', onTheBooks: false,
  };
}

function AssetFormModal({ record, lookups, me, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => (record ? formFromRecord(record) : blankForm(me)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.assetName.trim()) next.assetName = 'Enter the asset name';
    if (!form.departmentId) next.departmentId = 'Choose the owning department';
    if (!form.currentLocationId) next.currentLocationId = 'Choose where the asset is kept';
    if (Number.isNaN(toKobo(form.purchaseCost))) next.purchaseCost = 'Enter the purchase value in naira, for example 1250000.50';
    if (!form.purchaseDate) next.purchaseDate = 'Choose the purchase date';
    if (!editing) {
      const rate = Number(form.depreciationRate);
      if (form.depreciationRate === '' || !Number.isFinite(rate) || rate < 0 || rate > 100) next.depreciationRate = 'Enter a rate between 0 and 100';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => ({
    assetName: form.assetName.trim(),
    category: form.category,
    departmentId: form.departmentId,
    currentLocationId: form.currentLocationId,
    purchaseCost: toKobo(form.purchaseCost),
    purchaseDate: form.purchaseDate,
    condition: form.condition,
    status: form.status,
    ...(form.custodian ? { custodian: form.custodian } : {}),
    ...(form.serialNo.trim() ? { serialNo: form.serialNo.trim() } : {}),
    ...(form.vendor.trim() ? { vendor: form.vendor.trim() } : {}),
    ...(form.manufacturer.trim() ? { manufacturer: form.manufacturer.trim() } : {}),
    ...(form.model.trim() ? { model: form.model.trim() } : {}),
    ...(form.warrantyExpiry ? { warrantyExpiry: form.warrantyExpiry } : {}),
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
  });

  const save = async () => {
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      if (editing) {
        await assetService.update(record._id, payload());
        onSaved('Asset updated');
      } else {
        const res = await assetService.create({ ...payload(), depreciationRate: Number(form.depreciationRate), ...(form.onTheBooks ? { capitalise: false } : {}) });
        onSaved(`Asset ${res.data?.data?.assetTag || ''} registered`.replace('  ', ' '));
      }
    } catch (err) {
      setError(apiError(err, 'The asset could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Asset' : 'Register New Asset'}
      subtitle={editing ? undefined : 'Capture a new fixed asset in the register.'}
      maxWidth="720px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Register Asset'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <TwoCol>
          <Field label="Asset name" required error={errors.assetName}>
            <Input value={form.assetName} onChange={(e) => set('assetName', e.target.value)} placeholder="e.g. Dell Latitude Laptop (i7, 16GB)" error={Boolean(errors.assetName)} />
          </Field>
          <Field label="Asset tag" help={editing ? undefined : 'Assigned automatically when the asset is registered.'}>
            <Input value={editing ? record.assetTag : 'Assigned on save'} disabled />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Category" required error={errors.category}>
            <Choice value={form.category} onChange={(v) => set('category', v)} options={ASSET_CATEGORIES} />
          </Field>
          <Field label="Serial no" error={errors.serialNo}>
            <Input value={form.serialNo} onChange={(e) => set('serialNo', e.target.value)} error={Boolean(errors.serialNo)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Manufacturer" error={errors.manufacturer}>
            <Input value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
          </Field>
          <Field label="Model" error={errors.model}>
            <Input value={form.model} onChange={(e) => set('model', e.target.value)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Supplier/vendor" error={errors.vendor}>
            <Input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} />
          </Field>
          <Field label="Purchase date" required error={errors.purchaseDate}>
            <DatePicker value={form.purchaseDate} max={today()} onChange={(e) => set('purchaseDate', e.target.value)} error={Boolean(errors.purchaseDate)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Purchase value (₦)" required error={errors.purchaseCost}>
            <MoneyInput value={form.purchaseCost} onChange={(v) => set('purchaseCost', v)} error={errors.purchaseCost} />
          </Field>
          <Field label="Department" required error={errors.departmentId}>
            <Choice value={form.departmentId} onChange={(v) => set('departmentId', v)} searchable placeholder="Select a department" options={toOptions(lookups.departments, 'name')} error={errors.departmentId} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Location" required error={errors.currentLocationId}>
            <Choice value={form.currentLocationId} onChange={(v) => set('currentLocationId', v)} searchable placeholder="Select a location" options={toOptions(lookups.locations, 'name')} error={errors.currentLocationId} />
          </Field>
          <Field label="Custodian" error={errors.custodian}>
            <Choice value={form.custodian} onChange={(v) => set('custodian', v)} searchable placeholder="Select a custodian" options={[{ value: '', label: 'No custodian' }, ...toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)]} error={errors.custodian} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Condition" required error={errors.condition}>
            <Choice value={form.condition} onChange={(v) => set('condition', v)} options={CONDITIONS} />
          </Field>
          <Field label="Status" required error={errors.status}>
            <Choice value={form.status} onChange={(v) => set('status', v)} options={STATUSES} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Warranty expiry" error={errors.warrantyExpiry}>
            <DatePicker value={form.warrantyExpiry} onChange={(e) => set('warrantyExpiry', e.target.value)} error={Boolean(errors.warrantyExpiry)} />
          </Field>
          {!editing && (
            <Field label="Depreciation rate (% a year)" required error={errors.depreciationRate} help="Straight-line, five-year schedule.">
              <Input type="number" min="0" max="100" step="any" value={form.depreciationRate} onChange={(e) => set('depreciationRate', e.target.value)} error={Boolean(errors.depreciationRate)} />
            </Field>
          )}
        </TwoCol>
        <Field label="Description / notes (optional)" error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add any context…" />
        </Field>
        {!editing && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.onTheBooks} onChange={(e) => set('onTheBooks', e.target.checked)} style={{ accentColor: '#1E3A8A' }} />
            This asset is already on the books; do not post the purchase to the ledger again.
          </label>
        )}
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function TransferModal({ asset, lookups, onClose, onSaved }) {
  const [form, setForm] = useState({ toLocationId: '', toCustodian: refId(asset.custodian), transferDate: today(), condition: asset.condition || 'good', reason: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.toLocationId) next.toLocationId = 'Choose the new location';
    if (!form.reason.trim()) next.reason = 'Give a reason for the transfer';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await assetService.transfer(asset._id, {
        toLocationId: form.toLocationId,
        ...(form.toCustodian ? { toCustodian: form.toCustodian } : {}),
        transferDate: form.transferDate || undefined,
        condition: form.condition,
        reason: form.reason.trim(),
      });
      onSaved('Asset transferred');
    } catch (err) {
      setError(apiError(err, 'The transfer failed'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Transfer Asset"
      subtitle={`${asset.assetTag} · ${asset.assetName}`}
      maxWidth="640px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Transferring…' : 'Confirm Transfer'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <TwoCol>
          <Field label="Current location"><Input value={refName(asset.currentLocationId, 'name')} disabled /></Field>
          <Field label="New location" required error={errors.toLocationId}>
            <Choice value={form.toLocationId} onChange={(v) => set('toLocationId', v)} searchable placeholder="Select a location" options={toOptions(lookups.locations, 'name')} error={errors.toLocationId} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Current custodian"><Input value={asset.custodian ? refName(asset.custodian, 'fullName') : 'No custodian'} disabled /></Field>
          <Field label="New custodian" error={errors.toCustodian}>
            <Choice value={form.toCustodian} onChange={(v) => set('toCustodian', v)} searchable placeholder="Select a custodian" options={toOptions(lookups.employees, (e) => `${e.fullName} (${e.employeeId})`)} error={errors.toCustodian} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Transfer date" required error={errors.transferDate}>
            <DatePicker value={form.transferDate} onChange={(e) => set('transferDate', e.target.value)} />
          </Field>
          <Field label="Condition at transfer" required error={errors.condition}>
            <Choice value={form.condition} onChange={(v) => set('condition', v)} options={CONDITIONS} />
          </Field>
        </TwoCol>
        <Field label="Reason for transfer" required error={errors.reason}>
          <Textarea rows={3} value={form.reason} onChange={(e) => set('reason', e.target.value)} error={Boolean(errors.reason)} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function DepreciationTab({ id }) {
  const { data, error, loading } = useFetched(() => assetService.depreciation(id), id);
  const rows = [...data].sort((a, b) => b.year - a.year);
  if (loading) return <div style={{ color: '#64748B', padding: 12 }}>Loading schedule…</div>;
  if (error) return <FormError message={error} />;
  return (
    <SimpleTable
      empty="No depreciation schedule has been generated for this asset."
      columns={[
        { key: 'year', label: 'Year' },
        { key: 'openingBookValue', label: 'Opening Book Value', render: (r) => money(r.openingBookValue) },
        { key: 'depreciationRate', label: 'Depreciation Rate', render: (r) => `${r.depreciationRate}%` },
        { key: 'depreciationAmount', label: 'Depreciation Amount', render: (r) => money(r.depreciationAmount) },
        { key: 'closingBookValue', label: 'Closing Book Value', render: (r) => money(r.closingBookValue) },
      ]}
      rows={rows.map((r) => ({ ...r, key: r.year }))}
    />
  );
}

function CustodyTab({ id, refreshKey }) {
  const { data, error, loading } = useFetched(() => assetService.custodyHistory(id), id, refreshKey);
  if (loading) return <div style={{ color: '#64748B', padding: 12 }}>Loading custody history…</div>;
  if (error) return <FormError message={error} />;
  if (!data.length) return <div style={{ color: '#94A3B8', padding: 12 }}>No custody history has been recorded.</div>;
  const place = (location, person) => [location || '—', person ? `(${person})` : ''].filter(Boolean).join(' ');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((row) => (
        <div key={row._id} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.84rem', color: '#0F172A' }}>
          <div style={{ color: '#64748B', fontSize: '0.78rem' }}>{formatDate(row.date)}{row.by ? ` • by ${row.by}` : ''}{row.condition ? ` • condition ${row.condition}` : ''}</div>
          {row.kind === 'transferred' && <div>From: {place(row.fromLocation, row.fromCustodian)}</div>}
          <div>{row.kind === 'registered' ? 'Assigned to' : 'To'}: {place(row.toLocation, row.toCustodian)}</div>
          <Panel title="Reason for transfer">{row.reason || '—'}</Panel>
        </div>
      ))}
    </div>
  );
}

function ViewAssetModal({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(assetService, id, refreshKey);
  const [tab, setTab] = useState('specs');
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="760px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading asset…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiTool size={22} />} title={record.assetName} subtitle={`${record.custodian ? refName(record.custodian, 'fullName') : 'No custodian'} • ${record.assetTag}`}>
            {actions(record)}
          </ViewHeader>
          <StatusLine status={<AssetStatus status={record.status} />} />
          <TabBar tabs={[{ id: 'specs', label: 'Specifications' }, { id: 'dep', label: 'Depreciation Schedule' }, { id: 'custody', label: 'Custody History' }]} active={tab} onChange={setTab} />
          {tab === 'specs' && (
            <>
              <DetailGrid
                items={[
                  ['Asset name', record.assetName],
                  ['Asset tag', record.assetTag],
                  ['Custodian', record.custodian ? refName(record.custodian, 'fullName') : '—'],
                  ['Category', record.category],
                  ['Manufacturer', record.manufacturer],
                  ['Department', refName(record.departmentId, 'name')],
                  ['Model', record.model],
                  ['Serial no', record.serialNo],
                  ['Current location', refName(record.currentLocationId, 'name')],
                  ['Vendor', record.vendor],
                  ['Purchase cost', money(record.purchaseCost)],
                  ['Condition', statusLabel(record.condition)],
                  ['Purchase date', formatDate(record.purchaseDate)],
                  ['Current book value', money(record.currentBookValue)],
                  ['Warranty expiry', record.warrantyExpiry ? formatDate(record.warrantyExpiry) : '—'],
                  ['Status', statusLabel(record.status)],
                ]}
              />
              {record.description && <Panel title="Description">{record.description}</Panel>}
              {record.status === 'retired' && <Panel title="Retirement" tone="red">{`Retired ${formatDate(record.retiredAt)}. ${record.retirementReason || ''}`}</Panel>}
            </>
          )}
          {tab === 'dep' && <DepreciationTab id={record._id} />}
          {tab === 'custody' && <CustodyTab id={record._id} refreshKey={refreshKey} />}
        </div>
      )}
    </Modal>
  );
}

export default function FixedAssetsTab({ lookups, me, showToast }) {
  const { can } = usePermissions();
  const canCreate = can('administration.asset.create');
  const canUpdate = can('administration.asset.update');
  const canTransition = can('administration.asset.transition');
  const canExport = can('administration.asset.export');

  const list = useProcList(admAssetsSlice, { initialFilters: { status: '', condition: '', category: '', locationId: '' }, withStats: false });
  const run = useRunAction(admAssetsSlice);
  const selection = useSelection();
  const exporter = useExport(assetService, list, selection, EXPORT_COLUMNS, 'assets.csv');

  const [formFor, setFormFor] = useState(null);
  const [transferFor, setTransferFor] = useState(null);
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
  };

  const open = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const menuItems = (row) => {
    const actions = row.allowedActions || [];
    const items = [];
    if (actions.includes('edit') && canUpdate) items.push({ label: 'Edit Asset', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (actions.includes('transfer') && canTransition) items.push({ label: 'Transfer Asset', icon: <FiSend size={14} color="#64748B" />, action: () => setTransferFor(row) });
    if (actions.includes('mark_active') && canTransition) items.push({ label: 'Mark Active', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => open('active', row) });
    if (actions.includes('retire') && canTransition) items.push({ label: 'Retire Asset', icon: <FiSlash size={14} color="#DC2626" />, color: '#DC2626', action: () => open('retire', row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'assetTag', label: 'ASSET TAG', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'assetName', label: 'ASSET NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'custodian', label: 'CUSTODIAN', render: (v) => <span style={{ color: '#334155' }}>{v ? refName(v, 'fullName') : '—'}</span> },
    { key: 'currentLocationId', label: 'LOCATION', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'name')}</span> },
    { key: 'condition', label: 'CONDITION', render: (v) => <Pill tone={CONDITION_TONE[v]}>{statusLabel(v)}</Pill> },
    { key: 'status', label: 'STATUS', render: (v) => <AssetStatus status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Asset" aria-label="View asset" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canTransition]);

  const viewActions = (record) => {
    const actions = record.allowedActions || [];
    return (
      <>
        {actions.includes('mark_active') && canTransition && <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => open('active', record)}>Mark as Active</PrimaryButton>}
        {actions.includes('transfer') && canTransition && <SecondaryButton icon={<FiSend size={14} />} onClick={() => setTransferFor(record)}>Transfer</SecondaryButton>}
        {actions.includes('edit') && canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit Asset</SecondaryButton>}
        {actions.includes('retire') && canTransition && <SecondaryButton danger icon={<FiSlash size={14} />} onClick={() => open('retire', record)}>Retire</SecondaryButton>}
      </>
    );
  };

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected assets exported` : 'Assets exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Status', options: [...STATUSES, { value: 'retired', label: 'Retired' }] },
    { key: 'condition', label: 'Condition', options: CONDITIONS },
    { key: 'category', label: 'Category', options: ASSET_CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'locationId', label: 'Location', options: toOptions(lookups.locations, 'name') },
  ];

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No assets found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by tag, name, custodian..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Register Asset</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Assets" subtitle="Narrow the register by status, condition and more." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <AssetFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          me={me}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {transferFor && (
        <TransferModal
          key={transferFor._id}
          asset={transferFor}
          lookups={lookups}
          onClose={() => setTransferFor(null)}
          onSaved={(message) => { setTransferFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewAssetModal id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}

      {confirm?.type === 'active' && (
        <ConfirmModal
          title="Mark Asset Active?"
          message={`${confirm.row.assetTag} · ${confirm.row.assetName} returns to active service.`}
          confirmLabel="Mark Active"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('markActive', [confirm.row._id], 'Asset marked active')}
        />
      )}
      {confirm?.type === 'retire' && (
        <ReasonModal
          title="Retire Asset?"
          message="Retired assets cannot be assigned to employees or transferred. The asset will remain in the system for audit and historical records."
          detail={(
            <div style={{ fontSize: '0.84rem', color: '#0F172A', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div>Asset Tag: <strong>{confirm.row.assetTag}</strong></div>
              <div>Asset Name: <strong>{confirm.row.assetName}</strong></div>
              <div>Current Custodian: <strong>{confirm.row.custodian ? refName(confirm.row.custodian, 'fullName') : 'None'}</strong></div>
              <div>Status: <strong>{statusLabel(confirm.row.status)}</strong></div>
            </div>
          )}
          label="Reason for deactivation"
          placeholder="Enter commentary…"
          confirmLabel="Retire Asset"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('retire', [confirm.row._id, reason], 'Asset retired')}
        />
      )}
    </>
  );
}
