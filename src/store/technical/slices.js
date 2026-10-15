import { createTechSlice } from './createTechSlice';
import {
  projectService,
  wbsService,
  projectLogService,
  resourceRequestService,
  siteDiaryService,
  timesheetService,
  siteInspectionService,
  engineeringDocumentService,
  calibrationRecordService,
  projectTaskService,
} from '../../services/technical.service';

/** Project-scoped services take the project id first; the slice sends it as a `projectId` list param. */
const scoped = (service, extra = {}) => ({
  list: ({ projectId, ...params }) => service.list(projectId, params),
  ...(service.stats ? { stats: ({ projectId }) => service.stats(projectId) } : {}),
  ...extra,
});

export const projectsSlice = createTechSlice('techProjects', projectService);
export const resourceRequestsSlice = createTechSlice('techResourceRequests', resourceRequestService);
export const engineeringDocumentsSlice = createTechSlice('techEngineeringDocuments', engineeringDocumentService);
export const calibrationSlice = createTechSlice('techCalibration', calibrationRecordService);

export const wbsSlice = createTechSlice('techWbs', { ...wbsService, ...scoped(wbsService) });
export const logsSlice = createTechSlice('techLogs', { ...projectLogService, ...scoped(projectLogService) });
export const siteDiarySlice = createTechSlice('techSiteDiary', { ...siteDiaryService, ...scoped(siteDiaryService) });
export const timesheetsSlice = createTechSlice('techTimesheets', { ...timesheetService, ...scoped(timesheetService) });
export const inspectionsSlice = createTechSlice('techInspections', { ...siteInspectionService, ...scoped(siteInspectionService) });
export const projectTasksSlice = createTechSlice('techProjectTasks', projectTaskService);
