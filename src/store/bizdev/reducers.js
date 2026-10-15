import { clientsSlice, interactionsSlice, opportunitiesSlice, tendersSlice, rfqsSlice } from './slices';

export default Object.fromEntries(
  [clientsSlice, interactionsSlice, opportunitiesSlice, tendersSlice, rfqsSlice].map((slice) => [slice.key, slice.reducer]),
);
