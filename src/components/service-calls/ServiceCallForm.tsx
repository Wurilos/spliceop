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
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { useEmployees } from '@/hooks/useEmployees';

type ServiceCall = Tables<'service_calls'>;

const schema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  type: z.string().optional(),
  description: z.string().optional(),
  resolution: z.string().optional(),
  contract_id: z.string().optional(),
  equipment_id: z.string().optional(),
  employee_id: z.string().optional(),
  mob_code: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
});

type FormData = z.infer<typeof schema>;

const callTypes = ['Instalação', 'Manutenção Corretiva', 'Manutenção Preventiva', 'Aferição', 'Relocação', 'Desinstalação', 'Suporte'];

export function ServiceCallForm({ open, onOpenChange, onSubmit, initialData, loading }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: FormData) => void; initialData?: ServiceCall | null; loading?: boolean }) {
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const { employees } = useEmployees();
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0], type: '', description: '', resolution: '', contract_id: '', equipment_id: '', employee_id: '', mob_code: '', status: 'open' },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        date: initialData.date,
        type: initialData.type || '',
        description: initialData.description || '',
        resolution: initialData.resolution || '',
        contract_id: initialData.contract_id || '',
        equipment_id: initialData.equipment_id || '',
        employee_id: initialData.employee_id || '',
        mob_code: initialData.mob_code || '',
        status: (initialData.status as 'open' | 'in_progress' | 'closed') || 'open',
      });
    } else {
      form.reset({ date: new Date().toISOString().split('T')[0], type: '', description: '', resolution: '', contract_id: '', equipment_id: '', employee_id: '', mob_code: '', status: 'open' });
    }
  }, [initialData, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({ ...data, contract_id: data.contract_id || null, equipment_id: data.equipment_id || null, employee_id: data.employee_id || null } as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initialData ? 'Editar Atendimento' : 'Novo Atendimento'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{callTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="contract_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{contracts.map((c) => <SelectItem key={c.id} value={c.id}>{c.number} - {c.client_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="equipment_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{equipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.serial_number}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="employee_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Colaborador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mob_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cód. Mob</FormLabel>
                  <FormControl><Input placeholder="Código Mob" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o atendimento..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="resolution" render={({ field }) => (
              <FormItem><FormLabel>Resolução</FormLabel><FormControl><Textarea placeholder="Descreva a resolução..." {...field} /></FormControl><FormMessage /></FormItem>
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
