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
import { useServiceGoals } from '@/hooks/useServiceGoals';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Selecione um contrato'),
  month: z.string().min(1, 'Mês é obrigatório'),
  target_calls: z.coerce.number().min(0),
  completed_calls: z.coerce.number().min(0),
  percentage: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: any;
}

export function GoalForm({ open, onOpenChange, goal }: GoalFormProps) {
  const { createServiceGoal, updateServiceGoal } = useServiceGoals();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      month: new Date().toISOString().slice(0, 7) + '-01',
      target_calls: 0,
      completed_calls: 0,
      percentage: 0,
    },
  });

  const targetCalls = form.watch('target_calls');
  const completedCalls = form.watch('completed_calls');

  useEffect(() => {
    if (targetCalls > 0) {
      const pct = (completedCalls / targetCalls) * 100;
      form.setValue('percentage', parseFloat(pct.toFixed(2)));
    }
  }, [targetCalls, completedCalls, form]);

  useEffect(() => {
    if (goal) {
      form.reset({
        contract_id: goal.contract_id,
        month: goal.month,
        target_calls: goal.target_calls || 0,
        completed_calls: goal.completed_calls || 0,
        percentage: goal.percentage || 0,
      });
    } else {
      form.reset({
        contract_id: '',
        month: new Date().toISOString().slice(0, 7) + '-01',
        target_calls: 0,
        completed_calls: 0,
        percentage: 0,
      });
    }
  }, [goal, form]);

  const onSubmit = (values: FormValues) => {
    if (goal) {
      updateServiceGoal({ id: goal.id, ...values });
    } else {
      createServiceGoal(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {goal ? 'Editar Meta' : 'Nova Meta'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
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
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_calls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta de Atendimentos</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completed_calls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Realizados</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{goal ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
