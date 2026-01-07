import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { useVehicles } from '@/hooks/useVehicles';

type FuelRecord = Tables<'fuel_records'>;

const schema = z.object({
  vehicle_id: z.string().min(1, 'Veículo é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  fuel_type: z.string().optional(),
  liters: z.coerce.number().min(0.01, 'Litros deve ser maior que 0'),
  price_per_liter: z.coerce.number().min(0).optional(),
  total_value: z.coerce.number().min(0).optional(),
  odometer: z.coerce.number().min(0).optional(),
  station: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface FuelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: FuelRecord | null;
  loading?: boolean;
}

const fuelTypes = ['Gasolina', 'Etanol', 'Diesel', 'GNV', 'Flex'];

export function FuelForm({ open, onOpenChange, onSubmit, initialData, loading }: FuelFormProps) {
  const { vehicles } = useVehicles();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { vehicle_id: '', date: new Date().toISOString().split('T')[0], fuel_type: '', liters: 0, price_per_liter: 0, total_value: 0, odometer: 0, station: '' },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        vehicle_id: initialData.vehicle_id,
        date: initialData.date,
        fuel_type: initialData.fuel_type || '',
        liters: Number(initialData.liters) || 0,
        price_per_liter: Number(initialData.price_per_liter) || 0,
        total_value: Number(initialData.total_value) || 0,
        odometer: initialData.odometer || 0,
        station: initialData.station || '',
      });
    } else {
      form.reset({ vehicle_id: '', date: new Date().toISOString().split('T')[0], fuel_type: '', liters: 0, price_per_liter: 0, total_value: 0, odometer: 0, station: '' });
    }
  }, [initialData, form]);

  const liters = form.watch('liters');
  const pricePerLiter = form.watch('price_per_liter');
  
  useEffect(() => {
    if (liters && pricePerLiter) {
      form.setValue('total_value', Number((liters * pricePerLiter).toFixed(2)));
    }
  }, [liters, pricePerLiter, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Editar Abastecimento' : 'Novo Abastecimento'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="vehicle_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="fuel_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Combustível</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                    <SelectContent>{fuelTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="liters" render={({ field }) => (
                <FormItem><FormLabel>Litros</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="price_per_liter" render={({ field }) => (
                <FormItem><FormLabel>R$/Litro</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="total_value" render={({ field }) => (
                <FormItem><FormLabel>Total (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="odometer" render={({ field }) => (
                <FormItem><FormLabel>Km Atual</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="station" render={({ field }) => (
                <FormItem><FormLabel>Posto</FormLabel><FormControl><Input placeholder="Nome do posto" {...field} /></FormControl><FormMessage /></FormItem>
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
