import apiClient from './apiClient';
import { idempotencyHeaders } from './apiHelpers';

const blob = (params) => ({ params, responseType: 'blob' });

const fileForm = (file) => {
  const form = new FormData();
  form.append('file', file);
  return form;
};

export const procurementLookupService = {
  get: (include) => apiClient.get('/procurement/lookups', { params: include ? { include } : {} }),
};

export const purchaseRequisitionService = {
  list:     (params) => apiClient.get('/requisitions', { params }),
  stats:    ()       => apiClient.get('/requisitions/stats'),
  exportCsv: (params) => apiClient.get('/requisitions/export', blob(params)),
  create:   (data)   => apiClient.post('/requisitions', data),
  get:      (id)     => apiClient.get(`/requisitions/${id}`),
  update:   (id, data) => apiClient.patch(`/requisitions/${id}`, data),
  remove:   (id)     => apiClient.delete(`/requisitions/${id}`),
  submit:   (id)     => apiClient.post(`/requisitions/${id}/submit`),
  approve:  (id)     => apiClient.post(`/requisitions/${id}/approve`),
  reject:   (id, reason) => apiClient.post(`/requisitions/${id}/reject`, { reason }),
  convertToRfq: (id, data) => apiClient.post(`/requisitions/${id}/convert-to-rfq`, data),
  attachments: (id) => apiClient.get(`/requisitions/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/requisitions/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/requisitions/${id}/attachments/${attachmentId}/download`),
};

export const procurementRfqService = {
  list:         (params) => apiClient.get('/procurement-rfqs', { params }),
  stats:        ()       => apiClient.get('/procurement-rfqs/stats'),
  exportCsv:    (params) => apiClient.get('/procurement-rfqs/export', blob(params)),
  create:       (data)   => apiClient.post('/procurement-rfqs', data),
  get:          (id)     => apiClient.get(`/procurement-rfqs/${id}`),
  update:       (id, data) => apiClient.patch(`/procurement-rfqs/${id}`, data),
  remove:       (id)     => apiClient.delete(`/procurement-rfqs/${id}`),
  issue:        (id)     => apiClient.post(`/procurement-rfqs/${id}/issue`),
  vendorResponses: (id, data) => apiClient.post(`/procurement-rfqs/${id}/vendor-responses`, data),
  closeBidding: (id)     => apiClient.post(`/procurement-rfqs/${id}/close-bidding`),
  award:        (id, vendorId) => apiClient.post(`/procurement-rfqs/${id}/vendor-responses/${vendorId}/award`),
  cancel:       (id, reason) => apiClient.post(`/procurement-rfqs/${id}/cancel`, { reason }),
  attachments:  (id) => apiClient.get(`/procurement-rfqs/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/procurement-rfqs/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/procurement-rfqs/${id}/attachments/${attachmentId}/download`),
};

export const purchaseOrderService = {
  list:        (params) => apiClient.get('/purchase-orders', { params }),
  stats:       ()       => apiClient.get('/purchase-orders/stats'),
  exportCsv:   (params) => apiClient.get('/purchase-orders/export', blob(params)),
  create:      (data)   => apiClient.post('/purchase-orders', data),
  get:         (id)     => apiClient.get(`/purchase-orders/${id}`),
  update:      (id, data) => apiClient.patch(`/purchase-orders/${id}`, data),
  acknowledge: (id)     => apiClient.post(`/purchase-orders/${id}/acknowledge`),
  cancel:      (id, reason) => apiClient.post(`/purchase-orders/${id}/cancel`, { reason }),
  attachments: (id) => apiClient.get(`/purchase-orders/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/purchase-orders/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/purchase-orders/${id}/attachments/${attachmentId}/download`),
};

export const deliveryService = {
  list:      (params) => apiClient.get('/deliveries', { params }),
  stats:     ()       => apiClient.get('/deliveries/stats'),
  exportCsv: (params) => apiClient.get('/deliveries/export', blob(params)),
  create:    (data)   => apiClient.post('/deliveries', data),
  get:       (id)     => apiClient.get(`/deliveries/${id}`),
  timeline:  (id)     => apiClient.get(`/deliveries/${id}/timeline`),
  updateStatus: (id, data) => apiClient.post(`/deliveries/${id}/status`, data),
  attachments: (id) => apiClient.get(`/deliveries/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/deliveries/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/deliveries/${id}/attachments/${attachmentId}/download`),
};

