import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTollTags } from '@/hooks/useTollTags';
import { useVehicles } from '@/hooks/useVehicles';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Selecione um contrato'),
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  passage_date: z.string().min(1, 'Data é obrigatória'),
  value: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  tag_number: z.string().min(1, 'Nº TAG é obrigatório'),
  toll_plaza: z.string().min(1, 'Estabelecimento é obrigatório'),
});

type FormValues = z.infer<typeof formSchema>;

interface TollTagFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: any;
}

export function TollTagForm({ open, onOpenChange, tag }: TollTagFormProps) {
  const { createTollTag, updateTollTag } = useTollTags();
  const { vehicles } = useVehicles();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      vehicle_id: '',
      passage_date: new Date().toISOString().slice(0, 16),
      value: 0,
      tag_number: '',
      toll_plaza: '',
    },
  });

  useEffect(() => {
    if (tag) {
      form.reset({
        contract_id: tag.contract_id || '',
        vehicle_id: tag.vehicle_id,
        passage_date: tag.passage_date.slice(0, 16),
        value: tag.value,
        tag_number: tag.tag_number,
        toll_plaza: tag.toll_plaza || '',
      });
    } else {
      form.reset({
        contract_id: '',
        vehicle_id: '',
        passage_date: new Date().toISOString().slice(0, 16),
        value: 0,
        tag_number: '',
        toll_plaza: '',
      });
    }
  }, [tag, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      contract_id: values.contract_id || null,
      vehicle_id: values.vehicle_id,
      passage_date: values.passage_date,
      value: values.value,
      tag_number: values.tag_number,
      toll_plaza: values.toll_plaza || null,
    };

    if (tag) {
      updateTollTag({ id: tag.id, ...data });
    } else {
      createTollTag(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tag ? 'Editar TAG' : 'Nova TAG'}</DialogTitle>
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
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ABC-1234" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.plate}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passage_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tag_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº TAG *</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da TAG" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toll_plaza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estabelecimento *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do estabelecimento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{tag ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
