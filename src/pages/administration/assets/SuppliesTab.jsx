import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiBox } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermissions } from '../../../hooks/usePermission';
import { admSupplyItemsSlice } from '../../../store/administration/slices';
import { apiError } from '../../../services/apiHelpers';
import { supplyItemService } from '../../../services/admin.service';
import { countFilters, fieldErrorsOf, formatDate, refId, refName, statusLabel, toOptions, today, ymd } from '../../procurement/shared/procUtils';
import { useExport, useProcList, useRecord, useSelection } from '../../procurement/shared/procHooks';
import {
  Choice, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Panel, PrimaryButton, SecondaryButton, StatusLine, TwoCol, ViewHeader,
} from '../../procurement/shared/ProcUi';
import { Pill } from '../shared/AdmUi';

const SUPPLY_CATEGORIES = ['Stationery', 'Printing Supply', 'Hygiene & Cleaning', 'IT Equipment', 'Pantry & Refreshments', 'Office Furniture', 'Vehicle & Transport', 'Other'];
const UNITS = ['Ream', 'Box', 'Unit', 'Pack', 'Bottle', 'Roll', 'Carton', 'Piece', 'Set', 'Litre'];
const STOCK_STATUS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];
const STOCK_TONE = { in_stock: 'green', low_stock: 'amber', out_of_stock: 'red' };

const StockStatus = ({ status }) => <Pill tone={STOCK_TONE[status]}>{statusLabel(status)}</Pill>;

const EXPORT_COLUMNS = [
  { label: 'Item Code', value: (r) => r.itemCode },
  { label: 'Item Name', value: (r) => r.itemName },
  { label: 'Category', value: (r) => r.category },
  { label: 'Unit', value: (r) => r.unit },
  { label: 'Quantity', value: (r) => r.quantityInStock },
  { label: 'Reorder Level', value: (r) => r.reorderLevel },
  { label: 'Location', value: (r) => refName(r.locationId, 'name') },
  { label: 'Last Restocked', value: (r) => ymd(r.lastRestockedAt) },
  { label: 'Supplier', value: (r) => r.supplier || '' },
  { label: 'Status', value: (r) => statusLabel(r.status) },
];

