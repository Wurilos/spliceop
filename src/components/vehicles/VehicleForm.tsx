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
import { Tables } from '@/integrations/supabase/types';
import { useContracts } from '@/hooks/useContracts';

type Vehicle = Tables<'vehicles'>;

const schema = z.object({
  contract_id: z.string().optional(),
  plate: z.string().min(1, 'Placa é obrigatória'),
  model: z.string().optional(),
  brand: z.string().optional(),
  year: z.coerce.number().min(1900).max(2100).optional(),
  fuel_type: z.string().optional(),
  current_km: z.coerce.number().min(0).optional(),
  renavam: z.string().optional(),
  chassis: z.string().optional(),
  availability_date: z.string().optional(),
  fuel_card: z.string().optional(),
  monthly_balance: z.coerce.number().optional(),
  tag_number: z.string().optional(),
  insurance_company: z.string().optional(),
  rental_company: z.string().optional(),
  insurance_contact: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']),
  notes: z.string().optional(),
  color: z.string().optional(),
  team: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: Vehicle | null;
  loading?: boolean;
}

const fuelTypes = [
  'Gasolina',
  'Etanol',
  'Flex',
  'Diesel',
  'GNV',
  'Elétrico',
  'Híbrido',
];

export function VehicleForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: VehicleFormProps) {
  const { contracts } = useContracts();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_id: '',
      plate: '',
      model: '',
      brand: '',
      year: new Date().getFullYear(),
      fuel_type: '',
      current_km: 0,
      renavam: '',
      chassis: '',
      availability_date: '',
      fuel_card: '',
      monthly_balance: 0,
      tag_number: '',
      insurance_company: '',
      rental_company: '',
      insurance_contact: '',
      status: 'active',
      notes: '',
      color: '',
      team: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        contract_id: initialData.contract_id || '',
        plate: initialData.plate || '',
        model: initialData.model || '',
        brand: initialData.brand || '',
        year: initialData.year || new Date().getFullYear(),
        fuel_type: initialData.fuel_type || '',
        current_km: initialData.current_km || 0,
        renavam: initialData.renavam || '',
        chassis: initialData.chassis || '',
        availability_date: initialData.availability_date || '',
        fuel_card: initialData.fuel_card || '',
        monthly_balance: initialData.monthly_balance || 0,
        tag_number: initialData.tag_number || '',
        insurance_company: initialData.insurance_company || '',
        rental_company: initialData.rental_company || '',
        insurance_contact: initialData.insurance_contact || '',
        status: initialData.status || 'active',
        notes: initialData.notes || '',
        color: initialData.color || '',
        team: initialData.team || '',
      });
    } else {
      form.reset({
        contract_id: '',
        plate: '',
        model: '',
        brand: '',
        year: new Date().getFullYear(),
        fuel_type: '',
        current_km: 0,
        renavam: '',
        chassis: '',
        availability_date: '',
        fuel_card: '',
        monthly_balance: 0,
        tag_number: '',
        insurance_company: '',
        rental_company: '',
        insurance_contact: '',
        status: 'active',
        notes: '',
        color: '',
        team: '',
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: FormData) => {
    const cleanData = {
      ...data,
      contract_id: data.contract_id || null,
      monthly_balance: data.monthly_balance || 0,
    };
    onSubmit(cleanData as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Veículo' : 'Criar Veículo'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione contrato" />
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
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-destructive">Placa *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Strada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Fiat" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" min="1900" max="2100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione combustível" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fuelTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="current_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Atual</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="renavam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RENAVAM</FormLabel>
                    <FormControl>
                      <Input placeholder="00000000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chassis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chassi</FormLabel>
                    <FormControl>
                      <Input placeholder="9BWZZZ377VT004251" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Disponibilização</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fuel_card"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Cartão</FormLabel>
                    <FormControl>
                      <Input placeholder="1234-5678-9012" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Mensal</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="R$ 0,00"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tag_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da TAG</FormLabel>
                    <FormControl>
                      <Input placeholder="TAG-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurance_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seguradora</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da seguradora" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rental_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locadora</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da locadora" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurance_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato Seguradora</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefone ou email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-destructive">Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
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
                      placeholder="Observações adicionais sobre o veículo"
                      rows={3}
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
                {loading ? 'Salvando...' : initialData ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
