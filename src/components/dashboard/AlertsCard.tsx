import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  date?: string;
}

interface AlertsCardProps {
  alerts: Alert[];
  title?: string;
}

const alertStyles = {
  warning: {
    icon: AlertTriangle,
    badge: 'bg-warning/10 text-warning border-warning/20',
    iconColor: 'text-warning',
  },
  error: {
    icon: AlertCircle,
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    iconColor: 'text-destructive',
  },
  info: {
    icon: Clock,
    badge: 'bg-info/10 text-info border-info/20',
    iconColor: 'text-info',
  },
  success: {
    icon: CheckCircle2,
    badge: 'bg-success/10 text-success border-success/20',
    iconColor: 'text-success',
  },
};

export function AlertsCard({ alerts, title = 'Alertas' }: AlertsCardProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-success mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {title}
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const style = alertStyles[alert.type];
          const Icon = style.icon;

          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <div className={cn('mt-0.5', style.iconColor)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
                {alert.date && (
                  <p className="text-xs text-muted-foreground/60">{alert.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