function ItemFormModal({ record, lookups, onClose, onSaved }) {
  const editing = Boolean(record);
  const [form, setForm] = useState(() => ({
    itemName: record?.itemName || '',
    category: record?.category || 'Stationery',
    unit: record?.unit || 'Box',
    reorderLevel: record ? String(record.reorderLevel ?? '') : '',
    locationId: record ? refId(record.locationId) : '',
    initialQuantity: '',
    description: record?.description || '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setError('');
    const next = {};
    if (!form.itemName.trim()) next.itemName = 'Enter the item name';
    if (!form.locationId) next.locationId = 'Choose where it is stored';
    if (form.reorderLevel === '' || !(Number(form.reorderLevel) >= 0)) next.reorderLevel = 'Enter the reorder level (0 or more)';
    if (!editing && (form.initialQuantity === '' || !(Number(form.initialQuantity) >= 0))) next.initialQuantity = 'Enter the quantity in stock (0 or more)';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const payload = {
        itemName: form.itemName.trim(),
        category: form.category,
        unit: form.unit,
        reorderLevel: Number(form.reorderLevel),
        locationId: form.locationId,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      };
      if (editing) {
        await supplyItemService.update(record._id, payload);
        onSaved('Item updated');
      } else {
        const res = await supplyItemService.create({ ...payload, initialQuantity: Number(form.initialQuantity) });
        onSaved(`Item ${res.data?.data?.itemCode || ''} added`.replace('  ', ' '));
      }
    } catch (err) {
      setError(apiError(err, 'The item could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Supply Item' : 'Add Supply Item'}
      subtitle={editing ? undefined : 'Register a new consumable in the supplies register.'}
      maxWidth="640px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Item'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <TwoCol>
          <Field label="Item name" required error={errors.itemName}>
            <Input value={form.itemName} onChange={(e) => set('itemName', e.target.value)} placeholder="e.g. A4 Paper Ream (80gsm)" error={Boolean(errors.itemName)} />
          </Field>
          <Field label="Item code" help={editing ? undefined : 'Assigned automatically when the item is added.'}>
            <Input value={editing ? record.itemCode : 'Assigned on save'} disabled />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Category" required error={errors.category}>
            <Choice value={form.category} onChange={(v) => set('category', v)} options={SUPPLY_CATEGORIES} />
          </Field>
          <Field label="Unit" required error={errors.unit}>
            <Choice value={form.unit} onChange={(v) => set('unit', v)} options={UNITS} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Reorder level" required error={errors.reorderLevel}>
            <Input type="number" min="0" step="any" value={form.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} error={Boolean(errors.reorderLevel)} />
          </Field>
          <Field label="Location" required error={errors.locationId}>
            <Choice value={form.locationId} onChange={(v) => set('locationId', v)} searchable placeholder="Select a location" options={toOptions(lookups.locations, 'name')} error={errors.locationId} />
          </Field>
        </TwoCol>
        {!editing && (
          <div style={{ maxWidth: 260 }}>
            <Field label="Initial quantity" required error={errors.initialQuantity}>
              <Input type="number" min="0" step="any" value={form.initialQuantity} onChange={(e) => set('initialQuantity', e.target.value)} error={Boolean(errors.initialQuantity)} />
            </Field>
          </div>
        )}
        <Field label="Description / notes (optional)" error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Add any context…" />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function RestockModal({ item, onClose, onSaved }) {
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(today());
  const [supplier, setSupplier] = useState(item.supplier || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const add = Number(quantity);
  const validAdd = quantity !== '' && Number.isFinite(add) && add > 0;

  const save = async () => {
    setError('');
    const next = {};
    if (!validAdd) next.quantity = 'Enter a quantity above zero';
    if (!date) next.restockDate = 'Choose the restock date';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await supplyItemService.restock(item._id, { quantity: add, restockDate: date, ...(supplier.trim() ? { supplier: supplier.trim() } : {}) });
      onSaved(`${item.itemName} restocked`);
    } catch (err) {
      setError(apiError(err, 'The restock failed'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Restock Supply Item"
      subtitle={`${item.itemCode} · ${item.itemName}`}
      maxWidth="560px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Restocking…' : 'Confirm Restock'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => { e.preventDefault(); save(); }}>
        <TwoCol min={200}>
          <Field label="Current quantity"><Input value={String(item.quantityInStock)} disabled /></Field>
          <Field label="Quantity to add" required error={errors.quantity}>
            <Input type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} error={Boolean(errors.quantity)} />
          </Field>
        </TwoCol>
        <TwoCol min={200}>
          <Field label="New total"><Input value={String(item.quantityInStock + (validAdd ? add : 0))} disabled /></Field>
          <Field label="Restock date" required error={errors.restockDate}>
            <DatePicker value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </TwoCol>
        <Field label="Supplier/source" error={errors.supplier}>
          <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Who supplied this stock?" />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewItemModal({ id, refreshKey, actions, onClose }) {
  const { record, error, loading } = useRecord(supplyItemService, id, refreshKey);
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="640px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading item…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: -10 }}>
          <ViewHeader icon={<FiBox size={22} />} title={record.itemName} subtitle={record.itemCode}>{actions(record)}</ViewHeader>
          <StatusLine status={<StockStatus status={record.status} />} />
          <DetailGrid
            items={[
              ['Item code', record.itemCode],
              ['Category', record.category],
              ['Unit', record.unit],
              ['Quantity in stock', record.quantityInStock],
              ['Reorder level', record.reorderLevel],
              ['Location', refName(record.locationId, 'name')],
              ['Last restocked', record.lastRestockedAt ? formatDate(record.lastRestockedAt) : 'Never'],
              ['Supplier', record.supplier],
            ]}
          />
          {record.description && <Panel title="Description">{record.description}</Panel>}
        </div>
      )}
    </Modal>
  );
}

export default function SuppliesTab({ lookups, showToast }) {
  const { can } = usePermissions();
  const canCreate = can('administration.supplyitem.create');
  const canUpdate = can('administration.supplyitem.update');
  const canRestock = can('administration.supplyitem.restock');
  const canExport = can('administration.supplyitem.export');

  const list = useProcList(admSupplyItemsSlice, { initialFilters: { status: '', category: '', locationId: '' }, withStats: false });
  const selection = useSelection();
  const exporter = useExport(supplyItemService, list, selection, EXPORT_COLUMNS, 'supply-items.csv');

  const [formFor, setFormFor] = useState(null);
  const [restockFor, setRestockFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const refresh = () => { list.reload(); setRefreshKey((k) => k + 1); };

  const menuItems = (row) => {
    const items = [];
    if (canUpdate) items.push({ label: 'Edit Item', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) });
    if (canRestock) items.push({ label: 'Restock Item', icon: <FiBox size={14} color="#64748B" />, action: () => setRestockFor(row) });
    return items;
  };

  const columns = useMemo(() => [
    { key: 'itemCode', label: 'ITEM CODE', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'itemName', label: 'ITEM NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'unit', label: 'UNIT', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'quantityInStock', label: 'QTY', render: (v) => <span style={{ color: '#0F172A', fontWeight: 600 }}>{v}</span> },
    { key: 'reorderLevel', label: 'REORDER LEVEL', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'locationId', label: 'LOCATION', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'name')}</span> },
    { key: 'lastRestockedAt', label: 'LAST RESTOCKED', render: (v) => <span style={{ color: '#64748B' }}>{v ? formatDate(v) : 'Never'}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StockStatus status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => {
        const items = menuItems(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="icon-btn" title="View Item" aria-label="View item" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
            {items.length > 0 ? <RowMenu items={items} /> : <span style={{ width: 24 }} />}
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canRestock]);

  const viewActions = (record) => (
    <>
      {canRestock && <PrimaryButton icon={<FiBox size={14} />} onClick={() => setRestockFor(record)}>Restock</PrimaryButton>}
      {canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => setFormFor(record)}>Edit Item</SecondaryButton>}
    </>
  );

  const onExport = async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(selection.ids.length ? `${selection.ids.length} selected items exported` : 'Supply items exported', 'success');
  };

  const filterFields = [
    { key: 'status', label: 'Stock status', options: STOCK_STATUS },
    { key: 'category', label: 'Category', options: SUPPLY_CATEGORIES.map((c) => ({ value: c, label: c })) },
    { key: 'locationId', label: 'Location', options: toOptions(lookups.locations, 'name') },
  ];

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No supply items found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by code, name..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={canExport ? onExport : undefined}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Add Item</PrimaryButton>}
          </ListToolbar>
        )}
      />

      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Supplies" subtitle="Narrow the register by stock status, category and more." fields={filterFields} values={list.filters} onApply={list.applyFilters} />

      {formFor && (
        <ItemFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          record={formFor === 'new' ? null : formFor}
          lookups={lookups}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {restockFor && (
        <RestockModal
          key={restockFor._id}
          item={restockFor}
          onClose={() => setRestockFor(null)}
          onSaved={(message) => { setRestockFor(null); showToast(message, 'success'); refresh(); }}
        />
      )}

      {viewId && <ViewItemModal id={viewId} refreshKey={refreshKey} actions={viewActions} onClose={() => setViewId(null)} />}
    </>
  );
}
