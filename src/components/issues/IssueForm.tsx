import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePendingIssues } from '@/hooks/usePendingIssues';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().nullable().optional(),
  priority: z.string().nullable().optional().default('medium'),
  status: z.string().nullable().optional().default('open'),
  contract_id: z.string().nullable().optional(),
  equipment_id: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface IssueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue?: any;
}

export function IssueForm({ open, onOpenChange, issue }: IssueFormProps) {
  const { createPendingIssue, updatePendingIssue } = usePendingIssues();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
      contract_id: '',
      equipment_id: '',
    },
  });

  useEffect(() => {
    if (issue) {
      form.reset({
        title: issue.title,
        description: issue.description || '',
        priority: issue.priority || 'medium',
        status: issue.status || 'open',
        contract_id: issue.contract_id || '',
        equipment_id: issue.equipment_id || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
        contract_id: '',
        equipment_id: '',
      });
    }
  }, [issue, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      title: values.title,
      description: values.description || null,
      priority: values.priority || 'medium',
      status: values.status || 'open',
      contract_id: values.contract_id || null,
      equipment_id: values.equipment_id || null,
      assigned_to: values.assigned_to || null,
    };

    if (issue) {
      updatePendingIssue({ id: issue.id, ...data });
    } else {
      createPendingIssue(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {issue ? 'Editar Pendência' : 'Nova Pendência'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da pendência" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Aberta</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="resolved">Resolvida</SelectItem>
                        <SelectItem value="closed">Fechada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.number} - {c.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um equipamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipment.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.serial_number} - {e.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{issue ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
