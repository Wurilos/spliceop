import { Filter, Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Contract {
  id: string;
  number: string;
  client_name: string;
}

interface EquipmentFiltersProps {
  contracts: Contract[];
  equipment: any[];
  searchTerm: string;
  selectedContract: string;
  selectedSpeed: string;
  selectedCommunication: string;
  selectedEnergy: string;
  selectedType: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
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
  searchTerm,
  selectedContract,
  selectedSpeed,
  selectedCommunication,
  selectedEnergy,
  selectedType,
  selectedStatus,
  onSearchChange,
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

  const hasActiveFilters = searchTerm !== '' ||
    selectedContract !== 'all' || 
    selectedSpeed !== 'all' || 
    selectedCommunication !== 'all' || 
    selectedEnergy !== 'all' || 
    selectedType !== 'all' || 
    selectedStatus !== 'all';

  return (
    <div className="flex flex-col gap-3 p-4 border-b bg-muted/30">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filtros</span>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="h-7 px-2 text-muted-foreground hover:text-foreground ml-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Nº Equipamento</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar nº série..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-[200px] h-9 pl-8"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Contrato</Label>
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
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Velocidade</Label>
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
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Comunicação</Label>
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
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Energia</Label>
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
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
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
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
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
        </div>
      </div>
    </div>
  );
}
