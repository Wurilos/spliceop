import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInternetProviders, InternetProvider } from '@/hooks/useInternetProviders';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional(),
  city: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProviderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: InternetProvider | null;
}

export function ProviderForm({ open, onOpenChange, provider }: ProviderFormProps) {
  const { createProvider, updateProvider } = useInternetProviders();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
    },
  });

  useEffect(() => {
    if (provider) {
      form.reset({
        name: provider.name,
        address: provider.address || '',
        city: provider.city || '',
      });
    } else {
      form.reset({
        name: '',
        address: '',
        city: '',
      });
    }
  }, [provider, form]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      name: data.name,
      address: data.address || null,
      city: data.city || null,
    };

    if (provider) {
      updateProvider({ id: provider.id, ...payload });
    } else {
      createProvider(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{provider ? 'Editar Provedor' : 'Novo Provedor'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provedor *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do provedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Município</FormLabel>
                  <FormControl>
                    <Input placeholder="Município" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{provider ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
