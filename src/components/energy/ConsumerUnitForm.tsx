import { useEffect, useState } from 'react';
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
import { useEnergyConsumerUnits, EnergyConsumerUnit } from '@/hooks/useEnergyConsumerUnits';
import { useEnergySuppliers } from '@/hooks/useEnergySuppliers';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';

const formSchema = z.object({
  supplier_id: z.string().optional(),
  consumer_unit: z.string().min(1, 'Unidade consumidora é obrigatória'),
  contract_id: z.string().optional(),
  equipment_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsumerUnitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: EnergyConsumerUnit | null;
}

export function ConsumerUnitForm({ open, onOpenChange, unit }: ConsumerUnitFormProps) {
  const { createConsumerUnit, updateConsumerUnit } = useEnergyConsumerUnits();
  const { suppliers } = useEnergySuppliers();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const [selectedContractId, setSelectedContractId] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: '',
      consumer_unit: '',
      contract_id: '',
      equipment_id: '',
    },
  });

  useEffect(() => {
    if (unit) {
      form.reset({
        supplier_id: unit.supplier_id || '',
        consumer_unit: unit.consumer_unit,
        contract_id: unit.contract_id || '',
        equipment_id: unit.equipment_id || '',
      });
      setSelectedContractId(unit.contract_id || '');
    } else {
      form.reset({
        supplier_id: '',
        consumer_unit: '',
        contract_id: '',
        equipment_id: '',
      });
      setSelectedContractId('');
    }
  }, [unit, form]);

  const filteredEquipment = selectedContractId
    ? equipment.filter((e) => e.contract_id === selectedContractId)
    : equipment;

  const onSubmit = (values: FormValues) => {
    const data = {
      supplier_id: values.supplier_id || null,
      consumer_unit: values.consumer_unit,
      contract_id: values.contract_id || null,
      equipment_id: values.equipment_id || null,
    };

    if (unit) {
      updateConsumerUnit({ id: unit.id, ...data });
    } else {
      createConsumerUnit(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {unit ? 'Editar Unidade Consumidora' : 'Nova Unidade Consumidora'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
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
              name="consumer_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade Consumidora</FormLabel>
                  <FormControl>
                    <Input placeholder="Número da UC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedContractId(value);
                      form.setValue('equipment_id', '');
                    }}
                    value={field.value}
                  >
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
              name="equipment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um equipamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredEquipment.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.serial_number} - {e.type || e.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{unit ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
