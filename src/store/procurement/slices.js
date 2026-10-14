import { createProcSlice } from './createProcSlice';
import {
  purchaseRequisitionService,
  procurementRfqService,
  purchaseOrderService,
  deliveryService,
  vendorPrequalificationService,
  vendorService,
  inventoryItemService,
  stockMovementService,
  goodsReceiptService,
} from '../../services/procurement.service';

export const requisitionsSlice = createProcSlice('procRequisitions', purchaseRequisitionService);
export const rfqsSlice = createProcSlice('procRfqs', procurementRfqService);
export const ordersSlice = createProcSlice('procOrders', purchaseOrderService);
export const deliveriesSlice = createProcSlice('procDeliveries', deliveryService);
export const prequalificationsSlice = createProcSlice('procPrequalifications', vendorPrequalificationService);
export const vendorsSlice = createProcSlice('procVendors', vendorService);
export const inventoryItemsSlice = createProcSlice('procInventoryItems', inventoryItemService);
export const stockMovementsSlice = createProcSlice('procStockMovements', stockMovementService);
export const goodsReceiptsSlice = createProcSlice('procGoodsReceipts', goodsReceiptService);
