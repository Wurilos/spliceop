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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EpiItem } from '@/hooks/useEpiItems';
import { EpiOutput } from '@/hooks/useEpiOutputs';

interface Employee {
  id: string;
  full_name: string;
}

const schema = z.object({
  item_id: z.string().min(1, 'Item é obrigatório'),
  employee_id: z.string().min(1, 'Colaborador é obrigatório'),
  output_date: z.string().min(1, 'Data é obrigatória'),
  quantity: z.coerce.number().min(1, 'Quantidade deve ser maior que zero'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EpiOutputFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: EpiOutput | null;
  items: EpiItem[];
  employees: Employee[];
  loading?: boolean;
}

export function EpiOutputForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  items,
  employees,
  loading,
}: EpiOutputFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      item_id: '',
      employee_id: '',
      output_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      notes: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        item_id: initialData.item_id,
        employee_id: initialData.employee_id,
        output_date: initialData.output_date,
        quantity: initialData.quantity,
        notes: initialData.notes || '',
      });
    } else {
      form.reset({
        item_id: '',
        employee_id: '',
        output_date: new Date().toISOString().split('T')[0],
        quantity: 1,
        notes: '',
      });
    }
  }, [initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Saída' : 'Nova Saída de EPI'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="output_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[60]">
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} - {item.description}
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
                    <SelectContent className="z-[60]">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.full_name}
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
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
                    <Textarea
                      placeholder="Observações sobre a saída"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : initialData ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
