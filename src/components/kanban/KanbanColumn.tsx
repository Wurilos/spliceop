import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import { KanbanIssue } from '@/hooks/useKanbanIssues';
import { KanbanColumn as ColumnType } from '@/hooks/useKanbanColumns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  column: ColumnType;
  issues: KanbanIssue[];
  onDeleteIssue: (id: string) => void;
  onClickIssue: (issue: KanbanIssue) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnKey: string) => void;
}

export function KanbanColumn({
  column,
  issues,
  onDeleteIssue,
  onClickIssue,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  const columnIssues = issues.filter((issue) => issue.column_key === column.key);

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px] bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          {column.color && (
            <div 
              className={cn(
                'w-2 h-2 rounded-full',
                column.color === 'yellow' && 'bg-yellow-500',
                column.color === 'red' && 'bg-red-500',
                column.color === 'green' && 'bg-green-500',
                column.color === 'blue' && 'bg-blue-500',
              )}
            />
          )}
          <h3 className="font-medium text-sm text-foreground">{column.title}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {columnIssues.length}
        </span>
      </div>
      
      <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
        <div
          className="p-2 space-y-2 min-h-[200px]"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, column.key)}
        >
          {columnIssues.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma demanda
            </p>
          ) : (
            columnIssues.map((issue) => (
              <KanbanCard
                key={issue.id}
                issue={issue}
                columnTitle={column.title}
                onDelete={onDeleteIssue}
                onClick={onClickIssue}
                onDragStart={onDragStart}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
