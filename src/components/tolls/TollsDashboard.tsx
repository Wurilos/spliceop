import { useState, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Tag, DollarSign, Building2, TrendingUp, Car, FileText, Calendar } from 'lucide-react';
import { useTollTags, TollTag } from '@/hooks/useTollTags';
import { useContracts } from '@/hooks/useContracts';
import { useVehicles } from '@/hooks/useVehicles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function TollsDashboard() {
  const { tollTags } = useTollTags();
  const { contracts } = useContracts();
  const { vehicles } = useVehicles();

  const [showFilters, setShowFilters] = useState(false);
  const [contractFilter, setContractFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const uniqueMonths = useMemo(() => {
    const months = new Set(tollTags.map(t => format(parseISO(t.passage_date), 'yyyy-MM')));
    return Array.from(months).sort().reverse();
  }, [tollTags]);

  const filteredTags = useMemo(() => {
    return tollTags.filter(tag => {
      if (contractFilter !== 'all' && tag.contract_id !== contractFilter) return false;
      if (vehicleFilter !== 'all' && tag.vehicle_id !== vehicleFilter) return false;
      if (monthFilter !== 'all') {
        const tagMonth = format(parseISO(tag.passage_date), 'yyyy-MM');
        if (tagMonth !== monthFilter) return false;
      }
      return true;
    });
  }, [tollTags, contractFilter, vehicleFilter, monthFilter]);

  // Stats
  const totalTags = filteredTags.length;
  const totalValue = filteredTags.reduce((sum, t) => sum + t.value, 0);
  const uniquePlazas = new Set(filteredTags.map(t => t.toll_plaza).filter(Boolean)).size;
  const avgValue = totalTags > 0 ? totalValue / totalTags : 0;

  // Contract with highest spending
  const byContract = useMemo(() => {
    const result: Record<string, { name: string; total: number; count: number }> = {};
    filteredTags.forEach(tag => {
      const contract = contracts.find(c => c.id === tag.contract_id);
      const key = tag.contract_id || 'sem_contrato';
      const name = contract ? `${contract.number} - ${contract.client_name}` : 'Sem Contrato';
      if (!result[key]) result[key] = { name, total: 0, count: 0 };
      result[key].total += tag.value;
      result[key].count++;
    });
    return Object.entries(result).sort((a, b) => b[1].total - a[1].total);
  }, [filteredTags, contracts]);

  // Vehicle with highest spending
  const byVehicle = useMemo(() => {
    const result: Record<string, { plate: string; total: number; count: number }> = {};
    filteredTags.forEach(tag => {
      const vehicle = vehicles.find(v => v.id === tag.vehicle_id);
      const key = tag.vehicle_id;
      if (!result[key]) result[key] = { plate: vehicle?.plate || 'N/A', total: 0, count: 0 };
      result[key].total += tag.value;
      result[key].count++;
    });
    return Object.entries(result).sort((a, b) => b[1].total - a[1].total);
  }, [filteredTags, vehicles]);

  // Top establishments
  const topPlazas = useMemo(() => {
    const result: Record<string, { total: number; count: number }> = {};
    filteredTags.forEach(tag => {
      const plaza = tag.toll_plaza || 'Desconhecido';
      if (!result[plaza]) result[plaza] = { total: 0, count: 0 };
      result[plaza].total += tag.value;
      result[plaza].count++;
    });
    return Object.entries(result).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  }, [filteredTags]);

  // Recent tags (last 5)
  const recentTags = filteredTags.slice(0, 5);

  // Evolution last 30 days
  const evolutionData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, 'dd/MM');
    });

    const dataByDate: Record<string, number> = {};
    last30Days.forEach(d => dataByDate[d] = 0);

    filteredTags.forEach(tag => {
      const date = format(parseISO(tag.passage_date), 'dd/MM');
      if (dataByDate.hasOwnProperty(date)) {
        dataByDate[date]++;
      }
    });

    return last30Days.map(date => ({ date, count: dataByDate[date] }));
  }, [filteredTags]);

  // TAGs by contract chart data
  const contractChartData = useMemo(() => {
    return byContract.slice(0, 6).map(([_, data]) => ({
      name: data.name.length > 15 ? data.name.substring(0, 15) + '...' : data.name,
      count: data.count,
    }));
  }, [byContract]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getContractName = (tag: TollTag) => {
    const contract = contracts.find(c => c.id === tag.contract_id);
    return contract ? `${contract.number} - ${contract.client_name}` : 'Sem Contrato';
  };

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.plate || 'N/A';
  };

  const clearFilters = () => {
    setContractFilter('all');
    setVehicleFilter('all');
    setMonthFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Contrato</label>
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os contratos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os contratos</SelectItem>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.number} - {c.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Veículo</label>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os veículos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os veículos</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mês</label>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {uniqueMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Tag className="h-4 w-4" />
              Total de TAGs
            </div>
            <div className="text-3xl font-bold text-primary">{totalTags}</div>
            <div className="text-xs text-muted-foreground">0 neste mês</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </div>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalValue)}</div>
            <div className="text-xs text-muted-foreground">R$ 0,00 neste mês</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Building2 className="h-4 w-4" />
              Estabelecimentos
            </div>
            <div className="text-3xl font-bold text-blue-600">{uniquePlazas}</div>
            <div className="text-xs text-muted-foreground">Estabelecimentos únicos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <TrendingUp className="h-4 w-4" />
              Valor Médio
            </div>
            <div className="text-3xl font-bold text-purple-600">{formatCurrency(avgValue)}</div>
            <div className="text-xs text-muted-foreground">por TAG</div>
          </CardContent>
        </Card>
      </div>

      {/* Contract and Vehicle with highest spending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <FileText className="h-4 w-4" />
              Contrato com Maior Gasto
            </div>
            {byContract[0] ? (
              <>
                <div className="font-bold text-primary">{byContract[0][1].name}</div>
                <div className="text-sm text-green-600">{formatCurrency(byContract[0][1].total)}</div>
              </>
            ) : (
              <div className="text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Car className="h-4 w-4" />
              Veículo com Maior Gasto
            </div>
            {byVehicle[0] ? (
              <>
                <div className="font-bold text-primary">{byVehicle[0][1].plate}</div>
                <div className="text-sm text-green-600">{formatCurrency(byVehicle[0][1].total)}</div>
              </>
            ) : (
              <div className="text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Establishments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Top Estabelecimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPlazas.map(([plaza, data], idx) => (
              <div key={plaza}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm text-primary font-medium">{plaza}</span>
                  <div className="text-right">
                    <span className="font-semibold">{data.count} TAGs</span>
                    <div className="text-xs text-muted-foreground">{formatCurrency(data.total)}</div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${(data.count / (topPlazas[0]?.[1]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topPlazas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent TAGs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            TAGs Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTags.map((tag) => (
              <div key={tag.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{getVehiclePlate(tag.vehicle_id)}</span>
                    <span className="text-muted-foreground">TAG {tag.tag_number}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{getContractName(tag)}</div>
                  <div className="text-sm text-primary">{tag.toll_plaza}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatCurrency(tag.value)}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(tag.passage_date), 'dd/MM/yy HH:mm')}
                  </div>
                </div>
              </div>
            ))}
            {recentTags.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Evolução das TAGs (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              TAGs por Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
