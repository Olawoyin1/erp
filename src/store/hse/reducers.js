import { hseOffshoreSlice, hsePlansSlice, hseContactsSlice } from './slices';

export default Object.fromEntries([hseOffshoreSlice, hsePlansSlice, hseContactsSlice].map((slice) => [slice.key, slice.reducer]));
