import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  AuthResponse,
  DashboardResponse,
  DataSource,
  DataSourceTestResult,
  HealthResponse,
  User
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT access token to outgoing requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('fuji_flow_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token on authentication failure
      localStorage.removeItem('fuji_flow_token');
      localStorage.removeItem('fuji_flow_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export const dashboardService = {
  getSummary: async (timeRange: string = '30d'): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>(`/dashboard/summary?time_range=${timeRange}`);
    return response.data;
  },
};

export const dataSourceService = {
  getAll: async (): Promise<DataSource[]> => {
    const response = await api.get<DataSource[]>('/data-sources');
    return response.data;
  },
  create: async (data: Partial<DataSource>): Promise<DataSource> => {
    const response = await api.post<DataSource>('/data-sources', data);
    return response.data;
  },
  testConnection: async (id: number): Promise<DataSourceTestResult> => {
    const response = await api.post<DataSourceTestResult>(`/data-sources/${id}/test`);
    return response.data;
  },
};

export const uploadService = {
  getSamples: async () => {
    const response = await api.get('/uploads/samples');
    return response.data;
  },
  preview: async (formData: FormData) => {
    const response = await api.post('/uploads/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  cleanAndValidate: async (formData: FormData) => {
    const response = await api.post('/uploads/clean-and-validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  confirmImport: async (importId: number) => {
    const response = await api.post(`/uploads/${importId}/confirm`);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/uploads/history');
    return response.data;
  },
};

export const analyticsService = {
  getSales: async (params?: Record<string, any>) => {
    const response = await api.get('/analytics/sales', { params });
    return response.data;
  },
  getInventory: async (params?: Record<string, any>) => {
    const response = await api.get('/analytics/inventory', { params });
    return response.data;
  },
  getFilters: async () => {
    const response = await api.get('/analytics/filters');
    return response.data;
  },
};

export const workflowService = {
  getWorkflows: async () => {
    const response = await api.get('/workflows');
    return response.data;
  },
  createWorkflow: async (data: Record<string, any>) => {
    const response = await api.post('/workflows', data);
    return response.data;
  },
  runWorkflow: async (id: number, customFilePath?: string) => {
    const response = await api.post(`/workflows/${id}/run`, null, {
      params: customFilePath ? { custom_file_path: customFilePath } : undefined,
    });
    return response.data;
  },
  getExecutions: async (limit: number = 50) => {
    const response = await api.get('/workflows/executions', { params: { limit } });
    return response.data;
  },
  getExecutionDetails: async (executionId: string) => {
    const response = await api.get(`/workflows/executions/${executionId}`);
    return response.data;
  },
  retryExecution: async (executionId: string) => {
    const response = await api.post(`/workflows/executions/${executionId}/retry`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/workflows/stats');
    return response.data;
  },
};

export const anomalyService = {
  getAnomalies: async (params?: Record<string, any>) => {
    const response = await api.get('/anomalies', { params });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/anomalies/stats');
    return response.data;
  },
  triggerScan: async () => {
    const response = await api.post('/anomalies/scan');
    return response.data;
  },
  reviewAnomaly: async (id: number, status: string, notes?: string) => {
    const response = await api.post(`/anomalies/${id}/review`, { status, notes });
    return response.data;
  },
};

export const insightsService = {
  getExecutiveSummary: async (timeRange: string = 'all') => {
    const response = await api.get('/insights/executive-summary', { params: { time_range: timeRange } });
    return response.data;
  },
  askAssistant: async (question: string) => {
    const response = await api.post('/insights/ask', { question });
    return response.data;
  },
};

export const reportService = {
  getReports: async (limit: number = 50) => {
    const response = await api.get('/reports', { params: { limit } });
    return response.data;
  },
  generateReport: async (data: { report_type: string; file_format?: string; time_range?: string }) => {
    const response = await api.post('/reports/generate', data);
    return response.data;
  },
  downloadReportUrl: (reportId: number) => {
    return `/api/v1/reports/${reportId}/download`;
  },
};

export const emailService = {
  getConfig: async () => {
    const response = await api.get('/email/config');
    return response.data;
  },
  previewEmail: async (data: { template_type: string; recipients: string[]; custom_note?: string; report_id?: number }) => {
    const response = await api.post('/email/preview', data);
    return response.data;
  },
  sendEmail: async (data: { template_type: string; recipients: string[]; custom_note?: string; report_id?: number }) => {
    const response = await api.post('/email/send', data);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/email/history');
    return response.data;
  },
};

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  createUser: async (data: { email: string; full_name: string; password: string; role?: string }) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  toggleUserStatus: async (userId: number, isActive: boolean) => {
    const response = await api.patch(`/users/${userId}/status`, { is_active: isActive });
    return response.data;
  },
};

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
};

export const systemService = {
  getHealth: async (): Promise<HealthResponse> => {
    // Calling root /health or /api/v1/health
    const response = await axios.get<HealthResponse>('/health');
    return response.data;
  },
};

export default api;
