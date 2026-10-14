import { useState } from 'react';
import { FiUpload, FiBox, FiCheckCircle, FiAlertTriangle, FiRepeat } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import Toast, { useToast } from '../../components/ui/Toast';
import { usePermission } from '../../hooks/usePermission';
import { goodsReceiptsSlice, inventoryItemsSlice, stockMovementsSlice } from '../../store/procurement/slices';
import { goodsReceiptService, inventoryItemService, stockMovementService } from '../../services/procurement.service';
import { statValue } from './shared/procUtils';
import { useExport, useLookups, useProcList, useSelection } from './shared/procHooks';
import { PageHeader, PrimaryButton, SecondaryButton, StatTiles, TabBar } from './shared/ProcUi';
import { AttachToRecordDialog } from './shared/ProcExtras';
import GoodsReceiptsTab from './inventory/GoodsReceiptsTab';
import ItemsTab from './inventory/ItemsTab';
import MovementsTab from './inventory/MovementsTab';
import ImportDialog from './inventory/ImportDialog';
import { ITEM_EXPORT, MOVEMENT_EXPORT, RECEIPT_EXPORT } from './inventory/inventoryConstants';

function HandoverNote({ onClose }) {
  return (
    <Modal isOpen onClose={onClose} title="QHSE Handover Info" maxWidth="560px" footer={<PrimaryButton onClick={onClose}>Close</PrimaryButton>}>
      <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <strong>Materials received and QHSE inspection</strong>
          <p style={{ margin: '4px 0 0' }}>
            Procurement logs each delivery against an acknowledged purchase order. The QHSE team checks the physical quantity and quality at the delivery location and records the outcome, notes and the delivery document.
          </p>
        </div>
        <div>
          <strong>Inspection outcomes</strong>
          <ul style={{ paddingLeft: 20, margin: '6px 0 0' }}>
            <li><strong>Pending</strong>: the inspection has not been completed.</li>
            <li><strong>Passed</strong>: quantity and quality are satisfied. The received quantities are added to the stock of the linked inventory items.</li>
            <li><strong>Failed</strong>: nothing is added to stock, the vendor&apos;s failed-inspection count goes up, the vendor&apos;s open invoices for the order are put on payment hold and a follow-up task is raised for whoever created the order.</li>
          </ul>
        </div>
        <p style={{ margin: 0 }}>A decided inspection is locked. Its notes and delivery document stay linked to the receipt and to the delivery for end-to-end traceability.</p>
      </div>
    </Modal>
  );
}

