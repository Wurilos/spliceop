import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { useInternetBills } from '@/hooks/useInternetBills';
import { useInternetConnections } from '@/hooks/useInternetConnections';
import { useInternetProviders } from '@/hooks/useInternetProviders';
import { useContracts } from '@/hooks/useContracts';

export function InternetDashboard() {
  const { internetBills } = useInternetBills();
  const { connections } = useInternetConnections();
  const { providers } = useInternetProviders();
  const { contracts } = useContracts();

  const [contractFilter, setContractFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [serialFilter, setSerialFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const uniqueMonths = useMemo(() => {
    const months = new Set(internetBills.map(b => b.reference_month));
    return Array.from(months).sort().reverse();
  }, [internetBills]);

  const filteredBills = useMemo(() => {
    return internetBills.filter(bill => {
      const connection = connections.find(c => c.id === (bill as any).connection_id);
      
      if (contractFilter !== 'all' && bill.contract_id !== contractFilter) return false;
      if (providerFilter !== 'all' && connection?.provider_id !== providerFilter) return false;
      if (serialFilter !== 'all' && (bill as any).connection_id !== serialFilter) return false;
      if (monthFilter !== 'all' && bill.reference_month !== monthFilter) return false;
      
      return true;
    });
  }, [internetBills, connections, contractFilter, providerFilter, serialFilter, monthFilter]);

  const clearFilters = () => {
    setContractFilter('all');
    setProviderFilter('all');
    setSerialFilter('all');
    setMonthFilter('all');
  };

  const totalBills = filteredBills.reduce((sum, b) => sum + (b.value || 0), 0);
  const totalConnections = connections.length;

  const byProvider = useMemo(() => {
    const result: Record<string, { total: number; count: number }> = {};
    
    connections.forEach(conn => {
      const provider = providers.find(p => p.id === conn.provider_id);
      const providerName = provider?.name || 'Sem Provedor';
      
      if (!result[providerName]) {
        result[providerName] = { total: 0, count: 0 };
      }
      result[providerName].count++;
      
      const connBills = filteredBills.filter(b => (b as any).connection_id === conn.id);
      result[providerName].total += connBills.reduce((sum, b) => sum + (b.value || 0), 0);
    });
    
    return result;
  }, [connections, providers, filteredBills]);

  const byContract = useMemo(() => {
    const result: Record<string, { name: string; total: number; count: number }> = {};
    
    connections.forEach(conn => {
      const contract = contracts.find(c => c.id === conn.contract_id);
      const contractKey = contract?.id || 'sem_contrato';
      const contractName = contract?.client_name || 'Sem Contrato';
      
      if (!result[contractKey]) {
        result[contractKey] = { name: contractName, total: 0, count: 0 };
      }
      result[contractKey].count++;
      
      const connBills = filteredBills.filter(b => (b as any).connection_id === conn.id);
      result[contractKey].total += connBills.reduce((sum, b) => sum + (b.value || 0), 0);
    });
    
    return result;
  }, [connections, contracts, filteredBills]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Contrato</label>
              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os contratos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os contratos</SelectItem>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.number} - {contract.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Provedor</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os provedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os provedores</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Número de Série</label>
              <Select value={serialFilter} onValueChange={setSerialFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os números" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os números</SelectItem>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.serial_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {uniqueMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumo Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-primary">{formatCurrency(totalBills)}</div>
                <div className="text-sm text-muted-foreground">Total em Faturas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{totalConnections}</div>
                <div className="text-sm text-muted-foreground">Total de Conexões</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Por Provedor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Provedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(byProvider).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">{name}</span>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(data.total)}</div>
                    <div className="text-xs text-muted-foreground">{data.count} conexões</div>
                  </div>
                </div>
              ))}
              {Object.keys(byProvider).length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Por Contrato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Por Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(byContract).map(([key, data]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-primary">{data.name}</span>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(data.total)}</div>
                  <div className="text-xs text-muted-foreground">{data.count} conexões</div>
                </div>
              </div>
            ))}
            {Object.keys(byContract).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
