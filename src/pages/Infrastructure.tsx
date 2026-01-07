import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, StatusBadge } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { InfrastructureForm } from '@/components/infrastructure/InfrastructureForm';
import { useInfrastructureServices, InfrastructureService } from '@/hooks/useInfrastructureServices';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ViewMode = 'dashboard' | 'calendar' | 'table';

export default function Infrastructure() {
  const { services, isLoading, delete: deleteService } = useInfrastructureServices();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<InfrastructureService | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Stats calculations
  const stats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthServices = services.filter((s) => {
      const date = parseISO(s.date);
      return date >= monthStart && date <= monthEnd;
    });

    const completed = monthServices.filter((s) => s.status === 'completed').length;
    const scheduled = monthServices.filter((s) => s.status === 'scheduled').length;
    const unscheduled = monthServices.filter((s) => s.status === 'unscheduled').length;
    const total = monthServices.length;

    return {
      total,
      completed,
      scheduled,
      unscheduled,
      completedPercent: total ? Math.round((completed / total) * 100) : 0,
      scheduledPercent: total ? Math.round((scheduled / total) * 100) : 0,
      unscheduledPercent: total ? Math.round((unscheduled / total) * 100) : 0,
    };
  }, [services, currentMonth]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  // Services for selected date
  const selectedDateServices = useMemo(() => {
    if (!selectedDate) return [];
    return services.filter((s) => isSameDay(parseISO(s.date), selectedDate));
  }, [services, selectedDate]);

  // Get services for a specific day
  const getServicesForDay = (day: Date) => {
    return services.filter((s) => isSameDay(parseISO(s.date), day));
  };

  const columns = [
    {
      key: 'date',
      label: 'Data/Hora',
      render: (value: string) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    {
      key: 'contracts',
      label: 'Contrato',
      render: (value: any) => value?.number || '-',
    },
    { key: 'serial_number', label: 'Nº Série' },
    { key: 'municipality', label: 'Município' },
    { key: 'service_type', label: 'Tipo de Serviço' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const handleEdit = (service: InfrastructureService) => {
    setSelectedService(service);
    setFormOpen(true);
  };

  const handleDelete = (service: InfrastructureService) => {
    setSelectedService(service);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedService) {
      deleteService(selectedService.id);
      setDeleteOpen(false);
      setSelectedService(null);
    }
  };

  const exportColumns = [
    { key: 'Data/Hora', label: 'Data/Hora' },
    { key: 'Contrato', label: 'Contrato' },
    { key: 'Nº Série', label: 'Nº Série' },
    { key: 'Município', label: 'Município' },
    { key: 'Tipo', label: 'Tipo' },
    { key: 'Status', label: 'Status' },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    const data = services.map((s) => ({
      'Data/Hora': format(new Date(s.date), 'dd/MM/yyyy HH:mm'),
      Contrato: s.contracts?.number || '',
      'Nº Série': s.serial_number,
      Município: s.municipality,
      Tipo: s.service_type,
      Status: s.status || '',
    }));

    if (type === 'pdf') exportToPDF(data, exportColumns, 'Infraestrutura');
    else if (type === 'excel') exportToExcel(data, exportColumns, 'infraestrutura');
    else exportToCSV(data, exportColumns, 'infraestrutura');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), i, 1);
    return { value: i.toString(), label: format(date, 'MMMM yyyy', { locale: ptBR }) };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with view toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Infraestrutura - Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={currentMonth.getMonth().toString()}
              onValueChange={(value) => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(parseInt(value));
                setCurrentMonth(newDate);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border border-input">
              <Button
                variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('dashboard')}
                className="rounded-r-none"
              >
                Dashboard
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="rounded-none border-x"
              >
                Calendário
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                Tabela
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">no período selecionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Finalizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">{stats.completedPercent}% do total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Agendados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              <p className="text-xs text-muted-foreground">{stats.scheduledPercent}% do total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sem Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unscheduled}</div>
              <p className="text-xs text-muted-foreground">{stats.unscheduledPercent}% do total</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Calendário de Serviços</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Finalizado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Agendado</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {calendarDays.map((day) => {
                    const dayServices = getServicesForDay(day);
                    const hasCompleted = dayServices.some((s) => s.status === 'completed');
                    const hasScheduled = dayServices.some((s) => s.status === 'scheduled');
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'p-2 rounded-lg hover:bg-muted transition-colors relative',
                          isSelected && 'bg-primary text-primary-foreground',
                          isToday && !isSelected && 'bg-muted font-bold',
                          !isSameMonth(day, currentMonth) && 'text-muted-foreground'
                        )}
                      >
                        {format(day, 'd')}
                        {dayServices.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                            {hasScheduled && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Dia</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDate
                    ? `Serviços de ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}`
                    : 'Serviços do dia selecionado'}
                </p>
              </CardHeader>
              <CardContent>
                {selectedDateServices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum serviço nesta data</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateServices.map((service) => (
                      <div
                        key={service.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEdit(service)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{service.serial_number}</p>
                            <p className="text-sm text-muted-foreground">{service.municipality}</p>
                          </div>
                          <StatusBadge status={service.status || 'scheduled'} />
                        </div>
                        <p className="text-sm mt-1">{service.service_type}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dashboard View */}
        {viewMode === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Calendário de Serviços</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Finalizado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Agendado</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                  <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {calendarDays.map((day) => {
                    const dayServices = getServicesForDay(day);
                    const hasCompleted = dayServices.some((s) => s.status === 'completed');
                    const hasScheduled = dayServices.some((s) => s.status === 'scheduled');
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'p-2 rounded-lg hover:bg-muted transition-colors relative',
                          isSelected && 'bg-primary text-primary-foreground',
                          isToday && !isSelected && 'bg-muted font-bold',
                          !isSameMonth(day, currentMonth) && 'text-muted-foreground'
                        )}
                      >
                        {format(day, 'd')}
                        {dayServices.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                            {hasScheduled && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Dia</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedDate
                    ? `Serviços de ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}`
                    : 'Serviços do dia selecionado'}
                </p>
              </CardHeader>
              <CardContent>
                {selectedDateServices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum serviço nesta data</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateServices.map((service) => (
                      <div
                        key={service.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEdit(service)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{service.serial_number}</p>
                            <p className="text-sm text-muted-foreground">{service.municipality}</p>
                          </div>
                          <StatusBadge status={service.status || 'scheduled'} />
                        </div>
                        <p className="text-sm mt-1">{service.service_type}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <>
            <PageHeader
              title=""
              description=""
              onAdd={() => {
                setSelectedService(null);
                setFormOpen(true);
              }}
              onExport={handleExport}
            />
            <DataTable
              data={services}
              columns={columns}
              loading={isLoading}
              searchPlaceholder="Buscar por número de série..."
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}

        {/* Add button for dashboard/calendar views */}
        {viewMode !== 'table' && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedService(null);
                setFormOpen(true);
              }}
            >
              Adicionar Serviço
            </Button>
          </div>
        )}

        <InfrastructureForm open={formOpen} onOpenChange={setFormOpen} service={selectedService} />

        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={confirmDelete}
          title="Excluir Serviço"
          description="Tem certeza que deseja excluir este serviço de infraestrutura?"
        />
      </div>
    </AppLayout>
  );
}
