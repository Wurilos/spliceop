import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PhoneLine } from '@/hooks/usePhoneLines';
import { useChipNumbers, ChipNumber } from '@/hooks/useChipNumbers';
import { Phone, Building2, Radio, CheckCircle, Unlink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface PhoneLinesDashboardProps {
  phoneLines: PhoneLine[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function PhoneLinesDashboard({ phoneLines }: PhoneLinesDashboardProps) {
  const { chipNumbers } = useChipNumbers();

  // Get unlinked chips (chips not linked to any equipment)
  const unlinkedChips = useMemo(() => {
    const linkedChipIds = new Set(phoneLines.map(pl => pl.chip_id).filter(Boolean));
    return chipNumbers.filter(chip => !linkedChipIds.has(chip.id));
  }, [chipNumbers, phoneLines]);

  const stats = useMemo(() => {
    const total = phoneLines.length;
    const active = phoneLines.filter(pl => pl.status === 'active').length;
    const unlinked = unlinkedChips.length;
    const uniqueCarriers = new Set(phoneLines.map(pl => pl.carrier)).size;
    const uniqueContracts = new Set(phoneLines.filter(pl => pl.contract_id).map(pl => pl.contract_id)).size;

    return { total, active, unlinked, uniqueCarriers, uniqueContracts, totalChips: chipNumbers.length };
  }, [phoneLines, unlinkedChips, chipNumbers]);

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
      { name: 'Vinculadas', value: stats.total, color: '#10b981' },
      { name: 'Sem Vínculo', value: stats.unlinked, color: '#f59e0b' },
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
            <div className="text-2xl font-bold">{stats.totalChips}</div>
            <p className="text-xs text-muted-foreground">
              Chips cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linhas Vinculadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalChips > 0 ? ((stats.total / stats.totalChips) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linhas sem Vínculo</CardTitle>
            <Unlink className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.unlinked}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalChips > 0 ? ((stats.unlinked / stats.totalChips) * 100).toFixed(1) : 0}% do total
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
            <CardTitle className="text-lg">Distribuição por Vínculo</CardTitle>
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

      {/* Unlinked Chips Table */}
      {unlinkedChips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Unlink className="h-5 w-5 text-amber-500" />
              Linhas sem Vínculo ({unlinkedChips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número da Linha</TableHead>
                  <TableHead>Operadora</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unlinkedChips.map((chip) => (
                  <TableRow key={chip.id}>
                    <TableCell className="font-medium">{chip.line_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{chip.carrier}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(chip.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
