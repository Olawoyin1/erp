import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiEdit, FiRepeat } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import RowMenu from '../../../components/ui/RowMenu';
import { Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { inventoryItemService } from '../../../services/procurement.service';
import { UNITS, countFilters, fieldErrorsOf, formatDate, formatDateTime, refId, refName, toOptions, uploadStagedFiles } from '../shared/procUtils';
import {
  Choice, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, PrimaryButton, SecondaryButton, SimpleTable,
  StatusBadge, StatusLine, TabBar, TwoCol, ViewHeader,
} from '../shared/ProcUi';
import { AttachField, DocumentList } from '../shared/ProcExtras';
import { useFetched, useRecord } from '../shared/procHooks';

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const unitOptions = (current) => (current && !UNITS.includes(current) ? [...UNITS, current] : UNITS);

function ItemFormModal({ item, lookups, onClose, onSaved }) {
  const editing = Boolean(item);
  const [form, setForm] = useState({
    code: item?.itemCode || '',
    name: item?.itemName || '',
    category: item?.category || '',
    stock: '0',
    reorder: item ? String(item.reorderLevel) : '',
    unit: item?.unit || 'Pieces',
    warehouse: item ? refId(item.warehouseId) : '',
  });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    const next = {};
    if (!form.code.trim()) next.itemCode = 'Enter the item code';
    if (!form.name.trim()) next.itemName = 'Enter the item name';
    if (!form.category.trim()) next.category = 'Enter the category';
    if (form.reorder === '' || Number.isNaN(Number(form.reorder)) || Number(form.reorder) < 0) next.reorderLevel = 'Enter the reorder level (zero or more)';
    if (!editing) {
      if (form.stock === '' || Number.isNaN(Number(form.stock)) || Number(form.stock) < 0) next.currentStock = 'Enter the opening stock (zero or more)';
      if (!form.warehouse) next.warehouseId = 'Choose the warehouse';
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    const base = { itemCode: form.code.trim(), itemName: form.name.trim(), category: form.category.trim(), reorderLevel: Number(form.reorder), unit: form.unit };
    try {
      let saved;
      if (editing) {
        const res = await inventoryItemService.update(item._id, base);
        saved = res.data?.data;
      } else {
        const res = await inventoryItemService.create({ ...base, currentStock: Number(form.stock), warehouseId: form.warehouse });
        saved = res.data?.data;
      }
      let note = '';
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(inventoryItemService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`${editing ? 'Inventory item updated' : 'Inventory item added'}.${note}`);
    } catch (err) {
      setError(apiError(err, 'The inventory item could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={editing ? 'Edit Inventory Item' : 'Add Inventory Item'}
      subtitle={editing ? 'The warehouse and stock level are changed through movements, receipts and stock adjustments.' : 'The same item code can exist once per warehouse.'}
      width="620px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : editing ? 'Save Changes' : 'Add Item'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Item code" required error={errors.itemCode}>
            <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="e.g. RB-20MM" error={Boolean(errors.itemCode)} />
          </Field>
          <Field label="Item name" required error={errors.itemName}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Reinforcement Bars (20mm)" error={Boolean(errors.itemName)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Category" required error={errors.category}>
            <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Materials" error={Boolean(errors.category)} />
          </Field>
          <Field label="Unit" required error={errors.unit}>
            <Choice value={form.unit} onChange={(v) => set('unit', v)} options={unitOptions(form.unit)} />
          </Field>
        </TwoCol>
        <TwoCol>
          <Field label="Warehouse" required error={errors.warehouseId}>
            <Choice
              value={form.warehouse}
              onChange={(v) => set('warehouse', v)}
              searchable
              disabled={editing}
              placeholder="Select a warehouse"
              options={editing ? [{ value: form.warehouse, label: refName(item.warehouseId, 'name') }] : toOptions((lookups.locations || []).filter((l) => ['warehouse', 'yard'].includes(l.type)), 'name')}
              error={errors.warehouseId}
            />
          </Field>
          <Field label="Reorder level" required error={errors.reorderLevel}>
            <Input value={form.reorder} inputMode="decimal" onChange={(e) => set('reorder', e.target.value)} error={Boolean(errors.reorderLevel)} />
          </Field>
        </TwoCol>
        {!editing && (
          <Field label="Opening stock" error={errors.currentStock} help="Counts as the starting balance; it does not appear in the history.">
            <Input value={form.stock} inputMode="decimal" onChange={(e) => set('stock', e.target.value)} error={Boolean(errors.currentStock)} />
          </Field>
        )}
        {!editing && (
          <Field label="Attach document (optional)">
            <AttachField files={files} onChange={setFiles} disabled={busy} />
          </Field>
        )}
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function AdjustmentModal({ item, onClose, onSaved }) {
  const [newStock, setNewStock] = useState(String(item.currentStock));
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const submit = async () => {
    const next = {};
    if (newStock === '' || Number.isNaN(Number(newStock)) || Number(newStock) < 0) next.newStock = 'Enter the counted stock (zero or more)';
    if (!reason.trim()) next.reason = 'Give the reason for the adjustment';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      await inventoryItemService.adjust(item._id, { newStock: Number(newStock), reason: reason.trim() });
      let note = '';
      if (files.length) {
        const failed = await uploadStagedFiles(inventoryItemService, item._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`Stock balance adjusted and ledger updated.${note}`);
    } catch (err) {
      setError(apiError(err, 'The adjustment could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  const delta = Number(newStock) - item.currentStock;

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title="Stock Adjustment"
      subtitle={`Update the available stock for ${item.itemCode}`}
      width="560px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save Adjustment'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <Field label="Item name"><Input value={item.itemName} disabled /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Current stock"><Input value={item.currentStock} disabled /></Field>
          <Field label="New stock" required error={errors.newStock}>
            <Input value={newStock} inputMode="decimal" onChange={(e) => setNewStock(e.target.value)} error={Boolean(errors.newStock)} />
          </Field>
          <Field label="Unit"><Input value={item.unit} disabled /></Field>
        </div>
        {!Number.isNaN(delta) && delta !== 0 && <Note tone={delta < 0 ? 'amber' : 'blue'}>This records a change of {delta > 0 ? '+' : ''}{delta} {item.unit}.</Note>}
        <Field label="Reason for adjustment" required error={errors.reason}>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} error={Boolean(errors.reason)} />
        </Field>
        <Field label="Attach document (optional)">
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Drawer>
  );
}

function ViewItemModal({ id, refreshKey, canUpdate, onAdjust, onEdit, onClose }) {
  const [tab, setTab] = useState('info');
  const { record, error, loading } = useRecord(inventoryItemService, id, refreshKey);
  const history = useFetched(() => inventoryItemService.history(id), tab === 'history' ? `${id}:${refreshKey}` : null);
  return (
    <Drawer isOpen onClose={onClose} title="Inventory Item" subtitle="Stock information and movement history" width="780px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading item…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader title={record.itemName} subtitle={record.itemCode}>
            {canUpdate && <SecondaryButton icon={<FiRepeat size={14} />} onClick={() => onAdjust(record)}>Stock Adjustment</SecondaryButton>}
            {canUpdate && <SecondaryButton icon={<FiEdit size={14} />} onClick={() => onEdit(record)}>Edit</SecondaryButton>}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          <TabBar tabs={[{ id: 'info', label: 'Stock Information' }, { id: 'history', label: 'Inventory History' }]} active={tab} onChange={setTab} />
          {tab === 'info' && (
            <>
              <DetailGrid
                items={[
                  ['Item code', record.itemCode],
                  ['Item name', record.itemName],
                  ['Category', record.category],
                  ['Warehouse', refName(record.warehouseId, 'name')],
                  ['Current stock', `${record.currentStock} ${record.unit}`],
                  ['Reorder level', `${record.reorderLevel} ${record.unit}`],
                  ['Status', record.status === 'in_stock' ? 'In Stock' : record.status === 'low_stock' ? 'Low Stock' : 'Out of Stock'],
                  ['Last restocked', formatDate(record.lastRestocked)],
                ]}
              />
              <DocumentList key={record._id} api={inventoryItemService} id={record._id} canUpload={canUpdate} title="Attachments" />
            </>
          )}
          {tab === 'history' && (
            <>
              {history.error && <FormError message={history.error} />}
              <SimpleTable
                rows={history.data}
                empty={history.loading ? 'Loading history…' : 'No stock movements recorded for this item yet.'}
                columns={[
                  { key: 'date', label: 'Date', render: (h) => formatDateTime(h.date) },
                  { key: 'activity', label: 'Activity', render: (h) => <strong>{h.activity}</strong> },
                  { key: 'reference', label: 'Reference', render: (h) => <span style={{ color: '#1E3A8A', fontWeight: 600 }}>{h.reference}</span> },
                  { key: 'quantity', label: 'Qty.', align: 'center', render: (h) => <strong style={{ color: h.quantity >= 0 ? '#16A34A' : '#DC2626' }}>{h.quantity > 0 ? '+' : ''}{h.quantity}</strong> },
                  { key: 'balanceAfter', label: 'Balance', align: 'center', render: (h) => (h.balanceAfter == null ? '—' : h.balanceAfter) },
                  { key: 'updatedBy', label: 'Updated by', align: 'right', render: (h) => h.updatedBy || '—' },
                ]}
              />
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default function ItemsTab({ list, selection, exporter, lookups, showToast, onChanged, refreshKey, onExport }) {
  const canCreate = usePermission('procurement.inventoryitem.create');
  const canUpdate = usePermission('procurement.inventoryitem.update');
  const [formFor, setFormFor] = useState(null);
  const [adjustFor, setAdjustFor] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const columns = useMemo(() => [
    { key: 'itemCode', label: 'ITEM CODE', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'itemName', label: 'ITEM NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'currentStock', label: 'AVAILABLE STOCK', align: 'center', render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{v}</span> },
    { key: 'reorderLevel', label: 'REORDER LEVEL', align: 'center', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'warehouseId', label: 'WAREHOUSE', render: (v) => <span style={{ color: '#475569' }}>{refName(v, 'name')}</span> },
    { key: 'unit', label: 'UNIT', render: (v) => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'lastRestocked', label: 'LAST RESTOCKED', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="icon-btn" title="View Stock Details" aria-label="View stock details" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
          {canUpdate ? (
            <RowMenu
              items={[
                { label: 'Stock Adjustment', icon: <FiRepeat size={14} color="#1E3A8A" />, action: () => setAdjustFor(row) },
                { label: 'Edit Item', icon: <FiEdit size={14} color="#64748B" />, action: () => setFormFor(row) },
              ]}
            />
          ) : <span style={{ width: 24 }} />}
        </div>
      ),
    },
  ], [canUpdate]);

  const categories = useMemo(() => [...new Set(list.items.map((i) => i.category))].sort(), [list.items]);
  const filterFields = [
    { key: 'status', label: 'Stock status', options: STATUS_OPTIONS },
    { key: 'warehouseId', label: 'Warehouse', options: toOptions((lookups.locations || []).filter((l) => ['warehouse', 'yard'].includes(l.type)), 'name') },
    { key: 'category', label: 'Category', options: categories.map((c) => ({ value: c, label: c })) },
  ];

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No inventory items found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by Item code, name..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setFormFor('new')}>Add Inventory Item</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Inventory" subtitle="Narrow the stock list. Choose Low Stock to see what needs reordering." fields={filterFields} values={list.filters} onApply={list.applyFilters} />
      {formFor && (
        <ItemFormModal
          key={formFor === 'new' ? 'new' : formFor._id}
          item={formFor === 'new' ? null : formFor}
          lookups={lookups}
          onClose={() => setFormFor(null)}
          onSaved={(message) => { setFormFor(null); setViewId(null); showToast(message, 'success'); onChanged(); }}
        />
      )}
      {adjustFor && (
        <AdjustmentModal
          key={adjustFor._id}
          item={adjustFor}
          onClose={() => setAdjustFor(null)}
          onSaved={(message) => { setAdjustFor(null); showToast(message, 'success'); onChanged(); }}
        />
      )}
      {viewId && (
        <ViewItemModal
          id={viewId}
          refreshKey={refreshKey}
          canUpdate={canUpdate}
          onAdjust={(record) => { setViewId(null); setAdjustFor(record); }}
          onEdit={(record) => { setViewId(null); setFormFor(record); }}
          onClose={() => setViewId(null)}
        />
      )}
    </>
  );
}
