import { useEffect } from 'react';
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
import { useDependencyCheck, DependencyTableName } from '@/hooks/useDependencyCheck';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
  // New props for dependency checking
  tableName?: DependencyTableName;
  recordId?: string;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmar exclusão',
  description = 'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.',
  loading = false,
  tableName,
  recordId,
}: DeleteDialogProps) {
  const { isAdmin } = useAuth();
  const { 
    hasDependencies, 
    dependencies, 
    loading: checkingDeps, 
    checkDependencies, 
    resetDependencies 
  } = useDependencyCheck();

  useEffect(() => {
    if (open && tableName && recordId) {
      checkDependencies(tableName, recordId);
    } else if (!open) {
      resetDependencies();
    }
  }, [open, tableName, recordId]);

  const canDelete = !hasDependencies || isAdmin;
  const isLoading = loading || checkingDeps;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasDependencies && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{description}</p>
              
              {checkingDeps && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verificando dependências...</span>
                </div>
              )}

              {hasDependencies && !checkingDeps && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Este registro possui dependências:
                  </p>
                  <ul className="text-sm space-y-1 text-destructive/90">
                    {dependencies.map((dep) => (
                      <li key={dep.table} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive/70" />
                        {dep.label}: <strong>{dep.count}</strong> registro{dep.count > 1 ? 's' : ''}
                      </li>
                    ))}
                  </ul>
                  {!isAdmin && (
                    <p className="text-sm text-destructive font-medium mt-2">
                      Apenas administradores podem excluir registros com dependências.
                    </p>
                  )}
                  {isAdmin && (
                    <p className="text-sm text-destructive/80 mt-2">
                      ⚠️ Excluir este registro pode deixar os itens acima sem referência.
                    </p>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading || !canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Excluindo...' : checkingDeps ? 'Verificando...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
