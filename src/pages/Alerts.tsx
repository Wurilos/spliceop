import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemAlerts, SystemAlert } from '@/hooks/useSystemAlerts';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  RefreshCw,
  FileText,
  Award,
  Receipt,
  Package,
  Radar,
  Zap,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const categoryIcons: Record<string, React.ElementType> = {
  contracts: FileText,
  calibrations: Award,
  invoices: Receipt,
  inventory: Package,
  equipment: Radar,
  energy: Zap,
  internet: Wifi,
  maintenance: AlertTriangle,
};

const categoryLabels: Record<string, string> = {
  contracts: 'Contratos',
  calibrations: 'Aferições',
  invoices: 'Faturamento',
  inventory: 'Estoque',
  equipment: 'Equipamentos',
  energy: 'Energia',
  internet: 'Internet',
  maintenance: 'Manutenções',
};

const categoryRoutes: Record<string, string> = {
  contracts: '/contracts',
  calibrations: '/calibrations',
  invoices: '/invoices',
  inventory: '/inventory',
  equipment: '/equipment',
  energy: '/energy',
  internet: '/internet',
  maintenance: '/maintenance',
};

const alertTypeStyles: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  critical: { 
    bg: 'bg-destructive/10', 
    text: 'text-destructive', 
    border: 'border-destructive/30',
    icon: XCircle 
  },
  high: { 
    bg: 'bg-warning/10', 
    text: 'text-warning', 
    border: 'border-warning/30',
    icon: AlertTriangle 
  },
  medium: { 
    bg: 'bg-info/10', 
    text: 'text-info', 
    border: 'border-info/30',
    icon: Info 
  },
  low: { 
    bg: 'bg-muted', 
    text: 'text-muted-foreground', 
    border: 'border-border',
    icon: Info 
  },
};

const alertTypeLabels: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
};

function AlertCard({ alert, onResolve }: { alert: SystemAlert; onResolve: () => void }) {
  const navigate = useNavigate();
  const style = alertTypeStyles[alert.type];
  const Icon = style.icon;
  const CategoryIcon = categoryIcons[alert.category] || AlertCircle;

  return (
    <Card className={cn('border', style.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn('mt-0.5 p-2 rounded-lg', style.bg)}>
            <Icon className={cn('h-5 w-5', style.text)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{alert.title}</h4>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs gap-1">
                <CategoryIcon className="h-3 w-3" />
                {categoryLabels[alert.category]}
              </Badge>
              <Badge className={cn('text-xs', style.bg, style.text, 'border-0')}>
                {alertTypeLabels[alert.type]}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {alert.description}
            </p>
            
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <p className="text-xs text-muted-foreground mb-1">Sugestão:</p>
              <p className="text-sm">{alert.suggestion}</p>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Detectado em: {format(alert.detectedAt, "dd/MM/yyyy, HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(categoryRoutes[alert.category] || '/')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Resolver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  label, 
  count, 
  type 
}: { 
  label: string; 
  count: number; 
  type: 'critical' | 'high' | 'medium' | 'low';
}) {
  const style = alertTypeStyles[type];
  const Icon = style.icon;
  
  return (
    <Card className={cn('border', count > 0 ? style.border : 'border-border')}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn('text-3xl font-bold', count > 0 ? style.text : 'text-muted-foreground')}>
            {count}
          </p>
        </div>
        <div className={cn('p-3 rounded-full', count > 0 ? style.bg : 'bg-muted')}>
          <Icon className={cn('h-6 w-6', count > 0 ? style.text : 'text-muted-foreground')} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Alerts() {
  const { alerts, alertsByCategory, alertCounts, isLoading, refetch } = useSystemAlerts();
  const [activeTab, setActiveTab] = useState('all');

  const filteredAlerts = activeTab === 'all' 
    ? alerts 
    : alertsByCategory[activeTab] || [];

  const categories = Object.keys(alertsByCategory).filter(cat => alertsByCategory[cat].length > 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Sistema de Alertas</h1>
                <p className="text-muted-foreground">Análise automática dos dados do sistema</p>
              </div>
            </div>
          </div>
          <Button onClick={() => refetch()} disabled={isLoading} variant="outline">
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Críticos" count={alertCounts.critical} type="critical" />
          <StatCard label="Alto" count={alertCounts.high} type="high" />
          <StatCard label="Médio" count={alertCounts.medium} type="medium" />
          <StatCard label="Baixo" count={alertCounts.low} type="low" />
        </div>

        {/* Tabs and Alert List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Todos ({alertCounts.total})
            </TabsTrigger>
            {categories.map(category => {
              const CategoryIcon = categoryIcons[category];
              return (
                <TabsTrigger key={category} value={category} className="gap-1">
                  <CategoryIcon className="h-4 w-4" />
                  {categoryLabels[category]} ({alertsByCategory[category]?.length || 0})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3" />
                  <p>Analisando dados do sistema...</p>
                </CardContent>
              </Card>
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="text-lg font-medium">Nenhum alerta encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Todos os dados do sistema estão em conformidade.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert}
                  onResolve={() => {}}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
