import {
  accountsSlice, journalsSlice, ledgerLinesSlice, budgetsSlice, invoicesSlice, payablesSlice,
  contractsSlice, variationsSlice, claimsSlice, risksSlice, policiesSlice,
  reconciliationsSlice, taxRecordsSlice, financeFormsSlice,
} from './slices';

export default Object.fromEntries(
  [
    accountsSlice, journalsSlice, ledgerLinesSlice, budgetsSlice, invoicesSlice, payablesSlice,
    contractsSlice, variationsSlice, claimsSlice, risksSlice, policiesSlice,
    reconciliationsSlice, taxRecordsSlice, financeFormsSlice,
  ].map((slice) => [slice.key, slice.reducer]),
);
