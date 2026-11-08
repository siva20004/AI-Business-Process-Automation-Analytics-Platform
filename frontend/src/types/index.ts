export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'viewer';
  is_active: boolean;
  is_superuser: boolean;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface KPISummary {
  total_sales: number;
  total_transactions: number;
  total_inventory_items: number;
  low_stock_items: number;
  average_transaction_value: number;
  total_processing_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  detected_anomalies: number;
  reports_generated: number;
  has_real_data: boolean;
}

export interface SalesTrendItem {
  date: string;
  sales: number;
  transactions: number;
}

export interface CategoryBreakdownItem {
  category: string;
  revenue: number;
  percentage: number;
  transaction_count: number;
}

export interface JobStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface AnomalyTrendItem {
  date: string;
  count: number;
  unreviewed: number;
}

export interface DashboardMetadata {
  data_source: string;
  reporting_period: string;
  records_processed: number;
  last_processing_time?: string;
  calculation_method: string;
  data_quality_status: string;
}

export interface DashboardResponse {
  kpis: KPISummary;
  sales_trends: SalesTrendItem[];
  category_performance: CategoryBreakdownItem[];
  job_distribution: JobStatusItem[];
  anomaly_trends: AnomalyTrendItem[];
  metadata: DashboardMetadata;
  empty_state_message?: string;
}

export interface DataSource {
  id: number;
  name: string;
  source_type: 'csv' | 'excel' | 'json' | 'postgresql' | 'rest_api' | 'file_system';
  connection_config: Record<string, any>;
  status: 'connected' | 'configured' | 'error' | 'disconnected';
  last_sync_at?: string;
  record_count: number;
  schema_info: Record<string, any>;
  error_info?: string;
  created_at: string;
}

export interface DataSourceTestResult {
  success: boolean;
  status: string;
  message: string;
  latency_ms?: number;
  records_found?: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  database: {
    status: string;
    healthy: boolean;
    dialect: string;
    latency_ms?: number;
    database?: string;
    error?: string;
  };
}
