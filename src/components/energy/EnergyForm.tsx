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
import { useEnergyBills } from '@/hooks/useEnergyBills';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  consumer_unit: z.string().min(1, 'Unidade consumidora é obrigatória'),
  reference_month: z.string().min(1, 'Mês de referência é obrigatório'),
  contract_id: z.string().optional(),
  value: z.coerce.number().optional(),
  consumption_kwh: z.coerce.number().optional(),
  due_date: z.string().optional(),
  status: z.string().default('pending'),
});

type FormValues = z.infer<typeof formSchema>;

interface EnergyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: any;
}

export function EnergyForm({ open, onOpenChange, bill }: EnergyFormProps) {
  const { createEnergyBill, updateEnergyBill } = useEnergyBills();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      consumer_unit: '',
      reference_month: new Date().toISOString().slice(0, 7) + '-01',
      contract_id: '',
      value: 0,
      consumption_kwh: 0,
      due_date: '',
      status: 'pending',
    },
  });

  useEffect(() => {
    if (bill) {
      form.reset({
        consumer_unit: bill.consumer_unit,
        reference_month: bill.reference_month,
        contract_id: bill.contract_id || '',
        value: bill.value || 0,
        consumption_kwh: bill.consumption_kwh || 0,
        due_date: bill.due_date || '',
        status: bill.status || 'pending',
      });
    } else {
      form.reset({
        consumer_unit: '',
        reference_month: new Date().toISOString().slice(0, 7) + '-01',
        contract_id: '',
        value: 0,
        consumption_kwh: 0,
        due_date: '',
        status: 'pending',
      });
    }
  }, [bill, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      ...values,
      contract_id: values.contract_id || null,
      due_date: values.due_date || null,
    };

    if (bill) {
      updateEnergyBill({ id: bill.id, ...data });
    } else {
      createEnergyBill(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {bill ? 'Editar Conta de Energia' : 'Nova Conta de Energia'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="consumer_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade Consumidora</FormLabel>
                  <FormControl>
                    <Input placeholder="Número da UC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de Referência</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="consumption_kwh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumo (kWh)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
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
              <Button type="submit">{bill ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
