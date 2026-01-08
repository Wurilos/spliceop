import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter, Car, Route, TrendingUp, Clock } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useEmployees } from '@/hooks/useEmployees';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MileageRecord {
  id: string;
  vehicle_id: string;
  employee_id: string | null;
  date: string;
  initial_km: number;
  final_km: number;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
}

interface MileageDashboardProps {
  records: MileageRecord[];
}

const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function MileageDashboard({ records }: MileageDashboardProps) {
  const { vehicles } = useVehicles();
  const { employees } = useEmployees();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (startDate && new Date(record.date) < new Date(startDate)) return false;
      if (endDate && new Date(record.date) > new Date(endDate)) return false;
      if (selectedVehicle !== 'all' && record.vehicle_id !== selectedVehicle) return false;
      if (selectedEmployee !== 'all' && record.employee_id !== selectedEmployee) return false;
      return true;
    });
  }, [records, startDate, endDate, selectedVehicle, selectedEmployee]);

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

  // Km by employee
  const kmByEmployee = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const employee = employees.find(e => e.id === r.employee_id);
      const name = employee?.full_name || 'Não atribuído';
      grouped[name] = (grouped[name] || 0) + (r.final_km - r.initial_km);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredRecords, employees]);

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
              <Label>Colaborador</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger><SelectValue placeholder="Todos os colaboradores" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os colaboradores</SelectItem>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Km by Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Km por Veículo</CardTitle>
            <CardDescription>Top 10 veículos com mais km rodados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={kmByVehicle} layout="vertical" margin={{ left: 60, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')} km`, 'Km']} />
                <Bar dataKey="km" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Km by Employee */}
        <Card>
          <CardHeader>
            <CardTitle>Km por Colaborador</CardTitle>
            <CardDescription>Distribuição de km por colaborador</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kmByEmployee}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name.split(' ')[0]}: ${(value / 1000).toFixed(1)}k`}
                >
                  {kmByEmployee.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR')} km`, 'Km']} />
                <Legend />
              </PieChart>
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
