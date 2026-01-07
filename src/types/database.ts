// SpliceStream ERP Types

export type AppRole = 'admin' | 'user';
export type ContractStatus = 'active' | 'inactive' | 'expired' | 'pending';
export type EquipmentStatus = 'active' | 'inactive' | 'maintenance' | 'decommissioned';
export type VehicleStatus = 'active' | 'inactive' | 'maintenance';
export type EmployeeStatus = 'active' | 'inactive' | 'vacation' | 'terminated';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Contract {
  id: string;
  number: string;
  client_name: string;
  description: string | null;
  value: number;
  start_date: string | null;
  end_date: string | null;
  status: ContractStatus;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  full_name: string;
  cpf: string | null;
  rg: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  contract_id: string | null;
  salary: number;
  admission_date: string | null;
  status: EmployeeStatus;
  address: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  serial_number: string;
  model: string | null;
  brand: string | null;
  type: string | null;
  contract_id: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  status: EquipmentStatus;
  installation_date: string | null;
  last_calibration_date: string | null;
  next_calibration_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  renavam: string | null;
  chassis: string | null;
  fuel_card: string | null;
  contract_id: string | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface FuelRecord {
  id: string;
  vehicle_id: string;
  date: string;
  liters: number;
  price_per_liter: number | null;
  total_value: number | null;
  odometer: number | null;
  fuel_type: string | null;
  station: string | null;
  created_at: string;
}

export interface MileageRecord {
  id: string;
  vehicle_id: string;
  date: string;
  initial_km: number;
  final_km: number;
  employee_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  date: string;
  type: string;
  description: string | null;
  cost: number;
  workshop: string | null;
  odometer: number | null;
  created_at: string;
}

export interface Calibration {
  id: string;
  equipment_id: string;
  calibration_date: string;
  expiration_date: string;
  certificate_number: string | null;
  inmetro_number: string | null;
  status: string;
  created_at: string;
}

export interface ServiceCall {
  id: string;
  equipment_id: string | null;
  contract_id: string | null;
  employee_id: string | null;
  date: string;
  type: string | null;
  description: string | null;
  resolution: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  contract_id: string;
  number: string;
  issue_date: string;
  due_date: string | null;
  value: number;
  discount: number;
  status: string;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface EnergyBill {
  id: string;
  consumer_unit: string;
  contract_id: string | null;
  reference_month: string;
  consumption_kwh: number | null;
  value: number | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface InternetBill {
  id: string;
  provider: string;
  contract_id: string | null;
  reference_month: string;
  value: number | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

export interface Advance {
  id: string;
  employee_id: string;
  date: string;
  value: number;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface TollTag {
  id: string;
  vehicle_id: string;
  tag_number: string;
  passage_date: string;
  toll_plaza: string | null;
  value: number;
  created_at: string;
}

export interface ImageMetric {
  id: string;
  equipment_id: string;
  date: string;
  total_captures: number;
  valid_captures: number;
  utilization_rate: number | null;
  created_at: string;
}

export interface Infraction {
  id: string;
  equipment_id: string;
  date: string;
  plate: string | null;
  speed: number | null;
  limit_speed: number | null;
  status: string;
  created_at: string;
}

export interface CustomerSatisfaction {
  id: string;
  contract_id: string;
  quarter: string;
  year: number;
  score: number | null;
  feedback: string | null;
  created_at: string;
}

export interface SlaMetric {
  id: string;
  contract_id: string;
  month: string;
  availability: number | null;
  response_time: number | null;
  resolution_time: number | null;
  target_met: boolean;
  created_at: string;
}

export interface ServiceGoal {
  id: string;
  contract_id: string;
  month: string;
  target_calls: number;
  completed_calls: number;
  percentage: number | null;
  created_at: string;
}

export interface PendingIssue {
  id: string;
  contract_id: string | null;
  equipment_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Seal {
  id: string;
  equipment_id: string;
  seal_number: string;
  installation_date: string;
  service_order: string | null;
  technician_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  component_name: string;
  sku: string | null;
  quantity: number;
  min_quantity: number;
  unit_price: number | null;
  location: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}
