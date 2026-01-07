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
import { useTollTags } from '@/hooks/useTollTags';
import { useVehicles } from '@/hooks/useVehicles';

const formSchema = z.object({
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  tag_number: z.string().min(1, 'Número da tag é obrigatório'),
  passage_date: z.string().min(1, 'Data/hora é obrigatória'),
  toll_plaza: z.string().optional(),
  value: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_id: '',
      tag_number: '',
      passage_date: new Date().toISOString().slice(0, 16),
      toll_plaza: '',
      value: 0,
    },
  });

  useEffect(() => {
    if (tag) {
      form.reset({
        vehicle_id: tag.vehicle_id,
        tag_number: tag.tag_number,
        passage_date: tag.passage_date.slice(0, 16),
        toll_plaza: tag.toll_plaza || '',
        value: tag.value,
      });
    } else {
      form.reset({
        vehicle_id: '',
        tag_number: '',
        passage_date: new Date().toISOString().slice(0, 16),
        toll_plaza: '',
        value: 0,
      });
    }
  }, [tag, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      ...values,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tag ? 'Editar Passagem' : 'Nova Passagem de Pedágio'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veículo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um veículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} - {v.model}
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
              name="tag_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Tag</FormLabel>
                  <FormControl>
                    <Input placeholder="Número da tag" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passage_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data/Hora da Passagem</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
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
                  <FormLabel>Praça de Pedágio</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da praça" {...field} />
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

            <div className="flex justify-end gap-2">
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
