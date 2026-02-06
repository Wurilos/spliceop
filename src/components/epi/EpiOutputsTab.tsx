import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useEpiItems } from '@/hooks/useEpiItems';
import { useEpiOutputs, EpiOutput, EpiOutputInsert } from '@/hooks/useEpiOutputs';
import { useEmployees } from '@/hooks/useEmployees';
import { EpiOutputForm } from './EpiOutputForm';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EpiOutputsTab() {
  const { items } = useEpiItems();
  const { outputs, loading, create, update, delete: deleteOutput, isCreating, isUpdating } = useEpiOutputs();
  const { employees } = useEmployees();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingOutput, setEditingOutput] = useState<EpiOutput | null>(null);
  const [deletingOutput, setDeletingOutput] = useState<EpiOutput | null>(null);

  const filteredOutputs = outputs.filter((output) => {
    const itemName = output.epi_items?.description || '';
    const itemCode = output.epi_items?.code || '';
    const employeeName = output.employees?.full_name || '';
    return (
      itemName.toLowerCase().includes(search.toLowerCase()) ||
      itemCode.toLowerCase().includes(search.toLowerCase()) ||
      employeeName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = (data: EpiOutputInsert) => {
    create(data);
    setFormOpen(false);
  };

  const handleUpdate = (data: EpiOutputInsert) => {
    if (editingOutput) {
      update({ id: editingOutput.id, ...data });
      setEditingOutput(null);
    }
  };

  const handleDelete = () => {
    if (deletingOutput) {
      deleteOutput(deletingOutput.id);
      setDeletingOutput(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar saídas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Saída
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-24 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredOutputs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma saída encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredOutputs.map((output) => (
                <TableRow key={output.id}>
                  <TableCell>
                    {format(parseISO(output.output_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{output.epi_items?.code}</TableCell>
                  <TableCell>{output.epi_items?.description}</TableCell>
                  <TableCell>{output.employees?.full_name}</TableCell>
                  <TableCell className="text-right font-medium">{output.quantity}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[150px] truncate">
                    {output.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingOutput(output)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingOutput(output)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Form */}
      <EpiOutputForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        items={items}
        employees={employees}
        loading={isCreating}
      />

      {/* Edit Form */}
      <EpiOutputForm
        open={!!editingOutput}
        onOpenChange={(open) => !open && setEditingOutput(null)}
        onSubmit={handleUpdate}
        initialData={editingOutput}
        items={items}
        employees={employees}
        loading={isUpdating}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingOutput} onOpenChange={(open) => !open && setDeletingOutput(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta saída? Esta ação não pode ser desfeita e afetará o saldo do item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
