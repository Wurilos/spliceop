import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ColumnForm } from '@/components/kanban/ColumnForm';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { useKanbanColumns, KanbanColumn } from '@/hooks/useKanbanColumns';
import { useKanbanSubitems } from '@/hooks/useKanbanSubitems';

export default function KanbanItems() {
  const { columns, isLoading, createColumnAsync, updateColumn, deleteColumn, reorderColumns } = useKanbanColumns();
  const { createSubitem } = useKanbanSubitems();
  const [showForm, setShowForm] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleCreate = async (data: any) => {
    const { subitems, ...columnData } = data;
    try {
      const newColumn = await createColumnAsync({
        ...columnData,
        is_system: false,
        color: columnData.color === 'none' ? null : columnData.color,
      });
      
      // Criar subitems para a nova coluna
      if (subitems && subitems.length > 0 && newColumn) {
        for (let i = 0; i < subitems.length; i++) {
          if (subitems[i].title) {
            createSubitem({
              column_id: newColumn.id,
              title: subitems[i].title,
              order_index: i + 1,
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
    }
  };

  const handleUpdate = (data: any) => {
    if (editingColumn) {
      updateColumn({
        id: editingColumn.id,
        ...data,
        color: data.color === 'none' ? null : data.color,
      });
      setEditingColumn(null);
    }
  };

  const handleToggleActive = (column: KanbanColumn) => {
    updateColumn({ id: column.id, is_active: !column.is_active });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteColumn(deleteId);
      setDeleteId(null);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    setDraggedId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
    
    // Add visual feedback
    const row = e.currentTarget.closest('tr');
    if (row) {
      row.classList.add('opacity-50');
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedId(null);
    setDragOverId(null);
    
    // Remove visual feedback
    const row = e.currentTarget.closest('tr');
    if (row) {
      row.classList.remove('opacity-50');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedId && draggedId !== columnId) {
      setDragOverId(columnId);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = columns.findIndex(c => c.id === draggedId);
    const targetIndex = columns.findIndex(c => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Create new order
    const newColumns = [...columns];
    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedColumn);

    // Update order_index for all affected columns
    const updates = newColumns.map((col, index) => ({
      id: col.id,
      order_index: index + 1,
    }));

    reorderColumns(updates);
    
    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId, columns, reorderColumns]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Itens do Kanban</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os itens do quadro operacional
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Coluna
          </Button>
        </div>

        <p className="text-sm text-primary mb-6">
          Configure as colunas que aparecem no Kanban e os tipos de demanda disponíveis. Arraste os itens para reordenar.
        </p>

        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead className="text-center">Ordem</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => (
                  <TableRow 
                    key={column.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, column.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                    className={`transition-all duration-200 ${
                      draggedId === column.id ? 'opacity-50' : ''
                    } ${
                      dragOverId === column.id ? 'bg-primary/10 border-t-2 border-primary' : ''
                    }`}
                  >
                    <TableCell>
                      <GripVertical 
                        className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing hover:text-foreground transition-colors" 
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-primary">{column.key}</span>
                        {column.is_system && (
                          <Badge variant="secondary" className="text-xs">Sistema</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-primary font-medium">
                      {column.title}
                    </TableCell>
                    <TableCell className="text-center">{column.order_index}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={column.is_active}
                        onCheckedChange={() => handleToggleActive(column)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingColumn(column);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!column.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(column.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ColumnForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingColumn(null);
        }}
        editingColumn={editingColumn}
        onSubmit={editingColumn ? handleUpdate : handleCreate}
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Coluna"
        description="Tem certeza que deseja excluir esta coluna? As demandas associadas serão movidas para a primeira coluna ativa."
      />
    </AppLayout>
  );
}
