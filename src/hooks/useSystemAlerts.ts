import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SystemAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'contracts' | 'calibrations' | 'invoices' | 'maintenance' | 'inventory' | 'equipment' | 'energy' | 'internet' | 'mileage';
  title: string;
  description: string;
  suggestion: string;
  detectedAt: Date;
  entityId: string;
  entityType: string;
  resolved?: boolean;
  ignored?: boolean;
}

const ALERT_THRESHOLDS = {
  critical: 0,   // Already expired/overdue
  high: 15,      // Within 15 days
  medium: 30,    // Within 30 days
  low: 60,       // Within 60 days
};

const MILEAGE_THRESHOLDS = {
  monthlyLimit: 3000,
  warningLimit: 2000,
};

function getAlertType(daysUntil: number): SystemAlert['type'] {
  if (daysUntil <= ALERT_THRESHOLDS.critical) return 'critical';
  if (daysUntil <= ALERT_THRESHOLDS.high) return 'high';
  if (daysUntil <= ALERT_THRESHOLDS.medium) return 'medium';
  return 'low';
}

function getMileageAlertType(totalKm: number): SystemAlert['type'] {
  if (totalKm >= MILEAGE_THRESHOLDS.monthlyLimit) return 'critical';
  if (totalKm >= MILEAGE_THRESHOLDS.warningLimit + 500) return 'high';
  return 'medium';
}

function formatDate(date: string): string {
  return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR });
}

