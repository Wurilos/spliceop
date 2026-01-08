import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInfractions } from '@/hooks/useInfractions';
import { useEquipment } from '@/hooks/useEquipment';
import { useContracts } from '@/hooks/useContracts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Camera, Layers, FileText, TrendingUp, Trophy } from 'lucide-react';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function InfractionsDashboard() {
  const { infractions } = useInfractions();
  const { equipment } = useEquipment();
  const { contracts } = useContracts();
  
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredInfractions = useMemo(() => {
    return infractions.filter((infraction) => {
      if (selectedContract !== 'all' && infraction.contract_id !== selectedContract) {
        return false;
      }
      if (selectedEquipment !== 'all' && infraction.equipment_id !== selectedEquipment) {
        return false;
      }
      if (startDate && infraction.date) {
        const infractionDate = new Date(infraction.date);
        if (infractionDate < new Date(startDate)) return false;
      }
      if (endDate && infraction.date) {
        const infractionDate = new Date(infraction.date);
        if (infractionDate > new Date(endDate)) return false;
      }
      return true;
    });
  }, [infractions, selectedContract, selectedEquipment, startDate, endDate]);

  // Stats
  const totalImages = filteredInfractions.reduce((sum, i) => sum + (i.image_count || 0), 0);
  const totalRecords = filteredInfractions.length;
  const uniqueContracts = new Set(filteredInfractions.map(i => i.contract_id).filter(Boolean)).size;
  const avgPerRecord = totalRecords > 0 ? (totalImages / totalRecords).toFixed(1) : '0';

  // Images by Contract
  const imagesByContract = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredInfractions.forEach((i) => {
      const contract = contracts.find(c => c.id === i.contract_id);
      const key = contract ? `${contract.number} - ${contract.client_name}` : 'Sem Contrato';
      grouped[key] = (grouped[key] || 0) + (i.image_count || 0);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredInfractions, contracts]);

  // Distribution by Contract (for pie chart)
  const contractDistribution = useMemo(() => {
    const total = imagesByContract.reduce((sum, i) => sum + i.value, 0);
    return imagesByContract.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(0) : 0,
    }));
  }, [imagesByContract]);

  // Top 10 Equipment Ranking
  const equipmentRanking = useMemo(() => {
    const grouped: Record<string, { images: number; records: number; contractId: string | null }> = {};
    filteredInfractions.forEach((i) => {
      const eq = equipment.find(e => e.id === i.equipment_id);
      const key = eq?.serial_number || 'Desconhecido';
      if (!grouped[key]) {
        grouped[key] = { images: 0, records: 0, contractId: i.contract_id };
      }
      grouped[key].images += (i.image_count || 0);
      grouped[key].records += 1;
    });
    return Object.entries(grouped)
      .map(([serial, data]) => {
        const contract = contracts.find(c => c.id === data.contractId);
        return {
          serial,
          images: data.images,
          records: data.records,
          contract: contract ? `${contract.number} - ${contract.client_name}` : '-',
        };
      })
      .sort((a, b) => b.images - a.images)
      .slice(0, 10);
  }, [filteredInfractions, equipment, contracts]);

  // Images by Equipment (bar chart)
  const imagesByEquipment = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredInfractions.forEach((i) => {
      const eq = equipment.find(e => e.id === i.equipment_id);
      const key = eq?.serial_number || 'Desconhecido';
      grouped[key] = (grouped[key] || 0) + (i.image_count || 0);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredInfractions, equipment]);

  // Lane analysis by equipment
  const lanesByEquipment = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};
    filteredInfractions.forEach((i) => {
      const eq = equipment.find(e => e.id === i.equipment_id);
      const serial = eq?.serial_number || 'Desconhecido';
      const lane = i.physical_lane || i.datacheck_lane || 'N/A';
      if (!grouped[serial]) {
        grouped[serial] = {};
      }
      grouped[serial][lane] = (grouped[serial][lane] || 0) + (i.image_count || 0);
    });
    
    // Get top 5 equipment with most images
    const topEquipment = Object.entries(grouped)
      .map(([serial, lanes]) => ({
        serial,
        total: Object.values(lanes).reduce((sum, v) => sum + v, 0),
        lanes,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    // Get all unique lanes
    const allLanes = new Set<string>();
    topEquipment.forEach(eq => Object.keys(eq.lanes).forEach(l => allLanes.add(l)));
    
    return {
      data: topEquipment.map(eq => ({
        name: eq.serial,
        ...eq.lanes,
      })),
      lanes: Array.from(allLanes),
    };
  }, [filteredInfractions, equipment]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Contrato</Label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
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
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os equipamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os equipamentos</SelectItem>
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.serial_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total de Imagens</CardTitle>
            <Camera className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImages.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-blue-200">em {totalRecords} registros</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">Total de Faixas</CardTitle>
            <Layers className="h-4 w-4 text-amber-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-amber-200">registros cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueContracts}</div>
            <p className="text-xs text-green-200">com infrações registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Média por Registro</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerRecord}</div>
            <p className="text-xs text-purple-200">imagens por infração</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images by Contract Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Infrações por Contrato</CardTitle>
            <CardDescription>Total de imagens por contrato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={imagesByContract.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Contrato</CardTitle>
            <CardDescription>Proporção de imagens entre contratos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contractDistribution.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${percentage}%`}
                  >
                    {contractDistribution.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Equipment Ranking */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle>Top 10 Equipamentos</CardTitle>
              <CardDescription>Ranking dos equipamentos que mais geraram infrações</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {equipmentRanking.map((eq, index) => (
                <div
                  key={eq.serial}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0
                          ? 'bg-amber-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-amber-700'
                          : 'bg-muted-foreground/50'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{eq.serial}</p>
                      <p className="text-xs text-muted-foreground">Contrato: {eq.contract}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{eq.images.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">{eq.records} registros</p>
                  </div>
                </div>
              ))}
              {equipmentRanking.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images by Equipment Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Infrações por Equipamento</CardTitle>
            <CardDescription>Total de imagens por equipamento (top 8)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={imagesByEquipment} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lane Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Infrações por Faixa</CardTitle>
          <CardDescription>Análise de qual faixa gera mais infrações por equipamento (top 5 equipamentos)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lanesByEquipment.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                <Legend />
                {lanesByEquipment.lanes.map((lane, index) => (
                  <Bar
                    key={lane}
                    dataKey={lane}
                    fill={COLORS[index % COLORS.length]}
                    stackId="a"
                    radius={index === lanesByEquipment.lanes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
