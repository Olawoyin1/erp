/** Kobo integer -> text for an input showing naira ("50000000" -> "500000", "50000050" -> "500000.5"). */
export const koboToInput = (kobo) => {
  if (kobo == null || Number.isNaN(Number(kobo))) return '';
  const naira = Number(kobo) / 100;
  return Number.isInteger(naira) ? String(naira) : String(naira.toFixed(2)).replace(/0+$/, '');
};

/** Naira text -> whole kobo, or null when the text is not a valid non-negative amount with at most 2 decimals. */
export const inputToKobo = (text) => {
  const clean = String(text ?? '').replace(/[,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
};

export const formatNaira = (kobo) =>
  kobo == null ? '—' : new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(kobo / 100);

/** `{ field: message }` from a failed request's 422 details. */
export const detailErrors = (err) => {
  const out = {};
  (err?.response?.data?.error?.details || []).forEach((d) => {
    if (d.field && !out[d.field]) out[d.field] = d.message;
  });
  return out;
};

export const shallowEqual = (a, b) => {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of keys) if (a?.[key] !== b?.[key]) return false;
  return true;
};

export const tableHead = { fontSize: '0.72rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '10px 0' };
export const tableCell = { fontSize: '0.85rem', color: '#0F172A', padding: '12px 0', borderBottom: '1px solid #F1F5F9' };

export const dateInput =(value) => (value ? String(value).slice(0, 10) : '');

export const MAIL_REPLY_TO_KEYS = [
  ['default', 'Default (all modules)'],
  ['core', 'Platform (users, tasks, documents)'],
  ['hr', 'Human Resources'],
  ['administration', 'Administration'],
  ['businessdev', 'Business Development'],
  ['technical', 'Technical'],
  ['procurement', 'Procurement'],
  ['hse', 'HSE'],
  ['quality', 'Quality System'],
  ['finance', 'Accounts & Finance'],
];

export const ACCOUNT_MAPPING_LABELS = {
  bank: 'Main bank account',
  receivable: 'Accounts receivable',
  revenue: 'Revenue',
  vatOutput: 'VAT output (on sales)',
  vatInput: 'VAT input (on purchases)',
  whtReceivable: 'Withholding tax receivable',
  whtPayable: 'Withholding tax payable',
  payable: 'Accounts payable',
  defaultExpense: 'Default expense',
  retentionReceivable: 'Retention receivable',
  advanceReceived: 'Advances received',
  inventory: 'Inventory',
  goodsReceivedNotInvoiced: 'Goods received not invoiced',
  fxGainLoss: 'Exchange gain or loss',
  payrollExpense: 'Payroll expense',
  employerPensionExpense: 'Employer pension expense',
  nsitfExpense: 'NSITF expense',
  itfExpense: 'ITF expense',
  netSalariesPayable: 'Net salaries payable',
  payePayable: 'PAYE payable',
  pensionPayable: 'Pension payable',
  nhfPayable: 'NHF payable',
  nsitfPayable: 'NSITF payable',
  itfPayable: 'ITF payable',
  otherDeductionsPayable: 'Other deductions payable',
  vatPayable: 'VAT payable (remittance)',
  companyIncomeTaxPayable: 'Company income tax payable',
  fixedAssets: 'Fixed assets',
  accumulatedDepreciation: 'Accumulated depreciation',
  depreciationExpense: 'Depreciation expense',
  assetDisposalGainLoss: 'Asset disposal gain or loss',
  retainedEarnings: 'Retained earnings',
};
