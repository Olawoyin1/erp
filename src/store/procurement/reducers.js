import {
  requisitionsSlice,
  rfqsSlice,
  ordersSlice,
  deliveriesSlice,
  prequalificationsSlice,
  vendorsSlice,
  inventoryItemsSlice,
  stockMovementsSlice,
  goodsReceiptsSlice,
} from './slices';

export default Object.fromEntries(
  [
    requisitionsSlice,
    rfqsSlice,
    ordersSlice,
    deliveriesSlice,
    prequalificationsSlice,
    vendorsSlice,
    inventoryItemsSlice,
    stockMovementsSlice,
    goodsReceiptsSlice,
  ].map((slice) => [slice.key, slice.reducer]),
);
