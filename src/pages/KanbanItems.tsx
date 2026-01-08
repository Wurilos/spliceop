import { useState } from 'react';
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

export default function KanbanItems() {
  const { columns, isLoading, createColumn, updateColumn, deleteColumn } = useKanbanColumns();
  const [showForm, setShowForm] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (data: any) => {
    createColumn({
      ...data,
      is_system: false,
      color: data.color === 'none' ? null : data.color,
    });
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
          Configure as colunas que aparecem no Kanban e os tipos de demanda disponíveis.
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
                  <TableRow key={column.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
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
