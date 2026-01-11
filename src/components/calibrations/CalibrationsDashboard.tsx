import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { ClipboardCheck, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { addDays, isAfter, isBefore, format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Calibration = Tables<'calibrations'> & { 
  equipment?: { 
    serial_number: string; 
    type: string | null; 
    brand: string | null;
    contract_id?: string | null;
  } | null 
};

interface CalibrationsDashboardProps {
  calibrations: Calibration[];
  contracts?: { id: string; number: string; client_name: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  valid: 'hsl(142, 76%, 36%)',
  expired: 'hsl(0, 84%, 60%)',
  pending: 'hsl(38, 92%, 50%)',
};

const CHART_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(0, 84%, 60%)',
  'hsl(38, 92%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(280, 67%, 60%)',
  'hsl(180, 70%, 45%)',
  'hsl(320, 70%, 50%)',
  'hsl(45, 90%, 45%)',
];

export function CalibrationsDashboard({ calibrations, contracts = [] }: CalibrationsDashboardProps) {
  const today = new Date();
  const next30Days = addDays(today, 30);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = calibrations.length;
    const expired = calibrations.filter(c => 
      isBefore(new Date(c.expiration_date), today)
    ).length;
    const expiringNext30Days = calibrations.filter(c => {
      const expDate = new Date(c.expiration_date);
      return isAfter(expDate, today) && isBefore(expDate, next30Days);
    }).length;
    const valid = calibrations.filter(c => 
      c.status === 'valid' && isAfter(new Date(c.expiration_date), today)
    ).length;

    return { total, expired, expiringNext30Days, valid };
  }, [calibrations]);

  // Data for stacked bar chart - Expirations by Contract and Month
  const expirationsByContractMonth = useMemo(() => {
    const monthsData: Record<string, Record<string, number>> = {};
    const contractNames: Set<string> = new Set();
    
    // Generate next 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, 'MMM/yy', { locale: ptBR });
      monthsData[monthKey] = {};
    }

    calibrations.forEach(cal => {
      const expDate = new Date(cal.expiration_date);
      const monthKey = format(expDate, 'MMM/yy', { locale: ptBR });
      
      if (monthsData[monthKey] !== undefined) {
        // Get contract name from equipment's contract
        const contract = contracts.find(c => c.id === cal.equipment?.contract_id);
        const contractName = contract?.client_name || 'Sem Contrato';
        contractNames.add(contractName);
        
        monthsData[monthKey][contractName] = (monthsData[monthKey][contractName] || 0) + 1;
      }
    });

    return {
      data: Object.entries(monthsData).map(([month, contractCounts]) => ({
        month,
        ...contractCounts,
      })),
      contractNames: Array.from(contractNames),
    };
  }, [calibrations, contracts]);

  // Data for horizontal bar chart - Expirations by Contract (next 6 months)
  const expirationsByContract = useMemo(() => {
    const contractCounts: Record<string, number> = {};
    const sixMonthsFromNow = addMonths(today, 6);

    calibrations.forEach(cal => {
      const expDate = new Date(cal.expiration_date);
      if (isAfter(expDate, today) && isBefore(expDate, sixMonthsFromNow)) {
        const contract = contracts.find(c => c.id === cal.equipment?.contract_id);
        const contractName = contract?.client_name || 'Sem Contrato';
        contractCounts[contractName] = (contractCounts[contractName] || 0) + 1;
      }
    });

    return Object.entries(contractCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [calibrations, contracts]);

  // Data for bar chart - Calibrations by Status
  const calibrationsByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {
      'Válida': 0,
      'Vencida': 0,
      'Pendente': 0,
    };

    calibrations.forEach(cal => {
      const expDate = new Date(cal.expiration_date);
      if (isBefore(expDate, today)) {
        statusCounts['Vencida']++;
      } else if (cal.status === 'pending') {
        statusCounts['Pendente']++;
      } else {
        statusCounts['Válida']++;
      }
    });

    return [
      { name: 'Válida', value: statusCounts['Válida'], color: STATUS_COLORS.valid },
      { name: 'Vencida', value: statusCounts['Vencida'], color: STATUS_COLORS.expired },
      { name: 'Pendente', value: statusCounts['Pendente'], color: STATUS_COLORS.pending },
    ].filter(item => item.value > 0);
  }, [calibrations]);

  // Calibrations by equipment type
  const calibrationsByType = useMemo(() => {
    const typeCounts: Record<string, { valid: number; expired: number }> = {};

    calibrations.forEach(cal => {
      const type = cal.equipment?.type || 'Outros';
      if (!typeCounts[type]) {
        typeCounts[type] = { valid: 0, expired: 0 };
      }
      if (isBefore(new Date(cal.expiration_date), today)) {
        typeCounts[type].expired++;
      } else {
        typeCounts[type].valid++;
      }
    });

    return Object.entries(typeCounts).map(([type, counts]) => ({
      type,
      valida: counts.valid,
      vencida: counts.expired,
    }));
  }, [calibrations]);

  const chartConfig = {
    valida: { label: 'Válida', color: 'hsl(142, 76%, 36%)' },
    vencida: { label: 'Vencida', color: 'hsl(0, 84%, 60%)' },
    count: { label: 'Quantidade', color: 'hsl(217, 91%, 60%)' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold" translate="no">Dashboard de Aferições</h2>
        <p className="text-muted-foreground">Análise de vencimentos e status das aferições</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Total de Aferições</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Próximos 30 Dias</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.expiringNext30Days}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" translate="no">Válidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stacked Bar Chart - Expirations by Contract and Month */}
      <Card>
        <CardHeader>
          <CardTitle translate="no">Vencimentos por Contrato e Mês</CardTitle>
          <CardDescription>Quantidade de equipamentos com vencimento de aferição nos próximos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={expirationsByContractMonth.data} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {expirationsByContractMonth.contractNames.map((contractName, idx) => (
                <Bar
                  key={contractName}
                  dataKey={contractName}
                  name={contractName}
                  stackId="a"
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Two Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Horizontal Bar Chart - Expirations by Contract */}
        <Card>
          <CardHeader>
            <CardTitle translate="no">Vencimentos por Contrato</CardTitle>
            <CardDescription>Total de equipamentos a vencer nos próximos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={expirationsByContract} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" name="Quantidade" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Calibrations by Status */}
        <Card>
          <CardHeader>
            <CardTitle translate="no">Aferições por Status</CardTitle>
            <CardDescription>Distribuição por situação</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={calibrationsByStatus} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" name="Quantidade" radius={[4, 4, 0, 0]}>
                  {calibrationsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Calibrations by Equipment Type */}
      <Card>
        <CardHeader>
          <CardTitle translate="no">Aferições por Tipo de Equipamento</CardTitle>
          <CardDescription>Comparação entre aferições válidas e vencidas por tipo</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={calibrationsByType} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="type" fontSize={12} />
              <YAxis fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="valida" name="Válida" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vencida" name="Vencida" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
