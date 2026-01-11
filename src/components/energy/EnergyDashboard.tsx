import { useState, useMemo } from 'react';
import { format, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, FileText, Filter } from 'lucide-react';
import { useEnergyBills } from '@/hooks/useEnergyBills';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function EnergyDashboard() {
  const { energyBills } = useEnergyBills();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();

  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfYear(new Date()), 'yyyy-MM-dd'));
  const [selectedContract, setSelectedContract] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');

  const clearFilters = () => {
    setStartDate(format(startOfYear(new Date()), 'yyyy-MM-dd'));
    setEndDate(format(endOfYear(new Date()), 'yyyy-MM-dd'));
    setSelectedContract('all');
    setSelectedEquipment('all');
  };

  const filteredBills = useMemo(() => {
    return energyBills.filter((bill) => {
      const billDate = parseISO(bill.reference_month);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (billDate < start || billDate > end) return false;
      if (selectedContract !== 'all' && bill.contract_id !== selectedContract) return false;
      if (selectedEquipment !== 'all' && bill.equipment_id !== selectedEquipment) return false;
      
      return true;
    });
  }, [energyBills, startDate, endDate, selectedContract, selectedEquipment]);

  const totalValue = filteredBills.reduce((sum, b) => sum + (b.value || 0), 0);
  const totalBills = filteredBills.length;
  const avgValue = totalBills > 0 ? totalValue / totalBills : 0;

  const getContractName = (contractId: string | null) => {
    if (!contractId) return 'Sem Contrato';
    const contract = contracts.find((c) => c.id === contractId);
    return contract?.client_name || 'Sem Contrato';
  };

  // Gasto por contrato
  const expensesByContract = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredBills.forEach((bill) => {
      const name = getContractName(bill.contract_id);
      grouped[name] = (grouped[name] || 0) + (bill.value || 0);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredBills, contracts]);

  // Total de gastos por mês
  const expensesByMonth = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredBills.forEach((bill) => {
      const month = format(parseISO(bill.reference_month), 'MMM/yy', { locale: ptBR });
      grouped[month] = (grouped[month] || 0) + (bill.value || 0);
    });
    return Object.entries(grouped).map(([month, value]) => ({ month, value }));
  }, [filteredBills]);

  const chartConfig = {
    value: { label: 'Valor', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros do Dashboard - Energia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contrato</Label>
              <Select value={selectedContract} onValueChange={setSelectedContract}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Contratos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Contratos</SelectItem>
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
                  <SelectValue placeholder="Todos os Equipamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Equipamentos</SelectItem>
                  {equipment.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.serial_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total das Faturas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Valor total em energia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média das Faturas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {avgValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Média por fatura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{totalBills}</div>
            <p className="text-xs text-muted-foreground">Faturas processadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gasto por Contrato */}
        <Card>
          <CardHeader>
            <CardTitle>Gasto por Contrato</CardTitle>
            <CardDescription>Ranking dos contratos com maiores gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByContract} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) =>
                      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Total de Gastos por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Total de Gastos por Mês</CardTitle>
            <CardDescription>Evolução mensal dos gastos com energia</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) =>
                      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
