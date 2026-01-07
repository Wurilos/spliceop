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
import { useCustomerSatisfaction } from '@/hooks/useCustomerSatisfaction';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Selecione um contrato'),
  quarter: z.string().min(1, 'Trimestre é obrigatório'),
  year: z.coerce.number().min(2000, 'Ano inválido'),
  score: z.coerce.number().min(0).max(10).nullable().optional(),
  feedback: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SatisfactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: any;
}

export function SatisfactionForm({ open, onOpenChange, record }: SatisfactionFormProps) {
  const { createSatisfaction, updateSatisfaction } = useCustomerSatisfaction();
  const { contracts } = useContracts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      quarter: 'Q1',
      year: new Date().getFullYear(),
      score: 0,
      feedback: '',
    },
  });

  useEffect(() => {
    if (record) {
      form.reset({
        contract_id: record.contract_id,
        quarter: record.quarter,
        year: record.year,
        score: record.score || 0,
        feedback: record.feedback || '',
      });
    } else {
      form.reset({
        contract_id: '',
        quarter: 'Q1',
        year: new Date().getFullYear(),
        score: 0,
        feedback: '',
      });
    }
  }, [record, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      contract_id: values.contract_id,
      quarter: values.quarter,
      year: values.year,
      score: values.score || null,
      feedback: values.feedback || null,
    };

    if (record) {
      updateSatisfaction({ id: record.id, ...data });
    } else {
      createSatisfaction(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Editar Pesquisa' : 'Nova Pesquisa de Satisfação'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trimestre</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Q1">1º Trimestre</SelectItem>
                        <SelectItem value="Q2">2º Trimestre</SelectItem>
                        <SelectItem value="Q3">3º Trimestre</SelectItem>
                        <SelectItem value="Q4">4º Trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" max="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
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
              <Button type="submit">{record ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
