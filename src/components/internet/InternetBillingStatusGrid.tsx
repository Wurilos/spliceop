import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarX, CheckCircle, Clock, FileText, AlertTriangle, Plus, Wifi } from 'lucide-react';

interface InternetConnection {
  id: string;
  serial_number: string;
  contract_id: string | null;
  provider_id: string | null;
  contracts?: { number: string; client_name: string } | null;
  providers?: { name: string } | null;
}

interface InternetBill {
  id: string;
  connection_id: string | null;
  provider: string;
  reference_month: string;
  value: number | null;
  status: string | null;
  contract_id: string | null;
}

interface Contract {
  id: string;
  number: string;
  client_name: string;
}

interface InternetBillingStatusGridProps {
  connections: InternetConnection[];
  internetBills: InternetBill[];
  contracts: Contract[];
  onCreateBill?: (connectionId: string, referenceMonth: string, contractId: string | null) => void;
  onEditBill?: (bill: InternetBill) => void;
}

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type BillStatus = 'sent' | 'pending' | 'future' | 'zeroed';

interface CellData {
  status: BillStatus;
  bill?: InternetBill;
}

export function InternetBillingStatusGrid({
  connections,
  internetBills,
  contracts,
  onCreateBill,
  onEditBill
}: InternetBillingStatusGridProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedContract, setSelectedContract] = useState<string>('all');

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);
    
    internetBills.forEach(bill => {
      const year = parseInt(bill.reference_month.slice(0, 4));
      if (!isNaN(year)) yearsSet.add(year);
    });
    
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [internetBills, currentYear]);

  const filteredConnections = useMemo(() => {
    if (selectedContract === 'all') return connections;
    return connections.filter(conn => conn.contract_id === selectedContract);
  }, [connections, selectedContract]);

  const gridData = useMemo(() => {
    const data: Map<string, Map<number, CellData>> = new Map();
    
    filteredConnections.forEach(conn => {
      const monthsMap = new Map<number, CellData>();
      
      for (let month = 0; month < 12; month++) {
        const refMonth = `${selectedYear}-${String(month + 1).padStart(2, '0')}`;
        
        // Check if month is in the future
        const isFuture = selectedYear > currentYear || 
          (selectedYear === currentYear && month > currentMonth);
        
        if (isFuture) {
          monthsMap.set(month, { status: 'future' });
          continue;
        }
        
        // Find bill for this connection and month
        const bill = internetBills.find(b => 
          b.connection_id === conn.id && 
          b.reference_month.startsWith(refMonth)
        );
        
        if (bill) {
          if (bill.status === 'zeroed') {
            monthsMap.set(month, { status: 'zeroed', bill });
          } else if (bill.status === 'sent') {
            monthsMap.set(month, { status: 'sent', bill });
          } else {
            monthsMap.set(month, { status: 'pending', bill });
          }
        } else {
          monthsMap.set(month, { status: 'pending' });
        }
      }
      
      data.set(conn.id, monthsMap);
    });
    
    return data;
  }, [filteredConnections, internetBills, selectedYear, currentYear, currentMonth]);

  const stats = useMemo(() => {
    let sent = 0, pending = 0, zeroed = 0;
    
    gridData.forEach(monthsMap => {
      monthsMap.forEach((cellData) => {
        if (cellData.status === 'sent') sent++;
        else if (cellData.status === 'pending') pending++;
        else if (cellData.status === 'zeroed') zeroed++;
      });
    });
    
    return { sent, pending, zeroed, total: sent + pending + zeroed };
  }, [gridData]);

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case 'sent': return 'bg-green-500 hover:bg-green-600';
      case 'pending': return 'bg-red-500 hover:bg-red-600';
      case 'future': return 'bg-muted hover:bg-muted';
      case 'zeroed': return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getStatusLabel = (status: BillStatus) => {
    switch (status) {
      case 'sent': return 'Fatura enviada';
      case 'pending': return 'Fatura pendente';
      case 'future': return 'Mês futuro';
      case 'zeroed': return 'Fatura zerada';
    }
  };

  const handleCellClick = (connectionId: string, month: number, cellData: CellData) => {
    const conn = filteredConnections.find(c => c.id === connectionId);
    
    if (cellData.status === 'pending' && !cellData.bill && onCreateBill) {
      const refMonth = `${selectedYear}-${String(month + 1).padStart(2, '0')}-01`;
      onCreateBill(connectionId, refMonth, conn?.contract_id || null);
    } else if (cellData.bill && onEditBill) {
      onEditBill(cellData.bill);
    }
  };

  const complianceRate = stats.total > 0 
    ? Math.round(((stats.sent + stats.zeroed) / (stats.sent + stats.zeroed + stats.pending)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header with filters and stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os contratos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os contratos</SelectItem>
              {contracts.map(contract => (
                <SelectItem key={contract.id} value={contract.id}>
                  {contract.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm text-muted-foreground">Enviada ({stats.sent})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-sm text-muted-foreground">Pendente ({stats.pending})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm text-muted-foreground">Zerada ({stats.zeroed})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted border" />
            <span className="text-sm text-muted-foreground">Futuro</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.sent + stats.zeroed}</p>
                <p className="text-sm text-muted-foreground">Faturas Cadastradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Faturas Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredConnections.length}</p>
                <p className="text-sm text-muted-foreground">Conexões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{complianceRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Conformidade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Grid */}
      {filteredConnections.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarX className="h-5 w-5" />
              Grade de Status - {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <TooltipProvider>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2 min-w-[200px] font-medium text-muted-foreground">
                        Conexão
                      </th>
                      {MONTHS.map((month, idx) => (
                        <th key={idx} className="p-2 text-center font-medium text-muted-foreground w-12">
                          {month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConnections.map(conn => {
                      const monthsMap = gridData.get(conn.id);
                      return (
                        <tr key={conn.id} className="border-t">
                          <td className="p-2">
                            <div className="font-medium truncate max-w-[200px]" title={conn.serial_number}>
                              {conn.serial_number}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {conn.contracts?.client_name || 'Sem contrato'}
                            </div>
                          </td>
                          {MONTHS.map((_, monthIdx) => {
                            const cellData = monthsMap?.get(monthIdx) || { status: 'future' as BillStatus };
                            return (
                              <td key={monthIdx} className="p-1 text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      className={`w-8 h-8 rounded transition-colors ${getStatusColor(cellData.status)} ${
                                        cellData.status === 'future' ? 'cursor-default' : 'cursor-pointer'
                                      }`}
                                      onClick={() => handleCellClick(conn.id, monthIdx, cellData)}
                                      disabled={cellData.status === 'future'}
                                    >
                                      {cellData.status === 'pending' && !cellData.bill && (
                                        <Plus className="h-4 w-4 mx-auto text-white" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{MONTH_NAMES[monthIdx]} {selectedYear}</p>
                                    <p>{getStatusLabel(cellData.status)}</p>
                                    {cellData.bill && cellData.bill.value !== null && (
                                      <p className="text-green-400">
                                        R$ {cellData.bill.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conexão cadastrada.</p>
              <p className="text-sm">Cadastre conexões para visualizar o status das faturas.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
