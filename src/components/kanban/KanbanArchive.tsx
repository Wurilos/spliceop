import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useArchivedIssues } from '@/hooks/useArchivedIssues';
import { Archive, BarChart3, FileText, Building2, Wrench } from 'lucide-react';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const priorityLabels: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export function KanbanArchive() {
  const { archivedIssues, isLoading, contractChartData, equipmentChartData, typeChartData } = useArchivedIssues();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Archive className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{archivedIssues.length}</p>
                <p className="text-sm text-muted-foreground">Total Arquivados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Building2 className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contractChartData.length}</p>
                <p className="text-sm text-muted-foreground">Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Wrench className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{equipmentChartData.length}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{typeChartData.length}</p>
                <p className="text-sm text-muted-foreground">Tipos de Demanda</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contracts with most cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Contratos com Mais Demandas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contractChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contractChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Equipment with most cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-5 w-5 text-cyan-600" />
              Ativos com Mais Demandas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={equipmentChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Problem types distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-amber-600" />
              Tipos de Problemas Detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeChartData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {typeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col justify-center space-y-2">
                  {typeChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Archived Issues List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Archive className="h-5 w-5" />
            Histórico de Demandas Concluídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {archivedIssues.length > 0 ? (
              <div className="space-y-3">
                {archivedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{issue.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {issue.type && (
                            <Badge variant="outline" className="text-xs">
                              {issue.type}
                            </Badge>
                          )}
                          {issue.priority && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{
                                backgroundColor: issue.priority === 'critical' ? '#DC2626' :
                                                issue.priority === 'high' ? '#F97316' :
                                                issue.priority === 'medium' ? '#EAB308' : '#16A34A',
                                color: issue.priority === 'medium' ? '#1F2937' : 'white',
                              }}
                            >
                              {priorityLabels[issue.priority] || issue.priority}
                            </Badge>
                          )}
                          {issue.contract_name && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                              {issue.contract_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                          {issue.equipment_serial && (
                            <span>Equip: {issue.equipment_serial}</span>
                          )}
                          {issue.vehicle_plate && (
                            <span>Veículo: {issue.vehicle_plate}</span>
                          )}
                          {issue.team && (
                            <span>Equipe: {issue.team}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <div>Concluído</div>
                        <div className="font-medium">
                          {format(new Date(issue.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Archive className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma demanda arquivada ainda</p>
                <p className="text-sm">As demandas serão arquivadas quando forem movidas para "Concluído"</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
