import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageSquare, MapPin, Users, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KanbanIssue } from '@/hooks/useKanbanIssues';

interface KanbanCardProps {
  issue: KanbanIssue;
  columnTitle: string;
  onDelete: (id: string) => void;
  onClick: (issue: KanbanIssue) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

const priorityColors: Record<string, string> = {
  critical: 'bg-purple-600 text-white',
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-amber-500 text-white',
  low: 'bg-muted text-muted-foreground',
};

const priorityLabels: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export function KanbanCard({ issue, columnTitle, onDelete, onClick, onDragStart }: KanbanCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal when clicking delete button
    if ((e.target as HTMLElement).closest('button')) return;
    onClick(issue);
  };

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, issue.id)}
      onClick={handleClick}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card border-border hover:border-primary/50"
    >
      <CardHeader className="p-3 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">
              {columnTitle}
            </Badge>
            {issue.priority && (
              <Badge className={priorityColors[issue.priority] || priorityColors.medium}>
                {priorityLabels[issue.priority] || issue.priority}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(issue.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <h4 className="font-semibold text-sm leading-tight text-foreground">
          {issue.title}
        </h4>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {issue.equipment?.serial_number && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 flex-shrink-0" />
            <span>{issue.equipment.serial_number}</span>
          </div>
        )}
        
        {issue.type && (
          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {issue.type}
          </Badge>
        )}

        {issue.address && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{issue.address}</span>
          </div>
        )}

        {issue.team && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span>{issue.team}</span>
          </div>
        )}

        {issue.description && (
          <div className="bg-muted/50 rounded-md p-2 mt-2">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {issue.description}
            </p>
          </div>
        )}

        {issue.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(issue.due_date), 'dd MMM', { locale: ptBR })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
