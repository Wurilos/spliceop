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
import { useEquipment } from '@/hooks/useEquipment';

type Calibration = Tables<'calibrations'>;

const schema = z.object({
  equipment_id: z.string().min(1, 'Equipamento é obrigatório'),
  calibration_date: z.string().min(1, 'Data é obrigatória'),
  expiration_date: z.string().min(1, 'Validade é obrigatória'),
  certificate_number: z.string().optional(),
  inmetro_number: z.string().optional(),
  status: z.enum(['valid', 'expired', 'pending']).optional(),
});

type FormData = z.infer<typeof schema>;

interface CalibrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: Calibration | null;
  loading?: boolean;
}

export function CalibrationForm({ open, onOpenChange, onSubmit, initialData, loading }: CalibrationFormProps) {
  const { equipment } = useEquipment();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { equipment_id: '', calibration_date: '', expiration_date: '', certificate_number: '', inmetro_number: '', status: 'valid' },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        equipment_id: initialData.equipment_id,
        calibration_date: initialData.calibration_date,
        expiration_date: initialData.expiration_date,
        certificate_number: initialData.certificate_number || '',
        inmetro_number: initialData.inmetro_number || '',
        status: (initialData.status as 'valid' | 'expired' | 'pending') || 'valid',
      });
    } else {
      form.reset({ equipment_id: '', calibration_date: '', expiration_date: '', certificate_number: '', inmetro_number: '', status: 'valid' });
    }
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Editar Aferição' : 'Nova Aferição'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="equipment_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Equipamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.serial_number} - {e.type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="calibration_date" render={({ field }) => (
                <FormItem><FormLabel>Data Aferição</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="expiration_date" render={({ field }) => (
                <FormItem><FormLabel>Validade</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="certificate_number" render={({ field }) => (
                <FormItem><FormLabel>Nº Certificado</FormLabel><FormControl><Input placeholder="CERT-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="inmetro_number" render={({ field }) => (
                <FormItem><FormLabel>Nº INMETRO</FormLabel><FormControl><Input placeholder="INMETRO-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="valid">Válido</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
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
