import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Car, Route, TrendingUp, Clock } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useTeams } from '@/hooks/useTeams';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, ReferenceLine, ComposedChart } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MileageRecord {
  id: string;
  vehicle_id: string;
  team_id: string | null;
  date: string;
  initial_km: number;
  final_km: number;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  teams?: { id: string; name: string } | null;
}

interface MileageDashboardProps {
  records: MileageRecord[];
}

const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function MileageDashboard({ records }: MileageDashboardProps) {
  const { vehicles } = useVehicles();
  const { teams } = useTeams();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (startDate && new Date(record.date) < new Date(startDate)) return false;
      if (endDate && new Date(record.date) > new Date(endDate)) return false;
      if (selectedVehicle !== 'all' && record.vehicle_id !== selectedVehicle) return false;
      if (selectedTeam !== 'all' && record.team_id !== selectedTeam) return false;
      return true;
    });
  }, [records, startDate, endDate, selectedVehicle, selectedTeam]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const totalKm = filteredRecords.reduce((sum, r) => sum + (r.final_km - r.initial_km), 0);
    const avgKmPerDay = totalRecords > 0 ? totalKm / totalRecords : 0;
    const uniqueVehicles = new Set(filteredRecords.map(r => r.vehicle_id)).size;
    return { totalRecords, totalKm, avgKmPerDay, uniqueVehicles };
  }, [filteredRecords]);

  // Km by vehicle
  const kmByVehicle = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const vehicle = vehicles.find(v => v.id === r.vehicle_id);
      const plate = vehicle?.plate || 'Desconhecido';
      grouped[plate] = (grouped[plate] || 0) + (r.final_km - r.initial_km);
    });
    return Object.entries(grouped)
      .map(([name, km]) => ({ name, km }))
      .sort((a, b) => b.km - a.km)
      .slice(0, 10);
  }, [filteredRecords, vehicles]);

  // Monthly evolution
  const monthlyEvolution = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const month = format(parseISO(r.date), 'MMM/yy', { locale: ptBR });
      grouped[month] = (grouped[month] || 0) + (r.final_km - r.initial_km);
    });
    return Object.entries(grouped).map(([name, km]) => ({ name, km }));
  }, [filteredRecords]);

  // Km by team
  const kmByTeam = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const teamName = r.teams?.name || 'Não atribuído';
      grouped[teamName] = (grouped[teamName] || 0) + (r.final_km - r.initial_km);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
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
            <div className="space-y-2">
              <Label>Equipe</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger><SelectValue placeholder="Todas as equipes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as equipes</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Registros</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Km</p>
                <p className="text-2xl font-bold">{stats.totalKm.toLocaleString('pt-BR')} km</p>
              </div>
              <Route className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média por Registro</p>
                <p className="text-2xl font-bold">{stats.avgKmPerDay.toFixed(1)} km</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Veículos Utilizados</p>
                <p className="text-2xl font-bold">{stats.uniqueVehicles}</p>
              </div>
              <Car className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Km per Vehicle with Goal Line */}
      <Card>
        <CardHeader>
          <CardTitle>Km por Veículo</CardTitle>
          <CardDescription>Quilometragem por veículo com meta de 3.000 km</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={kmByVehicle} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 11 }}
              />
              <YAxis tickFormatter={(v) => `${v.toLocaleString('pt-BR')}`} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')} km`, 'Km']} />
              <ReferenceLine 
                y={3000} 
                stroke="#ef4444" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                label={{ value: 'Meta: 3.000 km', position: 'right', fill: '#ef4444', fontSize: 12 }}
              />
              <Bar 
                dataKey="km" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                label={{ position: 'top', fontSize: 10, formatter: (v: number) => v.toLocaleString('pt-BR') }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Km by Team */}
        <Card>
          <CardHeader>
            <CardTitle>Km por Equipe</CardTitle>
            <CardDescription>Distribuição de km por equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kmByTeam}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name.split(' ')[0]}: ${(value / 1000).toFixed(1)}k`}
                >
                  {kmByTeam.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')} km`, 'Km']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Km by Vehicle Horizontal */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Veículos</CardTitle>
            <CardDescription>Veículos com mais km rodados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kmByVehicle} layout="vertical" margin={{ left: 60, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')} km`, 'Km']} />
                <Bar dataKey="km" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Evolution */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal de Km</CardTitle>
          <CardDescription>Total de quilômetros rodados por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')} km`, 'Km']} />
              <Line type="monotone" dataKey="km" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
