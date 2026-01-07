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

const formSchema = z.object({
  equipment_id: z.string().min(1, 'Selecione um equipamento'),
  date: z.string().min(1, 'Data/hora é obrigatória'),
  plate: z.string().nullable().optional(),
  speed: z.coerce.number().nullable().optional(),
  limit_speed: z.coerce.number().nullable().optional(),
  status: z.string().nullable().optional().default('pending'),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipment_id: '',
      date: new Date().toISOString().slice(0, 16),
      plate: '',
      speed: 0,
      limit_speed: 0,
      status: 'pending',
    },
  });

  useEffect(() => {
    if (infraction) {
      form.reset({
        equipment_id: infraction.equipment_id,
        date: infraction.date.slice(0, 16),
        plate: infraction.plate || '',
        speed: infraction.speed || 0,
        limit_speed: infraction.limit_speed || 0,
        status: infraction.status || 'pending',
      });
    } else {
      form.reset({
        equipment_id: '',
        date: new Date().toISOString().slice(0, 16),
        plate: '',
        speed: 0,
        limit_speed: 0,
        status: 'pending',
      });
    }
  }, [infraction, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      equipment_id: values.equipment_id,
      date: values.date,
      plate: values.plate || null,
      speed: values.speed || null,
      limit_speed: values.limit_speed || null,
      status: values.status || 'pending',
    };

    if (infraction) {
      updateInfraction({ id: infraction.id, ...data });
    } else {
      createInfraction(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {infraction ? 'Editar Infração' : 'Nova Infração'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Velocidade (km/h)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limit_speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite (km/h)</FormLabel>
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
                      <SelectItem value="validated">Validada</SelectItem>
                      <SelectItem value="rejected">Rejeitada</SelectItem>
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
              <Button type="submit">{infraction ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
