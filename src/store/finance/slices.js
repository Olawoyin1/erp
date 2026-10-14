import { createFinanceSlice } from './createFinanceSlice';
import {
  accountService, journalEntryService, budgetService, invoiceService, payableService,
  contractService, contractVariationService, contractClaimService,
  commercialRiskService, insurancePolicyService, bankReconciliationService,
  taxRecordService, financeFormService, ledgerService,
} from '../../services/finance.service';

export const accountsSlice = createFinanceSlice('finAccounts', accountService);
export const journalsSlice = createFinanceSlice('finJournals', journalEntryService);
export const ledgerLinesSlice = createFinanceSlice('finLedgerLines', { list: ledgerService.lines });
export const budgetsSlice = createFinanceSlice('finBudgets', budgetService);
export const invoicesSlice = createFinanceSlice('finInvoices', invoiceService);
export const payablesSlice = createFinanceSlice('finPayables', payableService);
export const contractsSlice = createFinanceSlice('finContracts', contractService);
export const variationsSlice = createFinanceSlice('finVariations', contractVariationService);
export const claimsSlice = createFinanceSlice('finClaims', contractClaimService);
export const risksSlice = createFinanceSlice('finRisks', commercialRiskService);
export const policiesSlice = createFinanceSlice('finPolicies', insurancePolicyService);
export const reconciliationsSlice = createFinanceSlice('finReconciliations', bankReconciliationService);
export const taxRecordsSlice = createFinanceSlice('finTaxRecords', taxRecordService);
export const financeFormsSlice = createFinanceSlice('finForms', financeFormService);
