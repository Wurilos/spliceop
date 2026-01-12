export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advances: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string
          id: string
          reason: string | null
          status: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          reason?: string | null
          status?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          reason?: string | null
          status?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "advances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_advances_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_issues: {
        Row: {
          address: string | null
          archived_at: string
          completed_at: string
          contract_id: string | null
          contract_name: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          equipment_id: string | null
          equipment_serial: string | null
          id: string
          original_issue_id: string
          priority: string | null
          status: string | null
          team: string | null
          title: string
          type: string | null
          vehicle_id: string | null
          vehicle_plate: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string
          completed_at: string
          contract_id?: string | null
          contract_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          equipment_serial?: string | null
          id?: string
          original_issue_id: string
          priority?: string | null
          status?: string | null
          team?: string | null
          title: string
          type?: string | null
          vehicle_id?: string | null
          vehicle_plate?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string
          completed_at?: string
          contract_id?: string | null
          contract_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          equipment_serial?: string | null
          id?: string
          original_issue_id?: string
          priority?: string | null
          status?: string | null
          team?: string | null
          title?: string
          type?: string | null
          vehicle_id?: string | null
          vehicle_plate?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      calibrations: {
        Row: {
          calibration_date: string
          certificate_number: string | null
          created_at: string | null
          equipment_id: string
          expiration_date: string
          id: string
          inmetro_number: string | null
          status: string | null
        }
        Insert: {
          calibration_date: string
          certificate_number?: string | null
          created_at?: string | null
          equipment_id: string
          expiration_date: string
          id?: string
          inmetro_number?: string | null
          status?: string | null
        }
        Update: {
          calibration_date?: string
          certificate_number?: string | null
          created_at?: string | null
          equipment_id?: string
          expiration_date?: string
          id?: string
          inmetro_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calibrations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_calibrations_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_numbers: {
        Row: {
          carrier: string
          created_at: string
          id: string
          line_number: string
          updated_at: string
        }
        Insert: {
          carrier: string
          created_at?: string
          id?: string
          line_number: string
          updated_at?: string
        }
        Update: {
          carrier?: string
          created_at?: string
          id?: string
          line_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      components: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          type: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          type?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          type?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      contract_amendments: {
        Row: {
          amendment_number: number
          contract_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          start_date: string
          updated_at: string
          value: number
        }
        Insert: {
          amendment_number?: number
          contract_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          start_date: string
          updated_at?: string
          value: number
        }
        Update: {
          amendment_number?: number
          contract_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          start_date?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          city: string | null
          client_name: string
          cost_center: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          number: string
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          city?: string | null
          client_name: string
          cost_center?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          number: string
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          city?: string | null
          client_name?: string
          cost_center?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          number?: string
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      customer_satisfaction: {
        Row: {
          contract_id: string
          created_at: string | null
          feedback: string | null
          id: string
          quarter: string
          score: number | null
          year: number
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          quarter: string
          score?: number | null
          year: number
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          quarter?: string
          score?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_satisfaction_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customer_satisfaction_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          admission_date: string | null
          city: string | null
          contract_id: string | null
          cpf: string | null
          created_at: string | null
          ctps: string | null
          ctps_serie: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          re: string | null
          rg: string | null
          role: string | null
          salary: number | null
          state: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
          team_id: string | null
          termination_date: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          city?: string | null
          contract_id?: string | null
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          ctps_serie?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          re?: string | null
          rg?: string | null
          role?: string | null
          salary?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          city?: string | null
          contract_id?: string | null
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          ctps_serie?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          re?: string | null
          rg?: string | null
          role?: string | null
          salary?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          team_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_bills: {
        Row: {
          consumer_unit: string
          contract_id: string | null
          created_at: string | null
          due_date: string | null
          equipment_id: string | null
          id: string
          reference_month: string
          status: string | null
          supplier_id: string | null
          value: number | null
          zero_invoice: boolean | null
        }
        Insert: {
          consumer_unit: string
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          reference_month: string
          status?: string | null
          supplier_id?: string | null
          value?: number | null
          zero_invoice?: boolean | null
        }
        Update: {
          consumer_unit?: string
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          reference_month?: string
          status?: string | null
          supplier_id?: string | null
          value?: number | null
          zero_invoice?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_bills_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "energy_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_energy_bills_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_consumer_units: {
        Row: {
          consumer_unit: string
          contract_id: string | null
          created_at: string | null
          equipment_id: string | null
          id: string
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          consumer_unit: string
          contract_id?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          consumer_unit?: string
          contract_id?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_consumer_units_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "energy_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_energy_consumer_units_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_energy_consumer_units_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          address: string | null
          brand: string | null
          communication_type: string | null
          contract_id: string | null
          created_at: string | null
          direction: string | null
          energy_type: string | null
          id: string
          installation_date: string | null
          lanes_qty: number | null
          last_calibration_date: string | null
          latitude: number | null
          longitude: number | null
          model: string | null
          modem_number: string | null
          next_calibration_date: string | null
          serial_number: string
          speed_limit: number | null
          status: Database["public"]["Enums"]["equipment_status"] | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          brand?: string | null
          communication_type?: string | null
          contract_id?: string | null
          created_at?: string | null
          direction?: string | null
          energy_type?: string | null
          id?: string
          installation_date?: string | null
          lanes_qty?: number | null
          last_calibration_date?: string | null
          latitude?: number | null
          longitude?: number | null
          model?: string | null
          modem_number?: string | null
          next_calibration_date?: string | null
          serial_number: string
          speed_limit?: number | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          brand?: string | null
          communication_type?: string | null
          contract_id?: string | null
          created_at?: string | null
          direction?: string | null
          energy_type?: string | null
          id?: string
          installation_date?: string | null
          lanes_qty?: number | null
          last_calibration_date?: string | null
          latitude?: number | null
          longitude?: number | null
          model?: string | null
          modem_number?: string | null
          next_calibration_date?: string | null
          serial_number?: string
          speed_limit?: number | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipment_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_records: {
        Row: {
          created_at: string | null
          date: string
          fuel_type: string | null
          id: string
          liters: number
          odometer: number | null
          price_per_liter: number | null
          station: string | null
          total_value: number | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          fuel_type?: string | null
          id?: string
          liters: number
          odometer?: number | null
          price_per_liter?: number | null
          station?: string | null
          total_value?: number | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          fuel_type?: string | null
          id?: string
          liters?: number
          odometer?: number | null
          price_per_liter?: number | null
          station?: string | null
          total_value?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_fuel_records_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_metrics: {
        Row: {
          created_at: string | null
          date: string
          equipment_id: string
          id: string
          total_captures: number | null
          utilization_rate: number | null
          valid_captures: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          equipment_id: string
          id?: string
          total_captures?: number | null
          utilization_rate?: number | null
          valid_captures?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          equipment_id?: string
          id?: string
          total_captures?: number | null
          utilization_rate?: number | null
          valid_captures?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_image_metrics_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_metrics_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      infractions: {
        Row: {
          contract_id: string | null
          created_at: string | null
          datacheck_lane: string | null
          equipment_id: string
          id: string
          image_count: number | null
          month: string | null
          physical_lane: string | null
          year: number | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          datacheck_lane?: string | null
          equipment_id: string
          id?: string
          image_count?: number | null
          month?: string | null
          physical_lane?: string | null
          year?: number | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          datacheck_lane?: string | null
          equipment_id?: string
          id?: string
          image_count?: number | null
          month?: string | null
          physical_lane?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_infractions_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infractions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infractions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure_services: {
        Row: {
          contract_id: string | null
          created_at: string | null
          date: string
          id: string
          municipality: string
          notes: string | null
          serial_number: string
          service_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          municipality: string
          notes?: string | null
          serial_number: string
          service_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          municipality?: string
          notes?: string | null
          serial_number?: string
          service_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_infrastructure_services_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infrastructure_services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      internet_bills: {
        Row: {
          connection_id: string | null
          contract_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          provider: string
          reference_month: string
          status: string | null
          value: number | null
        }
        Insert: {
          connection_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          provider: string
          reference_month: string
          status?: string | null
          value?: number | null
        }
        Update: {
          connection_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          provider?: string
          reference_month?: string
          status?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_internet_bills_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internet_bills_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "internet_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internet_bills_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      internet_connections: {
        Row: {
          client_code: string | null
          contract_id: string | null
          created_at: string | null
          id: string
          provider_id: string | null
          serial_number: string
          updated_at: string | null
        }
        Insert: {
          client_code?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          provider_id?: string | null
          serial_number: string
          updated_at?: string | null
        }
        Update: {
          client_code?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          provider_id?: string | null
          serial_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "internet_connections_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internet_connections_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "internet_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      internet_providers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          component_name: string
          created_at: string | null
          id: string
          location: string | null
          min_quantity: number | null
          quantity: number | null
          sku: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          component_name: string
          created_at?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          quantity?: number | null
          sku?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          component_name?: string
          created_at?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          quantity?: number | null
          sku?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          contract_id: string
          created_at: string | null
          discount: number | null
          due_date: string | null
          id: string
          issue_date: string
          monthly_value: number | null
          notes: string | null
          number: string
          payment_date: string | null
          status: string | null
          value: number
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          issue_date: string
          monthly_value?: number | null
          notes?: string | null
          number: string
          payment_date?: string | null
          status?: string | null
          value: number
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          issue_date?: string
          monthly_value?: number | null
          notes?: string | null
          number?: string
          payment_date?: string | null
          status?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoices_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_columns: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      kanban_subitems: {
        Row: {
          column_id: string
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          column_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          column_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_subitems_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          odometer: number | null
          type: string
          vehicle_id: string
          workshop: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          odometer?: number | null
          type: string
          vehicle_id: string
          workshop?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          odometer?: number | null
          type?: string
          vehicle_id?: string
          workshop?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_maintenance_records_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_records: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string | null
          end_time: string | null
          final_km: number
          id: string
          initial_km: number
          notes: string | null
          start_time: string | null
          team_id: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id?: string | null
          end_time?: string | null
          final_km: number
          id?: string
          initial_km: number
          notes?: string | null
          start_time?: string | null
          team_id?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          end_time?: string | null
          final_km?: number
          id?: string
          initial_km?: number
          notes?: string | null
          start_time?: string | null
          team_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mileage_records_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_mileage_records_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_issues: {
        Row: {
          address: string | null
          assigned_to: string | null
          column_key: string | null
          completed_at: string | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          equipment_id: string | null
          id: string
          priority: string | null
          status: string | null
          team: string | null
          title: string
          type: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          column_key?: string | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          team?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          column_key?: string | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          team?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pending_issues_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pending_issues_employee"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pending_issues_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_issues_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_issues_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_issues_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_issues_history: {
        Row: {
          action: string
          created_at: string
          field_name: string | null
          id: string
          issue_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          action: string
          created_at?: string
          field_name?: string | null
          id?: string
          issue_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          field_name?: string | null
          id?: string
          issue_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_issues_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "pending_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_lines: {
        Row: {
          carrier: string
          chip_id: string | null
          contract_id: string | null
          created_at: string
          equipment_id: string | null
          id: string
          line_number: string
          status: string
          sub_carrier: string | null
          updated_at: string
        }
        Insert: {
          carrier: string
          chip_id?: string | null
          contract_id?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          line_number: string
          status?: string
          sub_carrier?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string
          chip_id?: string | null
          contract_id?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          line_number?: string
          status?: string
          sub_carrier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_lines_chip_id_fkey"
            columns: ["chip_id"]
            isOneToOne: false
            referencedRelation: "chip_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_lines_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_lines_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seal_service_order_items: {
        Row: {
          created_at: string | null
          id: string
          installation_item: string
          seal_id: string
          service_order_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          installation_item: string
          seal_id: string
          service_order_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          installation_item?: string
          seal_id?: string
          service_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seal_service_order_items_seal_id_fkey"
            columns: ["seal_id"]
            isOneToOne: false
            referencedRelation: "seals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seal_service_order_items_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "seal_service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      seal_service_orders: {
        Row: {
          category: string | null
          contract_id: string | null
          created_at: string | null
          equipment_id: string | null
          id: string
          maintenance_description: string | null
          order_number: string
          status: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          contract_id?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_description?: string | null
          order_number: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          contract_id?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_description?: string | null
          order_number?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seal_service_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seal_service_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      seals: {
        Row: {
          created_at: string | null
          equipment_id: string | null
          id: string
          installation_date: string | null
          memo_number: string | null
          notes: string | null
          received_date: string | null
          seal_number: string
          seal_type: string | null
          service_order: string | null
          status: string
          technician_id: string | null
        }
        Insert: {
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          installation_date?: string | null
          memo_number?: string | null
          notes?: string | null
          received_date?: string | null
          seal_number: string
          seal_type?: string | null
          service_order?: string | null
          status?: string
          technician_id?: string | null
        }
        Update: {
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          installation_date?: string | null
          memo_number?: string | null
          notes?: string | null
          received_date?: string | null
          seal_number?: string
          seal_type?: string | null
          service_order?: string | null
          status?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_seals_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_seals_technician"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seals_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seals_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      service_calls: {
        Row: {
          contract_id: string | null
          created_at: string | null
          date: string
          description: string | null
          employee_id: string | null
          equipment_id: string | null
          id: string
          mob_code: string | null
          resolution: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          employee_id?: string | null
          equipment_id?: string | null
          id?: string
          mob_code?: string | null
          resolution?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          employee_id?: string | null
          equipment_id?: string | null
          id?: string
          mob_code?: string | null
          resolution?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_calls_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_service_calls_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_service_calls_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_calls_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_calls_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_calls_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      service_goals: {
        Row: {
          completed_calls: number | null
          contract_id: string
          created_at: string | null
          id: string
          month: string
          percentage: number | null
          target_calls: number | null
        }
        Insert: {
          completed_calls?: number | null
          contract_id: string
          created_at?: string | null
          id?: string
          month: string
          percentage?: number | null
          target_calls?: number | null
        }
        Update: {
          completed_calls?: number | null
          contract_id?: string
          created_at?: string | null
          id?: string
          month?: string
          percentage?: number | null
          target_calls?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_goals_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_goals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_metrics: {
        Row: {
          availability: number | null
          contract_id: string
          created_at: string | null
          id: string
          month: string
          resolution_time: number | null
          response_time: number | null
          target_met: boolean | null
        }
        Insert: {
          availability?: number | null
          contract_id: string
          created_at?: string | null
          id?: string
          month: string
          resolution_time?: number | null
          response_time?: number | null
          target_met?: boolean | null
        }
        Update: {
          availability?: number | null
          contract_id?: string
          created_at?: string | null
          id?: string
          month?: string
          resolution_time?: number | null
          response_time?: number | null
          target_met?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sla_metrics_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_metrics_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          component_id: string
          contract_id: string | null
          created_at: string | null
          id: string
          quantity: number
          updated_at: string | null
        }
        Insert: {
          component_id: string
          contract_id?: string | null
          created_at?: string | null
          id?: string
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          component_id?: string
          contract_id?: string | null
          created_at?: string | null
          id?: string
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_maintenance: {
        Row: {
          centro_custo: string | null
          contract_id: string | null
          created_at: string | null
          destinatario: string | null
          id: string
          nf_number: string | null
          observations: string | null
          om_number: string | null
          remetente: string | null
          return_date: string | null
          return_nf: string | null
          send_date: string
          solicitante: string | null
          status: string | null
          status_nf: string | null
          updated_at: string | null
        }
        Insert: {
          centro_custo?: string | null
          contract_id?: string | null
          created_at?: string | null
          destinatario?: string | null
          id?: string
          nf_number?: string | null
          observations?: string | null
          om_number?: string | null
          remetente?: string | null
          return_date?: string | null
          return_nf?: string | null
          send_date: string
          solicitante?: string | null
          status?: string | null
          status_nf?: string | null
          updated_at?: string | null
        }
        Update: {
          centro_custo?: string | null
          contract_id?: string | null
          created_at?: string | null
          destinatario?: string | null
          id?: string
          nf_number?: string | null
          observations?: string | null
          om_number?: string | null
          remetente?: string | null
          return_date?: string | null
          return_nf?: string | null
          send_date?: string
          solicitante?: string | null
          status?: string | null
          status_nf?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_maintenance_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_maintenance_items: {
        Row: {
          barcode: string | null
          component_id: string
          created_at: string | null
          defect_description: string | null
          equipment_serial: string | null
          field_service_code: string | null
          id: string
          maintenance_id: string
          quantity: number
        }
        Insert: {
          barcode?: string | null
          component_id: string
          created_at?: string | null
          defect_description?: string | null
          equipment_serial?: string | null
          field_service_code?: string | null
          id?: string
          maintenance_id: string
          quantity?: number
        }
        Update: {
          barcode?: string | null
          component_id?: string
          created_at?: string | null
          defect_description?: string | null
          equipment_serial?: string | null
          field_service_code?: string | null
          id?: string
          maintenance_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_maintenance_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_maintenance_items_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "stock_maintenance"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      toll_tags: {
        Row: {
          contract_id: string | null
          created_at: string | null
          id: string
          passage_date: string
          tag_number: string
          toll_plaza: string | null
          value: number
          vehicle_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          passage_date: string
          tag_number: string
          toll_plaza?: string | null
          value: number
          vehicle_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          id?: string
          passage_date?: string
          tag_number?: string
          toll_plaza?: string | null
          value?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_toll_tags_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toll_tags_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toll_tags_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          availability_date: string | null
          brand: string | null
          chassis: string | null
          color: string | null
          contract_id: string | null
          created_at: string | null
          current_km: number | null
          fuel_card: string | null
          fuel_type: string | null
          id: string
          insurance_company: string | null
          insurance_contact: string | null
          model: string | null
          monthly_balance: number | null
          notes: string | null
          ownership: string | null
          plate: string
          renavam: string | null
          rental_company: string | null
          status: Database["public"]["Enums"]["vehicle_status"] | null
          tag_number: string | null
          team: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          availability_date?: string | null
          brand?: string | null
          chassis?: string | null
          color?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_km?: number | null
          fuel_card?: string | null
          fuel_type?: string | null
          id?: string
          insurance_company?: string | null
          insurance_contact?: string | null
          model?: string | null
          monthly_balance?: number | null
          notes?: string | null
          ownership?: string | null
          plate: string
          renavam?: string | null
          rental_company?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          tag_number?: string | null
          team?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          availability_date?: string | null
          brand?: string | null
          chassis?: string | null
          color?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_km?: number | null
          fuel_card?: string | null
          fuel_type?: string | null
          id?: string
          insurance_company?: string | null
          insurance_contact?: string | null
          model?: string | null
          monthly_balance?: number | null
          notes?: string | null
          ownership?: string | null
          plate?: string
          renavam?: string | null
          rental_company?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          tag_number?: string | null
          team?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vehicles_contract"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      contract_status: "active" | "inactive" | "expired" | "pending"
      employee_status: "active" | "inactive" | "vacation" | "terminated"
      equipment_status: "active" | "inactive" | "maintenance" | "decommissioned"
      vehicle_status: "active" | "inactive" | "maintenance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      contract_status: ["active", "inactive", "expired", "pending"],
      employee_status: ["active", "inactive", "vacation", "terminated"],
      equipment_status: ["active", "inactive", "maintenance", "decommissioned"],
      vehicle_status: ["active", "inactive", "maintenance"],
    },
  },
} as const
