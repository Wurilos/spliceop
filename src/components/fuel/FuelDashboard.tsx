import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Filter, Fuel, DollarSign, Droplets, TrendingUp, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useContracts } from '@/hooks/useContracts';
import { useVehicles } from '@/hooks/useVehicles';
import { useDashboardCrossFilter } from '@/hooks/useDashboardCrossFilter';
import { ActiveFilterBadge } from '@/components/shared/ActiveFilterBadge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FuelRecord = Tables<'fuel_records'> & { vehicles?: { plate: string; brand: string | null; model: string | null; contract_id: string | null } | null };

interface FuelDashboardProps {
  records: FuelRecord[];
}

const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function FuelDashboard({ records }: FuelDashboardProps) {
  const { contracts } = useContracts();
  const { vehicles } = useVehicles();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedContract, setSelectedContract] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const { activeFilter, setFilter, clearFilter, getFilterStyles } = useDashboardCrossFilter();

  // First apply date and dropdown filters
  const preFilteredRecords = useMemo(() => {
    return records.filter(record => {
      if (startDate && new Date(record.date) < new Date(startDate)) return false;
      if (endDate && new Date(record.date) > new Date(endDate)) return false;
      if (selectedContract !== 'all' && record.vehicles?.contract_id !== selectedContract) return false;
      if (selectedVehicle !== 'all' && record.vehicle_id !== selectedVehicle) return false;
      return true;
    });
  }, [records, startDate, endDate, selectedContract, selectedVehicle]);

  // Then apply cross-filter
  const filteredRecords = useMemo(() => {
    if (!activeFilter) return preFilteredRecords;
    
    return preFilteredRecords.filter(record => {
      switch (activeFilter.field) {
        case 'fuel_type':
          return (record.fuel_type || 'Não especificado') === activeFilter.value;
        case 'vehicle':
          return (record.vehicles?.plate || 'Desconhecido') === activeFilter.value;
        default:
          return true;
      }
    });
  }, [preFilteredRecords, activeFilter]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const totalLiters = filteredRecords.reduce((sum, r) => sum + (r.liters || 0), 0);
    const totalValue = filteredRecords.reduce((sum, r) => sum + (r.total_value || 0), 0);
    const avgPricePerLiter = totalLiters > 0 ? totalValue / totalLiters : 0;
    return { totalRecords, totalLiters, totalValue, avgPricePerLiter };
  }, [filteredRecords]);

  // Fuel type distribution (pie chart) - from pre-filtered for clicking
  const fuelTypeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    preFilteredRecords.forEach(r => {
      const type = r.fuel_type || 'Não especificado';
      grouped[type] = (grouped[type] || 0) + (r.liters || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [preFilteredRecords]);

  // Top consuming vehicles - from pre-filtered for clicking
  const vehicleConsumptionData = useMemo(() => {
    const grouped: Record<string, { plate: string; liters: number }> = {};
    preFilteredRecords.forEach(r => {
      const plate = r.vehicles?.plate || 'Desconhecido';
      if (!grouped[plate]) grouped[plate] = { plate, liters: 0 };
      grouped[plate].liters += r.liters || 0;
    });
    return Object.values(grouped)
      .sort((a, b) => b.liters - a.liters)
      .slice(0, 6)
      .map(v => ({ name: v.plate, litros: Number(v.liters.toFixed(2)) }));
  }, [preFilteredRecords]);

  // Monthly spending evolution - from filtered data
  const monthlySpendingData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const month = format(parseISO(r.date), 'MMM/yy', { locale: ptBR });
      grouped[month] = (grouped[month] || 0) + (r.total_value || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, valor: Number(value.toFixed(2)) }));
  }, [filteredRecords]);

  // Station ranking by fuel type - from filtered data
  const stationRankingByFuelType = useMemo(() => {
    const byFuelType: Record<string, Record<string, { total: number; liters: number }>> = {};
    
    filteredRecords.forEach(r => {
      const fuelType = r.fuel_type || 'Outro';
      const station = r.station || 'Não informado';
      if (!byFuelType[fuelType]) byFuelType[fuelType] = {};
      if (!byFuelType[fuelType][station]) byFuelType[fuelType][station] = { total: 0, liters: 0 };
      byFuelType[fuelType][station].total += r.total_value || 0;
      byFuelType[fuelType][station].liters += r.liters || 0;
    });

    const result: Record<string, { name: string; valor: number }[]> = {};
    Object.entries(byFuelType).forEach(([fuelType, stations]) => {
      result[fuelType] = Object.entries(stations)
        .map(([name, data]) => ({ name, valor: data.total }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);
    });
    return result;
  }, [filteredRecords]);

  const fuelTypes = Object.keys(stationRankingByFuelType);

  // Click handlers
  const handleFuelTypeClick = (data: { name: string }) => {
    setFilter('fuel_type', data.name, data.name);
  };

  const handleVehicleClick = (data: { name: string }) => {
    setFilter('vehicle', data.name, data.name);
  };

  const clearAllFilters = () => {
    clearFilter();
    setStartDate('');
    setEndDate('');
    setSelectedContract('all');
    setSelectedVehicle('all');
  };

  const hasAnyFilter = activeFilter || startDate || endDate || selectedContract !== 'all' || selectedVehicle !== 'all';

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contrato</Label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger><SelectValue placeholder="Todos os contratos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os contratos</SelectItem>
                  {contracts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.number} - {c.client_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Veículo</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger><SelectValue placeholder="Todos os veículos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os veículos</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Cross Filter Badge */}
      <ActiveFilterBadge filter={activeFilter} onClear={clearFilter} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Registros</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <Fuel className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Litros</p>
                <p className="text-2xl font-bold">{stats.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}L</p>
              </div>
              <Droplets className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Gasto</p>
                <p className="text-2xl font-bold">R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preço Médio por Litro</p>
                <p className="text-2xl font-bold">R$ {stats.avgPricePerLiter.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Station Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Postos Mais Caros por Tipo de Combustível</CardTitle>
          <CardDescription>Top 5 postos com maiores gastos por combustível</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fuelTypes.slice(0, 2).map((fuelType, idx) => (
              <div key={fuelType}>
                <h4 className="font-semibold text-center mb-4" style={{ color: COLORS[idx] }}>{fuelType}</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stationRankingByFuelType[fuelType]} layout="vertical" margin={{ left: 80, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                    <Bar dataKey="valor" fill={COLORS[idx]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fuel Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Combustível Mais Utilizado
              <span className="text-xs font-normal text-muted-foreground">(clique para filtrar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={fuelTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}L`}
                  onClick={handleFuelTypeClick}
                  style={{ cursor: 'pointer' }}
                >
                  {fuelTypeData.map((entry, index) => {
                    const styles = getFilterStyles('fuel_type', entry.name);
                    return (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={styles} />
                    );
                  })}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')}L`, 'Litros']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Consuming Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Veículos que Mais Consomem
              <span className="text-xs font-normal text-muted-foreground">(clique para filtrar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={vehicleConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}L`} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')}L`, 'Litros']} />
                <Bar 
                  dataKey="litros" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]}
                  onClick={handleVehicleClick}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Evolution */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Gastos Mensais</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySpendingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
              <Line type="monotone" dataKey="valor" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
