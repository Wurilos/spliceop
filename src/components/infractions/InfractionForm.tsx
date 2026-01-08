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
import { useInfractions } from '@/hooks/useInfractions';
import { useEquipment } from '@/hooks/useEquipment';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().nullable().optional(),
  equipment_id: z.string().min(1, 'Selecione um equipamento'),
  date: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  year: z.coerce.number().nullable().optional(),
  datacheck_lane: z.string().nullable().optional(),
  physical_lane: z.string().nullable().optional(),
  image_count: z.coerce.number().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InfractionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  infraction?: any;
}

export function InfractionForm({ open, onOpenChange, infraction }: InfractionFormProps) {
  const { createInfraction, updateInfraction } = useInfractions();
  const { equipment } = useEquipment();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      equipment_id: '',
      date: '',
      month: '',
      year: new Date().getFullYear(),
      datacheck_lane: '',
      physical_lane: '',
      image_count: 0,
    },
  });

  useEffect(() => {
    if (infraction) {
      form.reset({
        contract_id: infraction.contract_id || '',
        equipment_id: infraction.equipment_id,
        date: infraction.date ? infraction.date.slice(0, 16) : '',
        month: infraction.month || '',
        year: infraction.year || new Date().getFullYear(),
        datacheck_lane: infraction.datacheck_lane || '',
        physical_lane: infraction.physical_lane || '',
        image_count: infraction.image_count || 0,
      });
    } else {
      form.reset({
        contract_id: '',
        equipment_id: '',
        date: '',
        month: '',
        year: new Date().getFullYear(),
        datacheck_lane: '',
        physical_lane: '',
        image_count: 0,
      });
    }
  }, [infraction, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      contract_id: values.contract_id || null,
      equipment_id: values.equipment_id,
      date: values.date || null,
      month: values.month || null,
      year: values.year || null,
      datacheck_lane: values.datacheck_lane || null,
      physical_lane: values.physical_lane || null,
      image_count: values.image_count || 0,
    };

    if (infraction) {
      updateInfraction({ id: infraction.id, ...data });
    } else {
      createInfraction(data);
    }
    onOpenChange(false);
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {infraction ? 'Editar Infração' : 'Nova Infração'}
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
                  <Select onValueChange={field.onChange} value={field.value || ''}>
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
              name="equipment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um equipamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipment.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.serial_number} - {e.type}
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
                  <FormLabel>Data/Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="datacheck_lane"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faixa Datacheck</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: F1" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="physical_lane"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faixa Física</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Imagens</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{infraction ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
