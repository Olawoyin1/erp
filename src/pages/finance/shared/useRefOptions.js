import { useEffect, useState } from 'react';
import { accountService, contractService, contractVariationService, financeLookupService, legalEntityService } from '../../../services/finance.service';

const TTL_MS = 30000;
const cache = new Map();

const fresh = (key) => {
  const hit = cache.get(key);
  return hit && Date.now() - hit.at < TTL_MS ? hit.options : null;
};

/**
 * Loads a pick-list once and shares it between forms for 30 seconds.
 * `loader()` resolves with `[{ value, label, ... }]`; `loading` is true until it arrives.
 */
function useOptions(key, loader, enabled = true) {
  const [loaded, setLoaded] = useState({ key: null, options: [], failed: false });
  const cached = fresh(key);

  useEffect(() => {
    if (!enabled || fresh(key)) return undefined;
    let cancelled = false;
    loader()
      .then((options) => {
        cache.set(key, { at: Date.now(), options });
        if (!cancelled) setLoaded({ key, options, failed: false });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, options: [], failed: true });
      });
    return () => { cancelled = true; };
    // `loader` is rebuilt every render; the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  if (cached) return { options: cached, loading: false, failed: false };
  const mine = loaded.key === key;
  return { options: mine ? loaded.options : [], loading: enabled && !mine, failed: mine && loaded.failed };
}

const pick = (res) => res.data?.data || [];
const toOption = (r) => ({ ...r, value: r._id, label: r.code ? `${r.label} (${r.code})` : r.label });

export const useClientOptions = () =>
  useOptions('clients', () => financeLookupService.clients().then((r) => pick(r).map(toOption)));

export const useProjectOptions = (client) =>
  useOptions(`projects:${client || ''}`, () => financeLookupService.projects(client ? { client } : {}).then((r) => pick(r).map(toOption)));

export const useVendorOptions = () =>
  useOptions('vendors', () => financeLookupService.vendors().then((r) => pick(r).map(toOption)));

export const useDepartmentOptions = () =>
  useOptions('departments', () => financeLookupService.departments().then((r) => pick(r).map((d) => ({ ...d, value: d._id }))));

export const usePurchaseOrderOptions = (vendor, enabled = true) =>
  useOptions(`pos:${vendor || ''}`, () => financeLookupService.purchaseOrders(vendor ? { vendor } : {}).then((r) => pick(r).map((p) => ({ ...p, value: p._id }))), enabled);

export const useGoodsReceiptOptions = (po, enabled = true) =>
  useOptions(`grns:${po || ''}`, () => financeLookupService.goodsReceipts(po ? { po } : {}).then((r) => pick(r).map((g) => ({ ...g, value: g._id, label: `${g.label} (${g.inspection})` }))), enabled);

export const useLegalEntityOptions = () =>
  useOptions('entities', () => legalEntityService.list().then((r) => pick(r).map((e) => ({ ...e, value: e._id, label: e.name }))));

/** Ledger accounts, optionally one category and only active ones, labelled "1010 – First Bank". */
export const useAccountOptions = ({ category, activeOnly = true } = {}) =>
  useOptions(`accounts:${category || ''}:${activeOnly}`, async () => {
    const out = [];
    for (let page = 1; page <= 10; page += 1) {
      const res = await accountService.list({ page, limit: 100, ...(category ? { category } : {}), ...(activeOnly ? { status: 'active' } : {}) });
      out.push(...pick(res));
      if (page >= (res.data?.meta?.totalPages || 1)) break;
    }
    return out.map((a) => ({ ...a, value: a._id, label: `${a.accountCode} – ${a.accountName}` }));
  });

/** Contracts a variation can be lodged against (everything except closed ones). */
export const useContractOptions = () =>
  useOptions('contracts', async () => {
    const res = await contractService.list({ page: 1, limit: 100 });
    return pick(res)
      .filter((c) => c.status !== 'closed')
      .map((c) => ({ ...c, value: c._id, label: `${c.contractId}${c.contractTitle ? ` – ${c.contractTitle}` : ''}` }));
  });

/** Variations a claim can be raised against (rejected ones are refused by the server). */
export const useVariationOptions = () =>
  useOptions('variations', async () => {
    const res = await contractVariationService.list({ page: 1, limit: 100 });
    return pick(res)
      .filter((v) => v.status !== 'rejected')
      .map((v) => ({ ...v, value: v._id, label: `${v.variationId} – ${v.variationTitle}` }));
  });

export function clearRefOptionsCache() {
  cache.clear();
}
