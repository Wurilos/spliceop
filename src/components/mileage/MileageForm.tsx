import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { useMileageRecords } from '@/hooks/useMileageRecords';
import { useVehicles } from '@/hooks/useVehicles';

const formSchema = z.object({
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  date: z.string().min(1, 'Data é obrigatória'),
  start_time: z.string().min(1, 'Horário de início é obrigatório'),
  initial_km: z.coerce.number().min(0, 'Km inicial inválido'),
  end_time: z.string().min(1, 'Horário de término é obrigatório'),
  final_km: z.coerce.number().min(0, 'Km final inválido'),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MileageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: any;
}

export function MileageForm({ open, onOpenChange, record }: MileageFormProps) {
  const { create, update } = useMileageRecords();
  const { vehicles } = useVehicles();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_id: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '',
      initial_km: 0,
      end_time: '',
      final_km: 0,
      notes: '',
    },
  });

  const initialKm = useWatch({ control: form.control, name: 'initial_km' });
  const finalKm = useWatch({ control: form.control, name: 'final_km' });
  const kmRodado = Math.max(0, (finalKm || 0) - (initialKm || 0));

  useEffect(() => {
    if (record) {
      form.reset({
        vehicle_id: record.vehicle_id,
        date: record.date,
        start_time: record.start_time || '',
        initial_km: record.initial_km,
        end_time: record.end_time || '',
        final_km: record.final_km,
        notes: record.notes || '',
      });
    } else {
      form.reset({
        vehicle_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        initial_km: 0,
        end_time: '',
        final_km: 0,
        notes: '',
      });
    }
  }, [record, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      vehicle_id: values.vehicle_id,
      date: values.date,
      start_time: values.start_time,
      initial_km: values.initial_km,
      end_time: values.end_time,
      final_km: values.final_km,
      notes: values.notes || null,
      employee_id: null,
    };

    if (record) {
      update({ id: record.id, ...data });
    } else {
      create(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Editar Registro' : 'Registrar Km'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicle_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione veículo" />
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initial_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM no Início *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Término *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="final_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM no Término *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 10050" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* KM Rodado no Dia - Calculado automaticamente */}
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-muted-foreground">KM Rodado no Dia</p>
              <p className="text-2xl font-bold text-primary">{kmRodado}</p>
              <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{record ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}