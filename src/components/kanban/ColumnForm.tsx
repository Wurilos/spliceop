import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { KanbanColumn } from '@/hooks/useKanbanColumns';

const formSchema = z.object({
  key: z.string().min(1, 'Chave é obrigatória').regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e underscore'),
  title: z.string().min(1, 'Título é obrigatório'),
  order_index: z.coerce.number().min(1, 'Ordem deve ser maior que 0'),
  is_active: z.boolean().default(true),
  color: z.string().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ColumnFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingColumn?: KanbanColumn | null;
  onSubmit: (data: FormData) => void;
}

export function ColumnForm({ open, onOpenChange, editingColumn, onSubmit }: ColumnFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: editingColumn ? {
      key: editingColumn.key,
      title: editingColumn.title,
      order_index: editingColumn.order_index,
      is_active: editingColumn.is_active,
      color: editingColumn.color,
    } : {
      key: '',
      title: '',
      order_index: 1,
      is_active: true,
      color: null,
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
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
