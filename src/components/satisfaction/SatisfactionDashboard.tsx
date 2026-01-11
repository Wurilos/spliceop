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
import { CalendarIcon, TrendingUp, TrendingDown, Target, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';
import { useCustomerSatisfaction } from '@/hooks/useCustomerSatisfaction';
import { useContracts } from '@/hooks/useContracts';
import { DateRange } from 'react-day-picker';

const GOAL_TARGET = 98;

export function SatisfactionDashboard() {
  const { satisfactionRecords, isLoading } = useCustomerSatisfaction();
  const { contracts } = useContracts();

  // Filters
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  // Filter data based on selections
  const filteredRecords = useMemo(() => {
    return satisfactionRecords.filter(record => {
      // Contract filter
      if (selectedContract !== 'all' && record.contract_id !== selectedContract) {
        return false;
      }

      // Date filter (based on quarter/year)
      if (dateRange?.from || dateRange?.to) {
        const recordDate = new Date(record.year, getQuarterMonth(record.quarter), 1);
        if (dateRange.from && recordDate < dateRange.from) return false;
        if (dateRange.to && recordDate > dateRange.to) return false;
      }

      return true;
    });
  }, [satisfactionRecords, selectedContract, dateRange]);

  // Helper to get month from quarter
  function getQuarterMonth(quarter: string): number {
    switch (quarter) {
      case 'Q1': return 0;
      case 'Q2': return 3;
      case 'Q3': return 6;
      case 'Q4': return 9;
      default: return 0;
    }
  }

  // Get contract name
  const getContractName = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract?.client_name || contractId;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const recordsWithScore = filteredRecords.filter(r => r.score != null);
    const totalRecords = recordsWithScore.length;
    const averageScore = totalRecords > 0 
      ? recordsWithScore.reduce((sum, r) => sum + (r.score || 0), 0) / totalRecords 
      : 0;
    const aboveGoal = recordsWithScore.filter(r => (r.score || 0) >= GOAL_TARGET).length;
    const belowGoal = totalRecords - aboveGoal;
    const goalAchievementRate = totalRecords > 0 ? (aboveGoal / totalRecords) * 100 : 0;

    return { totalRecords, averageScore, aboveGoal, belowGoal, goalAchievementRate };
  }, [filteredRecords]);

  // Chart data: evolution over time
  const chartData = useMemo(() => {
    const grouped: Record<string, { period: string; score: number; count: number }> = {};

    filteredRecords.forEach(record => {
      if (record.score == null) return;
      const key = `${record.year}-${record.quarter}`;
      const label = `${record.quarter}/${record.year}`;

      if (!grouped[key]) {
        grouped[key] = { period: label, score: 0, count: 0 };
      }
      grouped[key].score += record.score;
      grouped[key].count += 1;
    });

    return Object.entries(grouped)
      .map(([key, value]) => ({
        key,
        period: value.period,
        score: value.count > 0 ? value.score / value.count : 0,
        meta: GOAL_TARGET,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredRecords]);

  // Chart data: contracts by quarter (bar chart)
  const contractsByQuarterData = useMemo(() => {
    // Group by quarter, each contract as a separate entry
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const years = [...new Set(satisfactionRecords.map(r => r.year))].sort();
    
    // Get unique contracts from filtered records
    const contractIds = [...new Set(filteredRecords.map(r => r.contract_id))];
    
    const data: { quarter: string; [key: string]: any }[] = [];
    
    years.forEach(year => {
      quarters.forEach(quarter => {
        const entry: { quarter: string; [key: string]: any } = {
          quarter: `${quarter}/${year}`,
        };
        
        contractIds.forEach(contractId => {
          const record = filteredRecords.find(
            r => r.contract_id === contractId && r.quarter === quarter && r.year === year
          );
          const contractName = contracts.find(c => c.id === contractId)?.client_name || 'Desconhecido';
          entry[contractName] = record?.score ?? null;
        });
        
        // Only add if at least one contract has data
        if (contractIds.some(id => {
          const name = contracts.find(c => c.id === id)?.client_name || 'Desconhecido';
          return entry[name] != null;
        })) {
          data.push(entry);
        }
      });
    });
    
    return { data, contractNames: contractIds.map(id => contracts.find(c => c.id === id)?.client_name || 'Desconhecido') };
  }, [filteredRecords, satisfactionRecords, contracts]);

  // Score status indicator
  const getScoreStatus = (score: number) => {
    if (score >= GOAL_TARGET) return { icon: ThumbsUp, color: 'text-green-500', label: 'Acima da Meta' };
    if (score >= 90) return { icon: Minus, color: 'text-yellow-500', label: 'Próximo da Meta' };
    return { icon: ThumbsDown, color: 'text-red-500', label: 'Abaixo da Meta' };
  };

  const currentStatus = getScoreStatus(stats.averageScore);

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
        {/* Average Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nota Média</p>
                <p className="text-3xl font-bold">{stats.averageScore.toFixed(1)}</p>
                <div className={cn("flex items-center gap-1 text-xs mt-1", currentStatus.color)}>
                  <currentStatus.icon className="h-3 w-3" />
                  <span>{currentStatus.label}</span>
                </div>
              </div>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", 
                stats.averageScore >= GOAL_TARGET ? "bg-green-100" : "bg-yellow-100"
              )}>
                <Target className={cn("h-5 w-5", 
                  stats.averageScore >= GOAL_TARGET ? "text-green-600" : "text-yellow-600"
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
                <p className="text-3xl font-bold">{GOAL_TARGET}</p>
                <p className="text-xs text-muted-foreground">Índice mínimo esperado</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Above Goal */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acima da Meta</p>
                <p className="text-3xl font-bold">{stats.aboveGoal}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.goalAchievementRate.toFixed(0)}% das pesquisas
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Below Goal */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abaixo da Meta</p>
                <p className="text-3xl font-bold">{stats.belowGoal}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRecords > 0 ? ((stats.belowGoal / stats.totalRecords) * 100).toFixed(0) : 0}% das pesquisas
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <ThumbsDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução da Satisfação</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}`,
                      name === 'score' ? 'Nota' : 'Meta'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => value === 'score' ? 'Nota' : 'Meta'}
                  />
                  <ReferenceLine 
                    y={GOAL_TARGET} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Meta: ${GOAL_TARGET}`, 
                      position: 'right',
                      fill: 'hsl(var(--destructive))',
                      fontSize: 12
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="score"
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

      {/* Contracts by Quarter Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Satisfação por Contrato e Trimestre</CardTitle>
        </CardHeader>
        <CardContent>
          {contractsByQuarterData.data.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={contractsByQuarterData.data} 
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="quarter" 
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value?.toFixed(1) ?? '-'}`, 'Nota']}
                  />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <ReferenceLine 
                    y={GOAL_TARGET} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Meta: ${GOAL_TARGET}`, 
                      position: 'right',
                      fill: 'hsl(var(--destructive))',
                      fontSize: 12
                    }}
                  />
                  {contractsByQuarterData.contractNames.map((name, index) => {
                    const colors = [
                      'hsl(var(--primary))',
                      'hsl(var(--chart-2))',
                      'hsl(var(--chart-3))',
                      'hsl(var(--chart-4))',
                      'hsl(var(--chart-5))',
                      '#8884d8',
                      '#82ca9d',
                      '#ffc658',
                      '#ff7300',
                      '#00C49F',
                    ];
                    return (
                      <Bar
                        key={name}
                        dataKey={name}
                        fill={colors[index % colors.length]}
                        name={name}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground">
              Nenhum dado encontrado para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
