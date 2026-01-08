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
import { useSeals } from '@/hooks/useSeals';

const formSchema = z.object({
  seal_number: z.string().min(1, 'Número do lacre é obrigatório'),
  seal_type: z.string().optional(),
  received_date: z.string().min(1, 'Data de recebimento é obrigatória'),
  memo_number: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seal?: any;
}

export function SealForm({ open, onOpenChange, seal }: SealFormProps) {
  const { createSeal, updateSeal } = useSeals();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seal_number: '',
      seal_type: '',
      received_date: new Date().toISOString().split('T')[0],
      memo_number: '',
    },
  });

  useEffect(() => {
    if (seal) {
      form.reset({
        seal_number: seal.seal_number || '',
        seal_type: seal.seal_type || '',
        received_date: seal.received_date || new Date().toISOString().split('T')[0],
        memo_number: seal.memo_number || '',
      });
    } else {
      form.reset({
        seal_number: '',
        seal_type: '',
        received_date: new Date().toISOString().split('T')[0],
        memo_number: '',
      });
    }
  }, [seal, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      seal_number: values.seal_number,
      seal_type: values.seal_type || null,
      received_date: values.received_date,
      memo_number: values.memo_number || null,
      status: seal?.status || 'available',
      equipment_id: seal?.equipment_id || null,
      installation_date: seal?.installation_date || null,
      service_order: seal?.service_order || null,
      technician_id: seal?.technician_id || null,
      notes: seal?.notes || null,
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
            {seal ? 'Editar Lacre' : 'Adicionar Lacre'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="seal_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Lacre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: I7228644-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Lacre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Azul" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="received_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Recebimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memo_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Memorando</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 396/2025" {...field} />
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
              <Button type="submit">{seal ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
