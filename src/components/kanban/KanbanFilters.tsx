import { Filter } from 'lucide-react';
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

interface KanbanFiltersProps {
  contracts: Contract[];
  selectedContract: string;
  selectedTeam: string;
  selectedType: string;
  selectedPriority: string;
  onContractChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

export function KanbanFilters({
  contracts,
  selectedContract,
  selectedTeam,
  selectedType,
  selectedPriority,
  onContractChange,
  onTeamChange,
  onTypeChange,
  onPriorityChange,
}: KanbanFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm">Filtros</span>
      </div>

      <Select value={selectedContract} onValueChange={onContractChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os contratos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os contratos</SelectItem>
          {contracts.map((contract) => (
            <SelectItem key={contract.id} value={contract.id}>
              {contract.number} - {contract.client_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedTeam} onValueChange={onTeamChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todas as equipes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as equipes</SelectItem>
          <SelectItem value="Equipe de Infraestrutura">Equipe de Infraestrutura</SelectItem>
          <SelectItem value="Equipe Técnica Ribeirão Preto">Equipe Técnica Ribeirão Preto</SelectItem>
          <SelectItem value="Equipe Técnica Bauru">Equipe Técnica Bauru</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos os tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="Rompimento de Lacres">Rompimento de Lacres</SelectItem>
          <SelectItem value="Fechamento de OS">Fechamento de OS</SelectItem>
          <SelectItem value="Manutenção Preventiva">Manutenção Preventiva</SelectItem>
          <SelectItem value="Manutenção Corretiva">Manutenção Corretiva</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedPriority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Todas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="low">Baixa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
