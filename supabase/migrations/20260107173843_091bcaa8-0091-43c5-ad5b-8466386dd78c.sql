-- =============================================
-- SPLICESTREAM ERP - DATABASE SCHEMA
-- =============================================

-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create enum for common statuses
CREATE TYPE public.contract_status AS ENUM ('active', 'inactive', 'expired', 'pending');
CREATE TYPE public.equipment_status AS ENUM ('active', 'inactive', 'maintenance', 'decommissioned');
CREATE TYPE public.vehicle_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'vacation', 'terminated');

-- 3. User roles table (security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Contracts table
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    description TEXT,
    value DECIMAL(15,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status contract_status DEFAULT 'active',
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- 6. Employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    rg TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    department TEXT,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    salary DECIMAL(15,2) DEFAULT 0,
    admission_date DATE,
    status employee_status DEFAULT 'active',
    address TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 7. Equipment table
CREATE TABLE public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number TEXT NOT NULL UNIQUE,
    model TEXT,
    brand TEXT,
    type TEXT,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    address TEXT,
    status equipment_status DEFAULT 'active',
    installation_date DATE,
    last_calibration_date DATE,
    next_calibration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

-- 8. Vehicles table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate TEXT NOT NULL UNIQUE,
    brand TEXT,
    model TEXT,
    year INTEGER,
    color TEXT,
    renavam TEXT,
    chassis TEXT,
    fuel_card TEXT,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    status vehicle_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 9. Fuel records table
CREATE TABLE public.fuel_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    liters DECIMAL(10,2) NOT NULL,
    price_per_liter DECIMAL(10,2),
    total_value DECIMAL(10,2),
    odometer INTEGER,
    fuel_type TEXT,
    station TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

-- 10. Mileage records table
CREATE TABLE public.mileage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    initial_km INTEGER NOT NULL,
    final_km INTEGER NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.mileage_records ENABLE ROW LEVEL SECURITY;

-- 11. Maintenance records table
CREATE TABLE public.maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    cost DECIMAL(10,2) DEFAULT 0,
    workshop TEXT,
    odometer INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- 12. Calibrations table
CREATE TABLE public.calibrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
    calibration_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    certificate_number TEXT,
    inmetro_number TEXT,
    status TEXT DEFAULT 'valid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.calibrations ENABLE ROW LEVEL SECURITY;

-- 13. Service calls table
CREATE TABLE public.service_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type TEXT,
    description TEXT,
    resolution TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.service_calls ENABLE ROW LEVEL SECURITY;

-- 14. Invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    value DECIMAL(15,2) NOT NULL,
    discount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 15. Energy bills table
CREATE TABLE public.energy_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_unit TEXT NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    reference_month DATE NOT NULL,
    consumption_kwh DECIMAL(10,2),
    value DECIMAL(10,2),
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.energy_bills ENABLE ROW LEVEL SECURITY;

-- 16. Internet bills table
CREATE TABLE public.internet_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    reference_month DATE NOT NULL,
    value DECIMAL(10,2),
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.internet_bills ENABLE ROW LEVEL SECURITY;

-- 17. Advances table (adiantamentos)
CREATE TABLE public.advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;

-- 18. Toll tags table
CREATE TABLE public.toll_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    tag_number TEXT NOT NULL,
    passage_date TIMESTAMP WITH TIME ZONE NOT NULL,
    toll_plaza TEXT,
    value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.toll_tags ENABLE ROW LEVEL SECURITY;

-- 19. Image metrics table
CREATE TABLE public.image_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_captures INTEGER DEFAULT 0,
    valid_captures INTEGER DEFAULT 0,
    utilization_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.image_metrics ENABLE ROW LEVEL SECURITY;

-- 20. Infractions table
CREATE TABLE public.infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    plate TEXT,
    speed DECIMAL(6,2),
    limit_speed DECIMAL(6,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;

-- 21. Customer satisfaction table
CREATE TABLE public.customer_satisfaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    quarter TEXT NOT NULL,
    year INTEGER NOT NULL,
    score DECIMAL(3,1),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.customer_satisfaction ENABLE ROW LEVEL SECURITY;

-- 22. SLA metrics table
CREATE TABLE public.sla_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    month DATE NOT NULL,
    availability DECIMAL(5,2),
    response_time DECIMAL(10,2),
    resolution_time DECIMAL(10,2),
    target_met BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sla_metrics ENABLE ROW LEVEL SECURITY;

-- 23. Service goals table
CREATE TABLE public.service_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    month DATE NOT NULL,
    target_calls INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.service_goals ENABLE ROW LEVEL SECURITY;

-- 24. Pending issues table
CREATE TABLE public.pending_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pending_issues ENABLE ROW LEVEL SECURITY;

-- 25. Seals and service orders table
CREATE TABLE public.seals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
    seal_number TEXT NOT NULL,
    installation_date DATE NOT NULL,
    service_order TEXT,
    technician_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.seals ENABLE ROW LEVEL SECURITY;

-- 26. Inventory table
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    location TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 27. Audit log table
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- All operational tables - authenticated users can view, admins can manage
DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'contracts', 'employees', 'equipment', 'vehicles',
            'fuel_records', 'mileage_records', 'maintenance_records',
            'calibrations', 'service_calls', 'invoices',
            'energy_bills', 'internet_bills', 'advances', 'toll_tags',
            'image_metrics', 'infractions', 'customer_satisfaction',
            'sla_metrics', 'service_goals', 'pending_issues',
            'seals', 'inventory', 'audit_log'
        ])
    LOOP
        EXECUTE format('
            CREATE POLICY "Authenticated users can view %1$s"
            ON public.%1$s FOR SELECT
            TO authenticated
            USING (true);
            
            CREATE POLICY "Authenticated users can insert %1$s"
            ON public.%1$s FOR INSERT
            TO authenticated
            WITH CHECK (true);
            
            CREATE POLICY "Authenticated users can update %1$s"
            ON public.%1$s FOR UPDATE
            TO authenticated
            USING (true)
            WITH CHECK (true);
            
            CREATE POLICY "Admins can delete %1$s"
            ON public.%1$s FOR DELETE
            TO authenticated
            USING (public.has_role(auth.uid(), ''admin''));
        ', tbl);
    END LOOP;
END $$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to relevant tables
DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'profiles', 'contracts', 'employees', 'equipment', 
            'vehicles', 'service_calls', 'pending_issues', 'inventory'
        ])
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%1$s_updated_at
            BEFORE UPDATE ON public.%1$s
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
        ', tbl);
    END LOOP;
END $$;