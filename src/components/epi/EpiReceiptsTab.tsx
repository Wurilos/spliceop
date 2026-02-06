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
import { useEpiReceipts, EpiReceipt, EpiReceiptInsert } from '@/hooks/useEpiReceipts';
import { EpiReceiptForm } from './EpiReceiptForm';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EpiReceiptsTab() {
  const { items } = useEpiItems();
  const { receipts, loading, create, update, delete: deleteReceipt, isCreating, isUpdating } = useEpiReceipts();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<EpiReceipt | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState<EpiReceipt | null>(null);

  const filteredReceipts = receipts.filter((receipt) => {
    const itemName = receipt.epi_items?.description || '';
    const itemCode = receipt.epi_items?.code || '';
    return (
      itemName.toLowerCase().includes(search.toLowerCase()) ||
      itemCode.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = (data: EpiReceiptInsert) => {
    create(data);
    setFormOpen(false);
  };

  const handleUpdate = (data: EpiReceiptInsert) => {
    if (editingReceipt) {
      update({ id: editingReceipt.id, ...data });
      setEditingReceipt(null);
    }
  };

  const handleDelete = () => {
    if (deletingReceipt) {
      deleteReceipt(deletingReceipt.id);
      setDeletingReceipt(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar recebimentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Recebimento
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="w-24 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredReceipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum recebimento encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    {format(parseISO(receipt.receipt_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{receipt.epi_items?.code}</TableCell>
                  <TableCell>{receipt.epi_items?.description}</TableCell>
                  <TableCell className="text-right font-medium">{receipt.quantity}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {receipt.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingReceipt(receipt)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingReceipt(receipt)}
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
      <EpiReceiptForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        items={items}
        loading={isCreating}
      />

      {/* Edit Form */}
      <EpiReceiptForm
        open={!!editingReceipt}
        onOpenChange={(open) => !open && setEditingReceipt(null)}
        onSubmit={handleUpdate}
        initialData={editingReceipt}
        items={items}
        loading={isUpdating}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingReceipt} onOpenChange={(open) => !open && setDeletingReceipt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este recebimento? Esta ação não pode ser desfeita e afetará o saldo do item.
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
