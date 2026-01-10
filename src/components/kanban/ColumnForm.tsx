import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { KanbanColumn } from '@/hooks/useKanbanColumns';
import { useKanbanSubitems, KanbanSubitem } from '@/hooks/useKanbanSubitems';

const subitemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Título do subitem é obrigatório'),
  isNew: z.boolean().optional(),
  toDelete: z.boolean().optional(),
});

const formSchema = z.object({
  key: z.string().min(1, 'Chave é obrigatória').regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e underscore'),
  title: z.string().min(1, 'Título é obrigatório'),
  order_index: z.coerce.number().min(1, 'Ordem deve ser maior que 0'),
  is_active: z.boolean().default(true),
  color: z.string().nullable().optional(),
  subitems: z.array(subitemSchema).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ColumnFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingColumn?: KanbanColumn | null;
  onSubmit: (data: FormData & { subitems?: { id?: string; title: string; isNew?: boolean; toDelete?: boolean }[] }) => void;
}

export function ColumnForm({ open, onOpenChange, editingColumn, onSubmit }: ColumnFormProps) {
  const { subitems: existingSubitems, createSubitem, updateSubitem, deleteSubitem } = useKanbanSubitems(editingColumn?.id);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: '',
      title: '',
      order_index: 1,
      is_active: true,
      color: null,
      subitems: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subitems',
  });

  // Carregar subitems existentes quando editar
  useEffect(() => {
    if (editingColumn) {
      form.reset({
        key: editingColumn.key,
        title: editingColumn.title,
        order_index: editingColumn.order_index,
        is_active: editingColumn.is_active,
        color: editingColumn.color,
        subitems: existingSubitems.map((s) => ({
          id: s.id,
          title: s.title,
          isNew: false,
          toDelete: false,
        })),
      });
    } else {
      form.reset({
        key: '',
        title: '',
        order_index: 1,
        is_active: true,
        color: null,
        subitems: [],
      });
    }
  }, [editingColumn, existingSubitems, form]);

  const handleAddSubitem = () => {
    append({ title: '', isNew: true, toDelete: false });
  };

  const handleSubmit = async (data: FormData) => {
    // Se estamos editando, processar os subitems
    if (editingColumn && data.subitems) {
      for (const subitem of data.subitems) {
        if (subitem.toDelete && subitem.id) {
          // Deletar subitem existente
          deleteSubitem(subitem.id);
        } else if (subitem.isNew && subitem.title) {
          // Criar novo subitem
          createSubitem({
            column_id: editingColumn.id,
            title: subitem.title,
            order_index: data.subitems.indexOf(subitem) + 1,
          });
        } else if (subitem.id && subitem.title) {
          // Atualizar subitem existente
          const existing = existingSubitems.find((s) => s.id === subitem.id);
          if (existing && existing.title !== subitem.title) {
            updateSubitem({ id: subitem.id, title: subitem.title });
          }
        }
      }
    }

    // Chamar onSubmit com os dados do formulário (sem subitems para criação, serão criados depois)
    const { subitems: subitemsData, ...columnData } = data;
    const filteredSubitems = (subitemsData || [])
      .filter((s): s is { id?: string; title: string; isNew?: boolean; toDelete?: boolean } => !!s.title);
    onSubmit({ ...columnData, subitems: editingColumn ? undefined : filteredSubitems });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingColumn ? 'Editar Coluna' : 'Nova Coluna'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: energia, manutencao" 
                      {...field} 
                      disabled={!!editingColumn}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da coluna" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order_index"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem cor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem cor</SelectItem>
                      <SelectItem value="yellow">Amarelo</SelectItem>
                      <SelectItem value="red">Vermelho</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                      <SelectItem value="blue">Azul</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Status (Ativo)</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            {/* Seção de Subitems */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">Subitens (Substatus)</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSubitem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Os subitens serão as opções de substatus disponíveis para este tipo de demanda.
              </p>

              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">
                  Nenhum subitem cadastrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const subitem = form.watch(`subitems.${index}`);
                    if (subitem?.toDelete) return null;

                    return (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`subitems.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Nome do subitem" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            const currentSubitem = form.getValues(`subitems.${index}`);
                            if (currentSubitem?.id) {
                              // Marcar para deleção se já existe
                              form.setValue(`subitems.${index}.toDelete`, true);
                            } else {
                              // Remover se é novo
                              remove(index);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingColumn ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
