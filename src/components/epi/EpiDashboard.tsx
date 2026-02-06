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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Package, ArrowDownToLine, ArrowUpFromLine, Boxes, ImageOff } from 'lucide-react';
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

  // Calculate stock per item (considering all transactions for total balance)
  const stockByItem = useMemo(() => {
    const stock: Record<string, { item: EpiItem; received: number; output: number; balance: number }> = {};

    items.forEach((item) => {
      stock[item.id] = { item, received: 0, output: 0, balance: 0 };
    });

    // Use all receipts/outputs for stock calculation (total balance)
    receipts.forEach((r) => {
      if (stock[r.item_id]) {
        stock[r.item_id].received += r.quantity;
      }
    });

    outputs.forEach((o) => {
      if (stock[o.item_id]) {
        stock[o.item_id].output += o.quantity;
      }
    });

    Object.values(stock).forEach((s) => {
      s.balance = s.received - s.output;
    });

    return Object.values(stock).sort((a, b) => a.item.code.localeCompare(b.item.code));
  }, [items, receipts, outputs]);

  const totalStock = useMemo(() => {
    return stockByItem.reduce((sum, s) => sum + s.balance, 0);
  }, [stockByItem]);

  // Data for bar chart - movement by month
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
            <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalReceived}</div>
            <p className="text-xs text-muted-foreground">unidades recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalOutput}</div>
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

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque por Item</CardTitle>
          <CardDescription>Quantidade em estoque de cada item de EPI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Foto</TableHead>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right w-[100px]">Entradas</TableHead>
                  <TableHead className="text-right w-[100px]">Saídas</TableHead>
                  <TableHead className="text-right w-[100px]">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockByItem.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum item cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  stockByItem.map((stock) => (
                    <TableRow key={stock.item.id}>
                      <TableCell>
                        {stock.item.photo_url ? (
                          <img
                            src={stock.item.photo_url}
                            alt={stock.item.description}
                            className="w-12 h-12 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center">
                            <ImageOff className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-medium">{stock.item.code}</TableCell>
                      <TableCell>{stock.item.description}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {stock.received}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {stock.output}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={stock.balance < 0 ? 'text-destructive' : stock.balance === 0 ? 'text-muted-foreground' : 'text-primary'}>
                          {stock.balance}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Movement by Month Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentação por Mês</CardTitle>
          <CardDescription>Entradas e saídas nos últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movementByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-md">
                      <p className="font-medium">{label}</p>
                      <div className="mt-1 space-y-1 text-sm">
                        <p className="text-emerald-600">Entradas: {payload[0]?.value || 0}</p>
                        <p className="text-destructive">Saídas: {payload[1]?.value || 0}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--chart-2))" />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
