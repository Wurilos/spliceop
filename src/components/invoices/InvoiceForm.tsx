import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { useContractAmendments } from '@/hooks/useContractAmendments';

type Invoice = Tables<'invoices'>;

const schema = z.object({
  number: z.string().min(1, 'Número é obrigatório'),
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  issue_date: z.string().min(1, 'Data de emissão é obrigatória'),
  due_date: z.string().optional(),
  value: z.coerce.number().min(0, 'Valor deve ser maior ou igual a 0'),
  monthly_value: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().optional(),
  payment_date: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function InvoiceForm({ open, onOpenChange, onSubmit, initialData, loading }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: FormData) => void; initialData?: Invoice | null; loading?: boolean }) {
  const { contracts } = useContracts();
  const { getEffectiveValue, allAmendments } = useContractAmendments();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { number: '', contract_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', value: 0, monthly_value: 0, discount: 0, payment_date: '', status: 'pending', notes: '' },
  });

  const contractId = useWatch({ control: form.control, name: 'contract_id' });
  const monthlyValue = useWatch({ control: form.control, name: 'monthly_value' });
  const contractValue = useWatch({ control: form.control, name: 'value' });

  // Auto-fill contract value when contract is selected (uses latest amendment value if available)
  useEffect(() => {
    if (contractId && !initialData) {
      const selectedContract = contracts.find(c => c.id === contractId);
      if (selectedContract) {
        const originalValue = Number(selectedContract.value) || 0;
        // Check amendments directly for this contract
        const contractAmendments = allAmendments.filter(a => a.contract_id === contractId);
        let effectiveValue = originalValue;
        if (contractAmendments.length > 0) {
          const latestAmendment = contractAmendments.reduce((prev, curr) =>
            curr.amendment_number > prev.amendment_number ? curr : prev
          );
          effectiveValue = Number(latestAmendment.value) || originalValue;
        }
        form.setValue('value', effectiveValue);
      }
    }
  }, [contractId, contracts, form, initialData, allAmendments]);

  // Auto-calculate discount/addition based on contract value and monthly value
  useEffect(() => {
    const contractVal = Number(contractValue) || 0;
    const monthlyVal = Number(monthlyValue) || 0;
    
    if (contractVal > 0 && monthlyVal > 0) {
      const difference = monthlyVal - contractVal;
      form.setValue('discount', difference);
    }
  }, [monthlyValue, contractValue, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        number: initialData.number,
        contract_id: initialData.contract_id,
        issue_date: initialData.issue_date,
        due_date: initialData.due_date || '',
        value: Number(initialData.value),
        monthly_value: Number(initialData.monthly_value) || 0,
        discount: Number(initialData.discount) || 0,
        payment_date: initialData.payment_date || '',
        status: (initialData.status as 'pending' | 'paid' | 'overdue' | 'cancelled') || 'pending',
        notes: initialData.notes || '',
      });
    } else {
      form.reset({ number: '', contract_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', value: 0, monthly_value: 0, discount: 0, payment_date: '', status: 'pending', notes: '' });
    }
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="NF-001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="issue_date" render={({ field }) => (
                <FormItem><FormLabel>Data Emissão</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem><FormLabel>Vencimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Contrato (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} readOnly className="bg-muted" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="monthly_value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor do Mês (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="discount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto/Acréscimo (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} readOnly className="bg-muted" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="payment_date" render={({ field }) => (
                <FormItem><FormLabel>Data Pagamento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações..." {...field} /></FormControl><FormMessage /></FormItem>
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
