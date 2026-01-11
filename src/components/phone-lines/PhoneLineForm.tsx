import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { useChipNumbers } from '@/hooks/useChipNumbers';
import { usePhoneLines, type PhoneLine } from '@/hooks/usePhoneLines';

const SUB_CARRIERS = ['Vivo', 'Oi', 'TIM', 'Claro'] as const;
const STATUSES = [
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' },
] as const;

const formSchema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  equipment_id: z.string().min(1, 'Equipamento é obrigatório'),
  chip_id: z.string().min(1, 'Chip é obrigatório'),
  sub_carrier: z.string().nullable(),
  status: z.string().min(1, 'Status é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface PhoneLineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
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
  const { chipNumbers } = useChipNumbers();
  const { phoneLines } = usePhoneLines();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: '',
      equipment_id: '',
      chip_id: '',
      sub_carrier: null,
      status: 'active',
    },
  });

  const selectedContractId = form.watch('contract_id');
  const selectedChipId = form.watch('chip_id');

  // Filter equipment by selected contract
  const filteredEquipment = useMemo(() => {
    if (!selectedContractId) return [];
    return equipment.filter(eq => eq.contract_id === selectedContractId);
  }, [equipment, selectedContractId]);

  // Get selected chip info
  const selectedChip = useMemo(() => {
    return chipNumbers.find(c => c.id === selectedChipId);
  }, [chipNumbers, selectedChipId]);

  // Check if chip is already linked to another equipment
  const chipConflict = useMemo(() => {
    if (!selectedChipId) return null;
    
    const linkedPhoneLine = phoneLines.find(pl => 
      pl.chip_id === selectedChipId && 
      (!phoneLine || pl.id !== phoneLine.id) // Exclude current phone line when editing
    );
    
    if (linkedPhoneLine) {
      return {
        equipmentSerial: linkedPhoneLine.equipment?.serial_number || 'Equipamento desconhecido',
        contractInfo: linkedPhoneLine.contracts 
          ? `${linkedPhoneLine.contracts.number} - ${linkedPhoneLine.contracts.client_name}`
          : '',
      };
    }
    
    return null;
  }, [selectedChipId, phoneLines, phoneLine]);

  // Filter available chips (not linked to other equipment)
  const availableChips = useMemo(() => {
    return chipNumbers.filter(chip => {
      const isLinked = phoneLines.some(pl => 
        pl.chip_id === chip.id && 
        (!phoneLine || pl.id !== phoneLine.id)
      );
      // Show if not linked OR if it's the chip of the current phone line being edited
      return !isLinked || (phoneLine && phoneLine.chip_id === chip.id);
    });
  }, [chipNumbers, phoneLines, phoneLine]);

  useEffect(() => {
    if (phoneLine) {
      form.reset({
        contract_id: phoneLine.contract_id || '',
        equipment_id: phoneLine.equipment_id || '',
        chip_id: phoneLine.chip_id || '',
        sub_carrier: phoneLine.sub_carrier,
        status: phoneLine.status || 'active',
      });
    } else {
      form.reset({
        contract_id: '',
        equipment_id: '',
        chip_id: '',
        sub_carrier: null,
        status: 'active',
      });
    }
  }, [phoneLine, form]);

  // Clear equipment when contract changes
  useEffect(() => {
    if (!phoneLine) {
      form.setValue('equipment_id', '');
    }
  }, [selectedContractId, form, phoneLine]);

  // Clear sub_carrier when chip carrier changes to non-DATATEM
  useEffect(() => {
    if (selectedChip && selectedChip.carrier !== 'DATATEM') {
      form.setValue('sub_carrier', null);
    }
  }, [selectedChip, form]);

  const handleSubmit = (data: FormData) => {
    if (chipConflict) {
      return; // Don't submit if there's a conflict
    }

    // Get chip info to pass line_number and carrier
    const chip = chipNumbers.find(c => c.id === data.chip_id);
    
    onSubmit({
      contract_id: data.contract_id,
      equipment_id: data.equipment_id,
      chip_id: data.chip_id,
      line_number: chip?.line_number || '',
      carrier: chip?.carrier || '',
      sub_carrier: data.sub_carrier,
      status: data.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {phoneLine ? 'Editar Linha / Equipamento' : 'Nova Linha / Equipamento'}
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
                  <FormLabel>Equipamento</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedContractId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          selectedContractId 
                            ? "Selecione o equipamento" 
                            : "Selecione um contrato primeiro"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredEquipment.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.serial_number} {eq.model ? `- ${eq.model}` : ''}
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
              name="chip_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chip / Linha</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o chip" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableChips.map((chip) => (
                        <SelectItem key={chip.id} value={chip.id}>
                          {chip.line_number} ({chip.carrier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {chipConflict && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Linha já vinculada a outro equipamento: <strong>{chipConflict.equipmentSerial}</strong>
                  {chipConflict.contractInfo && (
                    <span className="block text-xs mt-1">
                      Contrato: {chipConflict.contractInfo}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {selectedChip?.carrier === 'DATATEM' && (
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
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
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
              <Button type="submit" disabled={isLoading || !!chipConflict}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
