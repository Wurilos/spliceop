import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquare, MapPin, Users, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KanbanIssue } from '@/hooks/useKanbanIssues';
import { KanbanColumn } from '@/hooks/useKanbanColumns';

interface KanbanDetailModalProps {
  issue: KanbanIssue | null;
  columns: KanbanColumn[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateType: (id: string, type: string) => void;
  onEdit: (issue: KanbanIssue) => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-amber-500 text-white',
  low: 'bg-muted text-muted-foreground',
};

const priorityLabels: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const substatusOptions = [
  'Rompimento de Lacres',
  'Aguardando Lacres',
  'Solicitado GRU',
  'Fechamento de OS',
  'Aferição',
  'Manutenção Preventiva',
  'Manutenção Corretiva',
];

export function KanbanDetailModal({
  issue,
  columns,
  open,
  onOpenChange,
  onUpdateType,
  onEdit,
}: KanbanDetailModalProps) {
  if (!issue) return null;

  const currentColumn = columns.find((c) => c.key === issue.column_key);

  const handleTypeChange = (newType: string) => {
    onUpdateType(issue.id, newType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentColumn?.title || 'Sem coluna'}</Badge>
            {issue.priority && (
              <Badge className={priorityColors[issue.priority] || priorityColors.medium}>
                {priorityLabels[issue.priority] || issue.priority}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl">{issue.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Atual */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-1">
            <Label className="text-xs text-muted-foreground">Status Atual</Label>
            <p className="font-medium">{currentColumn?.title || 'Não definido'}</p>
          </div>

          {/* Substatus de Aferição - Select para alterar */}
          <div className="space-y-2">
            <Label className="text-primary text-sm">Substatus de Aferição</Label>
            <Select value={issue.type || ''} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o substatus" />
              </SelectTrigger>
              <SelectContent>
                {substatusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Informações em grid */}
          <div className="grid grid-cols-2 gap-4">
            {issue.equipment?.serial_number && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>DR</span>
                </div>
                <p className="text-sm font-medium">{issue.equipment.serial_number}</p>
              </div>
            )}

            {issue.due_date && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Data Limite</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(issue.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}

            {issue.address && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Endereço</span>
                </div>
                <p className="text-sm font-medium">{issue.address}</p>
              </div>
            )}

            {issue.team && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Equipe</span>
                </div>
                <p className="text-sm font-medium">{issue.team}</p>
              </div>
            )}

            {issue.employees?.full_name && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Responsável</span>
                </div>
                <p className="text-sm font-medium">{issue.employees.full_name}</p>
              </div>
            )}
          </div>

          {/* Observações */}
          {issue.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Observações</span>
              </div>
              <p className="text-sm bg-muted/30 p-3 rounded-lg">{issue.description}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => onEdit(issue)}>Editar Demanda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
