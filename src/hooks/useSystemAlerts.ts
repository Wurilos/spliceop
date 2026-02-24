import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
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
  critical: 0,
  high: 15,
  medium: 30,
  low: 60,
};

const MILEAGE_THRESHOLDS = {
  monthlyLimit: 3000,
  warningLimit: 2000,
};

const VALUE_ANOMALY_THRESHOLD = 0.3;

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

function getCurrentReferenceMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

function getPreviousReferenceMonth(): string {
  return format(subMonths(new Date(), 1), 'yyyy-MM');
}

// Safe query wrapper - returns null on error instead of crashing
async function safeQuery<T>(queryFn: () => PromiseLike<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn('[useSystemAlerts] Query error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[useSystemAlerts] Query failed:', err);
    return null;
  }
}

export function useSystemAlerts() {
  const { data: alerts = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['system-alerts'],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnMount: 'always',
    queryFn: async (): Promise<SystemAlert[]> => {
      try {
        const allAlerts: SystemAlert[] = [];
        const today = new Date();
        const detectedAt = new Date();
        const currentMonth = getCurrentReferenceMonth();
        const previousMonth = getPreviousReferenceMonth();
        const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

        // Batch all independent queries using Promise.allSettled
        const [
          contractsResult,
          amendmentsResult,
          calibrationsResult,
          invoicesResult,
          inventoryResult,
          equipMaintenanceResult,
          energyBillsResult,
          internetBillsResult,
          mileageResult,
          allEnergyBillsResult,
          allInternetBillsResult,
          consumerUnitsResult,
          internetConnectionsResult,
          activeEquipmentResult,
          activeContractsResult,
        ] = await Promise.allSettled([
          safeQuery(() => supabase.from('contracts').select('id, number, client_name, end_date, status').eq('status', 'active').not('end_date', 'is', null)),
          safeQuery(() => supabase.from('contract_amendments').select('*').order('amendment_number', { ascending: false })),
          safeQuery(() => supabase.from('calibrations').select('id, equipment_id, expiration_date, certificate_number, equipment:equipment_id!fk_calibrations_equipment(serial_number)').eq('status', 'valid')),
          safeQuery(() => supabase.from('invoices').select('id, number, due_date, value, status, contract:contract_id!fk_invoices_contract(client_name)').eq('status', 'pending').not('due_date', 'is', null)),
          safeQuery(() => supabase.from('inventory').select('id, component_name, quantity, min_quantity')),
          safeQuery(() => supabase.from('equipment').select('id, serial_number, status, updated_at').eq('status', 'maintenance')),
          safeQuery(() => supabase.from('energy_bills').select('id, consumer_unit, due_date, value, reference_month, status').eq('status', 'pending').not('due_date', 'is', null)),
          safeQuery(() => supabase.from('internet_bills').select('id, provider, due_date, value, reference_month, status').eq('status', 'pending').not('due_date', 'is', null)),
          safeQuery(() => supabase.from('mileage_records').select('id, vehicle_id, initial_km, final_km, date, vehicles!fk_mileage_records_vehicle(plate, brand, model)').gte('date', monthStart).lte('date', monthEnd)),
          safeQuery(() => supabase.from('energy_bills').select('id, consumer_unit, value, reference_month, contract_id').order('reference_month', { ascending: false })),
          safeQuery(() => supabase.from('internet_bills').select('id, provider, value, reference_month, connection_id').order('reference_month', { ascending: false })),
          safeQuery(() => supabase.from('energy_consumer_units').select('id, consumer_unit, contract_id, contracts:contract_id!fk_energy_consumer_units_contract(number, client_name)')),
          safeQuery(() => supabase.from('internet_connections').select('id, serial_number, contract_id, provider_id, providers:provider_id(name), contracts:contract_id(number, client_name)')),
          safeQuery(() => supabase.from('equipment').select('id, serial_number, contract_id, next_calibration_date, contracts:contract_id!fk_equipment_contract(number, client_name)').eq('status', 'active')),
          safeQuery(() => supabase.from('contracts').select('id, number, client_name').eq('status', 'active')),
        ]);

        // Extract values safely
        const getValue = <T,>(result: PromiseSettledResult<T | null>): T | null =>
          result.status === 'fulfilled' ? result.value : null;

        const contracts = getValue(contractsResult) as any[] | null;
        const contractAmendments = getValue(amendmentsResult) as any[] | null;
        const calibrations = getValue(calibrationsResult) as any[] | null;
        const invoices = getValue(invoicesResult) as any[] | null;
        const inventory = getValue(inventoryResult) as any[] | null;
        const equipmentMaintenance = getValue(equipMaintenanceResult) as any[] | null;
        const energyBills = getValue(energyBillsResult) as any[] | null;
        const internetBills = getValue(internetBillsResult) as any[] | null;
        const mileageRecords = getValue(mileageResult) as any[] | null;
        const allEnergyBills = getValue(allEnergyBillsResult) as any[] | null;
        const allInternetBills = getValue(allInternetBillsResult) as any[] | null;
        const consumerUnits = getValue(consumerUnitsResult) as any[] | null;
        const internetConnections = getValue(internetConnectionsResult) as any[] | null;
        const activeEquipment = getValue(activeEquipmentResult) as any[] | null;
        const activeContracts = getValue(activeContractsResult) as any[] | null;

        // Helper functions for contracts
        const getEffectiveEndDate = (contractId: string, originalEndDate: string | null): string | null => {
          const amendments = contractAmendments?.filter(a => a.contract_id === contractId) || [];
          if (amendments.length === 0) return originalEndDate;
          const latest = amendments.reduce((prev: any, curr: any) =>
            curr.amendment_number > prev.amendment_number ? curr : prev
          );
          return latest.end_date || originalEndDate;
        };

        const getContractAmendments = (contractId: string) =>
          contractAmendments?.filter(a => a.contract_id === contractId) || [];

        // 1. Expiring contracts
        try {
          contracts?.forEach(contract => {
            const effectiveEndDate = getEffectiveEndDate(contract.id, contract.end_date);
            if (!effectiveEndDate) return;
            const endDate = parseISO(effectiveEndDate);
            const daysUntil = differenceInDays(endDate, today);
            const amendments = getContractAmendments(contract.id);
            const hasAmendment = amendments.length > 0;

            if (daysUntil <= ALERT_THRESHOLDS.low) {
              const amendmentInfo = hasAmendment ? ` (${amendments.length} aditivo${amendments.length > 1 ? 's' : ''})` : '';
              allAlerts.push({
                id: `contract-${contract.id}`,
                type: getAlertType(daysUntil),
                category: 'contracts',
                title: daysUntil < 0 ? 'Contrato Vencido' : 'Contrato Próximo do Vencimento',
                description: daysUntil < 0
                  ? `O contrato ${contract.number} - ${contract.client_name}${amendmentInfo} venceu há ${Math.abs(daysUntil)} dias.`
                  : `O contrato ${contract.number} - ${contract.client_name}${amendmentInfo} vence em ${daysUntil} dias.`,
                suggestion: daysUntil < 0
                  ? hasAmendment ? 'Renovar contrato com novo aditivo ou encerrar formalmente.' : 'Renovar contrato imediatamente ou encerrar formalmente.'
                  : hasAmendment ? 'Iniciar processo de renovação ou novo aditivo.' : 'Iniciar processo de renovação ou negociação.',
                detectedAt,
                entityId: contract.id,
                entityType: 'contracts',
              });
            }
          });
        } catch (e) { console.warn('[useSystemAlerts] Error processing contracts:', e); }

        // Amendment expiration alerts
        try {
          if (contractAmendments && contractAmendments.length > 0) {
            const amendmentsByContract = new Map<string, any[]>();
            contractAmendments.forEach(amendment => {
              if (!amendmentsByContract.has(amendment.contract_id)) {
                amendmentsByContract.set(amendment.contract_id, []);
              }
              amendmentsByContract.get(amendment.contract_id)!.push(amendment);
            });

            for (const [contractId, amendments] of amendmentsByContract) {
              const contract = contracts?.find(c => c.id === contractId);
              if (!contract) continue;
              const latestAmendment = amendments.reduce((prev: any, curr: any) =>
                curr.amendment_number > prev.amendment_number ? curr : prev
              );
              if (!latestAmendment.end_date) continue;
              const endDate = parseISO(latestAmendment.end_date);
              const daysUntil = differenceInDays(endDate, today);
              if (daysUntil > 0 && daysUntil <= 90) {
                const hasContractAlert = allAlerts.some(a => a.id === `contract-${contractId}`);
                if (!hasContractAlert) {
                  allAlerts.push({
                    id: `amendment-${latestAmendment.id}`,
                    type: daysUntil <= 30 ? 'high' : 'medium',
                    category: 'contracts',
                    title: 'Aditivo de Contrato Próximo do Vencimento',
                    description: `O aditivo #${latestAmendment.amendment_number} do contrato ${contract.number} - ${contract.client_name} vence em ${daysUntil} dias.`,
                    suggestion: 'Iniciar processo de renovação ou negociação de novo aditivo.',
                    detectedAt,
                    entityId: contractId,
                    entityType: 'contracts',
                  });
                }
              }
            }
          }
        } catch (e) { console.warn('[useSystemAlerts] Error processing amendments:', e); }

        // 2. Expiring calibrations
        try {
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
        } catch (e) { console.warn('[useSystemAlerts] Error processing calibrations:', e); }

        // 3. Overdue invoices
        try {
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
        } catch (e) { console.warn('[useSystemAlerts] Error processing invoices:', e); }

        // 4. Low inventory
        try {
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
        } catch (e) { console.warn('[useSystemAlerts] Error processing inventory:', e); }

        // 5. Equipment in maintenance too long
        try {
          equipmentMaintenance?.forEach(equip => {
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
        } catch (e) { console.warn('[useSystemAlerts] Error processing equipment maintenance:', e); }

        // 6. Overdue energy bills
        try {
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
        } catch (e) { console.warn('[useSystemAlerts] Error processing energy bills:', e); }

        // 7. Overdue internet bills
        try {
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
        } catch (e) { console.warn('[useSystemAlerts] Error processing internet bills:', e); }

        // 8. Monthly mileage
        try {
          const vehicleMileage: Record<string, { vehicleId: string; plate: string; brand: string; model: string; totalKm: number; records: string[] }> = {};
          mileageRecords?.forEach(record => {
            if (!record.vehicle_id) return;
            const kmRodado = (record.final_km || 0) - (record.initial_km || 0);
            const vehicleInfo = record.vehicles as any;
            if (!vehicleMileage[record.vehicle_id]) {
              vehicleMileage[record.vehicle_id] = { vehicleId: record.vehicle_id, plate: vehicleInfo?.plate || 'N/A', brand: vehicleInfo?.brand || '', model: vehicleInfo?.model || '', totalKm: 0, records: [] };
            }
            vehicleMileage[record.vehicle_id].totalKm += kmRodado;
            vehicleMileage[record.vehicle_id].records.push(record.id);
          });

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
        } catch (e) { console.warn('[useSystemAlerts] Error processing mileage:', e); }

        // 9. Energy bill value anomalies
        try {
          if (allEnergyBills && allEnergyBills.length > 0) {
            const billsByUnit: Record<string, { values: number[]; bills: any[] }> = {};
            allEnergyBills.forEach(bill => {
              if (!bill.consumer_unit || bill.value === null) return;
              if (!billsByUnit[bill.consumer_unit]) billsByUnit[bill.consumer_unit] = { values: [], bills: [] };
              billsByUnit[bill.consumer_unit].values.push(bill.value);
              billsByUnit[bill.consumer_unit].bills.push(bill);
            });

            Object.entries(billsByUnit).forEach(([consumerUnit, data]) => {
              if (data.values.length < 3) return;
              const recentBill = data.bills[0];
              const historicalValues = data.values.slice(1);
              const average = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
              if (recentBill.value !== null && average > 0) {
                const deviation = Math.abs(recentBill.value - average) / average;
                if (deviation > VALUE_ANOMALY_THRESHOLD) {
                  const isHigher = recentBill.value > average;
                  const percentChange = Math.round(deviation * 100);
                  allAlerts.push({
                    id: `energy-anomaly-${recentBill.id}`,
                    type: deviation > 0.5 ? 'high' : 'medium',
                    category: 'energy',
                    title: isHigher ? 'Conta de Energia Acima da Média' : 'Conta de Energia Abaixo da Média',
                    description: `A UC ${consumerUnit} (${recentBill.reference_month}) teve valor de R$ ${recentBill.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, ${percentChange}% ${isHigher ? 'acima' : 'abaixo'} da média histórica (R$ ${average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
                    suggestion: isHigher
                      ? 'Verificar possíveis causas: aumento de consumo, vazamento, furto de energia ou erro de leitura.'
                      : 'Verificar se houve redução de operação, desligamento de equipamentos ou possível erro de leitura.',
                    detectedAt,
                    entityId: recentBill.id,
                    entityType: 'energy_bills',
                  });
                }
              }
            });
          }
        } catch (e) { console.warn('[useSystemAlerts] Error processing energy anomalies:', e); }

        // 10. Internet bill value anomalies
        try {
          if (allInternetBills && allInternetBills.length > 0) {
            const billsByConnection: Record<string, { values: number[]; bills: any[]; provider: string }> = {};
            allInternetBills.forEach(bill => {
              const key = bill.connection_id || bill.provider;
              if (!key || bill.value === null) return;
              if (!billsByConnection[key]) billsByConnection[key] = { values: [], bills: [], provider: bill.provider };
              billsByConnection[key].values.push(bill.value);
              billsByConnection[key].bills.push(bill);
            });

            Object.entries(billsByConnection).forEach(([connectionKey, data]) => {
              if (data.values.length < 3) return;
              const recentBill = data.bills[0];
              const historicalValues = data.values.slice(1);
              const average = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
              if (recentBill.value !== null && average > 0) {
                const deviation = Math.abs(recentBill.value - average) / average;
                if (deviation > VALUE_ANOMALY_THRESHOLD) {
                  const isHigher = recentBill.value > average;
                  const percentChange = Math.round(deviation * 100);
                  allAlerts.push({
                    id: `internet-anomaly-${recentBill.id}`,
                    type: deviation > 0.5 ? 'high' : 'medium',
                    category: 'internet',
                    title: isHigher ? 'Conta de Internet Acima da Média' : 'Conta de Internet Abaixo da Média',
                    description: `A conta ${data.provider} (${recentBill.reference_month}) teve valor de R$ ${recentBill.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, ${percentChange}% ${isHigher ? 'acima' : 'abaixo'} da média histórica (R$ ${average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
                    suggestion: isHigher
                      ? 'Verificar se houve mudança de plano, cobrança adicional ou erro na fatura.'
                      : 'Verificar se há créditos aplicados ou possível erro de faturamento.',
                    detectedAt,
                    entityId: recentBill.id,
                    entityType: 'internet_bills',
                  });
                }
              }
            });
          }
        } catch (e) { console.warn('[useSystemAlerts] Error processing internet anomalies:', e); }

        // 11. Missing energy bills
        try {
          if (consumerUnits && consumerUnits.length > 0) {
            const recentEnergyBills = await safeQuery(() =>
              supabase.from('energy_bills').select('consumer_unit, reference_month').in('reference_month', [currentMonth, previousMonth])
            );
            const billsByUnit = new Set(
              (recentEnergyBills as any[])?.map(b => `${b.consumer_unit}-${b.reference_month}`) || []
            );

            consumerUnits.forEach(unit => {
              const hasPreviousMonth = billsByUnit.has(`${unit.consumer_unit}-${previousMonth}`);
              const hasCurrentMonth = billsByUnit.has(`${unit.consumer_unit}-${currentMonth}`);
              const contractInfo = unit.contracts as any;

              if (!hasPreviousMonth) {
                allAlerts.push({
                  id: `missing-energy-prev-${unit.id}`, type: 'high', category: 'energy',
                  title: 'Fatura de Energia Não Lançada',
                  description: `A UC ${unit.consumer_unit}${contractInfo ? ` (${contractInfo.number} - ${contractInfo.client_name})` : ''} não possui fatura lançada para ${previousMonth}.`,
                  suggestion: 'Verificar se a fatura foi recebida e lançar no sistema.',
                  detectedAt, entityId: unit.id, entityType: 'energy_consumer_units',
                });
              }
              if (!hasCurrentMonth && today.getDate() > 10) {
                allAlerts.push({
                  id: `missing-energy-curr-${unit.id}`, type: 'medium', category: 'energy',
                  title: 'Fatura de Energia Pendente',
                  description: `A UC ${unit.consumer_unit}${contractInfo ? ` (${contractInfo.number} - ${contractInfo.client_name})` : ''} ainda não possui fatura para ${currentMonth}.`,
                  suggestion: 'Verificar se a fatura já chegou e lançar quando disponível.',
                  detectedAt, entityId: unit.id, entityType: 'energy_consumer_units',
                });
              }
            });
          }
        } catch (e) { console.warn('[useSystemAlerts] Error processing missing energy bills:', e); }

        // 12. Missing internet bills
        try {
          if (internetConnections && internetConnections.length > 0) {
            const recentInternetBills = await safeQuery(() =>
              supabase.from('internet_bills').select('connection_id, reference_month').in('reference_month', [currentMonth, previousMonth])
            );
            const billsByConnection = new Set(
              (recentInternetBills as any[])?.map(b => `${b.connection_id}-${b.reference_month}`) || []
            );

            internetConnections.forEach(conn => {
              const hasPreviousMonth = billsByConnection.has(`${conn.id}-${previousMonth}`);
              const hasCurrentMonth = billsByConnection.has(`${conn.id}-${currentMonth}`);
              const providerInfo = conn.providers as any;
              const contractInfo = conn.contracts as any;

              if (!hasPreviousMonth) {
                allAlerts.push({
                  id: `missing-internet-prev-${conn.id}`, type: 'high', category: 'internet',
                  title: 'Fatura de Internet Não Lançada',
                  description: `A conexão ${conn.serial_number}${providerInfo ? ` (${providerInfo.name})` : ''}${contractInfo ? ` - ${contractInfo.client_name}` : ''} não possui fatura lançada para ${previousMonth}.`,
                  suggestion: 'Verificar se a fatura foi recebida e lançar no sistema.',
                  detectedAt, entityId: conn.id, entityType: 'internet_connections',
                });
              }
              if (!hasCurrentMonth && today.getDate() > 10) {
                allAlerts.push({
                  id: `missing-internet-curr-${conn.id}`, type: 'medium', category: 'internet',
                  title: 'Fatura de Internet Pendente',
                  description: `A conexão ${conn.serial_number}${providerInfo ? ` (${providerInfo.name})` : ''}${contractInfo ? ` - ${contractInfo.client_name}` : ''} ainda não possui fatura para ${currentMonth}.`,
                  suggestion: 'Verificar se a fatura já chegou e lançar quando disponível.',
                  detectedAt, entityId: conn.id, entityType: 'internet_connections',
                });
              }
            });
          }
        } catch (e) { console.warn('[useSystemAlerts] Error processing missing internet bills:', e); }

        // 13. Equipment without valid calibration
        try {
          if (activeEquipment) {
            const validCalibrations = await safeQuery(() =>
              supabase.from('calibrations').select('equipment_id').eq('status', 'valid')
            );
            const equipmentWithCalibration = new Set((validCalibrations as any[])?.map(c => c.equipment_id) || []);

            activeEquipment.forEach(equip => {
              if (!equipmentWithCalibration.has(equip.id)) {
                const contractInfo = equip.contracts as any;
                allAlerts.push({
                  id: `no-calibration-${equip.id}`, type: 'high', category: 'calibrations',
                  title: 'Equipamento Sem Aferição Válida',
                  description: `O equipamento ${equip.serial_number}${contractInfo ? ` (${contractInfo.number} - ${contractInfo.client_name})` : ''} não possui aferição válida cadastrada.`,
                  suggestion: 'Cadastrar a aferição vigente ou verificar status do equipamento.',
                  detectedAt, entityId: equip.id, entityType: 'equipment',
                });
              }
            });
          }
        } catch (e) { console.warn('[useSystemAlerts] Error processing equipment calibrations:', e); }

        // 14. Contracts without recent invoices
        try {
          if (activeContracts && activeContracts.length > 0) {
            const recentInvoices = await safeQuery(() =>
              supabase.from('invoices').select('contract_id, issue_date').gte('issue_date', format(subMonths(today, 2), 'yyyy-MM-dd'))
            );
            const contractsWithInvoice = new Set((recentInvoices as any[])?.map(i => i.contract_id) || []);

            activeContracts.forEach(contract => {
              if (!contractsWithInvoice.has(contract.id)) {
                allAlerts.push({
                  id: `no-invoice-${contract.id}`, type: 'medium', category: 'invoices',
                  title: 'Contrato Sem Faturamento Recente',
                  description: `O contrato ${contract.number} - ${contract.client_name} não possui fatura emitida nos últimos 2 meses.`,
                  suggestion: 'Verificar se há pendência de faturamento ou se o contrato está pausado.',
                  detectedAt, entityId: contract.id, entityType: 'contracts',
                });
              }
            });
          }
        } catch (e) { console.warn('[useSystemAlerts] Error processing contract invoices:', e); }

        // Sort by priority
        const typePriority = { critical: 0, high: 1, medium: 2, low: 3 };
        allAlerts.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

        return allAlerts;
      } catch (error) {
        console.error('[useSystemAlerts] Critical error:', error);
        return [];
      }
    },
  });

  const alertsByCategory = alerts.reduce((acc, alert) => {
    if (!acc[alert.category]) acc[alert.category] = [];
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

  return { alerts, alertsByCategory, alertCounts, isLoading, isFetching, refetch };
}
