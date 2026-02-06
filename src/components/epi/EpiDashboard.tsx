import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Package, ArrowDownToLine, ArrowUpFromLine, Boxes } from 'lucide-react';
import { EpiItem } from '@/hooks/useEpiItems';
import { EpiReceipt } from '@/hooks/useEpiReceipts';
import { EpiOutput } from '@/hooks/useEpiOutputs';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EpiDashboardProps {
  items: EpiItem[];
  receipts: EpiReceipt[];
  outputs: EpiOutput[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(217, 91%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
];

export function EpiDashboard({ items, receipts, outputs }: EpiDashboardProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItem, setSelectedItem] = useState<string>('all');

  // Filter receipts and outputs by date and item
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const receiptDate = parseISO(r.receipt_date);
      const matchesStart = !startDate || isAfter(receiptDate, startOfDay(parseISO(startDate))) || r.receipt_date === startDate;
      const matchesEnd = !endDate || isBefore(receiptDate, endOfDay(parseISO(endDate))) || r.receipt_date === endDate;
      const matchesItem = selectedItem === 'all' || r.item_id === selectedItem;
      return matchesStart && matchesEnd && matchesItem;
    });
  }, [receipts, startDate, endDate, selectedItem]);

  const filteredOutputs = useMemo(() => {
    return outputs.filter((o) => {
      const outputDate = parseISO(o.output_date);
      const matchesStart = !startDate || isAfter(outputDate, startOfDay(parseISO(startDate))) || o.output_date === startDate;
      const matchesEnd = !endDate || isBefore(outputDate, endOfDay(parseISO(endDate))) || o.output_date === endDate;
      const matchesItem = selectedItem === 'all' || o.item_id === selectedItem;
      return matchesStart && matchesEnd && matchesItem;
    });
  }, [outputs, startDate, endDate, selectedItem]);

  // Calculate totals
  const totalReceived = useMemo(() => {
    return filteredReceipts.reduce((sum, r) => sum + r.quantity, 0);
  }, [filteredReceipts]);

  const totalOutput = useMemo(() => {
    return filteredOutputs.reduce((sum, o) => sum + o.quantity, 0);
  }, [filteredOutputs]);

  // Calculate stock per item (without date filter - always total)
  const stockByItem = useMemo(() => {
    const stock: Record<string, { item: EpiItem; received: number; output: number; balance: number }> = {};

    items.forEach((item) => {
      stock[item.id] = { item, received: 0, output: 0, balance: 0 };
    });

    // Consider all receipts for stock calculation (or filtered if item is selected)
    const receiptsForStock = selectedItem === 'all' ? receipts : receipts.filter(r => r.item_id === selectedItem);
    const outputsForStock = selectedItem === 'all' ? outputs : outputs.filter(o => o.item_id === selectedItem);

    receiptsForStock.forEach((r) => {
      if (stock[r.item_id]) {
        stock[r.item_id].received += r.quantity;
      }
    });

    outputsForStock.forEach((o) => {
      if (stock[o.item_id]) {
        stock[o.item_id].output += o.quantity;
      }
    });

    Object.values(stock).forEach((s) => {
      s.balance = s.received - s.output;
    });

    return Object.values(stock).filter(s => s.received > 0 || s.output > 0);
  }, [items, receipts, outputs, selectedItem]);

  const totalStock = useMemo(() => {
    return stockByItem.reduce((sum, s) => sum + s.balance, 0);
  }, [stockByItem]);

  // Data for bar chart - stock by item
  const stockChartData = useMemo(() => {
    return stockByItem
      .map((s) => ({
        name: s.item.code,
        description: s.item.description,
        entradas: s.received,
        saidas: s.output,
        saldo: s.balance,
      }))
      .sort((a, b) => b.saldo - a.saldo);
  }, [stockByItem]);

  // Data for pie chart - distribution by item
  const pieChartData = useMemo(() => {
    return stockByItem
      .filter((s) => s.balance > 0)
      .map((s) => ({
        name: s.item.code,
        value: s.balance,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stockByItem]);

  // Movement by month
  const movementByMonth = useMemo(() => {
    const months: Record<string, { month: string; entradas: number; saidas: number }> = {};

    filteredReceipts.forEach((r) => {
      const monthKey = format(parseISO(r.receipt_date), 'MMM/yy', { locale: ptBR });
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, entradas: 0, saidas: 0 };
      }
      months[monthKey].entradas += r.quantity;
    });

    filteredOutputs.forEach((o) => {
      const monthKey = format(parseISO(o.output_date), 'MMM/yy', { locale: ptBR });
      if (!months[monthKey]) {
        months[monthKey] = { month: monthKey, entradas: 0, saidas: 0 };
      }
      months[monthKey].saidas += o.quantity;
    });

    return Object.values(months).slice(-6);
  }, [filteredReceipts, filteredOutputs]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtrar movimentações por período e item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os itens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os itens</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.code} - {item.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Itens Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">tipos de EPI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalReceived}</div>
            <p className="text-xs text-muted-foreground">unidades recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOutput}</div>
            <p className="text-xs text-muted-foreground">unidades distribuídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Estoque</CardTitle>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalStock}</div>
            <p className="text-xs text-muted-foreground">unidades disponíveis</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock by Item */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque por Item</CardTitle>
            <CardDescription>Entradas, saídas e saldo por item de EPI</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-xs text-muted-foreground">{data.description}</p>
                        <div className="mt-1 space-y-1 text-sm">
                          <p className="text-green-600">Entradas: {data.entradas}</p>
                          <p className="text-red-600">Saídas: {data.saidas}</p>
                          <p className="font-medium">Saldo: {data.saldo}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(142, 76%, 36%)" />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 84%, 60%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Estoque</CardTitle>
            <CardDescription>Proporção do saldo por item</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Movement by Month */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentação Mensal</CardTitle>
          <CardDescription>Entradas e saídas por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={movementByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
