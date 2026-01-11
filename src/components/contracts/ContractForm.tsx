import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tables } from '@/integrations/supabase/types';
import { useContractAmendments, ContractAmendment } from '@/hooks/useContractAmendments';
import { Plus, Trash2, Edit2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { DeleteDialog } from '@/components/shared/DeleteDialog';

type Contract = Tables<'contracts'>;

const schema = z.object({
  client_name: z.string().min(1, 'Cliente é obrigatório'),
  cost_center: z.string().optional(),
  value: z.coerce.number().min(0, 'Valor é obrigatório'),
  start_date: z.string().min(1, 'Data de Início é obrigatória'),
  end_date: z.string().min(1, 'Data de Fim é obrigatória'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'expired', 'pending']),
});

const amendmentSchema = z.object({
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de fim é obrigatória'),
  value: z.coerce.number().min(0, 'Valor é obrigatório'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type AmendmentFormData = z.infer<typeof amendmentSchema>;

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: Contract | null;
  loading?: boolean;
}

export function ContractForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: ContractFormProps) {
  const [showAmendmentForm, setShowAmendmentForm] = useState(false);
  const [editingAmendment, setEditingAmendment] = useState<ContractAmendment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [amendmentToDelete, setAmendmentToDelete] = useState<string | null>(null);

  const {
    amendments,
    create: createAmendment,
    update: updateAmendment,
    delete: deleteAmendment,
    isCreating: isCreatingAmendment,
    isUpdating: isUpdatingAmendment,
    isDeleting: isDeletingAmendment,
  } = useContractAmendments(initialData?.id);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: '',
      cost_center: '',
      value: 0,
      start_date: '',
      end_date: '',
      description: '',
      status: 'active',
    },
  });

  const amendmentForm = useForm<AmendmentFormData>({
    resolver: zodResolver(amendmentSchema),
    defaultValues: {
      start_date: '',
      end_date: '',
      value: 0,
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        client_name: initialData.client_name || '',
        cost_center: initialData.cost_center || '',
        value: Number(initialData.value) || 0,
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        description: initialData.description || '',
        status: initialData.status || 'active',
      });
    } else {
      form.reset({
        client_name: '',
        cost_center: '',
        value: 0,
        start_date: '',
        end_date: '',
        description: '',
        status: 'active',
      });
    }
    // Reset amendment form when dialog opens/closes
    setShowAmendmentForm(false);
    setEditingAmendment(null);
    amendmentForm.reset();
  }, [initialData, form, open]);

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  const handleAmendmentSubmit = (data: AmendmentFormData) => {
    if (!initialData?.id) return;

    if (editingAmendment) {
      updateAmendment({
        id: editingAmendment.id,
        start_date: data.start_date,
        end_date: data.end_date,
        value: data.value,
        description: data.description || null,
      });
    } else {
      const nextNumber = amendments.length > 0 
        ? Math.max(...amendments.map(a => a.amendment_number)) + 1 
        : 1;
      createAmendment({
        contract_id: initialData.id,
        amendment_number: nextNumber,
        start_date: data.start_date,
        end_date: data.end_date,
        value: data.value,
        description: data.description || null,
      });
    }
    
    setShowAmendmentForm(false);
    setEditingAmendment(null);
    amendmentForm.reset();
  };

  const handleEditAmendment = (amendment: ContractAmendment) => {
    setEditingAmendment(amendment);
    amendmentForm.reset({
      start_date: amendment.start_date,
      end_date: amendment.end_date,
      value: amendment.value,
      description: amendment.description || '',
    });
    setShowAmendmentForm(true);
  };

  const handleDeleteAmendment = (id: string) => {
    setAmendmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAmendment = () => {
    if (amendmentToDelete) {
      deleteAmendment(amendmentToDelete);
      setAmendmentToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  // Calcula o valor efetivo atual do contrato
  const currentEffectiveValue = amendments.length > 0
    ? amendments.reduce((max, a) => a.amendment_number > max.amendment_number ? a : max).value
    : Number(initialData?.value) || 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {initialData ? 'Editar Contrato' : 'Criar Contrato'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Cliente <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_center"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Centro de Custo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CC-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Valor Original <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Data de Início <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Data de Fim <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder=""
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção de Aditivos - Somente exibe para contratos existentes */}
              {initialData && (
                <>
                  <Separator className="my-4" />
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Aditivos do Contrato
                        </CardTitle>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAmendment(null);
                            amendmentForm.reset({
                              start_date: '',
                              end_date: '',
                              value: currentEffectiveValue,
                              description: '',
                            });
                            setShowAmendmentForm(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Novo Aditivo
                        </Button>
                      </div>
                      {amendments.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Valor atual do contrato (com aditivos): <strong className="text-foreground">{formatCurrency(currentEffectiveValue)}</strong>
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {amendments.length === 0 && !showAmendmentForm && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum aditivo cadastrado
                        </p>
                      )}

                      {/* Lista de aditivos existentes */}
                      {amendments.map((amendment) => (
                        <div
                          key={amendment.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                Aditivo #{amendment.amendment_number}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({formatDate(amendment.start_date)} - {formatDate(amendment.end_date)})
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-primary">
                              {formatCurrency(amendment.value)}
                            </p>
                            {amendment.description && (
                              <p className="text-xs text-muted-foreground">{amendment.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditAmendment(amendment)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteAmendment(amendment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Formulário de novo aditivo */}
                      {showAmendmentForm && (
                        <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                          <p className="font-medium text-sm">
                            {editingAmendment ? `Editar Aditivo #${editingAmendment.amendment_number}` : 'Novo Aditivo'}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">Data de Início *</label>
                              <Input
                                type="date"
                                {...amendmentForm.register('start_date')}
                              />
                              {amendmentForm.formState.errors.start_date && (
                                <p className="text-xs text-destructive mt-1">
                                  {amendmentForm.formState.errors.start_date.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="text-sm font-medium">Data de Fim *</label>
                              <Input
                                type="date"
                                {...amendmentForm.register('end_date')}
                              />
                              {amendmentForm.formState.errors.end_date && (
                                <p className="text-xs text-destructive mt-1">
                                  {amendmentForm.formState.errors.end_date.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Novo Valor do Contrato *</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...amendmentForm.register('value')}
                            />
                            {amendmentForm.formState.errors.value && (
                              <p className="text-xs text-destructive mt-1">
                                {amendmentForm.formState.errors.value.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-medium">Descrição do Aditivo</label>
                            <Textarea
                              rows={2}
                              placeholder="Ex: Reajuste anual, alteração de escopo..."
                              {...amendmentForm.register('description')}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowAmendmentForm(false);
                                setEditingAmendment(null);
                                amendmentForm.reset();
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isCreatingAmendment || isUpdatingAmendment}
                              onClick={amendmentForm.handleSubmit(handleAmendmentSubmit)}
                            >
                              {isCreatingAmendment || isUpdatingAmendment ? 'Salvando...' : editingAmendment ? 'Atualizar' : 'Adicionar'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : initialData ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteAmendment}
        title="Excluir Aditivo"
        description="Tem certeza que deseja excluir este aditivo? Esta ação não pode ser desfeita."
        loading={isDeletingAmendment}
      />
    </>
  );
}
