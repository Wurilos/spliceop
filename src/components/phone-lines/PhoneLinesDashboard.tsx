import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneLine } from '@/hooks/usePhoneLines';
import { Phone, Building2, Radio, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface PhoneLinesDashboardProps {
  phoneLines: PhoneLine[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function PhoneLinesDashboard({ phoneLines }: PhoneLinesDashboardProps) {
  const stats = useMemo(() => {
    const total = phoneLines.length;
    const active = phoneLines.filter(pl => pl.status === 'active').length;
    const inactive = phoneLines.filter(pl => pl.status !== 'active').length;
    const uniqueCarriers = new Set(phoneLines.map(pl => pl.carrier)).size;
    const uniqueContracts = new Set(phoneLines.filter(pl => pl.contract_id).map(pl => pl.contract_id)).size;

    return { total, active, inactive, uniqueCarriers, uniqueContracts };
  }, [phoneLines]);

  const byContract = useMemo(() => {
    const grouped: Record<string, { name: string; count: number }> = {};
    phoneLines.forEach(pl => {
      const key = pl.contracts ? `${pl.contracts.number}` : 'Sem Contrato';
      const name = pl.contracts ? `${pl.contracts.number} - ${pl.contracts.client_name}` : 'Sem Contrato';
      if (!grouped[key]) grouped[key] = { name, count: 0 };
      grouped[key].count++;
    });
    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [phoneLines]);

  const byCarrier = useMemo(() => {
    const grouped: Record<string, number> = {};
    phoneLines.forEach(pl => {
      if (!grouped[pl.carrier]) grouped[pl.carrier] = 0;
      grouped[pl.carrier]++;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [phoneLines]);

  const byStatus = useMemo(() => {
    return [
      { name: 'Ativas', value: stats.active, color: '#10b981' },
      { name: 'Inativas', value: stats.inactive, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [stats]);

  const bySubCarrier = useMemo(() => {
    const grouped: Record<string, number> = {};
    phoneLines.forEach(pl => {
      const subCarrier = pl.sub_carrier || 'Sem Sub Operadora';
      if (!grouped[subCarrier]) grouped[subCarrier] = 0;
      grouped[subCarrier]++;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [phoneLines]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Linhas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linhas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linhas Inativas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.inactive / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadoras</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueCarriers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueContracts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linhas por Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byContract.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Linhas" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Carrier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linhas por Operadora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCarrier}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {byCarrier.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Sub Carrier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linhas por Sub Operadora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySubCarrier}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" name="Linhas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
