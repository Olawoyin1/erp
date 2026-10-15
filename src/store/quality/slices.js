import { createProcSlice } from '../procurement/createProcSlice';
import { qualityAuditService, qualityCalibrationService, qualityInspectionService } from '../../services/quality.service';

export const qmsAuditsSlice = createProcSlice('qmsAudits', qualityAuditService);
export const qmsCalibrationSlice = createProcSlice('qmsCalibration', qualityCalibrationService);
export const qmsInspectionsSlice = createProcSlice('qmsInspections', qualityInspectionService);
