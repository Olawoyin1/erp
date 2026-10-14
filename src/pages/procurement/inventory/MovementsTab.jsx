import { useMemo, useState } from 'react';
import { FiPlus, FiEye, FiCheck, FiX } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import RowMenu from '../../../components/ui/RowMenu';
import { DatePicker, Input, Textarea } from '../../../components/ui/FormField';
import { usePermission } from '../../../hooks/usePermission';
import { apiError } from '../../../services/apiHelpers';
import { stockMovementService } from '../../../services/procurement.service';
import { countFilters, fieldErrorsOf, formatDate, refId, refName, toQuantity, today, uploadStagedFiles } from '../shared/procUtils';
import {
  Choice, ConfirmModal, DetailGrid, Field, FilterDrawer, FormBody, FormError, ListCard, ListToolbar, Note, Panel, PrimaryButton, ReasonModal,
  RecordSummary, SecondaryButton, StatusBadge, StatusLine, TwoCol, ViewHeader,
} from '../shared/ProcUi';
import { AttachField, DocumentList } from '../shared/ProcExtras';
import { useRecord, useRunAction } from '../shared/procHooks';
import { stockMovementsSlice } from '../../../store/procurement/slices';

const MOVEMENT_TYPES = ['Material Issue', 'Warehouse Transfer', 'Material Return'];
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function NewMovementModal({ lookups, onClose, onSaved }) {
  const items = lookups.inventoryItems || [];
  const locations = lookups.locations || [];
  const [form, setForm] = useState({ itemId: '', type: 'Material Issue', other: '', quantity: '', date: today(), remarks: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const item = items.find((i) => i._id === form.itemId);
  const warehouseId = refId(item?.warehouseId);
  const returning = form.type === 'Material Return';
  const otherOptions = locations
    .filter((l) => l._id !== warehouseId && (form.type !== 'Warehouse Transfer' || ['warehouse', 'yard'].includes(l.type)))
    .map((l) => ({ value: l._id, label: l.name }));
  const overStock = item && !returning && toQuantity(form.quantity) > item.currentStock;

  const submit = async () => {
    const next = {};
    if (!form.itemId) next.itemId = 'Choose the item';
    if (!form.other) next[returning ? 'fromLocationId' : 'toLocationId'] = 'Choose the location';
    if (Number.isNaN(toQuantity(form.quantity))) next.quantity = 'Enter a quantity above zero';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setError('');
    try {
      const res = await stockMovementService.create({
        itemId: form.itemId,
        movementType: form.type,
        fromLocationId: returning ? form.other : warehouseId,
        toLocationId: returning ? warehouseId : form.other,
        quantity: toQuantity(form.quantity),
        unit: item.unit,
        ...(form.date ? { movementDate: form.date } : {}),
        ...(form.remarks.trim() ? { remarks: form.remarks.trim() } : {}),
      });
      let note = '';
      const saved = res.data?.data;
      if (files.length && saved?._id) {
        const failed = await uploadStagedFiles(stockMovementService, saved._id, files);
        if (failed.length) note = ` Documents not attached: ${failed.join('; ')}`;
      }
      onSaved(`Stock movement ${saved?.movementNo || ''} logged. Complete it to update the inventory balances.${note}`);
    } catch (err) {
      setError(apiError(err, 'The stock movement could not be saved'));
      setErrors(fieldErrorsOf(err?.response?.data?.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New Stock Movement"
      subtitle="Track material movements across warehouses and project sites. Stock only changes when the movement is completed."
      maxWidth="680px"
      footer={(
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save Movement'}</PrimaryButton>
        </>
      )}
    >
      <FormBody onSubmit={(e) => e.preventDefault()}>
        <TwoCol>
          <Field label="Movement ID" help="Assigned automatically."><Input value="" placeholder="Assigned on save" disabled /></Field>
          <Field label="Movement type" required error={errors.movementType}>
            <Choice value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v, other: '' }))} options={MOVEMENT_TYPES} />
          </Field>
        </TwoCol>
        <Field label="Item name" required error={errors.itemId}>
          <Choice
            value={form.itemId}
            onChange={(v) => setForm((f) => ({ ...f, itemId: v, other: '' }))}
            searchable
            placeholder="Select an item"
            options={items.map((i) => ({ value: i._id, label: `${i.itemName} (${i.itemCode}) at ${refName(i.warehouseId, 'name')}: ${i.currentStock} ${i.unit}` }))}
            error={errors.itemId}
          />
        </Field>
        <TwoCol>
          <Field label="From location" required error={errors.fromLocationId} help={returning ? undefined : "The item's own warehouse."}>
            {returning ? (
              <Choice value={form.other} onChange={(v) => set('other', v)} searchable placeholder="Select where it comes back from" options={otherOptions} error={errors.fromLocationId} />
            ) : (
              <Input value={item ? refName(item.warehouseId, 'name') : ''} placeholder="Chosen with the item" disabled />
            )}
          </Field>
          <Field label="To location" required error={errors.toLocationId} help={returning ? "The item's own warehouse." : undefined}>
            {returning ? (
              <Input value={item ? refName(item.warehouseId, 'name') : ''} placeholder="Chosen with the item" disabled />
            ) : (
              <Choice
                value={form.other}
                onChange={(v) => set('other', v)}
                searchable
                placeholder={form.type === 'Warehouse Transfer' ? 'Select the destination warehouse' : 'Select the project site or location'}
                options={otherOptions}
                error={errors.toLocationId}
              />
            )}
          </Field>
        </TwoCol>
        <TwoCol min={160}>
          <Field label="Quantity" required error={errors.quantity}>
            <Input value={form.quantity} inputMode="decimal" onChange={(e) => set('quantity', e.target.value)} error={Boolean(errors.quantity)} />
          </Field>
          <Field label="Unit"><Input value={item?.unit || ''} placeholder="From the item" disabled /></Field>
          <Field label="Movement date" error={errors.movementDate}>
            <DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
        </TwoCol>
        {overStock && <Note tone="amber">Only {item.currentStock} {item.unit} are on hand. You can log this movement, but completing it will be refused until enough stock is available.</Note>}
        {form.type === 'Warehouse Transfer' && <Note>If the destination warehouse has no record of this item yet, one is created automatically when the transfer is completed.</Note>}
        <Field label="Remarks" error={errors.remarks}>
          <Textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
        </Field>
        <Field label="Attach document (optional)">
          <AttachField files={files} onChange={setFiles} disabled={busy} />
        </Field>
        <FormError message={error} />
      </FormBody>
    </Modal>
  );
}

function ViewMovementModal({ id, refreshKey, canUpdate, onComplete, onCancel, onClose }) {
  const { record, error, loading } = useRecord(stockMovementService, id, refreshKey);
  return (
    <Modal isOpen onClose={onClose} title="" maxWidth="680px">
      {loading && <div style={{ padding: 24, color: '#64748B' }}>Loading movement…</div>}
      {error && <FormError message={error} />}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -10 }}>
          <ViewHeader title={refName(record.itemId, 'itemName')} subtitle={record.movementNo}>
            {record.status === 'pending' && canUpdate && (
              <>
                <PrimaryButton style={{ backgroundColor: '#16A34A' }} icon={<FiCheck size={14} />} onClick={() => onComplete(record)}>Complete Movement</PrimaryButton>
                <SecondaryButton danger icon={<FiX size={14} />} onClick={() => onCancel(record)}>Cancel Movement</SecondaryButton>
              </>
            )}
          </ViewHeader>
          <StatusLine status={<StatusBadge status={record.status} />} />
          <DetailGrid
            items={[
              ['Movement ID', record.movementNo],
              ['Item name', refName(record.itemId, 'itemName')],
              ['Movement type', record.movementType],
              ['From location', refName(record.fromLocationId, 'name')],
              ['To location', refName(record.toLocationId, 'name')],
              ['Quantity', `${record.quantity} ${record.unit}`],
              ['Reorder level', record.itemId?.reorderLevel != null ? `${record.itemId.reorderLevel} ${record.itemId.unit}` : '—'],
              ['Movement date', formatDate(record.movementDate)],
              ['Status', record.status === 'pending' ? 'Pending' : record.status === 'completed' ? 'Completed' : record.status === 'cancelled' ? 'Cancelled' : record.status],
            ]}
          />
          <Panel title="Remarks">{record.remarks || 'No remarks entered.'}</Panel>
          {record.status === 'cancelled' && <Panel title="Cancellation reason" tone="red">{record.cancellationReason || 'No reason was recorded.'}</Panel>}
          <DocumentList key={record._id} api={stockMovementService} id={record._id} canUpload={canUpdate && record.status === 'pending'} title="Attachments" />
        </div>
      )}
    </Modal>
  );
}

