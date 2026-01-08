import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Users,
  Radar,
  Car,
  Fuel,
  Route,
  Wrench,
  Award,
  Headphones,
  Receipt,
  Zap,
  Package,
  Map,
  BarChart3,
  Wifi,
  AlertTriangle,
  Shield,
  Target,
  Smile,
  Kanban,
  Settings,
  DollarSign,
  Bell,
  History,
  Building2,
  Lock,
  Smartphone,
} from 'lucide-react';

interface Module {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

const modules: Module[] = [
  { title: 'Contratos', description: 'Gestão de contratos', href: '/contracts', icon: FileText, color: 'bg-primary/10 text-primary' },
  { title: 'Colaboradores', description: 'Equipe técnica', href: '/employees', icon: Users, color: 'bg-success/10 text-success' },
  { title: 'Equipamentos', description: 'Radares e medidores', href: '/equipment', icon: Radar, color: 'bg-warning/10 text-warning' },
  { title: 'Veículos', description: 'Frota operacional', href: '/vehicles', icon: Car, color: 'bg-info/10 text-info' },
  { title: 'Abastecimentos', description: 'Controle de combustível', href: '/fuel', icon: Fuel, color: 'bg-destructive/10 text-destructive' },
  { title: 'Quilometragem', description: 'Registro de km', href: '/mileage', icon: Route, color: 'bg-primary/10 text-primary' },
  { title: 'Manutenções', description: 'Serviços em veículos', href: '/maintenance', icon: Wrench, color: 'bg-success/10 text-success' },
  { title: 'Aferições', description: 'Calibrações INMETRO', href: '/calibrations', icon: Award, color: 'bg-warning/10 text-warning' },
  { title: 'Atendimentos', description: 'Chamados técnicos', href: '/service-calls', icon: Headphones, color: 'bg-info/10 text-info' },
  { title: 'Faturamento', description: 'Notas e pagamentos', href: '/invoices', icon: Receipt, color: 'bg-destructive/10 text-destructive' },
  { title: 'Energia', description: 'Contas de luz', href: '/energy', icon: Zap, color: 'bg-warning/10 text-warning' },
  { title: 'Internet', description: 'Contas de internet', href: '/internet', icon: Wifi, color: 'bg-info/10 text-info' },
  { title: 'Estoque', description: 'Componentes', href: '/inventory', icon: Package, color: 'bg-primary/10 text-primary' },
  { title: 'Mapa', description: 'Visualização geográfica', href: '/map', icon: Map, color: 'bg-success/10 text-success' },
  { title: 'Métricas', description: 'Aproveitamento', href: '/image-metrics', icon: BarChart3, color: 'bg-info/10 text-info' },
  { title: 'SLA', description: 'Indicadores de nível', href: '/sla', icon: Target, color: 'bg-primary/10 text-primary' },
  { title: 'Metas', description: 'Metas de atendimento', href: '/goals', icon: Shield, color: 'bg-success/10 text-success' },
  { title: 'Satisfação', description: 'Pesquisa de clientes', href: '/satisfaction', icon: Smile, color: 'bg-warning/10 text-warning' },
  { title: 'Infrações', description: 'Registro de infrações', href: '/infractions', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
  { title: 'Pedágios', description: 'Tags e passagens', href: '/tolls', icon: DollarSign, color: 'bg-info/10 text-info' },
  { title: 'Infraestrutura', description: 'Serviços de campo', href: '/infrastructure', icon: Building2, color: 'bg-primary/10 text-primary' },
  { title: 'Lacres', description: 'Controle de lacres', href: '/seals', icon: Lock, color: 'bg-success/10 text-success' },
  { title: 'Adiantamentos', description: 'Controle financeiro', href: '/advances', icon: DollarSign, color: 'bg-warning/10 text-warning' },
  { title: 'Kanban', description: 'Gestão de demandas', href: '/kanban', icon: Kanban, color: 'bg-info/10 text-info' },
  { title: 'Colunas Kanban', description: 'Configurar colunas', href: '/kanban-items', icon: Settings, color: 'bg-primary/10 text-primary' },
  { title: 'Pendências', description: 'Issues abertas', href: '/issues', icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
  { title: 'Alertas', description: 'Alertas do sistema', href: '/alerts', icon: Bell, color: 'bg-warning/10 text-warning' },
  { title: 'Auditoria', description: 'Log de ações', href: '/audit-log', icon: History, color: 'bg-muted-foreground/10 text-muted-foreground' },
  { title: 'Linhas / Chip', description: 'Linhas telefônicas', href: '/phone-lines', icon: Smartphone, color: 'bg-info/10 text-info' },
];

export function ModulesGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
      {modules.map((module) => (
        <Link key={module.href} to={module.href}>
          <Card className="group h-full transition-all hover:shadow-md hover:border-primary/50">
            <CardContent className="flex flex-col items-center p-4 text-center">
              <div className={`rounded-lg p-3 mb-3 ${module.color}`}>
                <module.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                {module.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {module.description}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
