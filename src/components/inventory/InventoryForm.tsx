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

type Inventory = Tables<'inventory'>;

const schema = z.object({
  sku: z.string().optional(),
  component_name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
  min_quantity: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const categories = ['Eletrônico', 'Mecânico', 'Óptico', 'Estrutural', 'Cabo/Conector', 'Fixação', 'Consumível', 'Outro'];

export function InventoryForm({ open, onOpenChange, onSubmit, initialData, loading }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: FormData) => void; initialData?: Inventory | null; loading?: boolean }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { sku: '', component_name: '', category: '', quantity: 0, min_quantity: 0, unit_price: 0, location: '' },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        sku: initialData.sku || '',
        component_name: initialData.component_name,
        category: initialData.category || '',
        quantity: initialData.quantity || 0,
        min_quantity: initialData.min_quantity || 0,
        unit_price: Number(initialData.unit_price) || 0,
        location: initialData.location || '',
      });
    } else {
      form.reset({ sku: '', component_name: '', category: '', quantity: 0, min_quantity: 0, unit_price: 0, location: '' });
    }
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Editar Item' : 'Novo Item'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem><FormLabel>SKU</FormLabel><FormControl><Input placeholder="SKU-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="component_name" render={({ field }) => (
              <FormItem><FormLabel>Nome do Componente</FormLabel><FormControl><Input placeholder="Sensor de velocidade" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="min_quantity" render={({ field }) => (
                <FormItem><FormLabel>Qtd. Mínima</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="unit_price" render={({ field }) => (
                <FormItem><FormLabel>Preço Unit. (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>Localização</FormLabel><FormControl><Input placeholder="Prateleira A1" {...field} /></FormControl><FormMessage /></FormItem>
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
