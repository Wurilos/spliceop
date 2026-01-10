import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanFilters } from '@/components/kanban/KanbanFilters';
import { KanbanIssueForm } from '@/components/kanban/KanbanIssueForm';
import { KanbanDetailModal } from '@/components/kanban/KanbanDetailModal';
import { KanbanArchive } from '@/components/kanban/KanbanArchive';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { useKanbanIssues, KanbanIssue } from '@/hooks/useKanbanIssues';
import { useContracts } from '@/hooks/useContracts';
import { useEquipment } from '@/hooks/useEquipment';
import { useVehicles } from '@/hooks/useVehicles';

export default function Kanban() {
  const { activeColumns, isLoading: columnsLoading } = useKanbanColumns();
  const { issues, isLoading: issuesLoading, createIssue, updateIssue, moveIssue, deleteIssue } = useKanbanIssues();
  const { contracts } = useContracts();
  const { equipment } = useEquipment();
  const { vehicles } = useVehicles();

  const [showForm, setShowForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<KanbanIssue | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [selectedContract, setSelectedContract] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedContract !== 'all' && issue.contract_id !== selectedContract) return false;
      if (selectedTeam !== 'all' && issue.team !== selectedTeam) return false;
      if (selectedType !== 'all' && issue.type !== selectedType) return false;
      if (selectedPriority !== 'all' && issue.priority !== selectedPriority) return false;
      return true;
    });
  }, [issues, selectedContract, selectedTeam, selectedType, selectedPriority]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (draggedId) {
      // Find the target column to get its title (which becomes the new type)
      const targetColumn = activeColumns.find(col => col.key === columnKey);
      const newType = targetColumn?.title;
      moveIssue({ id: draggedId, column_key: columnKey, newType });
      setDraggedId(null);
    }
  };

  const handleCreateIssue = (data: any) => {
    createIssue(data);
  };

  const handleClickIssue = (issue: KanbanIssue) => {
    setSelectedIssue(issue);
    setShowDetailModal(true);
  };

  const handleUpdateSubstatus = (id: string, status: string) => {
    updateIssue({ id, status });
    // Update local state to reflect change immediately
    if (selectedIssue && selectedIssue.id === id) {
      setSelectedIssue({ ...selectedIssue, status });
    }
  };

  const handleEditIssue = (issue: KanbanIssue) => {
    setShowDetailModal(false);
    // For now, just close the modal - full edit form can be added later
  };

  const isLoading = columnsLoading || issuesLoading;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <Tabs defaultValue="board" className="flex-1 flex flex-col">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Kanban Operacional</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie demandas e ordens de serviço
                </p>
              </div>
              <div className="flex items-center gap-4">
                <TabsList>
                  <TabsTrigger value="board">Quadro</TabsTrigger>
                  <TabsTrigger value="archive">Histórico</TabsTrigger>
                </TabsList>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Demanda
                </Button>
              </div>
            </div>

            <TabsContent value="board" className="m-0">
              <KanbanFilters
                contracts={contracts.map(c => ({ id: c.id, number: c.number, client_name: c.client_name }))}
                selectedContract={selectedContract}
                selectedTeam={selectedTeam}
                selectedType={selectedType}
                selectedPriority={selectedPriority}
                onContractChange={setSelectedContract}
                onTeamChange={setSelectedTeam}
                onTypeChange={setSelectedType}
                onPriorityChange={setSelectedPriority}
              />
            </TabsContent>
          </div>

          <TabsContent value="board" className="flex-1 m-0">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 h-full">
                <div className="flex gap-4 p-6 min-w-max">
                  {activeColumns.map((column) => (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      issues={filteredIssues}
                      onDeleteIssue={deleteIssue}
                      onClickIssue={handleClickIssue}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="archive" className="flex-1 m-0 overflow-auto">
            <KanbanArchive />
          </TabsContent>
        </Tabs>
      </div>

      <KanbanIssueForm
        open={showForm}
        onOpenChange={setShowForm}
        columns={activeColumns}
        contracts={contracts.map(c => ({ id: c.id, number: c.number, client_name: c.client_name }))}
        equipment={equipment.map(e => ({ id: e.id, serial_number: e.serial_number, address: e.address || null, contract_id: e.contract_id || null }))}
        vehicles={vehicles.map(v => ({ id: v.id, plate: v.plate, model: v.model }))}
        onSubmit={handleCreateIssue}
      />

      <KanbanDetailModal
        issue={selectedIssue}
        columns={activeColumns}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onUpdateType={handleUpdateSubstatus}
        onEdit={handleEditIssue}
      />
    </AppLayout>
  );
}