export function useSystemAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async (): Promise<SystemAlert[]> => {
      const allAlerts: SystemAlert[] = [];
      const today = new Date();
      const detectedAt = new Date();

      // 1. Check expiring contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, number, client_name, end_date, status')
        .eq('status', 'active')
        .not('end_date', 'is', null);

      contracts?.forEach(contract => {
        if (!contract.end_date) return;
        const endDate = parseISO(contract.end_date);
        const daysUntil = differenceInDays(endDate, today);
        
        if (daysUntil <= ALERT_THRESHOLDS.low) {
          allAlerts.push({
            id: `contract-${contract.id}`,
            type: getAlertType(daysUntil),
            category: 'contracts',
            title: daysUntil < 0 ? 'Contrato Vencido' : 'Contrato Próximo do Vencimento',
            description: daysUntil < 0 
              ? `O contrato ${contract.number} - ${contract.client_name} venceu há ${Math.abs(daysUntil)} dias.`
              : `O contrato ${contract.number} - ${contract.client_name} vence em ${daysUntil} dias.`,
            suggestion: daysUntil < 0 
              ? 'Renovar contrato imediatamente ou encerrar formalmente.'
              : 'Iniciar processo de renovação ou negociação.',
            detectedAt,
            entityId: contract.id,
            entityType: 'contracts',
          });
        }
      });

      // 2. Check expiring calibrations
      const { data: calibrations } = await supabase
        .from('calibrations')
        .select('id, equipment_id, expiration_date, certificate_number, equipment:equipment_id!fk_calibrations_equipment(serial_number)')
        .eq('status', 'valid');

      calibrations?.forEach(calibration => {
        if (!calibration.expiration_date) return;
        const expDate = parseISO(calibration.expiration_date);
        const daysUntil = differenceInDays(expDate, today);
        const equipSerial = (calibration.equipment as any)?.serial_number || calibration.equipment_id;
        
        if (daysUntil <= ALERT_THRESHOLDS.low) {
          allAlerts.push({
            id: `calibration-${calibration.id}`,
            type: getAlertType(daysUntil),
            category: 'calibrations',
            title: daysUntil < 0 ? 'Aferição Vencida' : 'Aferição Próxima do Vencimento',
            description: daysUntil < 0 
              ? `A aferição do equipamento ${equipSerial} venceu há ${Math.abs(daysUntil)} dias.`
              : `A aferição do equipamento ${equipSerial} vence em ${daysUntil} dias.`,
            suggestion: daysUntil < 0 
              ? 'Agendar aferição urgente. Equipamento pode estar inválido para uso.'
              : 'Agendar aferição preventiva.',
            detectedAt,
            entityId: calibration.id,
            entityType: 'calibrations',
          });
        }
      });

      // 3. Check overdue invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, number, due_date, value, status, contract:contract_id!fk_invoices_contract(client_name)')
        .eq('status', 'pending')
        .not('due_date', 'is', null);

      invoices?.forEach(invoice => {
        if (!invoice.due_date) return;
        const dueDate = parseISO(invoice.due_date);
        const daysUntil = differenceInDays(dueDate, today);
        const clientName = (invoice.contract as any)?.client_name || 'Cliente';
        
        if (daysUntil <= ALERT_THRESHOLDS.high) {
          allAlerts.push({
            id: `invoice-${invoice.id}`,
            type: getAlertType(daysUntil),
            category: 'invoices',
            title: daysUntil < 0 ? 'Fatura Vencida' : 'Fatura Próxima do Vencimento',
            description: daysUntil < 0 
              ? `A fatura ${invoice.number} de ${clientName} (R$ ${invoice.value?.toLocaleString('pt-BR')}) venceu há ${Math.abs(daysUntil)} dias.`
              : `A fatura ${invoice.number} de ${clientName} vence em ${daysUntil} dias.`,
            suggestion: daysUntil < 0 
              ? 'Entrar em contato com cliente para cobrança.'
              : 'Enviar lembrete de vencimento ao cliente.',
            detectedAt,
            entityId: invoice.id,
            entityType: 'invoices',
          });
        }
      });

      // 4. Check low inventory items
      const { data: inventory } = await supabase
        .from('inventory')
        .select('id, component_name, quantity, min_quantity');

      inventory?.forEach(item => {
        if (item.min_quantity && item.quantity !== null && item.quantity <= item.min_quantity) {
          const ratio = item.quantity / item.min_quantity;
          const alertType = ratio === 0 ? 'critical' : ratio <= 0.5 ? 'high' : 'medium';
          
          allAlerts.push({
            id: `inventory-${item.id}`,
            type: alertType,
            category: 'inventory',
            title: item.quantity === 0 ? 'Estoque Zerado' : 'Estoque Baixo',
            description: item.quantity === 0 
              ? `O item "${item.component_name}" está com estoque zerado.`
              : `O item "${item.component_name}" está com apenas ${item.quantity} unidades (mínimo: ${item.min_quantity}).`,
            suggestion: 'Solicitar reposição de estoque.',
            detectedAt,
            entityId: item.id,
            entityType: 'inventory',
          });
        }
      });

      // 5. Check equipment in maintenance for too long
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id, serial_number, status, updated_at')
        .eq('status', 'maintenance');

      equipment?.forEach(equip => {
        if (!equip.updated_at) return;
        const updateDate = parseISO(equip.updated_at);
        const daysInMaintenance = differenceInDays(today, updateDate);
        
        if (daysInMaintenance >= 7) {
          allAlerts.push({
            id: `equipment-maintenance-${equip.id}`,
            type: daysInMaintenance >= 30 ? 'high' : 'medium',
            category: 'equipment',
            title: 'Equipamento em Manutenção Prolongada',
            description: `O equipamento ${equip.serial_number} está em manutenção há ${daysInMaintenance} dias.`,
            suggestion: 'Verificar status da manutenção e atualizar situação.',
            detectedAt,
            entityId: equip.id,
            entityType: 'equipment',
          });
        }
      });

      // 6. Check overdue energy bills
      const { data: energyBills } = await supabase
        .from('energy_bills')
        .select('id, consumer_unit, due_date, value, reference_month, status')
        .eq('status', 'pending')
        .not('due_date', 'is', null);

      energyBills?.forEach(bill => {
        if (!bill.due_date) return;
        const dueDate = parseISO(bill.due_date);
        const daysUntil = differenceInDays(dueDate, today);
        
        if (daysUntil <= ALERT_THRESHOLDS.high) {
          allAlerts.push({
            id: `energy-${bill.id}`,
            type: getAlertType(daysUntil),
            category: 'energy',
            title: daysUntil < 0 ? 'Conta de Energia Vencida' : 'Conta de Energia a Vencer',
            description: daysUntil < 0 
              ? `A conta de energia da UC ${bill.consumer_unit} (${bill.reference_month}) venceu há ${Math.abs(daysUntil)} dias.`
              : `A conta de energia da UC ${bill.consumer_unit} vence em ${daysUntil} dias.`,
            suggestion: 'Efetuar pagamento para evitar corte de energia.',
            detectedAt,
            entityId: bill.id,
            entityType: 'energy_bills',
          });
        }
      });

      // 7. Check overdue internet bills
      const { data: internetBills } = await supabase
        .from('internet_bills')
        .select('id, provider, due_date, value, reference_month, status')
        .eq('status', 'pending')
        .not('due_date', 'is', null);

      internetBills?.forEach(bill => {
        if (!bill.due_date) return;
        const dueDate = parseISO(bill.due_date);
        const daysUntil = differenceInDays(dueDate, today);
        
        if (daysUntil <= ALERT_THRESHOLDS.high) {
          allAlerts.push({
            id: `internet-${bill.id}`,
            type: getAlertType(daysUntil),
            category: 'internet',
            title: daysUntil < 0 ? 'Conta de Internet Vencida' : 'Conta de Internet a Vencer',
            description: daysUntil < 0 
              ? `A conta de internet ${bill.provider} (${bill.reference_month}) venceu há ${Math.abs(daysUntil)} dias.`
              : `A conta de internet ${bill.provider} vence em ${daysUntil} dias.`,
            suggestion: 'Efetuar pagamento para evitar suspensão do serviço.',
            detectedAt,
            entityId: bill.id,
            entityType: 'internet_bills',
          });
        }
      });

      // 8. Check monthly mileage per vehicle
      const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
      
      const { data: mileageRecords } = await supabase
        .from('mileage_records')
        .select('id, vehicle_id, initial_km, final_km, date, vehicles!fk_mileage_records_vehicle(plate, brand, model)')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      // Group mileage by vehicle
      const vehicleMileage: Record<string, { 
        vehicleId: string; 
        plate: string; 
        brand: string; 
        model: string; 
        totalKm: number; 
        records: string[];
      }> = {};

      mileageRecords?.forEach(record => {
        if (!record.vehicle_id) return;
        const kmRodado = (record.final_km || 0) - (record.initial_km || 0);
        const vehicleInfo = record.vehicles as any;
        
        if (!vehicleMileage[record.vehicle_id]) {
          vehicleMileage[record.vehicle_id] = {
            vehicleId: record.vehicle_id,
            plate: vehicleInfo?.plate || 'N/A',
            brand: vehicleInfo?.brand || '',
            model: vehicleInfo?.model || '',
            totalKm: 0,
            records: [],
          };
        }
        
        vehicleMileage[record.vehicle_id].totalKm += kmRodado;
        vehicleMileage[record.vehicle_id].records.push(record.id);
      });

      // Create alerts for vehicles exceeding 2000 km
      Object.values(vehicleMileage).forEach(vehicle => {
        if (vehicle.totalKm >= MILEAGE_THRESHOLDS.warningLimit) {
          const remaining = MILEAGE_THRESHOLDS.monthlyLimit - vehicle.totalKm;
          const exceeded = vehicle.totalKm >= MILEAGE_THRESHOLDS.monthlyLimit;
          
          allAlerts.push({
            id: `mileage-${vehicle.vehicleId}`,
            type: getMileageAlertType(vehicle.totalKm),
            category: 'mileage',
            title: exceeded ? 'Limite de Km Mensal Excedido' : 'Km Mensal Próximo do Limite',
            description: exceeded 
              ? `O veículo ${vehicle.plate} (${vehicle.brand} ${vehicle.model}) excedeu o limite mensal de ${MILEAGE_THRESHOLDS.monthlyLimit.toLocaleString('pt-BR')} km. Total: ${vehicle.totalKm.toLocaleString('pt-BR')} km.`
              : `O veículo ${vehicle.plate} (${vehicle.brand} ${vehicle.model}) atingiu ${vehicle.totalKm.toLocaleString('pt-BR')} km este mês. Restam ${remaining.toLocaleString('pt-BR')} km do limite mensal.`,
            suggestion: exceeded 
              ? 'Verificar necessidade de uso e avaliar redistribuição de veículos.'
              : 'Monitorar uso do veículo para não exceder o limite mensal.',
            detectedAt,
            entityId: vehicle.vehicleId,
            entityType: 'vehicles',
          });
        }
      });

      // Sort by type priority (critical first, then high, etc.)
      const typePriority = { critical: 0, high: 1, medium: 2, low: 3 };
      allAlerts.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

      return allAlerts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const alertsByCategory = alerts.reduce((acc, alert) => {
    if (!acc[alert.category]) {
      acc[alert.category] = [];
    }
    acc[alert.category].push(alert);
    return acc;
  }, {} as Record<string, SystemAlert[]>);

  const alertCounts = {
    critical: alerts.filter(a => a.type === 'critical').length,
    high: alerts.filter(a => a.type === 'high').length,
    medium: alerts.filter(a => a.type === 'medium').length,
    low: alerts.filter(a => a.type === 'low').length,
    total: alerts.length,
  };

  return {
    alerts,
    alertsByCategory,
    alertCounts,
    isLoading,
    refetch,
  };
}
