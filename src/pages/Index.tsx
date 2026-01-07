import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertsCard } from '@/components/dashboard/AlertsCard';
import { ModulesGrid } from '@/components/dashboard/ModulesGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { FileText, Users, Radar, Car, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ contracts: 0, employees: 0, equipment: 0, vehicles: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      Promise.all([
        supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('equipment').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]).then(([contracts, employees, equipment, vehicles]) => {
        setStats({
          contracts: contracts.count || 0,
          employees: employees.count || 0,
          equipment: equipment.count || 0,
          vehicles: vehicles.count || 0,
        });
        setLoadingStats(false);
      });
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const alerts = [
    { id: '1', type: 'warning' as const, title: 'Aferições vencendo', description: '3 equipamentos precisam de calibração nos próximos 30 dias' },
    { id: '2', type: 'info' as const, title: 'Contratos renovando', description: '2 contratos vencem nos próximos 60 dias' },
  ];

  const activities = [
    { id: '1', user: 'Sistema', action: 'iniciou', target: 'SpliceStream ERP', timestamp: new Date().toISOString() },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Contratos Ativos" value={loadingStats ? '...' : stats.contracts} icon={FileText} variant="primary" />
          <StatCard title="Colaboradores" value={loadingStats ? '...' : stats.employees} icon={Users} variant="success" />
          <StatCard title="Equipamentos" value={loadingStats ? '...' : stats.equipment} icon={Radar} variant="warning" />
          <StatCard title="Veículos" value={loadingStats ? '...' : stats.vehicles} icon={Car} variant="default" />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
          <ModulesGrid />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AlertsCard alerts={alerts} title="Alertas do Sistema" />
          <RecentActivity activities={activities} />
        </div>
      </div>
    </AppLayout>
  );
}
