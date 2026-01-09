import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePendingIssues } from '@/hooks/usePendingIssues';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { useEmployees } from '@/hooks/useEmployees';
import { ClipboardList, Clock, AlertTriangle, CheckCircle2, FileText, Radar, Users } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function IssuesDashboard() {
  const { pendingIssues, isLoading: loadingIssues } = usePendingIssues();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const { employees } = useEmployees();

  const isLoading = loadingIssues;

  // Stats calculations
  const totalDemandas = pendingIssues.length;
  const emAndamento = pendingIssues.filter((i: any) => 
    i.column_key && !['done', 'closed', 'cancelled'].includes(i.column_key)
  ).length;
  const atrasadas = pendingIssues.filter((i: any) => 
    i.due_date && new Date(i.due_date) < new Date() && !['done', 'closed'].includes(i.column_key || '')
  ).length;
  const concluidas = pendingIssues.filter((i: any) => 
    ['done', 'closed'].includes(i.column_key || '')
  ).length;

  const contratosAtivos = contracts.filter((c: any) => c.status === 'active').length;
  const equipamentosAtivos = equipment.filter((e: any) => e.status === 'active').length;
  const totalEquipamentos = equipment.length;
  const funcionariosAtivos = employees.filter((e: any) => e.status === 'active').length;

  // Chart data - Demandas por Status
  const statusData = [
    { name: 'Em Andamento', value: emAndamento, color: '#f97316' },
    { name: 'Atrasadas', value: atrasadas, color: '#ef4444' },
    { name: 'Concluídas', value: concluidas, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Chart data - Demandas por Equipe
  const teamCounts = pendingIssues.reduce((acc: Record<string, number>, issue: any) => {
    const team = issue.team || 'Sem equipe';
    acc[team] = (acc[team] || 0) + 1;
    return acc;
  }, {});
  const teamData = Object.entries(teamCounts).map(([name, value]) => ({ name, value }));

  // SLA Performance
  const slaCompliance = totalDemandas > 0 
    ? Math.round(((totalDemandas - atrasadas) / totalDemandas) * 100) 
    : 100;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das operações Splice OP</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* First row - Demandas */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Demandas</p>
                      <p className="text-3xl font-bold">{totalDemandas}</p>
                      <p className="text-xs text-muted-foreground">Todas as demandas ativas</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                      <ClipboardList className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-warning">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Em Andamento</p>
                      <p className="text-3xl font-bold">{emAndamento}</p>
                      <p className="text-xs text-muted-foreground">Demandas em processamento</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-warning flex items-center justify-center">
                      <Clock className="h-6 w-6 text-warning-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Atrasadas</p>
                      <p className="text-3xl font-bold">{atrasadas}</p>
                      <p className="text-xs text-muted-foreground">Fora do prazo SLA</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-destructive flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-success">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Concluídas</p>
                      <p className="text-3xl font-bold">{concluidas}</p>
                      <p className="text-xs text-muted-foreground">Este mês</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-success flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-success-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second row - Resources */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-info">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                      <p className="text-3xl font-bold">{contratosAtivos}</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-success flex items-center justify-center">
                      <FileText className="h-6 w-6 text-success-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-success">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Equipamentos</p>
                      <p className="text-3xl font-bold">{equipamentosAtivos}/{totalEquipamentos}</p>
                      <p className="text-xs text-muted-foreground">Operantes</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-success flex items-center justify-center">
                      <Radar className="h-6 w-6 text-success-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
                      <p className="text-3xl font-bold">{funcionariosAtivos}</p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Third row - Charts */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Demandas por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${value}`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Nenhuma demanda encontrada
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Demandas por Equipe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    {teamData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teamData} layout="vertical">
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Nenhuma demanda encontrada
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance de SLA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="12"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke={slaCompliance >= 90 ? 'hsl(var(--success))' : slaCompliance >= 70 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'}
                          strokeWidth="12"
                          strokeDasharray={`${(slaCompliance / 100) * 351.86} 351.86`}
                          strokeLinecap="round"
                          transform="rotate(-90 64 64)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-success">{slaCompliance}%</span>
                        <span className="text-xs text-muted-foreground">no prazo</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
