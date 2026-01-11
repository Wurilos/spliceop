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
import { CalendarIcon, TrendingUp, CheckCircle, XCircle, Activity, Clock, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar, Cell } from 'recharts';
import { useSlaMetrics } from '@/hooks/useSlaMetrics';
import { useContracts } from '@/hooks/useContracts';
import { DateRange } from 'react-day-picker';

const GOAL_TARGET = 98;

export function SlaDashboard() {
  const { slaMetrics, isLoading } = useSlaMetrics();
  const { contracts } = useContracts();

  // Filters
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  // Filter data based on selections
  const filteredMetrics = useMemo(() => {
    return slaMetrics.filter(metric => {
      // Contract filter
      if (selectedContract !== 'all' && metric.contract_id !== selectedContract) {
        return false;
      }

      // Date filter
      if (dateRange?.from || dateRange?.to) {
        const metricDate = parseISO(metric.month);
        if (dateRange.from && metricDate < dateRange.from) return false;
        if (dateRange.to && metricDate > dateRange.to) return false;
      }

      return true;
    });
  }, [slaMetrics, selectedContract, dateRange]);

  // Get contract name
  const getContractName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract?.client_name || contractId;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const metricsWithAvailability = filteredMetrics.filter(m => m.availability != null);
    const totalRecords = metricsWithAvailability.length;
    const averageAvailability = totalRecords > 0 
      ? metricsWithAvailability.reduce((sum, m) => sum + (m.availability || 0), 0) / totalRecords 
      : 0;
    const aboveGoal = metricsWithAvailability.filter(m => (m.availability || 0) >= GOAL_TARGET).length;
    const belowGoal = totalRecords - aboveGoal;
    const goalAchievementRate = totalRecords > 0 ? (aboveGoal / totalRecords) * 100 : 0;

    const avgResponseTime = totalRecords > 0
      ? filteredMetrics.filter(m => m.response_time != null).reduce((sum, m) => sum + (m.response_time || 0), 0) / 
        filteredMetrics.filter(m => m.response_time != null).length || 0
      : 0;

    const avgResolutionTime = totalRecords > 0
      ? filteredMetrics.filter(m => m.resolution_time != null).reduce((sum, m) => sum + (m.resolution_time || 0), 0) /
        filteredMetrics.filter(m => m.resolution_time != null).length || 0
      : 0;

    return { totalRecords, averageAvailability, aboveGoal, belowGoal, goalAchievementRate, avgResponseTime, avgResolutionTime };
  }, [filteredMetrics]);

  // Chart data: availability evolution over time
  const availabilityChartData = useMemo(() => {
    const grouped: Record<string, { month: string; availability: number; count: number }> = {};

    filteredMetrics.forEach(metric => {
      if (metric.availability == null) return;
      const monthKey = format(parseISO(metric.month), 'yyyy-MM');
      const label = format(parseISO(metric.month), 'MMM/yy', { locale: ptBR });

      if (!grouped[monthKey]) {
        grouped[monthKey] = { month: label, availability: 0, count: 0 };
      }
      grouped[monthKey].availability += metric.availability;
      grouped[monthKey].count += 1;
    });

    return Object.entries(grouped)
      .map(([key, value]) => ({
        key,
        month: value.month,
        availability: value.count > 0 ? value.availability / value.count : 0,
        meta: GOAL_TARGET,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredMetrics]);

  // Chart data: availability by contract
  const contractChartData = useMemo(() => {
    const grouped: Record<string, { name: string; availability: number; count: number }> = {};

    filteredMetrics.forEach(metric => {
      if (metric.availability == null) return;
      const contractId = metric.contract_id;

      if (!grouped[contractId]) {
        const contract = contracts.find(c => c.id === contractId);
        grouped[contractId] = { 
          name: contract?.client_name || 'Desconhecido', 
          availability: 0, 
          count: 0 
        };
      }
      grouped[contractId].availability += metric.availability;
      grouped[contractId].count += 1;
    });

    return Object.values(grouped)
      .map(value => ({
        name: value.name.length > 15 ? value.name.substring(0, 15) + '...' : value.name,
        availability: value.count > 0 ? value.availability / value.count : 0,
      }))
      .sort((a, b) => b.availability - a.availability)
      .slice(0, 10);
  }, [filteredMetrics, contracts]);

  // Status indicator
  const getAvailabilityStatus = (availability: number) => {
    if (availability >= GOAL_TARGET) return { icon: CheckCircle, color: 'text-green-500', label: 'Meta Atingida' };
    if (availability >= 95) return { icon: Activity, color: 'text-yellow-500', label: 'Próximo da Meta' };
    return { icon: XCircle, color: 'text-red-500', label: 'Abaixo da Meta' };
  };

  const currentStatus = getAvailabilityStatus(stats.averageAvailability);

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
        {/* Average Availability */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponibilidade Média</p>
                <p className="text-3xl font-bold">{stats.averageAvailability.toFixed(2)}%</p>
                <div className={cn("flex items-center gap-1 text-xs mt-1", currentStatus.color)}>
                  <currentStatus.icon className="h-3 w-3" />
                  <span>{currentStatus.label}</span>
                </div>
              </div>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", 
                stats.averageAvailability >= GOAL_TARGET ? "bg-green-100" : "bg-yellow-100"
              )}>
                <Target className={cn("h-5 w-5", 
                  stats.averageAvailability >= GOAL_TARGET ? "text-green-600" : "text-yellow-600"
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
                <p className="text-sm font-medium text-muted-foreground">Meta SLA</p>
                <p className="text-3xl font-bold">{GOAL_TARGET}%</p>
                <p className="text-xs text-muted-foreground">Disponibilidade mínima</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Response Time */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio Resposta</p>
                <p className="text-3xl font-bold">{stats.avgResponseTime.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">{stats.totalRecords} registros</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
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
                  {stats.aboveGoal} de {stats.totalRecords} meses
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
        {/* Availability Evolution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evolução da Disponibilidade</CardTitle>
          </CardHeader>
          <CardContent>
            {availabilityChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={availabilityChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis domain={[90, 100]} className="text-xs" tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)}%`,
                        name === 'availability' ? 'Disponibilidade' : 'Meta'
                      ]}
                    />
                    <Legend 
                      formatter={(value) => value === 'availability' ? 'Disponibilidade' : 'Meta'}
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
                      dataKey="availability"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="availability"
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

        {/* Availability by Contract Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Disponibilidade por Contrato</CardTitle>
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
                    <YAxis domain={[90, 100]} className="text-xs" tickFormatter={(value) => `${value}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Disponibilidade']}
                    />
                    <ReferenceLine 
                      y={GOAL_TARGET} 
                      stroke="hsl(var(--destructive))" 
                      strokeDasharray="5 5"
                    />
                    <Bar dataKey="availability" radius={[4, 4, 0, 0]}>
                      {contractChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.availability >= GOAL_TARGET ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} 
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
