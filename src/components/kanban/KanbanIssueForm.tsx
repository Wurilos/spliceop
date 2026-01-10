import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KanbanColumn } from '@/hooks/useKanbanColumns';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.string().default('medium'),
  column_key: z.string().optional(),
  type: z.string().min(1, 'Tipo é obrigatório'),
  status: z.string().optional(),
  address: z.string().min(1, 'Localidade é obrigatória'),
  team: z.string().min(1, 'Equipe é obrigatória'),
  due_date: z.string().min(1, 'Prazo SLA é obrigatório'),
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  equipment_id: z.string().optional(),
  vehicle_id: z.string().optional(),
});

// Mapeamento de substatus por tipo de demanda
const substatusByType: Record<string, string[]> = {
  'Aferição': [
    'Rompimento de Lacres',
    'Aguardando lacres',
    'Fechamento de O.S',
    'Aguardando GRU',
    'Aguardando pagamento de GRU',
    'Aguardando data de aferição',
  ],
  'Energia': [
    'Conjunta com fornecedor',
    'Falta de pagamento',
    'Vandalismo',
    'Pausa temporária',
  ],
  'Internet': [
    'Conjunta com fornecedor',
    'Falta de pagamento',
    'Vandalismo',
  ],
  'Infraestrutura': [
    'Aguardando material',
    'Aguardando Adiantamento',
  ],
  'Manutenção Veicular': [
    'Aguardando setor de transporte',
    'Aguardando Locadora',
    'Aguardando Oficina',
  ],
};

type FormData = z.infer<typeof formSchema>;

interface KanbanIssueFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
  contracts: { id: string; number: string; client_name: string }[];
  equipment: { id: string; serial_number: string; address: string | null; contract_id: string | null }[];
  vehicles: { id: string; plate: string; model: string | null }[];
  onSubmit: (data: FormData) => void;
}

export function KanbanIssueForm({
  open,
  onOpenChange,
  columns,
  contracts,
  equipment,
  vehicles,
  onSubmit,
}: KanbanIssueFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      column_key: columns[0]?.key || '',
      type: '',
      status: '',
      address: '',
      team: '',
      due_date: '',
      contract_id: '',
      equipment_id: '',
      vehicle_id: '',
    },
  });

  const selectedType = form.watch('type');

  const selectedContractId = form.watch('contract_id');
  const selectedEquipmentId = form.watch('equipment_id');

  // Filter equipment by selected contract
  const filteredEquipment = selectedContractId
    ? equipment.filter((e) => e.contract_id === selectedContractId)
    : [];

  // Auto-fill address when equipment is selected
  useEffect(() => {
    if (selectedEquipmentId) {
      const selectedEquip = equipment.find((e) => e.id === selectedEquipmentId);
      if (selectedEquip?.address) {
        form.setValue('address', selectedEquip.address);
      }
    }
  }, [selectedEquipmentId, equipment, form]);

  // Reset equipment when contract changes
  useEffect(() => {
    form.setValue('equipment_id', '');
    form.setValue('address', '');
  }, [selectedContractId, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      column_key: columns[0]?.key || 'backlog',
      contract_id: data.contract_id || undefined,
      equipment_id: data.equipment_id || undefined,
      vehicle_id: data.vehicle_id || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
          <DialogDescription>
            Preencha os campos para criar uma nova demanda no Kanban.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Título da Demanda */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Demanda *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Instalação de radar na BR-101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Demanda + Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Demanda *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col.key} value={col.title}>
                            {col.title}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Substatus baseado no tipo de demanda */}
            {selectedType && substatusByType[selectedType] && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Substatus</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o substatus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {substatusByType[selectedType].map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Contrato + Equipamento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contrato *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o contrato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contracts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.client_name}
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
                          <SelectValue placeholder={selectedContractId ? "Selecione" : "Selecione um contrato primeiro"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredEquipment.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.serial_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Localidade */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localidade *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rodovia SP-425, KM 120" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Equipe Responsável */}
            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipe Responsável *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a equipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Coordenador">Coordenador</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                      <SelectItem value="Administrativo">Administrativo</SelectItem>
                      <SelectItem value="Equipe técnica de Barretos">Equipe técnica de Barretos</SelectItem>
                      <SelectItem value="Equipe Técnica Ribeirão Preto">Equipe Técnica Ribeirão Preto</SelectItem>
                      <SelectItem value="Equipe Técnica de Bauru">Equipe Técnica de Bauru</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prazo SLA */}
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo SLA *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {/* Observações Técnicas */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Técnicas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Adicione informações relevantes sobre a demanda..." 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Demanda</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
