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
import { useSeals } from '@/hooks/useSeals';
import { useEquipment } from '@/hooks/useEquipment';
import { useEmployees } from '@/hooks/useEmployees';

const formSchema = z.object({
  equipment_id: z.string().min(1, 'Selecione um equipamento'),
  seal_number: z.string().min(1, 'Número do lacre é obrigatório'),
  installation_date: z.string().min(1, 'Data de instalação é obrigatória'),
  service_order: z.string().nullable().optional(),
  technician_id: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seal?: any;
}

export function SealForm({ open, onOpenChange, seal }: SealFormProps) {
  const { createSeal, updateSeal } = useSeals();
  const { equipment } = useEquipment();
  const { employees } = useEmployees();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipment_id: '',
      seal_number: '',
      installation_date: new Date().toISOString().split('T')[0],
      service_order: '',
      technician_id: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (seal) {
      form.reset({
        equipment_id: seal.equipment_id,
        seal_number: seal.seal_number,
        installation_date: seal.installation_date,
        service_order: seal.service_order || '',
        technician_id: seal.technician_id || '',
        notes: seal.notes || '',
      });
    } else {
      form.reset({
        equipment_id: '',
        seal_number: '',
        installation_date: new Date().toISOString().split('T')[0],
        service_order: '',
        technician_id: '',
        notes: '',
      });
    }
  }, [seal, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      equipment_id: values.equipment_id,
      seal_number: values.seal_number,
      installation_date: values.installation_date,
      service_order: values.service_order || null,
      technician_id: values.technician_id || null,
      notes: values.notes || null,
    };

    if (seal) {
      updateSeal({ id: seal.id, ...data });
    } else {
      createSeal(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {seal ? 'Editar Lacre' : 'Novo Lacre'}
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
              name="seal_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Lacre</FormLabel>
                  <FormControl>
                    <Input placeholder="Número do lacre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installation_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Instalação</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem de Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Número da OS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technician_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um técnico" />
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
              <Button type="submit">{seal ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
