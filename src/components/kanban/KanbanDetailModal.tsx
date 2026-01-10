import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { Separator } from '@/components/ui/separator';
import { FileText, MapPin, Users, Calendar, Radio, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KanbanIssue } from '@/hooks/useKanbanIssues';
import { KanbanColumn } from '@/hooks/useKanbanColumns';
import { useAllKanbanSubitems } from '@/hooks/useKanbanSubitems';
import { useIssueHistory } from '@/hooks/useIssueHistory';

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

const actionLabels: Record<string, string> = {
  created: 'Demanda criada',
  moved: 'Movida para',
  status_changed: 'Status alterado para',
  updated: 'Demanda atualizada',
};

const actionIcons: Record<string, React.ReactNode> = {
  created: <div className="w-3 h-3 rounded-full bg-primary" />,
  moved: <ArrowRight className="h-3 w-3 text-blue-500" />,
  status_changed: <RefreshCw className="h-3 w-3 text-amber-500" />,
  updated: <RefreshCw className="h-3 w-3 text-muted-foreground" />,
};

export function KanbanDetailModal({
  issue,
  columns,
  open,
  onOpenChange,
  onUpdateType,
  onEdit,
}: KanbanDetailModalProps) {
  const { subitemsByType } = useAllKanbanSubitems();
  const { history, isLoading: historyLoading } = useIssueHistory(issue?.id);
  
  if (!issue) return null;

  const currentColumn = columns.find((c) => c.key === issue.column_key);

  const handleTypeChange = (newType: string) => {
    onUpdateType(issue.id, newType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header com badges */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-muted">
              {currentColumn?.title || 'Sem coluna'}
            </Badge>
            {issue.priority && (
              <Badge className={priorityColors[issue.priority] || priorityColors.medium}>
                {priorityLabels[issue.priority] || issue.priority}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-semibold text-foreground">{issue.title}</h2>
        </div>

        {/* Status Atual Box */}
        <div className="mx-6 bg-muted/50 rounded-lg p-4 mb-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status Atual</Label>
          <p className="font-medium mt-1">{currentColumn?.title || 'Não definido'}</p>
        </div>

        <Separator />

        {/* Grid de informações */}
        <div className="p-6 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* Contrato */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Contrato</span>
              </div>
              <p className="text-sm font-medium">
                {issue.contracts?.client_name || 'Não informado'}
              </p>
            </div>

            {/* Equipamento */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Radio className="h-3.5 w-3.5" />
                <span>Equipamento</span>
              </div>
              <p className="text-sm font-medium">
                {issue.equipment?.serial_number || 'Não informado'}
              </p>
            </div>

            {/* Localidade */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>Localidade</span>
              </div>
              <p className="text-sm font-medium">
                {issue.address || 'Não informado'}
              </p>
            </div>

            {/* Prazo SLA */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Prazo SLA</span>
              </div>
              <p className="text-sm font-medium">
                {issue.due_date
                  ? format(new Date(issue.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : 'Não informado'}
              </p>
            </div>

            {/* Equipe */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Equipe</span>
              </div>
              <p className="text-sm font-medium">
                {issue.team || 'Não informado'}
              </p>
            </div>

            {/* Responsável */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Responsável</span>
              </div>
              <p className="text-sm font-medium">
                {issue.employees?.full_name || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Substatus baseado no tipo de demanda */}
          {issue.type && subitemsByType[issue.type] && subitemsByType[issue.type].length > 0 && (
            <div className="pt-2 space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Substatus - {issue.type}
              </Label>
              <Select value={issue.status || ''} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o substatus" />
                </SelectTrigger>
                <SelectContent>
                  {subitemsByType[issue.type].map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Histórico de Alterações */}
          <div className="pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Clock className="h-3.5 w-3.5" />
              <span>Histórico de Alterações</span>
            </div>
            <div className="relative pl-4 border-l-2 border-primary/30 space-y-4">
              {/* Dynamic history entries */}
              {!historyLoading && history.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center">
                    {index === 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium">
                      {actionLabels[entry.action] || entry.action}
                      {entry.new_value && entry.action !== 'created' && (
                        <span className="text-primary ml-1">{entry.new_value}</span>
                      )}
                    </p>
                    {entry.action === 'moved' && entry.old_value && (
                      <p className="text-xs text-muted-foreground">
                        De: {entry.old_value}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Fallback: show creation date if no history */}
              {!historyLoading && history.length === 0 && (
                <div className="flex items-start gap-3">
                  <div className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-primary" />
                  <div className="ml-2">
                    <p className="text-sm font-medium">Demanda criada</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.created_at
                        ? format(new Date(issue.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : 'Data não disponível'}
                    </p>
                  </div>
                </div>
              )}
              
              {historyLoading && (
                <p className="text-xs text-muted-foreground ml-2">Carregando histórico...</p>
              )}
            </div>
          </div>

          {/* Observações */}
          {issue.description && (
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Observações</span>
              </div>
              <p className="text-sm bg-muted/30 p-3 rounded-lg">{issue.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => onEdit(issue)}>Editar Demanda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
