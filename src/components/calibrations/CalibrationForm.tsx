import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables } from '@/integrations/supabase/types';
import { useEquipment } from '@/hooks/useEquipment';
import { useContracts } from '@/hooks/useContracts';
import { addYears, format } from 'date-fns';

type Calibration = Tables<'calibrations'>;

const schema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  equipment_id: z.string().min(1, 'Equipamento é obrigatório'),
  calibration_date: z.string().min(1, 'Data é obrigatória'),
  expiration_date: z.string().min(1, 'Validade é obrigatória'),
  certificate_number: z.string().optional(),
  inmetro_number: z.string().optional(),
  status: z.enum(['valid', 'expired', 'pending']).optional(),
});

type FormData = z.infer<typeof schema>;

interface CalibrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<FormData, 'contract_id'>) => void;
  initialData?: Calibration | null;
  loading?: boolean;
}

export function CalibrationForm({ open, onOpenChange, onSubmit, initialData, loading }: CalibrationFormProps) {
  const { equipment } = useEquipment();
  const { contracts } = useContracts();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      contract_id: '',
      equipment_id: '', 
      calibration_date: '', 
      expiration_date: '', 
      certificate_number: '', 
      inmetro_number: '', 
      status: 'valid' 
    },
  });

  const selectedContractId = form.watch('contract_id');
  const calibrationDate = form.watch('calibration_date');

  // Filter equipment by selected contract
  const filteredEquipment = useMemo(() => {
    if (!selectedContractId) return [];
    return equipment.filter(e => e.contract_id === selectedContractId);
  }, [equipment, selectedContractId]);

  // Auto-calculate expiration date (1 year from calibration date) - only for new records or manual changes
  useEffect(() => {
    if (calibrationDate && !initialData) {
      const expirationDate = addYears(new Date(calibrationDate), 1);
      const formattedDate = format(expirationDate, 'yyyy-MM-dd');
      const currentExpiration = form.getValues('expiration_date');
      if (currentExpiration !== formattedDate) {
        form.setValue('expiration_date', formattedDate, { shouldValidate: false });
      }
    }
  }, [calibrationDate, form, initialData]);

  // Reset equipment when contract changes - only for new records
  useEffect(() => {
    if (selectedContractId && !initialData) {
      const currentEquipment = form.getValues('equipment_id');
      if (currentEquipment) {
        form.setValue('equipment_id', '', { shouldValidate: false });
      }
    }
  }, [selectedContractId, form, initialData]);

  // Populate form when editing - use ref to prevent infinite loops
  useEffect(() => {
    // Wait for relational data to load before populating the form
    if (initialData && equipment.length > 0) {
      const equipmentItem = equipment.find(e => e.id === initialData.equipment_id);
      const newValues = {
        contract_id: equipmentItem?.contract_id || '',
        equipment_id: initialData.equipment_id,
        calibration_date: initialData.calibration_date,
        expiration_date: initialData.expiration_date,
        certificate_number: initialData.certificate_number || '',
        inmetro_number: initialData.inmetro_number || '',
        status: (initialData.status as 'valid' | 'expired' | 'pending') || 'valid',
      };
      
      // Only reset if values are different to prevent loops
      const currentValues = form.getValues();
      if (currentValues.equipment_id !== newValues.equipment_id) {
        form.reset(newValues);
      }
    } else if (!initialData && open) {
      form.reset({ 
        contract_id: '',
        equipment_id: '', 
        calibration_date: '', 
        expiration_date: '', 
        certificate_number: '', 
        inmetro_number: '', 
        status: 'valid' 
      });
    }
  }, [initialData, equipment, open]);

  const handleSubmit = (data: FormData) => {
    // Remove contract_id as it's not in the calibrations table
    const { contract_id, ...submitData } = data;
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initialData ? 'Editar Aferição' : 'Nova Aferição'}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="contract_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Contrato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o contrato" /></SelectTrigger></FormControl>
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
            )} />

            <FormField control={form.control} name="equipment_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Equipamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedContractId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedContractId ? "Selecione o equipamento" : "Selecione um contrato primeiro"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredEquipment.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.serial_number} - {e.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="calibration_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Aferição</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expiration_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade (auto)</FormLabel>
                  <FormControl><Input type="date" {...field} readOnly className="bg-muted" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="certificate_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Certificado</FormLabel>
                  <FormControl><Input placeholder="CERT-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="inmetro_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº INMETRO</FormLabel>
                  <FormControl><Input placeholder="INMETRO-001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="valid">Válido</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
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
