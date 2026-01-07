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
import { useAdvances } from '@/hooks/useAdvances';
import { useEmployees } from '@/hooks/useEmployees';

const formSchema = z.object({
  employee_id: z.string().min(1, 'Selecione um colaborador'),
  date: z.string().min(1, 'Data é obrigatória'),
  value: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  reason: z.string().nullable().optional(),
  status: z.string().nullable().optional().default('pending'),
});

type FormValues = z.infer<typeof formSchema>;

interface AdvanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance?: any;
}

export function AdvanceForm({ open, onOpenChange, advance }: AdvanceFormProps) {
  const { createAdvance, updateAdvance } = useAdvances();
  const { employees } = useEmployees();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      value: 0,
      reason: '',
      status: 'pending',
    },
  });

  useEffect(() => {
    if (advance) {
      form.reset({
        employee_id: advance.employee_id,
        date: advance.date,
        value: advance.value,
        reason: advance.reason || '',
        status: advance.status || 'pending',
      });
    } else {
      form.reset({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        value: 0,
        reason: '',
        status: 'pending',
      });
    }
  }, [advance, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      employee_id: values.employee_id,
      date: values.date,
      value: values.value,
      reason: values.reason || null,
      status: values.status || 'pending',
    };

    if (advance) {
      updateAdvance({ id: advance.id, ...data });
    } else {
      createAdvance(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {advance ? 'Editar Adiantamento' : 'Novo Adiantamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colaborador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um colaborador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.full_name}
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
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
              <Button type="submit">{advance ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
