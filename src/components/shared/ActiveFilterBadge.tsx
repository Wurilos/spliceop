import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { CrossFilter } from '@/hooks/useDashboardCrossFilter';

interface ActiveFilterBadgeProps {
  filter: CrossFilter | null;
  onClear: () => void;
}

export function ActiveFilterBadge({ filter, onClear }: ActiveFilterBadgeProps) {
  if (!filter) return null;

  const fieldLabels: Record<string, string> = {
    status: 'Status',
    state: 'Estado',
    city: 'Cidade',
    contract: 'Contrato',
    type: 'Tipo',
    priority: 'Prioridade',
    team: 'Equipe',
    fuel_type: 'Combustível',
    model: 'Modelo',
    ownership: 'Titularidade',
    carrier: 'Operadora',
    communication_type: 'Comunicação',
    energy_type: 'Energia',
    brand: 'Marca',
  };

  const displayLabel = filter.label || String(filter.value);
  const fieldLabel = fieldLabels[filter.field] || filter.field;

  return (
    <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
      <Filter className="h-4 w-4 text-primary" />
      <span className="text-sm text-muted-foreground">Filtrado por</span>
      <Badge variant="secondary" className="font-medium">
        {fieldLabel}: {displayLabel}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-6 w-6 p-0 hover:bg-destructive/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
