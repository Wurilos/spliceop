import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, AlertTriangle, AlertCircle, Clock, FileText, 
  Package, Wrench, Zap, Wifi, Car, CheckCircle2 
} from 'lucide-react';
import { useSystemAlerts, SystemAlert } from '@/hooks/useSystemAlerts';

interface NotificationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  contracts: FileText,
  calibrations: AlertTriangle,
  invoices: FileText,
  inventory: Package,
  maintenance: Wrench,
  energy: Zap,
  internet: Wifi,
  mileage: Car,
};

const categoryLabels: Record<string, string> = {
  contracts: 'Contratos',
  calibrations: 'Aferições',
  invoices: 'Faturas',
  inventory: 'Estoque',
  maintenance: 'Manutenção',
  energy: 'Energia',
  internet: 'Internet',
  mileage: 'Quilometragem',
};

const categoryRoutes: Record<string, string> = {
  contracts: '/contracts',
  calibrations: '/calibrations',
  invoices: '/invoices',
  inventory: '/inventory',
  maintenance: '/maintenance',
  energy: '/energy',
  internet: '/internet',
  mileage: '/mileage',
};

const alertTypeStyles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', icon: AlertCircle },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', icon: AlertTriangle },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  low: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Bell },
};

export function NotificationPopup({ open, onOpenChange }: NotificationPopupProps) {
  const navigate = useNavigate();
  const { alerts, isLoading, alertCounts } = useSystemAlerts();

  const handleNavigate = (alert: SystemAlert) => {
    onOpenChange(false);
    const route = categoryRoutes[alert.category] || '/alerts';
    navigate(route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações do Sistema
          </DialogTitle>
        </DialogHeader>
        
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          {alertCounts.critical > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {alertCounts.critical} Crítico{alertCounts.critical > 1 ? 's' : ''}
            </Badge>
          )}
          {alertCounts.high > 0 && (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 gap-1">
              <AlertTriangle className="h-3 w-3" />
              {alertCounts.high} Alto{alertCounts.high > 1 ? 's' : ''}
            </Badge>
          )}
          {alertCounts.medium > 0 && (
            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 gap-1">
              <Clock className="h-3 w-3" />
              {alertCounts.medium} Médio{alertCounts.medium > 1 ? 's' : ''}
            </Badge>
          )}
          {alertCounts.low > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Bell className="h-3 w-3" />
              {alertCounts.low} Baixo{alertCounts.low > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando notificações...
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 15).map((alert) => {
                const CategoryIcon = categoryIcons[alert.category] || AlertTriangle;
                const typeStyle = alertTypeStyles[alert.type] || alertTypeStyles.low;
                const TypeIcon = typeStyle.icon;
                
                return (
                  <div
                    key={alert.id}
                    className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleNavigate(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md ${typeStyle.bg}`}>
                        <TypeIcon className={`h-4 w-4 ${typeStyle.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm truncate">
                            {alert.title}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {categoryLabels[alert.category] || alert.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                        {alert.suggestion && (
                          <p className="text-xs text-primary mt-1 line-clamp-1">
                            💡 {alert.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {alerts.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'} no total
            </span>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate('/alerts');
              }}
            >
              Ver Central de Alertas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
