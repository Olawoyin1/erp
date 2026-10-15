import {
  projectsSlice,
  resourceRequestsSlice,
  engineeringDocumentsSlice,
  calibrationSlice,
  wbsSlice,
  logsSlice,
  siteDiarySlice,
  timesheetsSlice,
  inspectionsSlice,
  projectTasksSlice,
} from './slices';

export default Object.fromEntries(
  [
    projectsSlice,
    resourceRequestsSlice,
    engineeringDocumentsSlice,
    calibrationSlice,
    wbsSlice,
    logsSlice,
    siteDiarySlice,
    timesheetsSlice,
    inspectionsSlice,
    projectTasksSlice,
  ].map((slice) => [slice.key, slice.reducer]),
);
