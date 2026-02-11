import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ChipNumber } from '@/hooks/useChipNumbers';

const CARRIERS = ['Vivo', 'Oi', 'TIM', 'Claro', 'DATATEM'] as const;

const SUB_CARRIERS: Record<string, string[]> = {
  'DATATEM': ['Vivo', 'Oi', 'TIM', 'Claro'],
};

const STATUSES = ['Ativo', 'Inativo', 'Suspenso', 'Sobressalente'] as const;

const formSchema = z.object({
  line_number: z.string().min(1, 'Número da linha é obrigatório'),
  iccid: z.string().optional(),
  carrier: z.string().min(1, 'Operadora é obrigatória'),
  sub_carrier: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface ChipNumberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  chipNumber?: ChipNumber | null;
  isLoading?: boolean;
}

export function ChipNumberForm({
  open,
  onOpenChange,
  onSubmit,
  chipNumber,
  isLoading,
}: ChipNumberFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      line_number: '',
      iccid: '',
      carrier: '',
      sub_carrier: '',
      status: 'Ativo',
    },
  });

  useEffect(() => {
    if (chipNumber) {
      form.reset({
        line_number: chipNumber.line_number,
        iccid: chipNumber.iccid || '',
        carrier: chipNumber.carrier,
        sub_carrier: chipNumber.sub_carrier || '',
        status: chipNumber.status || 'Ativo',
      });
    } else {
      form.reset({
        line_number: '',
        iccid: '',
        carrier: '',
        sub_carrier: '',
        status: 'Ativo',
      });
    }
  }, [chipNumber, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {chipNumber ? 'Editar Chip' : 'Novo Chip'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="line_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Linha</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: (11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iccid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ICCID</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 8955031234567890123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operadora</FormLabel>
                  <Select onValueChange={(val) => {
                    field.onChange(val);
                    // Reset sub_carrier when carrier changes
                    if (!SUB_CARRIERS[val]) {
                      form.setValue('sub_carrier', '');
                    }
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a operadora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CARRIERS.map((carrier) => (
                        <SelectItem key={carrier} value={carrier}>
                          {carrier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {SUB_CARRIERS[form.watch('carrier')] && (
              <FormField
                control={form.control}
                name="sub_carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub Operadora</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a sub operadora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SUB_CARRIERS[form.watch('carrier')].map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
