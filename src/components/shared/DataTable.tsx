import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { DeleteDialog } from './DeleteDialog';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKey?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onDeleteMany?: (ids: string[]) => void;
  onView?: (row: T) => void;
  pageSize?: number;
  entityName?: string;
  customActions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  searchPlaceholder = 'Buscar...',
  searchKey,
  onEdit,
  onDelete,
  onDeleteMany,
  onView,
  pageSize = 10,
  entityName = 'registro',
  customActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);

  const getNestedValue = (row: T, key: string): unknown => {
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value;
  };

  const filteredData = data.filter((row) => {
    if (searchKey) {
      // Search by specific key (supports nested keys like 'equipment.serial_number')
      const value = getNestedValue(row, searchKey);
      return value && String(value).toLowerCase().includes(search.toLowerCase());
    }
    // Default: search all values
    return Object.values(row).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );


  const allPageSelected = paginatedData.length > 0 && paginatedData.every(row => selectedIds.has(row.id));
  const somePageSelected = paginatedData.some(row => selectedIds.has(row.id));

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      paginatedData.forEach(row => newSelected.add(row.id));
    } else {
      paginatedData.forEach(row => newSelected.delete(row.id));
    }
    setSelectedIds(newSelected);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (onDeleteMany && selectedIds.size > 0) {
      onDeleteMany(Array.from(selectedIds));
      clearSelection();
    }
    setDeleteDialogOpen(false);
  };

  const handleDeleteAll = () => {
    if (onDeleteMany) {
      onDeleteMany(filteredData.map(row => row.id));
      clearSelection();
    }
    setDeleteAllDialogOpen(false);
  };

  const handleDeleteRow = (row: T) => {
    setRowToDelete(row);
  };

  const confirmDeleteRow = () => {
    if (rowToDelete && onDelete) {
      onDelete(rowToDelete);
      setRowToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                {columns.map((col) => (
                  <TableHead key={String(col.key)}>{col.label}</TableHead>
                ))}
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} {entityName}(s)
          </div>
        </div>
        {onDeleteMany && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteAllDialogOpen(true)}
            disabled={filteredData.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Apagar Todos
          </Button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-md">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} {entityName}(s) selecionado(s)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar seleção
            </Button>
            {onDeleteMany && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir selecionados
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className={somePageSelected && !allPageSelected ? "opacity-50" : ""}
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead key={String(col.key)}>{col.label}</TableHead>
              ))}
              {(onEdit || onDelete || onView || customActions) && (
                <TableHead className="w-[100px] text-center">Ações</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow key={row.id} data-state={selectedIds.has(row.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                      aria-label="Selecionar linha"
                    />
                  </TableCell>
                  {columns.map((col) => {
                    const value = getNestedValue(row, String(col.key));
                    return (
                      <TableCell key={String(col.key)}>
                        {col.render ? col.render(value, row) : String(value ?? '-')}
                      </TableCell>
                    );
                  })}
                  {(onEdit || onDelete || onView || customActions) && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {customActions && customActions(row)}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(row)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRow(row)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Selected Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteSelected}
        title="Excluir Selecionados"
        description={`Tem certeza que deseja excluir ${selectedIds.size} ${entityName}(s) selecionado(s)? Esta ação não pode ser desfeita.`}
      />

      {/* Delete All Dialog */}
      <DeleteDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        onConfirm={handleDeleteAll}
        title="Apagar Todos"
        description={`Tem certeza que deseja excluir todos os ${filteredData.length} ${entityName}(s)? Esta ação não pode ser desfeita.`}
      />

      {/* Delete Single Row Dialog */}
      <DeleteDialog
        open={!!rowToDelete}
        onOpenChange={(open) => !open && setRowToDelete(null)}
        onConfirm={confirmDeleteRow}
        title="Excluir Registro"
        description={`Tem certeza que deseja excluir este ${entityName}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Ativo' },
    inactive: { variant: 'secondary', label: 'Inativo' },
    expired: { variant: 'destructive', label: 'Expirado' },
    pending: { variant: 'outline', label: 'Pendente' },
    maintenance: { variant: 'outline', label: 'Manutenção' },
    decommissioned: { variant: 'destructive', label: 'Desativado' },
    vacation: { variant: 'secondary', label: 'Férias' },
    terminated: { variant: 'destructive', label: 'Desligado' },
    open: { variant: 'outline', label: 'Aberto' },
    closed: { variant: 'default', label: 'Fechado' },
    valid: { variant: 'default', label: 'Válido' },
    paid: { variant: 'default', label: 'Pago' },
    overdue: { variant: 'destructive', label: 'Vencido' },
  };

  const config = variants[status] || { variant: 'outline' as const, label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
