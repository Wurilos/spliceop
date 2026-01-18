import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, cacheConfig } from '@/lib/queryKeys';

// Prefetch critical data on app load for faster navigation
export function usePrefetchCriticalData() {
  const queryClient = useQueryClient();

  const prefetchContracts = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.contracts,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      ...cacheConfig.stable,
    });
  }, [queryClient]);

  const prefetchEquipment = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.equipment,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('equipment')
          .select('*, contracts!fk_equipment_contract(number, client_name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      ...cacheConfig.stable,
    });
  }, [queryClient]);

  const prefetchEmployees = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.employees,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('employees')
          .select('*, contracts(number, client_name), teams(name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      ...cacheConfig.stable,
    });
  }, [queryClient]);

  const prefetchVehicles = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.vehicles,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*, contracts(number, client_name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      ...cacheConfig.stable,
    });
  }, [queryClient]);

  // Prefetch all critical data in parallel
  const prefetchAll = useCallback(() => {
    // Use Promise.allSettled to not fail if one fails
    Promise.allSettled([
      prefetchContracts(),
      prefetchEquipment(),
      prefetchEmployees(),
      prefetchVehicles(),
    ]);
  }, [prefetchContracts, prefetchEquipment, prefetchEmployees, prefetchVehicles]);

  return { prefetchAll, prefetchContracts, prefetchEquipment, prefetchEmployees, prefetchVehicles };
}

// Hook to prefetch module data when hovering over menu items
export function useHoverPrefetch() {
  const queryClient = useQueryClient();

  const prefetchModule = useCallback((moduleName: string) => {
    const prefetchMap: Record<string, () => Promise<void>> = {
      contracts: async () => {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.contracts,
          queryFn: async () => {
            const { data } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
            return data;
          },
          ...cacheConfig.stable,
        });
      },
      equipment: async () => {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.equipment,
          queryFn: async () => {
            const { data } = await supabase.from('equipment').select('*, contracts!fk_equipment_contract(number, client_name)').order('created_at', { ascending: false });
            return data;
          },
          ...cacheConfig.stable,
        });
      },
      employees: async () => {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.employees,
          queryFn: async () => {
            const { data } = await supabase.from('employees').select('*, contracts(number, client_name), teams(name)').order('created_at', { ascending: false });
            return data;
          },
          ...cacheConfig.stable,
        });
      },
      vehicles: async () => {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.vehicles,
          queryFn: async () => {
            const { data } = await supabase.from('vehicles').select('*, contracts(number, client_name)').order('created_at', { ascending: false });
            return data;
          },
          ...cacheConfig.stable,
        });
      },
      fuel: async () => {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.fuelRecords,
          queryFn: async () => {
            const { data } = await supabase.from('fuel_records').select('*, vehicles(plate, model)').order('date', { ascending: false });
            return data;
          },
          ...cacheConfig.moderate,
        });
      },
      invoices: async () => {
        await queryClient.prefetchQuery({
          queryKey: queryKeys.invoices,
          queryFn: async () => {
            const { data } = await supabase.from('invoices').select('*, contracts(number, client_name)').order('issue_date', { ascending: false });
            return data;
          },
          ...cacheConfig.moderate,
        });
      },
    };

    const prefetchFn = prefetchMap[moduleName];
    if (prefetchFn) {
      prefetchFn();
    }
  }, [queryClient]);

  return { prefetchModule };
}
