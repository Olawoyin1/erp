import {
  admRequestsSlice,
  admAssetsSlice,
  admSupplyItemsSlice,
  admTravelSlice,
  admMovementsSlice,
  admMaintenanceSlice,
  admMemosSlice,
  admDisposalsSlice,
} from './slices';

export default Object.fromEntries(
  [
    admRequestsSlice,
    admAssetsSlice,
    admSupplyItemsSlice,
    admTravelSlice,
    admMovementsSlice,
    admMaintenanceSlice,
    admMemosSlice,
    admDisposalsSlice,
  ].map((slice) => [slice.key, slice.reducer]),
);
