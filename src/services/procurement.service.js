import apiClient from './apiClient';
import { idempotencyHeaders } from './apiHelpers';

// Procurement.md is not in this frontend repo; paths follow INTEGRATION_PROGRESS
// and cross-references in hse-quality.md / platform-core.md.

export const purchaseRequisitionService = {
  list:    (params) => apiClient.get('/purchase-requisitions', { params }),
  stats:   ()       => apiClient.get('/purchase-requisitions/stats'),
  create:  (data)   => apiClient.post('/purchase-requisitions', data),
  get:     (id)     => apiClient.get(`/purchase-requisitions/${id}`),
  update:  (id, data) => apiClient.patch(`/purchase-requisitions/${id}`, data),
  submit:  (id)     => apiClient.post(`/purchase-requisitions/${id}/submit`),
  approve: (id)     => apiClient.post(`/purchase-requisitions/${id}/approve`),
  reject:  (id, reason) => apiClient.post(`/purchase-requisitions/${id}/reject`, { reason }),
};

export const procurementRfqService = {
  list:            (params) => apiClient.get('/procurement-rfqs', { params }),
  stats:           ()       => apiClient.get('/procurement-rfqs/stats'),
  create:          (data)   => apiClient.post('/procurement-rfqs', data),
  get:             (id)     => apiClient.get(`/procurement-rfqs/${id}`),
  update:          (id, data) => apiClient.patch(`/procurement-rfqs/${id}`, data),
  vendorResponses: (id, data) => apiClient.post(`/procurement-rfqs/${id}/vendor-responses`, data),
  award:           (id, data) => apiClient.post(`/procurement-rfqs/${id}/award`, data),
};

export const purchaseOrderService = {
  list:    (params) => apiClient.get('/purchase-orders', { params }),
  stats:   ()       => apiClient.get('/purchase-orders/stats'),
  create:  (data)   => apiClient.post('/purchase-orders', data),
  get:     (id)     => apiClient.get(`/purchase-orders/${id}`),
  update:  (id, data) => apiClient.patch(`/purchase-orders/${id}`, data),
  issue:   (id)     => apiClient.post(`/purchase-orders/${id}/issue`),
  cancel:  (id, reason) => apiClient.post(`/purchase-orders/${id}/cancel`, { reason }),
};

export const deliveryService = {
  list:    (params) => apiClient.get('/deliveries', { params }),
  stats:   ()       => apiClient.get('/deliveries/stats'),
  create:  (data)   => apiClient.post('/deliveries', data),
  get:     (id)     => apiClient.get(`/deliveries/${id}`),
  update:  (id, data) => apiClient.patch(`/deliveries/${id}`, data),
  confirm: (id)     => apiClient.post(`/deliveries/${id}/confirm`),
};

export const vendorService = {
  list:    (params) => apiClient.get('/vendors', { params }),
  stats:   ()       => apiClient.get('/vendors/stats'),
  create:  (data)   => apiClient.post('/vendors', data),
  get:     (id)     => apiClient.get(`/vendors/${id}`),
  update:  (id, data) => apiClient.patch(`/vendors/${id}`, data),
};

export const inventoryItemService = {
  list:    (params) => apiClient.get('/inventory-items', { params }),
  stats:   ()       => apiClient.get('/inventory-items/stats'),
  create:  (data)   => apiClient.post('/inventory-items', data),
  get:     (id)     => apiClient.get(`/inventory-items/${id}`),
  update:  (id, data) => apiClient.patch(`/inventory-items/${id}`, data),
};

export const stockMovementService = {
  list:     (params) => apiClient.get('/stock-movements', { params }),
  create:   (data)   => apiClient.post('/stock-movements', data, idempotencyHeaders()),
  get:      (id)     => apiClient.get(`/stock-movements/${id}`),
  complete: (id)     => apiClient.post(`/stock-movements/${id}/complete`, {}, idempotencyHeaders()),
};

export const goodsReceiptService = {
  list:              (params) => apiClient.get('/goods-receipts', { params }),
  stats:             ()       => apiClient.get('/goods-receipts/stats'),
  get:               (id)     => apiClient.get(`/goods-receipts/${id}`),
  inspectionStatus:  (id, formData) => apiClient.post(`/goods-receipts/${id}/inspection-status`, formData),
};

export const procurementReportService = {
  get: () => apiClient.get('/procurement/reports'),
};
