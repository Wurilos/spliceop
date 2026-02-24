import { useEffect, useMemo } from 'react';
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
import { useAdvances } from '@/hooks/useAdvances';
import { useEmployees } from '@/hooks/useEmployees';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Selecione um contrato'),
  employee_id: z.string().min(1, 'Selecione um colaborador'),
  intranet: z.string().nullable().optional(),
  request_date: z.string().min(1, 'Data da solicitação é obrigatória'),
  requested_value: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  reason: z.string().nullable().optional(),
  closing_date: z.string().nullable().optional(),
  proven_value: z.coerce.number().nullable().optional(),
  status: z.string().nullable().optional().default('Pendente'),
});

type FormValues = z.infer<typeof formSchema>;

interface AdvanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance?: any;
}

export function AdvanceForm({ open, onOpenChange, advance }: AdvanceFormProps) {
  const { createAdvance, updateAdvance } = useAdvances();
  const { employees } = useEmployees();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      employee_id: '',
      intranet: '',
      request_date: new Date().toISOString().split('T')[0],
      requested_value: 0,
      reason: '',
      closing_date: '',
      proven_value: 0,
      status: 'Pendente',
    },
  });

  const selectedContractId = form.watch('contract_id');
  const requestedValue = form.watch('requested_value') || 0;
  const provenValue = form.watch('proven_value') || 0;

  // Show all employees regardless of contract
  const filteredEmployees = employees;

  // Calculate balance to return
  const balanceToReturn = useMemo(() => {
    return Math.max(0, requestedValue - provenValue);
  }, [requestedValue, provenValue]);

  useEffect(() => {
    // Wait for relational data to load before populating the form
    if (advance && employees.length > 0 && contracts.length > 0) {
      form.reset({
        contract_id: advance.contract_id || '',
        employee_id: advance.employee_id,
        intranet: advance.intranet || '',
        request_date: advance.request_date,
        requested_value: advance.requested_value,
        reason: advance.reason || '',
        closing_date: advance.closing_date || '',
        proven_value: advance.proven_value || 0,
        status: advance.status || 'Pendente',
      });
    } else if (!advance) {
      form.reset({
        contract_id: '',
        employee_id: '',
        intranet: '',
        request_date: new Date().toISOString().split('T')[0],
        requested_value: 0,
        reason: '',
        closing_date: '',
        proven_value: 0,
        status: 'Pendente',
      });
    }
  }, [advance, form, employees, contracts]);


  const onSubmit = (values: FormValues) => {
    const data = {
      contract_id: values.contract_id || null,
      employee_id: values.employee_id,
      intranet: values.intranet || null,
      request_date: values.request_date,
      requested_value: values.requested_value,
      reason: values.reason || null,
      closing_date: values.closing_date || null,
      proven_value: values.proven_value || 0,
      status: values.status || 'Pendente',
    };

    if (advance) {
      updateAdvance({ id: advance.id, ...data });
    } else {
      createAdvance(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {advance ? 'Editar Adiantamento' : 'Novo Adiantamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um contrato" />
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
                name="employee_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colaborador</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um colaborador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredEmployees.map((e) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="intranet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intranet</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Código/número intranet" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="request_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Solicitação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requested_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Solicitado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Motivo do adiantamento" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closing_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Fechamento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proven_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Comprovado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value || 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Saldo a Devolver</label>
                <Input
                  type="text"
                  disabled
                  value={balanceToReturn.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  className="bg-muted"
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'Pendente'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Fechado">Fechado</SelectItem>
                        <SelectItem value="Cancelado">Cancelado</SelectItem>
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
              <Button type="submit">{advance ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
