import { format } from 'date-fns';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SealServiceOrder } from '@/hooks/useSealServiceOrders';

interface ServiceOrderCardProps {
  order: SealServiceOrder;
  onView?: (order: SealServiceOrder) => void;
  onEdit?: (order: SealServiceOrder) => void;
  onDelete?: (order: SealServiceOrder) => void;
}

export function ServiceOrderCard({ order, onView, onEdit, onDelete }: ServiceOrderCardProps) {
  const year = order.created_at ? format(new Date(order.created_at), 'yyyy') : '';
  
  return (
    <div className="border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">O.S #{order.order_number}</h3>
          {order.category && (
            <Badge variant="secondary" className="text-xs">
              {order.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onView && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(order)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(order)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(order)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        {order.contracts && (
          <p>
            <span className="font-medium text-foreground">Contrato:</span> {order.contracts.number}
          </p>
        )}
        {order.equipment && (
          <p>
            <span className="font-medium text-foreground">Número de Série:</span> {order.equipment.serial_number}
          </p>
        )}
        {order.maintenance_description && (
          <p>
            <span className="font-medium text-foreground">Manutenção:</span> {order.maintenance_description}
          </p>
        )}
      </div>

      {order.items && order.items.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Lacres Instalados:</p>
          <div className="flex flex-wrap gap-1">
            {order.items.map((item) => (
              <Badge key={item.id} variant="outline" className="text-xs">
                {item.seals?.seal_number}-{getItemSuffix(item.installation_item)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getItemSuffix(installationItem: string): string {
  const suffixMap: Record<string, string> = {
    'MET': '1',
    'MET - Acrílico frontal': '2',
    'NMET': '3',
    'MCA': '4',
    'Cartão SD': '5',
    'Câmeras': '6',
    'Laço 1': '7',
    'Laço 2': '8',
    'Laço 3': '9',
    'Laço 4': '10',
  };
  return suffixMap[installationItem] || '0';
}
