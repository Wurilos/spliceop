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
import { Textarea } from '@/components/ui/textarea';
import { useMileageRecords } from '@/hooks/useMileageRecords';
import { useVehicles } from '@/hooks/useVehicles';
import { useEmployees } from '@/hooks/useEmployees';

const formSchema = z.object({
  vehicle_id: z.string().min(1, 'Selecione um veículo'),
  employee_id: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  initial_km: z.coerce.number().min(0, 'Km inicial inválido'),
  final_km: z.coerce.number().min(0, 'Km final inválido'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MileageFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: any;
}

export function MileageForm({ open, onOpenChange, record }: MileageFormProps) {
  const { createMileageRecord, updateMileageRecord } = useMileageRecords();
  const { vehicles } = useVehicles();
  const { employees } = useEmployees();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicle_id: '',
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      initial_km: 0,
      final_km: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        vehicle_id: record.vehicle_id,
        employee_id: record.employee_id || '',
        date: record.date,
        initial_km: record.initial_km,
        final_km: record.final_km,
        notes: record.notes || '',
      });
    } else {
      form.reset({
        vehicle_id: '',
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        initial_km: 0,
        final_km: 0,
        notes: '',
      });
    }
  }, [record, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      ...values,
      employee_id: values.employee_id || null,
      notes: values.notes || null,
    };

    if (record) {
      updateMileageRecord({ id: record.id, ...data });
    } else {
      createMileageRecord(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Editar Registro' : 'Novo Registro de Quilometragem'}
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
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colaborador (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um colaborador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.full_name}
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
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="initial_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Km Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Km Final</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
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
