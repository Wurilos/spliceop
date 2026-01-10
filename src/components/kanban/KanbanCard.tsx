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

const priorityLabels: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

export function KanbanCard({ issue, columnTitle, onDelete, onClick, onDragStart }: KanbanCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onClick(issue);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Aferição':
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'Manutenção Preventiva':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Manutenção Corretiva':
        return 'bg-rose-50 text-rose-600 border border-rose-200';
      case 'Manutenção Veicular':
        return 'bg-sky-50 text-sky-600 border border-sky-200';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0';
      case 'high':
        return 'bg-gradient-to-r from-red-400 to-amber-400 text-white border-0';
      case 'medium':
        return 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white border-0';
      case 'low':
        return 'bg-slate-100 text-slate-500 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-500 border border-slate-200';
    }
  };

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, issue.id)}
      onClick={handleClick}
      className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 bg-white border border-slate-100 hover:border-slate-200 rounded-xl shadow-sm"
    >
      <CardHeader className="p-4 pb-3 space-y-3">
        {/* Top Row: Type + Priority + Delete */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {issue.type && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getTypeStyle(issue.type)}`}>
                {issue.type}
              </span>
            )}
            {issue.priority && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getPriorityStyle(issue.priority)}`}>
                {priorityLabels[issue.priority] || issue.priority}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(issue.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-base leading-snug text-slate-800">
          {issue.title}
        </h4>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
        {/* Equipment Serial */}
        {issue.equipment?.serial_number && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <span className="font-medium">{issue.equipment.serial_number}</span>
          </div>
        )}
        
        {/* Substatus Badge */}
        {issue.status && (
          <div className="pt-1">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
              {issue.status}
            </span>
          </div>
        )}

        {/* Address */}
        {issue.address && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{issue.address}</span>
          </div>
        )}

        {/* Team */}
        {issue.team && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span>{issue.team}</span>
          </div>
        )}

        {/* Description Box */}
        {issue.description && (
          <div className="bg-slate-50 rounded-lg p-3 mt-2 border border-slate-100">
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          </div>
        )}

        {/* Due Date */}
        {issue.due_date && (
          <div className="flex items-center gap-2 text-sm text-slate-500 pt-3 mt-2 border-t border-slate-100">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="font-medium">{format(new Date(issue.due_date), 'dd MMM', { locale: ptBR })}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
