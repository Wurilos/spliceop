import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Seal } from '@/hooks/useSeals';

interface SealCardProps {
  seal: Seal;
  onEdit: (seal: Seal) => void;
  onDelete: (seal: Seal) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  available: { label: 'Disponível', variant: 'default' },
  installed: { label: 'Instalado', variant: 'secondary' },
  lost: { label: 'Perdido', variant: 'destructive' },
  damaged: { label: 'Danificado', variant: 'destructive' },
};

export function SealCard({ seal, onEdit, onDelete }: SealCardProps) {
  const statusConfig = STATUS_CONFIG[seal.status] || STATUS_CONFIG.available;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-lg">{seal.seal_number}</h3>
          <p className="text-sm text-muted-foreground">{seal.seal_type || '-'}</p>
        </div>
        <Badge variant={statusConfig.variant} className="text-xs">
          {statusConfig.label}
        </Badge>
      </div>

      <div className="space-y-1 text-sm mb-4">
        <p className="text-primary">
          <span className="font-medium">Recebido em:</span> {formatDate(seal.received_date)}
        </p>
        <p>
          <span className="font-medium">Memorando:</span> {seal.memo_number || '-'}
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(seal)}
          className="h-8 w-8"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(seal)}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
