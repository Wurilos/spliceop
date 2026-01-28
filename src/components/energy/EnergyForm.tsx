import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEnergyBills } from '@/hooks/useEnergyBills';
import { useEnergyConsumerUnits } from '@/hooks/useEnergyConsumerUnits';
import { useContracts } from '@/hooks/useContracts';

const formSchema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  consumer_unit: z.string().min(1, 'Unidade consumidora é obrigatória'),
  reference_month: z.string().min(1, 'Mês de referência é obrigatório'),
  value: z.coerce.number().nullable().optional(),
  zero_invoice: z.boolean().optional().default(false),
  due_date: z.string().nullable().optional(),
  status: z.string().nullable().optional().default('pending'),
});

type FormValues = z.infer<typeof formSchema>;

interface EnergyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: any;
  prefillData?: {
    consumerUnit?: string;
    referenceMonth?: string;
    contractId?: string | null;
  } | null;
}

export function EnergyForm({ open, onOpenChange, bill, prefillData }: EnergyFormProps) {
  const { energyBills, createEnergyBill, updateEnergyBill } = useEnergyBills();
  const { consumerUnits } = useEnergyConsumerUnits();
  const { contracts } = useContracts();
  const [consumerUnitOpen, setConsumerUnitOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      consumer_unit: '',
      reference_month: new Date().toISOString().slice(0, 7) + '-01',
      value: 0,
      zero_invoice: false,
      due_date: '',
      status: 'pending',
    },
  });

  const zeroInvoice = form.watch('zero_invoice');

  // When zero_invoice is checked, set value to 0
  useEffect(() => {
    if (zeroInvoice) {
      form.setValue('value', 0);
    }
  }, [zeroInvoice, form]);

  const selectedContractId = form.watch('contract_id');

  // Filter consumer units by selected contract
  const filteredConsumerUnits = useMemo(() => {
    if (!selectedContractId) return consumerUnits;
    return consumerUnits.filter((cu: any) => cu.contract_id === selectedContractId);
  }, [consumerUnits, selectedContractId]);

  // Get unique consumer unit codes for autocomplete
  const consumerUnitOptions = useMemo(() => {
    return filteredConsumerUnits.map((cu: any) => cu.consumer_unit);
  }, [filteredConsumerUnits]);

  // Normalize status from database to match Select options
  const normalizeStatus = (status: string | null): string => {
    if (!status) return 'pending';
    const statusMap: Record<string, string> = {
      'enviada': 'sent',
      'pendente': 'pending',
      'zerada': 'zeroed',
      'sent': 'sent',
      'pending': 'pending',
      'zeroed': 'zeroed',
    };
    return statusMap[status.toLowerCase()] || 'pending';
  };

  useEffect(() => {
    // Wait for relational data to load before populating the form
    if (bill && contracts.length > 0) {
      form.reset({
        contract_id: bill.contract_id || '',
        consumer_unit: bill.consumer_unit,
        reference_month: bill.reference_month,
        value: bill.value || 0,
        zero_invoice: bill.zero_invoice || false,
        due_date: bill.due_date || '',
        status: normalizeStatus(bill.status),
      });
    } else if (prefillData) {
      // Pre-fill from dashboard click
      form.reset({
        contract_id: prefillData.contractId || '',
        consumer_unit: prefillData.consumerUnit || '',
        reference_month: prefillData.referenceMonth || new Date().toISOString().slice(0, 7) + '-01',
        value: 0,
        zero_invoice: false,
        due_date: '',
        status: 'pending',
      });
    } else if (!bill) {
      form.reset({
        contract_id: '',
        consumer_unit: '',
        reference_month: new Date().toISOString().slice(0, 7) + '-01',
        value: 0,
        zero_invoice: false,
        due_date: '',
        status: 'pending',
      });
    }
  }, [bill, prefillData, form, contracts]);

  const onSubmit = (values: FormValues) => {
    // Check for duplicate: same consumer_unit and reference_month
    const isDuplicate = energyBills.some((b: any) => {
      if (bill && b.id === bill.id) return false; // Exclude current bill when editing
      return b.consumer_unit === values.consumer_unit && 
             b.reference_month === values.reference_month;
    });

    if (isDuplicate) {
      toast.error('Já existe uma conta cadastrada para esta unidade consumidora e mês de referência.');
      return;
    }

    const data = {
      contract_id: values.contract_id || null,
      consumer_unit: values.consumer_unit,
      reference_month: values.reference_month,
      value: values.zero_invoice ? 0 : (values.value || null),
      zero_invoice: values.zero_invoice || false,
      due_date: values.due_date || null,
      status: values.status || 'pending',
      supplier_id: null,
      equipment_id: null,
    };

    if (bill) {
      updateEnergyBill({ id: bill.id, ...data });
    } else {
      createEnergyBill(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {bill ? 'Editar Conta de Energia' : 'Nova Conta de Energia'}
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
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear consumer unit when contract changes
                      form.setValue('consumer_unit', '');
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[60]">
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
              name="consumer_unit"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Unidade Consumidora</FormLabel>
                  <Popover open={consumerUnitOpen} onOpenChange={setConsumerUnitOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={consumerUnitOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Digite ou selecione uma UC"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar unidade consumidora..." 
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2 text-sm">
                              Nenhuma UC encontrada. 
                              {field.value && (
                                <Button
                                  variant="link"
                                  className="p-0 h-auto ml-1"
                                  onClick={() => {
                                    setConsumerUnitOpen(false);
                                  }}
                                >
                                  Usar "{field.value}"
                                </Button>
                              )}
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {consumerUnitOptions.map((uc: string) => (
                              <CommandItem
                                key={uc}
                                value={uc}
                                onSelect={() => {
                                  field.onChange(uc);
                                  setConsumerUnitOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === uc ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {uc}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de Referência</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      disabled={zeroInvoice}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zero_invoice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Fatura Zerada</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[60]">
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="sent">Enviada</SelectItem>
                      <SelectItem value="zeroed">Zerada</SelectItem>
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
              <Button type="submit">{bill ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