export default function MovementsTab({ list, selection, exporter, lookups, showToast, onChanged, refreshKey, onExport }) {
  const canCreate = usePermission('procurement.stockmovement.create');
  const canUpdate = usePermission('procurement.stockmovement.update');
  const run = useRunAction(stockMovementsSlice);
  const [newOpen, setNewOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const ask = (type, row) => { setActionError(''); setConfirm({ type, row }); };

  const doAction = async (method, args, success) => {
    setBusy(true);
    setActionError('');
    const res = await run(method, ...args);
    setBusy(false);
    if (res.ok) {
      setConfirm(null);
      showToast(success, 'success');
      onChanged();
    } else {
      setActionError(res.error);
    }
  };

  const columns = useMemo(() => [
    { key: 'movementNo', label: 'MOVEMENT NO.', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span> },
    { key: 'itemId', label: 'ITEM NAME', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{refName(v, 'itemName')}</span> },
    { key: 'movementType', label: 'MOVEMENT TYPE', render: (v) => <span style={{ color: '#475569' }}>{v}</span> },
    { key: 'fromLocationId', label: 'FROM', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'name')}</span> },
    { key: 'toLocationId', label: 'TO', render: (v) => <span style={{ color: '#334155' }}>{refName(v, 'name')}</span> },
    { key: 'quantity', label: 'QTY', align: 'center', render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{v}</span> },
    { key: 'movementDate', label: 'MOVEMENT DATE', render: (v) => <span style={{ color: '#64748B' }}>{formatDate(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="icon-btn" title="View Movement Voucher" aria-label="View movement voucher" onClick={() => setViewId(row._id)} style={{ color: '#64748B', cursor: 'pointer' }}><FiEye size={16} /></button>
          {row.status === 'pending' && canUpdate ? (
            <RowMenu
              items={[
                { label: 'Complete Movement', icon: <FiCheck size={14} color="#16A34A" />, color: '#16A34A', action: () => ask('complete', row) },
                { label: 'Cancel Movement', icon: <FiX size={14} color="#DC2626" />, color: '#DC2626', action: () => ask('cancel', row) },
              ]}
            />
          ) : <span style={{ width: 24 }} />}
        </div>
      ),
    },
  ], [canUpdate]);

  const filterFields = [
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
    { key: 'movementType', label: 'Movement type', options: MOVEMENT_TYPES.map((t) => ({ value: t, label: t })) },
    { key: 'dateFrom', label: 'Moved from', type: 'date' },
    { key: 'dateTo', label: 'Moved to', type: 'date' },
  ];

  return (
    <>
      <ListCard
        list={list}
        columns={columns}
        emptyText="No stock movements found."
        selection={selection}
        toolbar={(
          <ListToolbar
            search={list.searchText}
            onSearch={list.onSearch}
            placeholder="Search by movement no, item name..."
            onFilter={() => setFilterOpen(true)}
            filterCount={countFilters(list.filters)}
            onExport={onExport}
            exporting={exporter.exporting}
            selectedCount={exporter.selectedCount}
          >
            {canCreate && <PrimaryButton icon={<FiPlus size={16} />} onClick={() => setNewOpen(true)}>New Stock Movement</PrimaryButton>}
          </ListToolbar>
        )}
      />
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Stock Movements" subtitle="Narrow the movement log." fields={filterFields} values={list.filters} onApply={list.applyFilters} />
      {newOpen && <NewMovementModal lookups={lookups} onClose={() => setNewOpen(false)} onSaved={(message) => { setNewOpen(false); showToast(message, 'success'); onChanged(); }} />}
      {viewId && <ViewMovementModal id={viewId} refreshKey={refreshKey} canUpdate={canUpdate} onComplete={(r) => ask('complete', r)} onCancel={(r) => ask('cancel', r)} onClose={() => setViewId(null)} />}
      {confirm?.type === 'complete' && (
        <ConfirmModal
          title="Complete Movement?"
          message="Completing posts this movement to the inventory balances in one step. Issuing or transferring more than the stock on hand is refused."
          detail={<RecordSummary rows={[['Movement', confirm.row.movementNo], ['Item', refName(confirm.row.itemId, 'itemName')], ['Quantity', `${confirm.row.quantity} ${confirm.row.unit}`]]} />}
          confirmLabel="Complete Movement"
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={() => doAction('complete', [confirm.row._id], `Stock movement ${confirm.row.movementNo} completed`)}
        />
      )}
      {confirm?.type === 'cancel' && (
        <ReasonModal
          title="Cancel Stock Movement"
          message="Are you sure you want to cancel this stock movement? This movement will not affect inventory balances."
          detail={<RecordSummary rows={[['Movement ID', confirm.row.movementNo], ['Item name', refName(confirm.row.itemId, 'itemName')]]} />}
          label="Reason for cancellation"
          required={false}
          confirmLabel="Confirm Cancellation"
          danger
          busy={busy}
          error={actionError}
          onClose={() => setConfirm(null)}
          onConfirm={(reason) => doAction('cancel', [confirm.row._id, reason], `Stock movement ${confirm.row.movementNo} cancelled`)}
        />
      )}
    </>
  );
}
