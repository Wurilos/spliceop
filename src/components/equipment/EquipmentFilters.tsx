import { Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Contract {
  id: string;
  number: string;
  client_name: string;
}

interface EquipmentFiltersProps {
  contracts: Contract[];
  equipment: any[];
  selectedContract: string;
  selectedSpeed: string;
  selectedCommunication: string;
  selectedEnergy: string;
  selectedType: string;
  selectedStatus: string;
  onContractChange: (value: string) => void;
  onSpeedChange: (value: string) => void;
  onCommunicationChange: (value: string) => void;
  onEnergyChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
}

export function EquipmentFilters({
  contracts,
  equipment,
  selectedContract,
  selectedSpeed,
  selectedCommunication,
  selectedEnergy,
  selectedType,
  selectedStatus,
  onContractChange,
  onSpeedChange,
  onCommunicationChange,
  onEnergyChange,
  onTypeChange,
  onStatusChange,
  onClearFilters,
}: EquipmentFiltersProps) {
  // Extrair valores únicos dos equipamentos
  const uniqueSpeeds = [...new Set(equipment.map(e => e.speed_limit).filter(Boolean))].sort((a, b) => a - b);
  const uniqueCommunications = [...new Set(equipment.map(e => e.communication_type).filter(Boolean))].sort();
  const uniqueEnergies = [...new Set(equipment.map(e => e.energy_type).filter(Boolean))].sort();
  const uniqueTypes = [...new Set(equipment.map(e => e.type).filter(Boolean))].sort();

  const hasActiveFilters = selectedContract !== 'all' || 
    selectedSpeed !== 'all' || 
    selectedCommunication !== 'all' || 
    selectedEnergy !== 'all' || 
    selectedType !== 'all' || 
    selectedStatus !== 'all';

  return (
    <div className="flex items-center gap-3 flex-wrap p-4 border-b bg-muted/30">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filtros</span>
      </div>

      <Select value={selectedContract} onValueChange={onContractChange}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Todos os contratos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os contratos</SelectItem>
          {contracts.map((contract) => (
            <SelectItem key={contract.id} value={contract.id}>
              {contract.client_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedSpeed} onValueChange={onSpeedChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Velocidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {uniqueSpeeds.map((speed) => (
            <SelectItem key={speed} value={String(speed)}>
              {speed} km/h
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCommunication} onValueChange={onCommunicationChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Comunicação" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {uniqueCommunications.map((comm) => (
            <SelectItem key={comm} value={comm}>
              {comm}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedEnergy} onValueChange={onEnergyChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Energia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {uniqueEnergies.map((energy) => (
            <SelectItem key={energy} value={energy}>
              {energy}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {uniqueTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Operante</SelectItem>
          <SelectItem value="maintenance">Em Manutenção</SelectItem>
          <SelectItem value="inactive">Inativo</SelectItem>
          <SelectItem value="decommissioned">Desativado</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters}
          className="h-9 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
