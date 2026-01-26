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
  contract_id: z.string().optional(),
  serial_number: z.string().min(1, 'Número de série é obrigatório'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  address: z.string().optional(),
  direction: z.string().optional(),
  lanes_qty: z.coerce.number().optional(),
  speed_limit: z.coerce.number().optional(),
  communication_type: z.string().optional(),
  energy_type: z.string().optional(),
  brand: z.string().optional(),
  type: z.string().optional(),
  installation_date: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
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

const brands = ['Splice', 'Focalle'];

const communicationTypes = ['Modem', 'Satélite', '3G', '4G', '5G', 'WiFi', 'Fibra Óptica', 'Rádio'];

const energyTypes = ['Convencional', 'Solar'];

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
      contract_id: '',
      serial_number: '',
      model: '',
      address: '',
      direction: '',
      lanes_qty: undefined,
      speed_limit: undefined,
      communication_type: '',
      energy_type: '',
      brand: '',
      type: '',
      installation_date: '',
      latitude: undefined,
      longitude: undefined,
      status: 'active',
    },
  });

  useEffect(() => {
    if (initialData) {
      // Converter date (YYYY-MM-DD) para datetime-local (YYYY-MM-DDTHH:mm)
      let installationDateForInput = '';
      if (initialData.installation_date) {
        const dateStr = String(initialData.installation_date);
        // Se já tem T, é datetime, senão adiciona T00:00
        installationDateForInput = dateStr.includes('T') ? dateStr.slice(0, 16) : `${dateStr}T00:00`;
      }
      
      form.reset({
        contract_id: initialData.contract_id || '',
        serial_number: initialData.serial_number || '',
        model: initialData.model || '',
        address: initialData.address || '',
        direction: initialData.direction || '',
        lanes_qty: initialData.lanes_qty || undefined,
        speed_limit: initialData.speed_limit || undefined,
        communication_type: initialData.communication_type || '',
        energy_type: initialData.energy_type || '',
        brand: initialData.brand || '',
        type: initialData.type || '',
        installation_date: installationDateForInput,
        latitude: initialData.latitude ? Number(initialData.latitude) : undefined,
        longitude: initialData.longitude ? Number(initialData.longitude) : undefined,
        status: initialData.status || 'active',
      });
    } else {
      form.reset({
        contract_id: '',
        serial_number: '',
        model: '',
        address: '',
        direction: '',
        lanes_qty: undefined,
        speed_limit: undefined,
        communication_type: '',
        energy_type: '',
        brand: '',
        type: '',
        installation_date: '',
        latitude: undefined,
        longitude: undefined,
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
      lanes_qty: data.lanes_qty || null,
      speed_limit: data.speed_limit || null,
      direction: data.direction || null,
      communication_type: data.communication_type || null,
      energy_type: data.energy_type || null,
    };
    onSubmit(cleanData as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Equipamento' : 'Criar Equipamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Row 1: Contrato, Nº Série */}
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
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série *</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-00001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Modelo, Endereço */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo *</FormLabel>
                    <FormControl>
                      <Input placeholder="VL-500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Av. Brasil, 1000 - km 45" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Sentido, Qtd Faixas */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentido</FormLabel>
                    <FormControl>
                      <Input placeholder="Norte-Sul" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lanes_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd Faixas</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Velocidade, Meio de Comunicação */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="speed_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Velocidade</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communication_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meio de Comunicação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {communicationTypes.map((type) => (
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

            {/* Row 5: Tipo de Energia, Marca */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="energy_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Energia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {energyTypes.map((type) => (
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
            </div>

            {/* Row 6: Tipo, Início das Atividades */}
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="installation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início das Atividades</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 7: Latitude, Longitude */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Ex: -23.550520" {...field} />
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
                      <Input type="number" step="any" placeholder="Ex: -46.633309" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 8: Status */}
            <div className="grid grid-cols-2 gap-4">
              <div></div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
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
