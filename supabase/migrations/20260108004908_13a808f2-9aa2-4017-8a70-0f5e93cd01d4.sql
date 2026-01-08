-- Add foreign key constraints to ensure referential integrity
-- Using ON DELETE SET NULL for nullable fields and ON DELETE RESTRICT for required fields

-- employees.contract_id -> contracts.id
ALTER TABLE public.employees
ADD CONSTRAINT fk_employees_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- equipment.contract_id -> contracts.id
ALTER TABLE public.equipment
ADD CONSTRAINT fk_equipment_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- vehicles.contract_id -> contracts.id
ALTER TABLE public.vehicles
ADD CONSTRAINT fk_vehicles_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- fuel_records.vehicle_id -> vehicles.id
ALTER TABLE public.fuel_records
ADD CONSTRAINT fk_fuel_records_vehicle
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;

-- mileage_records.vehicle_id -> vehicles.id
ALTER TABLE public.mileage_records
ADD CONSTRAINT fk_mileage_records_vehicle
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;

-- mileage_records.employee_id -> employees.id
ALTER TABLE public.mileage_records
ADD CONSTRAINT fk_mileage_records_employee
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- maintenance_records.vehicle_id -> vehicles.id
ALTER TABLE public.maintenance_records
ADD CONSTRAINT fk_maintenance_records_vehicle
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;

-- calibrations.equipment_id -> equipment.id
ALTER TABLE public.calibrations
ADD CONSTRAINT fk_calibrations_equipment
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE RESTRICT;

-- service_calls.equipment_id -> equipment.id
ALTER TABLE public.service_calls
ADD CONSTRAINT fk_service_calls_equipment
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;

-- service_calls.contract_id -> contracts.id
ALTER TABLE public.service_calls
ADD CONSTRAINT fk_service_calls_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- service_calls.employee_id -> employees.id
ALTER TABLE public.service_calls
ADD CONSTRAINT fk_service_calls_employee
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- invoices.contract_id -> contracts.id
ALTER TABLE public.invoices
ADD CONSTRAINT fk_invoices_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;

-- energy_bills.contract_id -> contracts.id
ALTER TABLE public.energy_bills
ADD CONSTRAINT fk_energy_bills_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- internet_bills.contract_id -> contracts.id
ALTER TABLE public.internet_bills
ADD CONSTRAINT fk_internet_bills_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- advances.employee_id -> employees.id
ALTER TABLE public.advances
ADD CONSTRAINT fk_advances_employee
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;

-- toll_tags.vehicle_id -> vehicles.id
ALTER TABLE public.toll_tags
ADD CONSTRAINT fk_toll_tags_vehicle
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;

-- image_metrics.equipment_id -> equipment.id
ALTER TABLE public.image_metrics
ADD CONSTRAINT fk_image_metrics_equipment
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE RESTRICT;

-- infractions.equipment_id -> equipment.id
ALTER TABLE public.infractions
ADD CONSTRAINT fk_infractions_equipment
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE RESTRICT;

-- customer_satisfaction.contract_id -> contracts.id
ALTER TABLE public.customer_satisfaction
ADD CONSTRAINT fk_customer_satisfaction_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;

-- sla_metrics.contract_id -> contracts.id
ALTER TABLE public.sla_metrics
ADD CONSTRAINT fk_sla_metrics_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;

-- service_goals.contract_id -> contracts.id
ALTER TABLE public.service_goals
ADD CONSTRAINT fk_service_goals_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE RESTRICT;

-- pending_issues.contract_id -> contracts.id
ALTER TABLE public.pending_issues
ADD CONSTRAINT fk_pending_issues_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

-- pending_issues.equipment_id -> equipment.id
ALTER TABLE public.pending_issues
ADD CONSTRAINT fk_pending_issues_equipment
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;

-- pending_issues.assigned_to -> employees.id
ALTER TABLE public.pending_issues
ADD CONSTRAINT fk_pending_issues_employee
FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE SET NULL;

-- seals.equipment_id -> equipment.id
ALTER TABLE public.seals
ADD CONSTRAINT fk_seals_equipment
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE RESTRICT;

-- seals.technician_id -> employees.id
ALTER TABLE public.seals
ADD CONSTRAINT fk_seals_technician
FOREIGN KEY (technician_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- infrastructure_services.contract_id -> contracts.id
ALTER TABLE public.infrastructure_services
ADD CONSTRAINT fk_infrastructure_services_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;