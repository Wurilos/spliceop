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
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import type { PhoneLine } from '@/hooks/usePhoneLines';

const CARRIERS = ['Vivo', 'Oi', 'TIM', 'Claro', 'DATATEM'] as const;
const SUB_CARRIERS = ['Vivo', 'Oi', 'TIM', 'Claro'] as const;

const formSchema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  equipment_id: z.string().min(1, 'Equipamento é obrigatório'),
  line_number: z.string().min(1, 'Número da linha é obrigatório'),
  carrier: z.string().min(1, 'Operadora é obrigatória'),
  sub_carrier: z.string().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface PhoneLineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  phoneLine?: PhoneLine | null;
  isLoading?: boolean;
}

export function PhoneLineForm({
  open,
  onOpenChange,
  onSubmit,
  phoneLine,
  isLoading,
}: PhoneLineFormProps) {
  const { contracts } = useContracts();
  const { equipment } = useEquipment();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      equipment_id: '',
      line_number: '',
      carrier: '',
      sub_carrier: null,
    },
  });

  const selectedCarrier = form.watch('carrier');

  useEffect(() => {
    if (phoneLine) {
      form.reset({
        contract_id: phoneLine.contract_id || '',
        equipment_id: phoneLine.equipment_id || '',
        line_number: phoneLine.line_number,
        carrier: phoneLine.carrier,
        sub_carrier: phoneLine.sub_carrier,
      });
    } else {
      form.reset({
        contract_id: '',
        equipment_id: '',
        line_number: '',
        carrier: '',
        sub_carrier: null,
      });
    }
  }, [phoneLine, form]);

  // Clear sub_carrier when carrier changes to non-DATATEM
  useEffect(() => {
    if (selectedCarrier !== 'DATATEM') {
      form.setValue('sub_carrier', null);
    }
  }, [selectedCarrier, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {phoneLine ? 'Editar Linha' : 'Nova Linha'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.number} - {contract.client_name}
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
              name="equipment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Equipamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {equipment.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.serial_number}
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
              name="line_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Linha</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: (11) 99999-9999" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {selectedCarrier === 'DATATEM' && (
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
                        {SUB_CARRIERS.map((subCarrier) => (
                          <SelectItem key={subCarrier} value={subCarrier}>
                            {subCarrier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
