import { Button } from '@/components/ui/button';
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

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issue.id)}
      onClick={handleClick}
      className="cursor-grab active:cursor-grabbing bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
    >
      {/* Top Row: Type on left, Priority + Delete on right */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {issue.type && (
            <span 
              className="px-2.5 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: issue.type === 'Aferição' ? '#FEF3E2' : 
                                 issue.type === 'Manutenção Veicular' ? '#E8F4FD' :
                                 issue.type === 'Manutenção Preventiva' ? '#E8FDF0' :
                                 issue.type === 'Manutenção Corretiva' ? '#FDE8E8' : '#F3F4F6',
                color: issue.type === 'Aferição' ? '#D97706' : 
                       issue.type === 'Manutenção Veicular' ? '#0891B2' :
                       issue.type === 'Manutenção Preventiva' ? '#059669' :
                       issue.type === 'Manutenção Corretiva' ? '#DC2626' : '#6B7280',
              }}
            >
              {issue.type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {issue.priority && (
            <span 
              className="px-2.5 py-1 rounded-md text-xs font-semibold text-white"
              style={{
                background: issue.priority === 'critical' ? 'linear-gradient(90deg, #9333EA, #7C3AED)' :
                           issue.priority === 'high' ? 'linear-gradient(90deg, #F43F5E, #FB923C)' :
                           issue.priority === 'medium' ? 'linear-gradient(90deg, #FBBF24, #FCD34D)' :
                           '#E5E7EB',
                color: issue.priority === 'low' ? '#6B7280' : 'white',
              }}
            >
              {priorityLabels[issue.priority] || issue.priority}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(issue.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-800 text-sm mb-3 leading-snug">
        {issue.title}
      </h4>

      {/* Equipment Serial - Full Width */}
      {issue.equipment?.serial_number && (
        <div 
          className="flex items-center gap-2 text-sm mb-3 px-3 py-2 rounded-lg w-full"
          style={{
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            color: '#4F46E5',
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium">{issue.equipment.serial_number}</span>
        </div>
      )}
      
      {/* Substatus Badge - Full Width */}
      {issue.status && (
        <div 
          className="flex items-center px-3 py-2 rounded-lg text-xs font-medium mb-3 w-full"
          style={{
            backgroundColor: '#F3E8FF',
            color: '#7C3AED',
            border: '1px solid #E9D5FF',
          }}
        >
          {issue.status}
        </div>
      )}

      {/* Address */}
      {issue.address && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1.5">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>{issue.address}</span>
        </div>
      )}

      {/* Team */}
      {issue.team && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>{issue.team}</span>
        </div>
      )}

      {/* Description Box */}
      {issue.description && (
        <div 
          className="rounded-lg p-3 mb-3 text-sm text-gray-600"
          style={{ backgroundColor: '#F9FAFB' }}
        >
          <p className="line-clamp-2 leading-relaxed">{issue.description}</p>
        </div>
      )}

      {/* Due Date */}
      {issue.due_date && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(issue.due_date), 'dd MMM', { locale: ptBR })}</span>
        </div>
      )}
    </div>
  );
}