export const vendorPrequalificationService = {
  list:      (params) => apiClient.get('/vendor-prequalifications', { params }),
  stats:     ()       => apiClient.get('/vendor-prequalifications/stats'),
  exportCsv: (params) => apiClient.get('/vendor-prequalifications/export', blob(params)),
  create:    (data)   => apiClient.post('/vendor-prequalifications', data),
  get:       (id)     => apiClient.get(`/vendor-prequalifications/${id}`),
  update:    (id, data) => apiClient.patch(`/vendor-prequalifications/${id}`, data),
  approve:   (id, approvalRemarks) => apiClient.post(`/vendor-prequalifications/${id}/approve`, { approvalRemarks }),
  reject:    (id, approvalRemarks) => apiClient.post(`/vendor-prequalifications/${id}/reject`, { approvalRemarks }),
  attachments: (id) => apiClient.get(`/vendor-prequalifications/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/vendor-prequalifications/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/vendor-prequalifications/${id}/attachments/${attachmentId}/download`),
};

export const vendorService = {
  list:         (params) => apiClient.get('/vendors', { params }),
  stats:        ()       => apiClient.get('/vendors/stats'),
  exportCsv:    (params) => apiClient.get('/vendors/export', blob(params)),
  get:          (id)     => apiClient.get(`/vendors/${id}`),
  suspend:      (id, reason) => apiClient.post(`/vendors/${id}/suspend`, { reason }),
  markInactive: (id, reason) => apiClient.post(`/vendors/${id}/mark-inactive`, { reason }),
  reactivate:   (id)     => apiClient.post(`/vendors/${id}/reactivate`),
  attachments:  (id) => apiClient.get(`/vendors/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/vendors/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/vendors/${id}/attachments/${attachmentId}/download`),
};

export const inventoryItemService = {
  list:      (params) => apiClient.get('/inventory-items', { params }),
  stats:     ()       => apiClient.get('/inventory-items/stats'),
  exportCsv: (params) => apiClient.get('/inventory-items/export', blob(params)),
  create:    (data)   => apiClient.post('/inventory-items', data),
  get:       (id)     => apiClient.get(`/inventory-items/${id}`),
  update:    (id, data) => apiClient.patch(`/inventory-items/${id}`, data),
  history:   (id)     => apiClient.get(`/inventory-items/${id}/history`),
  adjust:    (id, data) => apiClient.post(`/inventory-items/${id}/adjust`, data),
  attachments: (id) => apiClient.get(`/inventory-items/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/inventory-items/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/inventory-items/${id}/attachments/${attachmentId}/download`),
};

export const inventoryImportService = {
  template: () => apiClient.get('/imports/inventory-items/template', { responseType: 'blob' }),
  run: (file, dryRun) => apiClient.post('/imports/inventory-items', fileForm(file), { params: { dryRun: dryRun ? 'true' : 'false' } }),
};

export const stockMovementService = {
  list:      (params) => apiClient.get('/stock-movements', { params }),
  stats:     ()       => apiClient.get('/stock-movements/stats'),
  exportCsv: (params) => apiClient.get('/stock-movements/export', blob(params)),
  create:    (data)   => apiClient.post('/stock-movements', data, idempotencyHeaders()),
  get:       (id)     => apiClient.get(`/stock-movements/${id}`),
  complete:  (id)     => apiClient.post(`/stock-movements/${id}/complete`, {}, idempotencyHeaders()),
  cancel:    (id, reason) => apiClient.post(`/stock-movements/${id}/cancel`, reason ? { reason } : {}),
  attachments: (id) => apiClient.get(`/stock-movements/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/stock-movements/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/stock-movements/${id}/attachments/${attachmentId}/download`),
};

export const goodsReceiptService = {
  list:      (params) => apiClient.get('/goods-receipts', { params }),
  stats:     ()       => apiClient.get('/goods-receipts/stats'),
  exportCsv: (params) => apiClient.get('/goods-receipts/export', blob(params)),
  create:    (data)   => apiClient.post('/goods-receipts', data),
  get:       (id)     => apiClient.get(`/goods-receipts/${id}`),
  inspectionStatus: (id, formData) => apiClient.post(`/goods-receipts/${id}/inspection-status`, formData),
  attachments: (id) => apiClient.get(`/goods-receipts/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/goods-receipts/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/goods-receipts/${id}/attachments/${attachmentId}/download`),
};

export const procurementReportService = {
  get: () => apiClient.get('/procurement/reports'),
  exportFile: (format) => apiClient.get('/procurement/reports/export', { params: { format }, responseType: 'blob' }),
};
