import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { useVehicles } from '@/hooks/useVehicles';

type MaintenanceRecord = Tables<'maintenance_records'>;

const schema = z.object({
  vehicle_id: z.string().min(1, 'Veículo é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  description: z.string().optional(),
  workshop: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  odometer: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

const maintenanceTypes = ['Preventiva', 'Corretiva', 'Troca de Óleo', 'Troca de Pneus', 'Freios', 'Suspensão', 'Elétrica', 'Ar Condicionado', 'Revisão Geral', 'Outro'];

export function MaintenanceForm({ open, onOpenChange, onSubmit, initialData, loading }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: FormData) => void; initialData?: MaintenanceRecord | null; loading?: boolean }) {
  const { vehicles } = useVehicles();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_id: '', date: new Date().toISOString().split('T')[0], type: '', description: '', workshop: '', cost: 0, odometer: 0 },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        vehicle_id: initialData.vehicle_id,
        date: initialData.date,
        type: initialData.type,
        description: initialData.description || '',
        workshop: initialData.workshop || '',
        cost: Number(initialData.cost) || 0,
        odometer: initialData.odometer || 0,
      });
    } else {
      form.reset({ vehicle_id: '', date: new Date().toISOString().split('T')[0], type: '', description: '', workshop: '', cost: 0, odometer: 0 });
    }
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="vehicle_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{maintenanceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o serviço..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="workshop" render={({ field }) => (
                <FormItem><FormLabel>Oficina</FormLabel><FormControl><Input placeholder="Nome" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem><FormLabel>Custo (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="odometer" render={({ field }) => (
                <FormItem><FormLabel>Km Atual</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : initialData ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
