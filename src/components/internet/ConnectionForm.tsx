import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInternetConnections, InternetConnection } from '@/hooks/useInternetConnections';
import { useInternetProviders } from '@/hooks/useInternetProviders';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  serial_number: z.string().min(1, 'Número de série é obrigatório'),
  provider_id: z.string().min(1, 'Provedor é obrigatório'),
  client_code: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: InternetConnection | null;
}

export function ConnectionForm({ open, onOpenChange, connection }: ConnectionFormProps) {
  const { createConnection, updateConnection } = useInternetConnections();
  const { providers } = useInternetProviders();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      serial_number: '',
      provider_id: '',
      client_code: '',
    },
  });

  useEffect(() => {
    if (connection) {
      form.reset({
        contract_id: connection.contract_id || '',
        serial_number: connection.serial_number,
        provider_id: connection.provider_id || '',
        client_code: connection.client_code || '',
      });
    } else {
      form.reset({
        contract_id: '',
        serial_number: '',
        provider_id: '',
        client_code: '',
      });
    }
  }, [connection, form]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      contract_id: data.contract_id || null,
      serial_number: data.serial_number,
      provider_id: data.provider_id || null,
      client_code: data.client_code || null,
    };

    if (connection) {
      updateConnection({ id: connection.id, ...payload });
    } else {
      createConnection(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{connection ? 'Editar Cadastro' : 'Novo Cadastro'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.number} - {contract.client_name}
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
              name="serial_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Série *</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de série" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="provider_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provedor *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o provedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
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
              name="client_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Código do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{connection ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
