import { qmsAuditsSlice, qmsCalibrationSlice, qmsInspectionsSlice } from './slices';

export default Object.fromEntries([qmsAuditsSlice, qmsCalibrationSlice, qmsInspectionsSlice].map((slice) => [slice.key, slice.reducer]));
