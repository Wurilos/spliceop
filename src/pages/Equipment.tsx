import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { ImportDialog } from '@/components/shared/ImportDialog';
import { useEquipment } from '@/hooks/useEquipment';
import { useContracts } from '@/hooks/useContracts';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { EquipmentDashboard } from '@/components/equipment/EquipmentDashboard';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { equipmentImportConfig } from '@/lib/importConfigs';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, List, Monitor, Smartphone, MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { Checkbox } from '@/components/ui/checkbox';

type Equipment = Tables<'equipment'> & { contracts?: { number: string; client_name: string } | null };

const getTypeIcon = (type: string | null) => {
  switch (type?.toLowerCase()) {
    case 'cev':
      return <Monitor className="h-5 w-5 text-primary" />;
    case 'cec':
      return <Smartphone className="h-5 w-5 text-primary" />;
    default:
      return <Monitor className="h-5 w-5 text-primary" />;
  }
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case 'maintenance':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Em Manutenção
        </Badge>
      );
    case 'active':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Operante
        </Badge>
      );
    case 'inactive':
    case 'decommissioned':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Inativo
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Operante
        </Badge>
      );
  }
};

const exportColumns = [
  { key: 'Contrato', label: 'Contrato' },
  { key: 'Nº Série', label: 'Nº Série' },
  { key: 'Modelo', label: 'Modelo' },
  { key: 'Endereço', label: 'Endereço' },
  { key: 'Sentido', label: 'Sentido' },
  { key: 'Faixas', label: 'Faixas' },
  { key: 'Velocidade', label: 'Velocidade' },
  { key: 'Comunicação', label: 'Comunicação' },
  { key: 'Energia', label: 'Energia' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Tipo', label: 'Tipo' },
  { key: 'Status', label: 'Status' },
];

export default function EquipmentPage() {
  const queryClient = useQueryClient();
  const { equipment, loading, create, update, delete: deleteEquipment, deleteMany, isCreating, isUpdating } = useEquipment();
  const { contracts } = useContracts();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteManyDialogOpen, setDeleteManyDialogOpen] = useState(false);
  const itemsPerPage = 10;

  // Filter states
  const [filterContract, setFilterContract] = useState('all');
  const [filterSpeed, setFilterSpeed] = useState('all');
  const [filterCommunication, setFilterCommunication] = useState('all');
  const [filterEnergy, setFilterEnergy] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Apply filters
  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      if (filterContract !== 'all' && eq.contract_id !== filterContract) return false;
      if (filterSpeed !== 'all' && eq.speed_limit !== Number(filterSpeed)) return false;
      if (filterCommunication !== 'all' && eq.communication_type !== filterCommunication) return false;
      if (filterEnergy !== 'all' && eq.energy_type !== filterEnergy) return false;
      if (filterType !== 'all' && eq.type !== filterType) return false;
      if (filterStatus !== 'all' && eq.status !== filterStatus) return false;
      return true;
    });
  }, [equipment, filterContract, filterSpeed, filterCommunication, filterEnergy, filterType, filterStatus]);

  const clearFilters = () => {
    setFilterContract('all');
    setFilterSpeed('all');
    setFilterCommunication('all');
    setFilterEnergy('all');
    setFilterType('all');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedEquipment.map((eq) => eq.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length > 0) {
      setDeleteManyDialogOpen(true);
    }
  };

  const handleConfirmDeleteMany = () => {
    deleteMany(selectedIds);
    setSelectedIds([]);
    setDeleteManyDialogOpen(false);
  };

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormOpen(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: Partial<Equipment>) => {
    if (editingEquipment) {
      update({ id: editingEquipment.id, ...data });
    } else {
      create(data as any);
    }
    setFormOpen(false);
    setEditingEquipment(null);
  };

  const handleImport = async (rows: any[]) => {
    // Buscar contratos para resolver contract_number -> contract_id
    const { data: contracts } = await supabase.from('contracts').select('id, number, client_name');

    const normalizeText = (value: any) =>
      String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/:$/, '')
        .replace(/\s+/g, ' ')
        .toLowerCase();

    // Aceita tanto "número" quanto "nome do cliente" como identificador do contrato
    const contractMap = new Map<string, string>();
    contracts?.forEach((c) => {
      const numberKey = normalizeText(c.number);
      const nameKey = normalizeText(c.client_name);
      if (numberKey) contractMap.set(numberKey, c.id);
      if (nameKey) contractMap.set(nameKey, c.id);
    });

    const parseDateFlexible = (val: any): string | null => {
      if (val === null || val === undefined || val === '') return null;
      const str = String(val).trim();

      // DD/MM/YYYY
      const br = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (br) {
        const [, d, m, y] = br;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }

      // YYYY-MM-DD (já vem assim às vezes)
      const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso) return str;

      return null;
    };

    // Normaliza coordenadas que chegam sem separador decimal (ex: -20462591)
    // Em vez de assumir "6 casas", reduzimos por 10 até caber no range esperado.
    const normalizeCoordinate = (val: any, maxAbs: number): number | null => {
      if (val === null || val === undefined || val === '') return null;

      let num: number;
      if (typeof val === 'number') {
        num = val;
      } else {
        const s = String(val).trim().replace(',', '.');
        num = Number(s);
      }

      if (!Number.isFinite(num)) return null;

      let guard = 0;
      while (Math.abs(num) > maxAbs && guard < 20) {
        num = num / 10;
        guard++;
      }

      if (Math.abs(num) > maxAbs) return null;

      // Garante compatibilidade com numeric(10,7)
      return Math.round(num * 1e7) / 1e7;
    };

    const normalizeSpeedLimit = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const str = String(val).trim();

      // Planilha pode vir como "100/80" (dia/noite). Gravamos o primeiro valor.
      const firstPart = str.includes('/') ? str.split('/')[0] : str;
      const n = parseInt(firstPart.replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(n) ? null : n;
    };

    const normalizeEquipmentStatus = (val: any): string | null => {
      if (val === null || val === undefined || val === '') return null;
      const normalized = normalizeText(val);
      const statusMap: Record<string, string> = {
        ativo: 'active',
        operante: 'active',
        inativo: 'inactive',
        manutencao: 'maintenance',
        manutencaoe: 'maintenance',
        manutencao_: 'maintenance',
        manutencao__:'maintenance',
        manutencao__1:'maintenance',
        manutencao__2:'maintenance',
        manutencao__3:'maintenance',
        manutencao__4:'maintenance',
        manutencao__5:'maintenance',
        manutencao__6:'maintenance',
        manutencao__7:'maintenance',
        manutencao__8:'maintenance',
        manutencao__9:'maintenance',
        manutencao__10:'maintenance',
        manutencao__11:'maintenance',
        manutencao__12:'maintenance',
        manutencao__13:'maintenance',
        manutencao__14:'maintenance',
        manutencao__15:'maintenance',
        manutencao__16:'maintenance',
        manutencao__17:'maintenance',
        manutencao__18:'maintenance',
        manutencao__19:'maintenance',
        manutencao__20:'maintenance',
        manutencao__21:'maintenance',
        manutencao__22:'maintenance',
        manutencao__23:'maintenance',
        manutencao__24:'maintenance',
        manutencao__25:'maintenance',
        manutencao__26:'maintenance',
        manutencao__27:'maintenance',
        manutencao__28:'maintenance',
        manutencao__29:'maintenance',
        manutencao__30:'maintenance',
        manutencao__31:'maintenance',
        manutencao__32:'maintenance',
        manutencao__33:'maintenance',
        manutencao__34:'maintenance',
        manutencao__35:'maintenance',
        manutencao__36:'maintenance',
        manutencao__37:'maintenance',
        manutencao__38:'maintenance',
        manutencao__39:'maintenance',
        manutencao__40:'maintenance',
        manutencao__41:'maintenance',
        manutencao__42:'maintenance',
        manutencao__43:'maintenance',
        manutencao__44:'maintenance',
        manutencao__45:'maintenance',
        manutencao__46:'maintenance',
        manutencao__47:'maintenance',
        manutencao__48:'maintenance',
        manutencao__49:'maintenance',
        manutencao__50:'maintenance',
        manutencao__51:'maintenance',
        manutencao__52:'maintenance',
        manutencao__53:'maintenance',
        manutencao__54:'maintenance',
        manutencao__55:'maintenance',
        manutencao__56:'maintenance',
        manutencao__57:'maintenance',
        manutencao__58:'maintenance',
        manutencao__59:'maintenance',
        manutencao__60:'maintenance',
        manutencao__61:'maintenance',
        manutencao__62:'maintenance',
        manutencao__63:'maintenance',
        manutencao__64:'maintenance',
        manutencao__65:'maintenance',
        manutencao__66:'maintenance',
        manutencao__67:'maintenance',
        manutencao__68:'maintenance',
        manutencao__69:'maintenance',
        manutencao__70:'maintenance',
        manutencao__71:'maintenance',
        manutencao__72:'maintenance',
        manutencao__73:'maintenance',
        manutencao__74:'maintenance',
        manutencao__75:'maintenance',
        manutencao__76:'maintenance',
        manutencao__77:'maintenance',
        manutencao__78:'maintenance',
        manutencao__79:'maintenance',
        manutencao__80:'maintenance',
        manutencao__81:'maintenance',
        manutencao__82:'maintenance',
        manutencao__83:'maintenance',
        manutencao__84:'maintenance',
        manutencao__85:'maintenance',
        manutencao__86:'maintenance',
        manutencao__87:'maintenance',
        manutencao__88:'maintenance',
        manutencao__89:'maintenance',
        manutencao__90:'maintenance',
        manutencao__91:'maintenance',
        manutencao__92:'maintenance',
        manutencao__93:'maintenance',
        manutencao__94:'maintenance',
        manutencao__95:'maintenance',
        manutencao__96:'maintenance',
        manutencao__97:'maintenance',
        manutencao__98:'maintenance',
        manutencao__99:'maintenance',
        manutencao__100:'maintenance',
        manutencao__101:'maintenance',
        manutencao__102:'maintenance',
        manutencao__103:'maintenance',
        manutencao__104:'maintenance',
        manutencao__105:'maintenance',
        manutencao__106:'maintenance',
        manutencao__107:'maintenance',
        manutencao__108:'maintenance',
        manutencao__109:'maintenance',
        manutencao__110:'maintenance',
        manutencao__111:'maintenance',
        manutencao__112:'maintenance',
        manutencao__113:'maintenance',
        manutencao__114:'maintenance',
        manutencao__115:'maintenance',
        manutencao__116:'maintenance',
        manutencao__117:'maintenance',
        manutencao__118:'maintenance',
        manutencao__119:'maintenance',
        manutencao__120:'maintenance',
        desativado: 'decommissioned',
        descomissionado: 'decommissioned',
      };
      return statusMap[normalized] || normalized || null;
    };

    const isLikelyTypeCode = (val: any) => {
      const t = normalizeText(val);
      return t === 'cev' || t === 'cec' || t === 'rev' || t === 'sat';
    };

    const isLikelyBigCoordinate = (val: any) => {
      if (val === null || val === undefined || val === '') return false;
      const s = String(val).trim().replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) && Math.abs(n) > 1000;
    };

    const looksLikeLegacyShift = (r: any) => {
      // Padrão típico do arquivo enviado:
      // - installation_date vem como "CEV/CEC/..." (porque a coluna está deslocada)
      // - latitude vem como data (DD/MM/YYYY)
      // - status vem como longitude inteira (-47415120)
      return isLikelyTypeCode(r.installation_date) && !!parseDateFlexible(r.latitude) && isLikelyBigCoordinate(r.status);
    };

    const normalized = rows.map((row) => {
      const r: any = { ...row };

      // Resolver contract_number (pode ser número OU nome do cliente) para contract_id
      if (Object.prototype.hasOwnProperty.call(r, 'contract_number')) {
        const key = normalizeText(r.contract_number);
        const candidates = [key];

        for (const sep of [' - ', ' – ', ' — ']) {
          if (key.includes(sep)) {
            candidates.push(key.split(sep)[0].trim());
          }
        }

        const matched = candidates.find((c) => !!c && contractMap.has(c));
        r.contract_id = matched ? contractMap.get(matched) : null;

        // Nunca enviar essa coluna para o backend (ela é apenas um campo auxiliar de importação)
        delete r.contract_number;
      }

      // Normalizar velocidade (db espera integer)
      r.speed_limit = normalizeSpeedLimit(r.speed_limit);

      // ===== Corrigir planilha "legada" (colunas deslocadas) =====
      if (looksLikeLegacyShift(r)) {
        const legacyType = String(r.installation_date).trim(); // CEV/CEC/REV/SAT
        const legacyInstallDate = parseDateFlexible(r.latitude);
        const legacyLatitudeRaw = r.longitude; // ex: -20462591
        const legacyLongitudeRaw = r.status; // ex: -47415120

        // status real costuma vir na segunda coluna "Status" (Status_1)
        const legacyStatusRaw = r.status_text ?? null;

        // Reorganiza campos deslocados
        const legacyEnergyType = r.brand || null; // Convencional/Solar
        const legacyBrand = r.type || null; // Splice

        r.type = legacyType;
        r.installation_date = legacyInstallDate;
        r.latitude = normalizeCoordinate(legacyLatitudeRaw, 90);
        r.longitude = normalizeCoordinate(legacyLongitudeRaw, 180);
        r.status = normalizeEquipmentStatus(legacyStatusRaw) || 'active';

        r.energy_type = legacyEnergyType;
        r.brand = legacyBrand;

        delete r.status_text;
        return r;
      }

      // ===== Import "normal" =====
      // Data (quando vier como texto)
      r.installation_date = parseDateFlexible(r.installation_date) || null;

      // Coordenadas
      r.latitude = normalizeCoordinate(r.latitude, 90);
      r.longitude = normalizeCoordinate(r.longitude, 180);

      // Status
      r.status = normalizeEquipmentStatus(r.status) || null;

      // Garantir nulls em campos opcionais
      r.lanes_qty = r.lanes_qty || null;
      r.direction = r.direction || null;
      r.communication_type = r.communication_type || null;
      r.energy_type = r.energy_type || null;

      delete r.status_text;
      return r;
    });

    const { error } = await supabase.from('equipment').insert(normalized);
    if (error) throw error;

    // Atualiza a listagem após importação
    queryClient.invalidateQueries({ queryKey: ['equipment'] });
  };

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = equipment.map((e) => ({
      'Contrato': (e as any).contracts?.client_name || '',
      'Nº Série': e.serial_number,
      'Modelo': e.model || '',
      'Endereço': e.address || '',
      'Sentido': e.direction || '',
      'Faixas': e.lanes_qty ?? '',
      'Velocidade': e.speed_limit ? `${e.speed_limit} km/h` : '',
      'Comunicação': e.communication_type || '',
      'Energia': e.energy_type || '',
      'Marca': e.brand || '',
      'Tipo': e.type || '',
      'Status': e.status || '',
    }));
    if (type === 'pdf') exportToPDF(data, exportColumns, 'Equipamentos');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'equipamentos');
    else exportToCSV(data, exportColumns, 'equipamentos');
  };

  const handleDeleteClick = (eq: Equipment) => {
    setEquipmentToDelete(eq);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (equipmentToDelete) {
      deleteEquipment(equipmentToDelete.id);
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEquipment = filteredEquipment.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AppLayout title="Equipamentos">
      <div className="space-y-6">
        <PageHeader
          title="Equipamentos"
          description="Gerencie CEV, CEC, REV e SAT"
          onAdd={handleAdd}
          addLabel="Novo Equipamento"
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
        />

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Listagem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <EquipmentDashboard />
          </TabsContent>

          <TabsContent value="list">
            <div className="bg-card rounded-lg border">
              <EquipmentFilters
                contracts={contracts}
                equipment={equipment}
                selectedContract={filterContract}
                selectedSpeed={filterSpeed}
                selectedCommunication={filterCommunication}
                selectedEnergy={filterEnergy}
                selectedType={filterType}
                selectedStatus={filterStatus}
                onContractChange={(v) => { setFilterContract(v); setCurrentPage(1); }}
                onSpeedChange={(v) => { setFilterSpeed(v); setCurrentPage(1); }}
                onCommunicationChange={(v) => { setFilterCommunication(v); setCurrentPage(1); }}
                onEnergyChange={(v) => { setFilterEnergy(v); setCurrentPage(1); }}
                onTypeChange={(v) => { setFilterType(v); setCurrentPage(1); }}
                onStatusChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}
                onClearFilters={clearFilters}
              />
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} item(ns) selecionado(s)
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Selecionados
                  </Button>
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Carregando...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 px-4 w-10">
                            <Checkbox
                              checked={paginatedEquipment.length > 0 && selectedIds.length === paginatedEquipment.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contrato</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nº Série</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Modelo</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Endereço</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Sentido</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Faixas</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Velocidade</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Comunicação</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Energia</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Marca</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEquipment.map((eq) => (
                          <tr key={eq.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <Checkbox
                                checked={selectedIds.includes(eq.id)}
                                onCheckedChange={(checked) => handleSelectOne(eq.id, !!checked)}
                              />
                            </td>
                            <td className="py-3 px-4 text-muted-foreground max-w-[120px] truncate" title={eq.contracts?.client_name || ''}>
                              {eq.contracts?.client_name || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-primary">{eq.serial_number}</span>
                            </td>
                            <td className="py-3 px-4 max-w-[80px] truncate" title={eq.model || ''}>{eq.model || '-'}</td>
                            <td className="py-3 px-4 min-w-[200px] whitespace-normal" title={eq.address || ''}>{eq.address || '-'}</td>
                            <td className="py-3 px-4 max-w-[100px] truncate" title={eq.direction || ''}>{eq.direction || '-'}</td>
                            <td className="py-3 px-4 text-center">{eq.lanes_qty ?? '-'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{eq.speed_limit ? `${eq.speed_limit} km/h` : '-'}</td>
                            <td className="py-3 px-4 max-w-[80px] truncate" title={eq.communication_type || ''}>{eq.communication_type || '-'}</td>
                            <td className="py-3 px-4 max-w-[80px] truncate" title={eq.energy_type || ''}>{eq.energy_type || '-'}</td>
                            <td className="py-3 px-4 max-w-[80px] truncate" title={eq.brand || ''}>{eq.brand || '-'}</td>
                            <td className="py-3 px-4 max-w-[100px]">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(eq.type)}
                                <span>{eq.type || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(eq.status)}</td>
                            <td className="py-3 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(eq)}>
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteClick(eq)}
                                  >
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredEquipment.length)} de {filteredEquipment.length} registros
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        &lt;
                      </Button>
                      <span className="text-sm">
                        Página {currentPage} de {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        &gt;
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <EquipmentForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          initialData={editingEquipment}
          loading={isCreating || isUpdating}
        />

        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Importar Equipamentos"
          description="Importe equipamentos a partir de uma planilha Excel"
          columnMappings={equipmentImportConfig.mappings}
          templateColumns={equipmentImportConfig.templateColumns}
          templateFilename="equipamentos"
          onImport={handleImport}
        />

        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Excluir Equipamento"
          description={`Tem certeza que deseja excluir o equipamento ${equipmentToDelete?.serial_number}?`}
        />

        <DeleteDialog
          open={deleteManyDialogOpen}
          onOpenChange={setDeleteManyDialogOpen}
          onConfirm={handleConfirmDeleteMany}
          title="Excluir Equipamentos"
          description={`Tem certeza que deseja excluir ${selectedIds.length} equipamento(s) selecionado(s)?`}
        />
      </div>
    </AppLayout>
  );
}