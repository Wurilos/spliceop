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
import { Checkbox } from '@/components/ui/checkbox';
import { useSlaMetrics } from '@/hooks/useSlaMetrics';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Selecione um contrato'),
  month: z.string().min(1, 'Mês é obrigatório'),
  availability: z.coerce.number().optional(),
  response_time: z.coerce.number().optional(),
  resolution_time: z.coerce.number().optional(),
  target_met: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface SlaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metric?: any;
}

export function SlaForm({ open, onOpenChange, metric }: SlaFormProps) {
  const { createSlaMetric, updateSlaMetric } = useSlaMetrics();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      month: new Date().toISOString().slice(0, 7) + '-01',
      availability: 0,
      response_time: 0,
      resolution_time: 0,
      target_met: false,
    },
  });

  useEffect(() => {
    if (metric) {
      form.reset({
        contract_id: metric.contract_id,
        month: metric.month,
        availability: metric.availability || 0,
        response_time: metric.response_time || 0,
        resolution_time: metric.resolution_time || 0,
        target_met: metric.target_met || false,
      });
    } else {
      form.reset({
        contract_id: '',
        month: new Date().toISOString().slice(0, 7) + '-01',
        availability: 0,
        response_time: 0,
        resolution_time: 0,
        target_met: false,
      });
    }
  }, [metric, form]);

  const onSubmit = (values: FormValues) => {
    if (metric) {
      updateSlaMetric({ id: metric.id, ...values });
    } else {
      createSlaMetric(values);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {metric ? 'Editar Métrica SLA' : 'Nova Métrica SLA'}
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

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disponibilidade (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="response_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T. Resposta (h)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolution_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>T. Resolução (h)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="target_met"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Meta atingida</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{metric ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
