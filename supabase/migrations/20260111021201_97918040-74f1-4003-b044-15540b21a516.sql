-- Add missing foreign keys to energy_consumer_units
ALTER TABLE public.energy_consumer_units
ADD CONSTRAINT fk_energy_consumer_units_contract
FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL;

ALTER TABLE public.energy_consumer_units
ADD CONSTRAINT fk_energy_consumer_units_equipment
FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;