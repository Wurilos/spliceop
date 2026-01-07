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
import { useInfrastructureServices, InfrastructureService } from '@/hooks/useInfrastructureServices';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  serial_number: z.string().min(1, 'Número de série é obrigatório'),
  municipality: z.string().min(1, 'Município é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  service_type: z.string().min(1, 'Tipo de serviço é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: InfrastructureService | null;
}

export function InfrastructureForm({ open, onOpenChange, service }: Props) {
  const { create, update, isCreating, isUpdating } = useInfrastructureServices();
  const { contracts } = useContracts();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      serial_number: '',
      municipality: '',
      date: '',
      service_type: '',
      status: 'scheduled',
      notes: '',
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        contract_id: service.contract_id || '',
        serial_number: service.serial_number,
        municipality: service.municipality,
        date: service.date ? new Date(service.date).toISOString().slice(0, 16) : '',
        service_type: service.service_type,
        status: service.status || 'scheduled',
        notes: service.notes || '',
      });
    } else {
      form.reset({
        contract_id: '',
        serial_number: '',
        municipality: '',
        date: '',
        service_type: '',
        status: 'scheduled',
        notes: '',
      });
    }
  }, [service, form]);

  const onSubmit = (data: FormData) => {
    const payload = {
      contract_id: data.contract_id,
      serial_number: data.serial_number,
      municipality: data.municipality,
      date: new Date(data.date).toISOString(),
      service_type: data.service_type,
      status: data.status,
      notes: data.notes || null,
    };

    if (service) {
      update({ id: service.id, ...payload });
    } else {
      create(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Editar Serviço de Infraestrutura' : 'Criar Serviço de Infraestrutura'}
          </DialogTitle>
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
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="municipality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Serviço *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Instalação, Manutenção..." />
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
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="completed">Finalizado</SelectItem>
                        <SelectItem value="unscheduled">Sem Agendamento</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {service ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
