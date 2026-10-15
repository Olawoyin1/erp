import { createProcSlice } from '../procurement/createProcSlice';
import {
  adminRequestService,
  assetService,
  supplyItemService,
  travelRequestService,
  movementService,
  facilityMaintenanceService,
  memoService,
  disposalService,
} from '../../services/admin.service';

export const admRequestsSlice = createProcSlice('admRequests', adminRequestService);
export const admAssetsSlice = createProcSlice('admAssets', assetService);
export const admSupplyItemsSlice = createProcSlice('admSupplyItems', supplyItemService);
export const admTravelSlice = createProcSlice('admTravel', travelRequestService);
export const admMovementsSlice = createProcSlice('admMovements', movementService);
export const admMaintenanceSlice = createProcSlice('admMaintenance', facilityMaintenanceService);
export const admMemosSlice = createProcSlice('admMemos', memoService);
export const admDisposalsSlice = createProcSlice('admDisposals', disposalService);
