import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EpiItemsTab } from '@/components/epi/EpiItemsTab';
import { EpiReceiptsTab } from '@/components/epi/EpiReceiptsTab';
import { EpiOutputsTab } from '@/components/epi/EpiOutputsTab';
import { EpiDashboard } from '@/components/epi/EpiDashboard';
import { useEpiItems } from '@/hooks/useEpiItems';
import { useEpiReceipts } from '@/hooks/useEpiReceipts';
import { useEpiOutputs } from '@/hooks/useEpiOutputs';
import { HardHat, Package, ArrowDownToLine, ArrowUpFromLine, LayoutDashboard } from 'lucide-react';

export default function Epi() {
  const { items } = useEpiItems();
  const { receipts } = useEpiReceipts();
  const { outputs } = useEpiOutputs();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <HardHat className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Controle de EPI</h1>
            <p className="text-muted-foreground">
              Gerenciamento de Equipamentos de Proteção Individual
            </p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              Cadastro de Itens
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Recebimento
            </TabsTrigger>
            <TabsTrigger value="outputs" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Saída
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <EpiDashboard items={items} receipts={receipts} outputs={outputs} />
          </TabsContent>

          <TabsContent value="items">
            <EpiItemsTab />
          </TabsContent>

          <TabsContent value="receipts">
            <EpiReceiptsTab />
          </TabsContent>

          <TabsContent value="outputs">
            <EpiOutputsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
