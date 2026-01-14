import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useDashboardCrossFilter } from '@/hooks/useDashboardCrossFilter';
import { ActiveFilterBadge } from '@/components/shared/ActiveFilterBadge';

interface Vehicle {
  id: string;
  model: string | null;
  fuel_type: string | null;
  ownership: string | null;
  status: string | null;
}

interface VehiclesDashboardProps {
  vehicles: Vehicle[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case 'active': return 'Em Uso';
    case 'inactive': return 'Inativo';
    case 'maintenance': return 'Manutenção';
    default: return status || 'Não definido';
  }
};

const getOwnershipLabel = (ownership: string | null) => {
  return ownership || 'Não definido';
};

export function VehiclesDashboard({ vehicles }: VehiclesDashboardProps) {
  const { activeFilter, setFilter, clearFilter, getFilterStyles } = useDashboardCrossFilter();

  // Apply cross-filter
  const filteredVehicles = useMemo(() => {
    if (!activeFilter) return vehicles;
    
    return vehicles.filter((v) => {
      switch (activeFilter.field) {
        case 'model':
          return (v.model || 'Não definido') === activeFilter.value;
        case 'fuel_type':
          return (v.fuel_type || 'Não definido') === activeFilter.value;
        case 'ownership':
          return getOwnershipLabel(v.ownership) === activeFilter.value;
        case 'status':
          return getStatusLabel(v.status) === activeFilter.value;
        default:
          return true;
      }
    });
  }, [vehicles, activeFilter]);

  const stats = useMemo(() => {
    // Use full data for clickable charts
    const byModel: Record<string, number> = {};
    const byFuelType: Record<string, number> = {};
    const byOwnership: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    vehicles.forEach((v) => {
      const model = v.model || 'Não definido';
      const fuelType = v.fuel_type || 'Não definido';
      const ownership = getOwnershipLabel(v.ownership);
      const status = getStatusLabel(v.status);

      byModel[model] = (byModel[model] || 0) + 1;
      byFuelType[fuelType] = (byFuelType[fuelType] || 0) + 1;
      byOwnership[ownership] = (byOwnership[ownership] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      byModel: Object.entries(byModel)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      byFuelType: Object.entries(byFuelType).map(([name, value]) => ({ name, value })),
      byOwnership: Object.entries(byOwnership).map(([name, value]) => ({ name, value })),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    };
  }, [vehicles]);

  // Filtered stats for display
  const filteredStats = useMemo(() => {
    return {
      total: filteredVehicles.length,
      active: filteredVehicles.filter(v => v.status === 'active').length,
    };
  }, [filteredVehicles]);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Click handlers
  const handleModelClick = (data: { name: string }) => {
    setFilter('model', data.name, data.name);
  };

  const handleFuelTypeClick = (data: { name: string }) => {
    setFilter('fuel_type', data.name, data.name);
  };

  const handleOwnershipClick = (data: { name: string }) => {
    setFilter('ownership', data.name, data.name);
  };

  const handleStatusClick = (data: { name: string }) => {
    setFilter('status', data.name, data.name);
  };

  return (
    <div className="space-y-6">
      {/* Active Filter Badge */}
      <ActiveFilterBadge filter={activeFilter} onClear={clearFilter} />

      {/* Summary when filtered */}
      {activeFilter && (
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Veículos filtrados</p>
              <p className="text-2xl font-bold">{filteredStats.total}</p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Em uso</p>
              <p className="text-2xl font-bold text-green-600">{filteredStats.active}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total de Veículos por Modelo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Veículos por Modelo (Top 10)
              <span className="text-xs font-normal text-muted-foreground">(clique para filtrar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byModel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                    onClick={handleModelClick}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total de Veículos por Combustível */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Veículos por Combustível
              <span className="text-xs font-normal text-muted-foreground">(clique para filtrar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byFuelType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handleFuelTypeClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {stats.byFuelType.map((entry, index) => {
                      const styles = getFilterStyles('fuel_type', entry.name);
                      return (
                        <Cell key={`cell-fuel-${index}`} fill={COLORS[index % COLORS.length]} style={styles} />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total de Veículos por Titularidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Veículos por Titularidade
              <span className="text-xs font-normal text-muted-foreground">(clique para filtrar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byOwnership}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handleOwnershipClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {stats.byOwnership.map((entry, index) => {
                      const styles = getFilterStyles('ownership', entry.name);
                      return (
                        <Cell key={`cell-ownership-${index}`} fill={COLORS[index % COLORS.length]} style={styles} />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total de Veículos por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Veículos por Status
              <span className="text-xs font-normal text-muted-foreground">(clique para filtrar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handleStatusClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {stats.byStatus.map((entry, index) => {
                      const styles = getFilterStyles('status', entry.name);
                      return (
                        <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} style={styles} />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
