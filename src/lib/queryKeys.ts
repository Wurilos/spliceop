// Centralized query keys for React Query
// This ensures consistent cache invalidation across the app

export const queryKeys = {
  // Core entities (stable data - longer cache)
  contracts: ['contracts'] as const,
  employees: ['employees'] as const,
  equipment: ['equipment'] as const,
  vehicles: ['vehicles'] as const,
  teams: ['teams'] as const,
  
  // Operational data (moderate cache)
  fuelRecords: ['fuel_records'] as const,
  mileageRecords: ['mileage_records'] as const,
  maintenanceRecords: ['maintenance_records'] as const,
  calibrations: ['calibrations'] as const,
  serviceCalls: ['service_calls'] as const,
  
  // Financial data (moderate cache)
  invoices: ['invoices'] as const,
  energyBills: ['energy_bills'] as const,
  energyConsumerUnits: ['energy_consumer_units'] as const,
  energySuppliers: ['energy_suppliers'] as const,
  internetBills: ['internet_bills'] as const,
  internetConnections: ['internet_connections'] as const,
  internetProviders: ['internet_providers'] as const,
  advances: ['advances'] as const,
  tollTags: ['toll_tags'] as const,
  
  // Metrics data (moderate cache)
  imageMetrics: ['image_metrics'] as const,
  infractions: ['infractions'] as const,
  customerSatisfaction: ['customer_satisfaction'] as const,
  slaMetrics: ['sla_metrics'] as const,
  serviceGoals: ['service_goals'] as const,
  
  // Support data (moderate cache)
  seals: ['seals'] as const,
  sealServiceOrders: ['seal_service_orders'] as const,
  inventory: ['inventory'] as const,
  stock: ['stock'] as const,
  components: ['components'] as const,
  phoneLines: ['phone_lines'] as const,
  chipNumbers: ['chip_numbers'] as const,
  
  // Dynamic data (shorter cache)
  pendingIssues: ['pending_issues'] as const,
  archivedIssues: ['archived_issues'] as const,
  kanbanColumns: ['kanban_columns'] as const,
  kanbanSubitems: ['kanban_subitems'] as const,
  systemAlerts: ['system_alerts'] as const,
  
  // User data
  users: ['users_with_roles'] as const,
  profiles: ['profiles'] as const,
  auditLog: ['audit_log'] as const,
  issueHistory: (issueId: string) => ['issue_history', issueId] as const,
  
  // Infrastructure
  infrastructureServices: ['infrastructure_services'] as const,
  contractAmendments: ['contract_amendments'] as const,
} as const;

// Cache time configurations (in milliseconds)
export const cacheConfig = {
  // Stable data - 10 minutes stale, 20 minutes cache
  stable: {
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
  },
  // Moderate data - 5 minutes stale, 10 minutes cache
  moderate: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  },
  // Dynamic data - 2 minutes stale, 5 minutes cache
  dynamic: {
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  },
  // Real-time data - 30 seconds stale, 2 minutes cache
  realtime: {
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 2,
  },
} as const;
