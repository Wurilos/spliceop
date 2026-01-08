import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { useSeals } from '@/hooks/useSeals';
import { useSealServiceOrders, CreateServiceOrderInput } from '@/hooks/useSealServiceOrders';

const INSTALLATION_ITEMS = [
  'MET',
  'MET - Acrílico frontal',
  'NMET',
  'MCA',
  'Cartão SD',
  'Câmeras',
  'Laço 1',
  'Laço 2',
  'Laço 3',
  'Laço 4',
];

const sealItemSchema = z.object({
  seal_id: z.string().min(1, 'Selecione um lacre'),
  installation_item: z.string().min(1, 'Selecione um item'),
});

const schema = z.object({
  order_number: z.string().min(1, 'Número da O.S é obrigatório'),
  contract_id: z.string().min(1, 'Selecione um contrato'),
  equipment_id: z.string().min(1, 'Selecione um equipamento'),
  maintenance_description: z.string().optional(),
  items: z.array(sealItemSchema).min(1, 'Adicione pelo menos um lacre'),
});

type FormData = z.infer<typeof schema>;

interface ServiceOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceOrderForm({ open, onOpenChange }: ServiceOrderFormProps) {
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const { seals } = useSeals();
  const { createServiceOrder, isCreating } = useSealServiceOrders();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      order_number: '',
      contract_id: '',
      equipment_id: '',
      maintenance_description: '',
      items: [{ seal_id: '', installation_item: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const selectedContractId = form.watch('contract_id');

  // Filter equipment by selected contract
  const filteredEquipment = useMemo(() => {
    if (!selectedContractId) return [];
    return equipment.filter(eq => eq.contract_id === selectedContractId);
  }, [equipment, selectedContractId]);

  // Filter available seals (status = 'available')
  const availableSeals = useMemo(() => {
    return seals.filter(seal => seal.status === 'available');
  }, [seals]);

  // Get selected seal IDs to prevent duplicate selection
  const selectedSealIds = form.watch('items').map(item => item.seal_id).filter(Boolean);

  // Reset equipment when contract changes
  useEffect(() => {
    form.setValue('equipment_id', '');
  }, [selectedContractId, form]);

  const handleSubmit = (data: FormData) => {
    // Determine category based on installation items
    const categories = data.items.map(item => item.installation_item);
    let category = 'Outros';
    if (categories.some(c => c.includes('Câmeras'))) category = 'Cameras';
    else if (categories.some(c => c.includes('Laço'))) category = 'Laços';
    else if (categories.some(c => c.includes('MET') || c.includes('NMET') || c.includes('MCA'))) category = 'Medição';

    const input: CreateServiceOrderInput = {
      order_number: data.order_number,
      contract_id: data.contract_id || null,
      equipment_id: data.equipment_id || null,
      maintenance_description: data.maintenance_description || null,
      category,
      items: data.items.map(item => ({
        seal_id: item.seal_id,
        installation_item: item.installation_item,
      })),
    };

    createServiceOrder(input, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="order_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da O.S</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1209/2025" {...field} />
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
            </div>

            <FormField
              control={form.control}
              name="equipment_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Série</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedContractId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedContractId ? "Selecione o equipamento" : "Selecione um contrato primeiro"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredEquipment.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.serial_number}
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
              name="maintenance_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manutenção Realizada</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a manutenção realizada..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lacres Instalados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Lacres Instalados</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ seal_id: '', installation_item: '' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Linha
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.seal_id`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o lacre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableSeals
                                .filter(seal => !selectedSealIds.includes(seal.id) || seal.id === field.value)
                                .map((seal) => (
                                  <SelectItem key={seal.id} value={seal.id}>
                                    {seal.seal_number}
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
                      name={`items.${index}.installation_item`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INSTALLATION_ITEMS.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-0"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Ordem de Serviço'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