export default function InventoryStore() {
  const canViewReceipts = usePermission('procurement.goodsreceipt.view');
  const canViewItems = usePermission('procurement.inventoryitem.view');
  const canViewMovements = usePermission('procurement.stockmovement.view');
  const canImport = usePermission('procurement.inventoryitem.create');
  const canUpdateItems = usePermission('procurement.inventoryitem.update');

  const receipts = useProcList(goodsReceiptsSlice, { initialFilters: { status: '', warehouseId: '', dateFrom: '', dateTo: '' }, enabled: canViewReceipts });
  const items = useProcList(inventoryItemsSlice, { initialFilters: { status: '', warehouseId: '', category: '' }, enabled: canViewItems });
  const movements = useProcList(stockMovementsSlice, { initialFilters: { status: '', movementType: '', dateFrom: '', dateTo: '' }, enabled: canViewMovements });
  const receiptSelection = useSelection();
  const itemSelection = useSelection();
  const movementSelection = useSelection();
  const receiptExport = useExport(goodsReceiptService, receipts, receiptSelection, RECEIPT_EXPORT, 'goods-receipts.csv');
  const itemExport = useExport(inventoryItemService, items, itemSelection, ITEM_EXPORT, 'inventory-stock.csv');
  const movementExport = useExport(stockMovementService, movements, movementSelection, MOVEMENT_EXPORT, 'stock-movements.csv');
  const { toast, showToast, hideToast } = useToast();
  const { lookups, refresh: refreshLookups } = useLookups(['locations', 'acknowledgedOrders', 'inventoryItems']);

  const tabs = [
    ...(canViewReceipts ? [{ id: 'receiving', label: 'Material Receiving' }] : []),
    ...(canViewItems ? [{ id: 'inventory', label: 'Inventory' }] : []),
    ...(canViewMovements ? [{ id: 'movements', label: 'Stock Movements' }] : []),
  ];
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'receiving');
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const changed = () => {
    receipts.reload();
    items.reload();
    movements.reload();
    refreshLookups();
    setRefreshKey((k) => k + 1);
  };

  const exportWith = (exporter, okMessage) => async () => {
    const message = await exporter.run();
    if (message) showToast(message, 'error');
    else showToast(okMessage, 'success');
  };

  const tiles = [
    { label: 'TOTAL STOCK ITEMS', value: statValue(items.stats, 'total_items'), sub: 'Currently available across all warehouses', icon: <FiBox size={18} />, tone: 'blue' },
    { label: 'GOODS RECEIVED THIS MONTH', value: statValue(receipts.stats, 'received_this_month'), sub: 'Receipts successfully posted this month', icon: <FiCheckCircle size={18} />, tone: 'green' },
    { label: 'LOW STOCK ITEMS', value: statValue(items.stats, 'below_reorder_items'), sub: 'Items below their reorder level', subColor: '#D97706', icon: <FiAlertTriangle size={18} />, tone: 'amber' },
    { label: 'STOCK MOVEMENT TODAY', value: statValue(movements.stats, 'movements_today'), sub: 'Recorded today', icon: <FiRepeat size={18} />, tone: 'purple' },
  ];

  const uploadConfig = {
    receiving: { api: goodsReceiptService, title: 'Upload Goods Receipt Document', noun: 'goods receipt', label: (r) => `${r.grnNo}: ${r.material}`, allowed: canViewReceipts },
    movements: { api: stockMovementService, title: 'Upload Stock Movement Document', noun: 'stock movement', label: (m) => `${m.movementNo}: ${m.itemId?.itemName || ''}`, allowed: canViewMovements },
    inventory: { api: inventoryItemService, title: 'Upload Item Document', noun: 'inventory item', label: (i) => `${i.itemCode}: ${i.itemName}`, allowed: canUpdateItems },
  }[activeTab];
  const onInventory = activeTab === 'inventory';

  const sharedProps = { lookups, showToast, onChanged: changed, refreshKey };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader title="Inventory & Warehouse" subtitle="Manage goods receipt, monitor inventory levels, and track warehouse stock movements across all storage locations">
        <SecondaryButton onClick={() => setNoteOpen(true)} style={{ color: '#2563EB', fontWeight: 600 }}>QHSE Handover Info</SecondaryButton>
        {onInventory && canImport && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setImportOpen(true)}>Upload</SecondaryButton>}
        {!onInventory && uploadConfig?.allowed && <SecondaryButton icon={<FiUpload size={15} />} onClick={() => setUploadOpen(true)}>Upload</SecondaryButton>}
      </PageHeader>

      <StatTiles tiles={tiles} loading={(items.statsLoading || receipts.statsLoading || movements.statsLoading) && !items.stats.length} error={Boolean(items.statsError && receipts.statsError && movements.statsError)} />

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'receiving' && canViewReceipts && (
        <GoodsReceiptsTab list={receipts} selection={receiptSelection} exporter={receiptExport} onExport={exportWith(receiptExport, 'Goods receipts exported')} {...sharedProps} />
      )}
      {activeTab === 'inventory' && canViewItems && (
        <ItemsTab list={items} selection={itemSelection} exporter={itemExport} onExport={exportWith(itemExport, 'Inventory exported')} {...sharedProps} />
      )}
      {activeTab === 'movements' && canViewMovements && (
        <MovementsTab list={movements} selection={movementSelection} exporter={movementExport} onExport={exportWith(movementExport, 'Stock movements exported')} {...sharedProps} />
      )}

      {noteOpen && <HandoverNote onClose={() => setNoteOpen(false)} />}
      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} onDone={(message) => { setImportOpen(false); showToast(message, 'success'); changed(); }} />}
      {uploadOpen && uploadConfig && (
        <AttachToRecordDialog
          api={uploadConfig.api}
          title={uploadConfig.title}
          recordNoun={uploadConfig.noun}
          recordLabel={uploadConfig.label}
          onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); setRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}
