import { refName, statusLabel, ymd } from '../shared/procUtils';

export const RECEIPT_EXPORT = [
  { label: 'GRN No', value: (r) => r.grnNo },
  { label: 'PO No', value: (r) => refName(r.poId, 'poNo') },
  { label: 'Vendor', value: (r) => refName(r.vendorId, 'vendorName') },
  { label: 'Material', value: (r) => r.material },
  { label: 'Warehouse', value: (r) => refName(r.warehouseId, 'name') },
  { label: 'Receipt Date', value: (r) => ymd(r.receiptDate) },
  { label: 'Inspection Status', value: (r) => statusLabel(r.status) },
  { label: 'Inspection Notes', value: (r) => r.inspectionNotes || '' },
];

export const ITEM_EXPORT = [
  { label: 'Item Code', value: (i) => i.itemCode },
  { label: 'Item Name', value: (i) => i.itemName },
  { label: 'Category', value: (i) => i.category },
  { label: 'Available Stock', value: (i) => i.currentStock },
  { label: 'Reorder Level', value: (i) => i.reorderLevel },
  { label: 'Unit', value: (i) => i.unit },
  { label: 'Warehouse', value: (i) => refName(i.warehouseId, 'name') },
  { label: 'Last Restocked', value: (i) => ymd(i.lastRestocked) },
  { label: 'Status', value: (i) => statusLabel(i.status) },
];

export const MOVEMENT_EXPORT = [
  { label: 'Movement No', value: (m) => m.movementNo },
  { label: 'Item', value: (m) => refName(m.itemId, 'itemName') },
  { label: 'Movement Type', value: (m) => m.movementType },
  { label: 'From', value: (m) => refName(m.fromLocationId, 'name') },
  { label: 'To', value: (m) => refName(m.toLocationId, 'name') },
  { label: 'Quantity', value: (m) => m.quantity },
  { label: 'Unit', value: (m) => m.unit },
  { label: 'Movement Date', value: (m) => ymd(m.movementDate) },
  { label: 'Status', value: (m) => statusLabel(m.status) },
  { label: 'Remarks', value: (m) => m.remarks || '' },
];

export const FAILED_INSPECTION_CONSEQUENCE =
  "A failed inspection cannot be reversed. It raises the vendor's failed-inspection count, puts the vendor's open invoices for this purchase order on payment hold, and creates a follow-up task for whoever raised the order. Nothing is added to stock.";
