import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seal } from '@/hooks/useSeals';

interface SealCardProps {
  seal: Seal;
  onEdit: (seal: Seal) => void;
  onDelete: (seal: Seal) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available: { label: 'Disponível', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  installed: { label: 'Instalado', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  lost: { label: 'Perdido', className: 'bg-red-100 text-red-700 border-red-200' },
  damaged: { label: 'Danificado', className: 'bg-orange-100 text-orange-700 border-orange-200' },
};

export function SealCard({ seal, onEdit, onDelete }: SealCardProps) {
  const statusConfig = STATUS_CONFIG[seal.status] || STATUS_CONFIG.available;

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header with seal number and status */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate">{seal.seal_number}</h3>
            <p className="text-sm text-muted-foreground">{seal.seal_type || 'Sem tipo'}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Details section */}
      <div className="px-4 pb-3 space-y-1">
        <p className="text-sm">
          <span className="text-primary font-medium">Recebido em:</span>{' '}
          <span className="font-semibold">{formatDate(seal.received_date)}</span>
        </p>
        <p className="text-sm">
          <span className="text-muted-foreground">Memorando:</span>{' '}
          <span className="font-medium">{seal.memo_number || '-'}</span>
        </p>
      </div>

      {/* Actions footer */}
      <div className="flex justify-end gap-1 px-3 py-2 border-t bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(seal)}
          className="h-8 w-8 hover:bg-primary/10"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(seal)}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
