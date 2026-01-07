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
import { Tables } from '@/integrations/supabase/types';
import { useContracts } from '@/hooks/useContracts';

type Equipment = Tables<'equipment'>;

const schema = z.object({
  serial_number: z.string().min(1, 'Número de série é obrigatório'),
  type: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  installation_date: z.string().optional(),
  last_calibration_date: z.string().optional(),
  next_calibration_date: z.string().optional(),
  contract_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'decommissioned']).optional(),
});

type FormData = z.infer<typeof schema>;

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: Equipment | null;
  loading?: boolean;
}

const equipmentTypes = [
  'Radar Fixo',
  'Radar Móvel',
  'Medidor de Velocidade',
  'Lombada Eletrônica',
  'Semáforo Inteligente',
  'Detector de Avanço',
];

const brands = ['Perkons', 'Velsis', 'Kapsch', 'Tecnoradar', 'Autotrac', 'Outro'];

export function EquipmentForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: EquipmentFormProps) {
  const { contracts } = useContracts();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serial_number: '',
      type: '',
      brand: '',
      model: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      installation_date: '',
      last_calibration_date: '',
      next_calibration_date: '',
      contract_id: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        serial_number: initialData.serial_number || '',
        type: initialData.type || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        address: initialData.address || '',
        latitude: initialData.latitude ? Number(initialData.latitude) : undefined,
        longitude: initialData.longitude ? Number(initialData.longitude) : undefined,
        installation_date: initialData.installation_date || '',
        last_calibration_date: initialData.last_calibration_date || '',
        next_calibration_date: initialData.next_calibration_date || '',
        contract_id: initialData.contract_id || '',
        status: initialData.status || 'active',
      });
    } else {
      form.reset({
        serial_number: '',
        type: '',
        brand: '',
        model: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        installation_date: '',
        last_calibration_date: '',
        next_calibration_date: '',
        contract_id: '',
        status: 'active',
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: FormData) => {
    const cleanData = {
      ...data,
      contract_id: data.contract_id || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };
    onSubmit(cleanData as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-00001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {equipmentTypes.map((type) => (
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
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
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
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="VL-500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço/Localização</FormLabel>
                  <FormControl>
                    <Input placeholder="Av. Brasil, 1000 - km 45" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="-23.550520" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="-46.633309" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="installation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instalação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_calibration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Última Aferição</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_calibration_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Aferição</FormLabel>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="decommissioned">Desativado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
