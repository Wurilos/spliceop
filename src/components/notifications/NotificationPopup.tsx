import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, AlertTriangle, Clock, MapPin, X } from 'lucide-react';
import { useSystemAlerts, SystemAlert } from '@/hooks/useSystemAlerts';
import { format, differenceInDays, parseISO } from 'date-fns';

interface NotificationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPopup({ open, onOpenChange }: NotificationPopupProps) {
  const navigate = useNavigate();
  const { alerts, isLoading } = useSystemAlerts();

  // Filter only calibration alerts for the popup (as shown in reference image)
  const calibrationAlerts = alerts.filter(a => a.category === 'calibrations');

  const getDaysLabel = (alert: SystemAlert) => {
    // Parse from description to get days
    const match = alert.description.match(/(\d+) dias/);
    if (!match) return null;
    const days = parseInt(match[1]);
    const isExpired = alert.description.includes('venceu');
    
    if (isExpired) {
      return { label: 'Vencido', variant: 'destructive' as const };
    } else if (days <= 7) {
      return { label: `${days} dias`, variant: 'destructive' as const };
    } else if (days <= 30) {
      return { label: `${days} dias`, variant: 'warning' as const };
    }
    return { label: `${days} dias`, variant: 'secondary' as const };
  };

  const getEquipmentInfo = (alert: SystemAlert) => {
    // Extract serial number from description
    const serialMatch = alert.description.match(/equipamento ([^\s]+)/);
    return serialMatch ? serialMatch[1] : 'N/A';
  };

  const handleNavigate = (alert: SystemAlert) => {
    onOpenChange(false);
    navigate('/calibrations');
  };

  if (calibrationAlerts.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Aferições Próximas do Vencimento
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando notificações...
            </div>
          ) : calibrationAlerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma aferição próxima do vencimento.
            </div>
          ) : (
            <div className="space-y-3">
              {calibrationAlerts.slice(0, 10).map((alert) => {
                const daysInfo = getDaysLabel(alert);
                const serialNumber = getEquipmentInfo(alert);
                
                return (
                  <div
                    key={alert.id}
                    className="rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleNavigate(alert)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary truncate">
                            {serialNumber}
                          </span>
                          {daysInfo && (
                            <Badge 
                              variant={daysInfo.variant === 'warning' ? 'secondary' : daysInfo.variant}
                              className={daysInfo.variant === 'warning' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : ''}
                            >
                              {daysInfo.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                        alert.type === 'critical' ? 'text-destructive' : 
                        alert.type === 'high' ? 'text-orange-500' : 
                        'text-yellow-500'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {calibrationAlerts.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {calibrationAlerts.length} {calibrationAlerts.length === 1 ? 'alerta' : 'alertas'}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                onOpenChange(false);
                navigate('/alerts');
              }}
            >
              Ver Todos os Alertas
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
