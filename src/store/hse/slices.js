import { createProcSlice } from '../procurement/createProcSlice';
import { offshoreTravelService, emergencyPlanService, emergencyContactService } from '../../services/hse.service';

export const hseOffshoreSlice = createProcSlice('hseOffshore', offshoreTravelService);
export const hsePlansSlice = createProcSlice('hsePlans', emergencyPlanService);
export const hseContactsSlice = createProcSlice('hseContacts', emergencyContactService);
