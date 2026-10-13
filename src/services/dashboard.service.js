import apiClient from './apiClient';

export const dashboardService = {
  getOverview: () => apiClient.get('/dashboard/overview'),
  getActivity: (page = 1, limit = 4) =>
    apiClient.get('/activity', { params: { page, limit } }),
};
