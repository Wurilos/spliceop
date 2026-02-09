import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInternetBills, InternetBill } from '@/hooks/useInternetBills';
import { useInternetConnections } from '@/hooks/useInternetConnections';
import { useInternetProviders } from '@/hooks/useInternetProviders';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  connection_id: z.string().min(1, 'Conexão é obrigatória'),
  reference_month: z.string().min(1, 'Mês de referência é obrigatório'),
  value: z.string().min(1, 'Valor é obrigatório'),
  status: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InternetBillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: InternetBill | null;
}

export function InternetBillForm({ open, onOpenChange, bill }: InternetBillFormProps) {
  const { createInternetBill, updateInternetBill } = useInternetBills();
  const { connections } = useInternetConnections();
  const { providers } = useInternetProviders();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      connection_id: '',
      reference_month: '',
      value: '',
      status: 'pending',
    },
  });

  useEffect(() => {
    // Wait for relational data to load before populating the form
    if (bill && connections.length > 0) {
      // Convert reference_month date to month input format (YYYY-MM)
      let referenceMonth = bill.reference_month || '';
      if (referenceMonth && referenceMonth.length > 7) {
        referenceMonth = referenceMonth.slice(0, 7); // Extract YYYY-MM from YYYY-MM-DD
      }
      
      form.reset({
        connection_id: (bill as any).connection_id || '',
        reference_month: referenceMonth,
        value: bill.value?.toString() || '',
        status: bill.status || 'pending',
      });
    } else if (!bill) {
      form.reset({
        connection_id: '',
        reference_month: '',
        value: '',
        status: 'pending',
      });
    }
  }, [bill, form, connections]);

  const getConnectionLabel = (conn: any) => {
    const contract = contracts.find(c => c.id === conn.contract_id);
    const provider = providers.find(p => p.id === conn.provider_id);
    return `${contract?.number || 'N/A'} - ${conn.serial_number} - ${provider?.name || 'N/A'}`;
  };

  const onSubmit = (data: FormValues) => {
    const connection = connections.find(c => c.id === data.connection_id);
    const payload = {
      provider: providers.find(p => p.id === connection?.provider_id)?.name || '',
      reference_month: data.reference_month.length === 7 ? `${data.reference_month}-01` : data.reference_month,
      value: parseFloat(data.value),
      contract_id: connection?.contract_id || null,
      connection_id: data.connection_id,
      status: data.status || 'pending',
    };

    if (bill) {
      updateInternetBill({ id: bill.id, ...payload });
    } else {
      createInternetBill(payload as any);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{bill ? 'Editar Fatura' : 'Criar Fatura'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="connection_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Série *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conexão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {getConnectionLabel(conn)}
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
              name="reference_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de Referência *</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} />
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
                  <FormLabel>Valor *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="sent">Enviada</SelectItem>
                      <SelectItem value="zeroed">Zerada</SelectItem>
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
