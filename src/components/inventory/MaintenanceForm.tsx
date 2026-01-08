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
import { Plus, Trash2 } from 'lucide-react';

const schema = z.object({
  contract_id: z.string().min(1, 'Contrato é obrigatório'),
  om_number: z.string().min(1, 'Nº O.M é obrigatório'),
  nf_number: z.string().min(1, 'Nº NF é obrigatório'),
  send_date: z.string().min(1, 'Data de envio é obrigatória'),
  return_date: z.string().optional(),
  return_nf: z.string().optional(),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface MaintenanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData & { items: MaintenanceItem[] }) => void;
  initialData?: StockMaintenance | null;
  loading?: boolean;
}

export function MaintenanceForm({ open, onOpenChange, onSubmit, initialData, loading }: MaintenanceFormProps) {
  const { contracts } = useContracts();
  const { components } = useComponents();
  const [items, setItems] = useState<MaintenanceItem[]>([{ component_id: '', quantity: 1 }]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contract_id: '',
      om_number: '',
      nf_number: '',
      send_date: '',
      return_date: '',
      return_nf: '',
      observations: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        contract_id: initialData.contract_id || '',
        om_number: initialData.om_number,
        nf_number: initialData.nf_number,
        send_date: initialData.send_date,
        return_date: initialData.return_date || '',
        return_nf: initialData.return_nf || '',
        observations: initialData.observations || '',
      });
      if (initialData.stock_maintenance_items && initialData.stock_maintenance_items.length > 0) {
        setItems(initialData.stock_maintenance_items.map(item => ({
          component_id: item.component_id,
          quantity: item.quantity,
        })));
      } else {
        setItems([{ component_id: '', quantity: 1 }]);
      }
    } else {
      form.reset({
        contract_id: '',
        om_number: '',
        nf_number: '',
        send_date: '',
        return_date: '',
        return_nf: '',
        observations: '',
      });
      setItems([{ component_id: '', quantity: 1 }]);
    }
  }, [initialData, form]);

  const addItem = () => {
    setItems([...items, { component_id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof MaintenanceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (data: FormData) => {
    const validItems = items.filter(item => item.component_id);
    onSubmit({ ...data, items: validItems });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                name="om_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº O.M *</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da O.M" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nf_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº NF *</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da NF" {...field} />
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

            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-sm font-medium mb-1">Dados de Retorno (opcional - preencha se já retornou da manutenção)</p>
              <p className="text-xs text-muted-foreground mb-4">Ao preencher esses campos, o material será automaticamente adicionado ao estoque.</p>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Componentes para Manutenção</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Linha
                </Button>
              </div>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
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
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <FormLabel className="text-xs">Qtd</FormLabel>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{initialData ? 'Salvar' : 'Criar Manutenção'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
