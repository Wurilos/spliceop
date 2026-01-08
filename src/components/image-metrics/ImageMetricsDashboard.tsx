import { useMemo, useState } from 'react';
import { format, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, TrendingUp, CheckCircle, XCircle, Image, Target, Camera } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar, Cell } from 'recharts';
import { useImageMetrics } from '@/hooks/useImageMetrics';
import { useEquipment } from '@/hooks/useEquipment';
import { useContracts } from '@/hooks/useContracts';
import { DateRange } from 'react-day-picker';

const GOAL_TARGET = 94;

export function ImageMetricsDashboard() {
  const { imageMetrics, isLoading } = useImageMetrics();
  const { equipment } = useEquipment();
  const { contracts } = useContracts();

  // Filters
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  // Get equipment's contract
  const getEquipmentContract = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq?.contract_id || null;
  };

  // Filter data based on selections
  const filteredMetrics = useMemo(() => {
    return imageMetrics.filter(metric => {
      // Contract filter (through equipment)
      if (selectedContract !== 'all') {
        const equipmentContract = getEquipmentContract(metric.equipment_id);
        if (equipmentContract !== selectedContract) return false;
      }

      // Date filter
      if (dateRange?.from || dateRange?.to) {
        const metricDate = parseISO(metric.date);
        if (dateRange.from && metricDate < dateRange.from) return false;
        if (dateRange.to && metricDate > dateRange.to) return false;
      }

      return true;
    });
  }, [imageMetrics, selectedContract, dateRange, equipment]);

  // Get contract name
  const getContractName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract ? `${contract.number} - ${contract.client_name}` : contractId;
  };

  // Get equipment serial
  const getEquipmentSerial = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq?.serial_number || equipmentId;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const metricsWithRate = filteredMetrics.filter(m => m.utilization_rate != null);
    const totalRecords = metricsWithRate.length;
    const averageRate = totalRecords > 0 
      ? metricsWithRate.reduce((sum, m) => sum + (m.utilization_rate || 0), 0) / totalRecords 
      : 0;
    const aboveGoal = metricsWithRate.filter(m => (m.utilization_rate || 0) >= GOAL_TARGET).length;
    const belowGoal = totalRecords - aboveGoal;
    const goalAchievementRate = totalRecords > 0 ? (aboveGoal / totalRecords) * 100 : 0;

    const totalCaptures = filteredMetrics.reduce((sum, m) => sum + (m.total_captures || 0), 0);
    const validCaptures = filteredMetrics.reduce((sum, m) => sum + (m.valid_captures || 0), 0);

    return { totalRecords, averageRate, aboveGoal, belowGoal, goalAchievementRate, totalCaptures, validCaptures };
  }, [filteredMetrics]);

  // Chart data: utilization evolution over time
  const utilizationChartData = useMemo(() => {
    const grouped: Record<string, { month: string; rate: number; count: number }> = {};

    filteredMetrics.forEach(metric => {
      if (metric.utilization_rate == null) return;
      const monthKey = format(parseISO(metric.date), 'yyyy-MM');
      const label = format(parseISO(metric.date), 'MMM/yy', { locale: ptBR });

      if (!grouped[monthKey]) {
        grouped[monthKey] = { month: label, rate: 0, count: 0 };
      }
      grouped[monthKey].rate += metric.utilization_rate;
      grouped[monthKey].count += 1;
    });

    return Object.entries(grouped)
      .map(([key, value]) => ({
        key,
        month: value.month,
        rate: value.count > 0 ? value.rate / value.count : 0,
        meta: GOAL_TARGET,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredMetrics]);

  // Chart data: utilization by contract
  const contractChartData = useMemo(() => {
    const grouped: Record<string, { name: string; rate: number; count: number }> = {};

    filteredMetrics.forEach(metric => {
      if (metric.utilization_rate == null) return;
      const contractId = getEquipmentContract(metric.equipment_id);
      if (!contractId) return;

      if (!grouped[contractId]) {
        const contract = contracts.find(c => c.id === contractId);
        grouped[contractId] = { 
          name: contract?.client_name || 'Desconhecido', 
          rate: 0, 
          count: 0 
        };
      }
      grouped[contractId].rate += metric.utilization_rate;
      grouped[contractId].count += 1;
    });

    return Object.values(grouped)
      .map(value => ({
        name: value.name.length > 15 ? value.name.substring(0, 15) + '...' : value.name,
        rate: value.count > 0 ? value.rate / value.count : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
  }, [filteredMetrics, contracts, equipment]);

  // Status indicator
  const getRateStatus = (rate: number) => {
    if (rate >= GOAL_TARGET) return { icon: CheckCircle, color: 'text-green-500', label: 'Meta Atingida' };
    if (rate >= 90) return { icon: Image, color: 'text-yellow-500', label: 'Próximo da Meta' };
    return { icon: XCircle, color: 'text-red-500', label: 'Abaixo da Meta' };
  };

  const currentStatus = getRateStatus(stats.averageRate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contract Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contrato</label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os contratos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os contratos</SelectItem>
                  {contracts.map(contract => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.number} - {contract.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedContract !== 'all' || dateRange) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedContract !== 'all' && (
                <Badge variant="outline">
                  Contrato: {getContractName(selectedContract)}
                </Badge>
              )}
              {dateRange?.from && (
                <Badge variant="outline">
                  Período: {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
                  {dateRange.to && ` - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedContract('all');
                  setDateRange({ from: startOfYear(new Date()), to: endOfYear(new Date()) });
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aproveitamento Médio</p>
                <p className="text-3xl font-bold">{stats.averageRate.toFixed(2)}%</p>
                <div className={cn("flex items-center gap-1 text-xs mt-1", currentStatus.color)}>
                  <currentStatus.icon className="h-3 w-3" />
                  <span>{currentStatus.label}</span>
                </div>
              </div>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", 
                stats.averageRate >= GOAL_TARGET ? "bg-green-100" : "bg-yellow-100"
              )}>
                <Target className={cn("h-5 w-5", 
                  stats.averageRate >= GOAL_TARGET ? "text-green-600" : "text-yellow-600"
                )} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Target */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meta</p>
                <p className="text-3xl font-bold">{GOAL_TARGET}%</p>
                <p className="text-xs text-muted-foreground">Aproveitamento mínimo</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Captures */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Capturas</p>
                <p className="text-3xl font-bold">{stats.totalCaptures.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">{stats.validCaptures.toLocaleString('pt-BR')} válidas</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Camera className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Achievement */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Cumprimento</p>
                <p className="text-3xl font-bold">{stats.goalAchievementRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">
                  {stats.aboveGoal} de {stats.totalRecords} registros
                </p>
              </div>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center",
                stats.goalAchievementRate >= 80 ? "bg-green-100" : "bg-red-100"
              )}>
                {stats.goalAchievementRate >= 80 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Evolution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolução do Aproveitamento</CardTitle>
          </CardHeader>
          <CardContent>
            {utilizationChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={utilizationChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis domain={[80, 100]} className="text-xs" tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)}%`,
                        name === 'rate' ? 'Aproveitamento' : 'Meta'
                      ]}
                    />
                    <Legend 
                      formatter={(value) => value === 'rate' ? 'Aproveitamento' : 'Meta'}
                    />
                    <ReferenceLine 
                      y={GOAL_TARGET} 
                      stroke="hsl(var(--destructive))" 
                      strokeDasharray="5 5"
                      label={{ 
                        value: `Meta: ${GOAL_TARGET}%`, 
                        position: 'right',
                        fill: 'hsl(var(--destructive))',
                        fontSize: 12
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Nenhum dado encontrado para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utilization by Contract Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Aproveitamento por Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            {contractChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contractChartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[80, 100]} className="text-xs" tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Aproveitamento']}
                    />
                    <ReferenceLine 
                      y={GOAL_TARGET} 
                      stroke="hsl(var(--destructive))" 
                      strokeDasharray="5 5"
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {contractChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.rate >= GOAL_TARGET ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Nenhum dado encontrado para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
