import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts } from '@/hooks/useContracts';
import { useComponents } from '@/hooks/useComponents';
import { Stock } from '@/hooks/useStock';

const schema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  component_id: z.string().min(1, 'Componente é obrigatório'),
  quantity: z.coerce.number().min(1, 'Quantidade deve ser maior que 0'),
});

type FormData = z.infer<typeof schema>;

interface StockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: Stock | null;
  loading?: boolean;
}

export function StockForm({ open, onOpenChange, onSubmit, initialData, loading }: StockFormProps) {
  const { contracts } = useContracts();
  const { components } = useComponents();
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_id: '',
      component_id: '',
      quantity: 1,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        contract_id: initialData.contract_id || '',
        component_id: initialData.component_id,
        quantity: initialData.quantity,
      });
    } else {
      form.reset({ contract_id: '', component_id: '', quantity: 1 });
    }
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Item de Estoque' : 'Novo Item de Estoque'}</DialogTitle>
          <DialogDescription>Adicionar item ao estoque</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione contrato" />
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
                name="component_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Componente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione componente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {components.map((comp) => (
                          <SelectItem key={comp.id} value={comp.id}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{initialData ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
