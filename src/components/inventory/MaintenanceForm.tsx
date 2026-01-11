import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts } from '@/hooks/useContracts';
import { useComponents } from '@/hooks/useComponents';
import { StockMaintenance, MaintenanceItem } from '@/hooks/useStockMaintenance';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const schema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  solicitante: z.string().min(1, 'Solicitante é obrigatório'),
  centro_custo: z.string().min(1, 'Centro de custo é obrigatório'),
  remetente: z.string().min(1, 'Remetente é obrigatório'),
  destinatario: z.string().default('Matriz - Manutenção'),
  send_date: z.string().min(1, 'Data de envio é obrigatória'),
  om_number: z.string().optional(),
  nf_number: z.string().optional(),
  return_date: z.string().optional(),
  return_nf: z.string().optional(),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ExtendedMaintenanceItem extends MaintenanceItem {
  barcode?: string;
  defect_description?: string;
  field_service_code?: string;
  equipment_serial?: string;
}

interface MaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData & { items: ExtendedMaintenanceItem[] }) => void;
  initialData?: StockMaintenance | null;
  loading?: boolean;
}

export function MaintenanceForm({ open, onOpenChange, onSubmit, initialData, loading }: MaintenanceFormProps) {
  const { contracts } = useContracts();
  const { components } = useComponents();
  const [items, setItems] = useState<ExtendedMaintenanceItem[]>([{ 
    component_id: '', 
    quantity: 1,
    barcode: '',
    defect_description: '',
    field_service_code: '',
    equipment_serial: '',
  }]);
  const [nfSectionOpen, setNfSectionOpen] = useState(false);
  const [returnSectionOpen, setReturnSectionOpen] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_id: '',
      solicitante: '',
      centro_custo: '',
      remetente: '',
      destinatario: 'Matriz - Manutenção',
      send_date: new Date().toISOString().split('T')[0],
      om_number: '',
      nf_number: '',
      return_date: '',
      return_nf: '',
      observations: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        contract_id: initialData.contract_id || '',
        solicitante: initialData.solicitante || '',
        centro_custo: initialData.centro_custo || '',
        remetente: initialData.remetente || '',
        destinatario: initialData.destinatario || 'Matriz - Manutenção',
        send_date: initialData.send_date,
        om_number: initialData.om_number || '',
        nf_number: initialData.nf_number || '',
        return_date: initialData.return_date || '',
        return_nf: initialData.return_nf || '',
        observations: initialData.observations || '',
      });
      if (initialData.stock_maintenance_items && initialData.stock_maintenance_items.length > 0) {
        setItems(initialData.stock_maintenance_items.map(item => ({
          component_id: item.component_id,
          quantity: item.quantity,
          barcode: item.barcode || '',
          defect_description: item.defect_description || '',
          field_service_code: item.field_service_code || '',
          equipment_serial: item.equipment_serial || '',
        })));
      } else {
        setItems([{ 
          component_id: '', 
          quantity: 1,
          barcode: '',
          defect_description: '',
          field_service_code: '',
          equipment_serial: '',
        }]);
      }
      // Open NF section if has OM/NF data
      if (initialData.om_number || initialData.nf_number) {
        setNfSectionOpen(true);
      }
      // Open return section if has return data
      if (initialData.return_date || initialData.return_nf) {
        setReturnSectionOpen(true);
      }
    } else {
      form.reset({
        contract_id: '',
        solicitante: '',
        centro_custo: '',
        remetente: '',
        destinatario: 'Matriz - Manutenção',
        send_date: new Date().toISOString().split('T')[0],
        om_number: '',
        nf_number: '',
        return_date: '',
        return_nf: '',
        observations: '',
      });
      setItems([{ 
        component_id: '', 
        quantity: 1,
        barcode: '',
        defect_description: '',
        field_service_code: '',
        equipment_serial: '',
      }]);
      setNfSectionOpen(false);
      setReturnSectionOpen(false);
    }
  }, [initialData, form]);

  const addItem = () => {
    setItems([...items, { 
      component_id: '', 
      quantity: 1,
      barcode: '',
      defect_description: '',
      field_service_code: '',
      equipment_serial: '',
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ExtendedMaintenanceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (data: FormData) => {
    const validItems = items.filter(item => item.component_id);
    onSubmit({ ...data, items: validItems });
  };

  // Auto-fill centro_custo from selected contract
  const selectedContract = contracts.find(c => c.id === form.watch('contract_id'));
  useEffect(() => {
    if (selectedContract && !initialData) {
      form.setValue('centro_custo', selectedContract.cost_center || '');
      form.setValue('remetente', selectedContract.client_name || '');
    }
  }, [selectedContract, form, initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Manutenção' : 'Nova Solicitação de Manutenção'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Seção: Dados da Solicitação */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dados da Solicitação</h3>
              
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
                  name="centro_custo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro de Custo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 20051" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="remetente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remetente *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do remetente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinatario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinatário</FormLabel>
                      <FormControl>
                        <Input placeholder="Destinatário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="solicitante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Solicitante/Requisitante *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do solicitante" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="send_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Envio *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações sobre a manutenção" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seção: Dados da NF (colapsável) */}
            <Collapsible open={nfSectionOpen} onOpenChange={setNfSectionOpen}>
              <div className="border rounded-lg p-4 bg-muted/30">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" className="w-full flex justify-between items-center p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Dados da NF (após retorno do setor)
                      </h3>
                    </div>
                    {nfSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    Preencha esses campos após receber o retorno do setor com os números de O.M e NF.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="om_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº O.M</FormLabel>
                          <FormControl>
                            <Input placeholder="Número da O.M" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nf_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nº NF</FormLabel>
                          <FormControl>
                            <Input placeholder="Número da NF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Seção: Dados de Retorno (colapsável) */}
            <Collapsible open={returnSectionOpen} onOpenChange={setReturnSectionOpen}>
              <div className="border rounded-lg p-4 bg-muted/30">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" className="w-full flex justify-between items-center p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Dados de Retorno
                      </h3>
                    </div>
                    {returnSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-4">
                    Ao preencher esses campos, o material será automaticamente adicionado ao estoque.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="return_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Retorno</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="return_nf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NF de Retorno</FormLabel>
                          <FormControl>
                            <Input placeholder="Número da NF de retorno" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Seção: Componentes para Manutenção */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Componentes para Manutenção
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Componente
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="border rounded-md p-4 space-y-3 bg-background">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Componente {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <FormLabel className="text-xs">Componente</FormLabel>
                      <Select
                        value={item.component_id}
                        onValueChange={(value) => updateItem(index, 'component_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o componente" />
                        </SelectTrigger>
                        <SelectContent>
                          {components.map((comp) => (
                            <SelectItem key={comp.id} value={comp.id}>
                              {comp.code ? `${comp.code} - ` : ''}{comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <FormLabel className="text-xs">Quantidade</FormLabel>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FormLabel className="text-xs">Código de Barras</FormLabel>
                      <Input
                        placeholder="Ex: 01078917950163512100001644"
                        value={item.barcode || ''}
                        onChange={(e) => updateItem(index, 'barcode', e.target.value)}
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs">Nº Série do Equipamento</FormLabel>
                      <Input
                        placeholder="Ex: 1687"
                        value={item.equipment_serial || ''}
                        onChange={(e) => updateItem(index, 'equipment_serial', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FormLabel className="text-xs">Defeito Detectado</FormLabel>
                      <Input
                        placeholder="Descreva o defeito"
                        value={item.defect_description || ''}
                        onChange={(e) => updateItem(index, 'defect_description', e.target.value)}
                      />
                    </div>
                    <div>
                      <FormLabel className="text-xs">Código Atendimento Campo/Base</FormLabel>
                      <Input
                        placeholder="Ex: 3547070"
                        value={item.field_service_code || ''}
                        onChange={(e) => updateItem(index, 'field_service_code', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{initialData ? 'Salvar' : 'Criar Solicitação'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
