import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Radio,
  LayoutDashboard,
  FileText,
  Users,
  Radar,
  Car,
  Fuel,
  Route,
  Wrench,
  Award,
  Headphones,
  Building2,
  Receipt,
  Zap,
  Wifi,
  Wallet,
  CreditCard,
  BarChart3,
  AlertTriangle,
  Star,
  Target,
  ClipboardCheck,
  AlertCircle,
  Tag,
  Package,
  Map,
  History,
  LogOut,
  Settings,
  ChevronUp,
  Kanban,
  List,
  Smartphone,
} from 'lucide-react';

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Kanban', href: '/kanban', icon: Kanban },
      { title: 'Itens Kanban', href: '/kanban-items', icon: List },
      { title: 'Alertas', href: '/alerts', icon: AlertCircle },
      { title: 'Mapa', href: '/map', icon: Map },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Contratos', href: '/contracts', icon: FileText },
      { title: 'Colaboradores', href: '/employees', icon: Users },
      { title: 'Equipamentos', href: '/equipment', icon: Radar },
      { title: 'Veículos', href: '/vehicles', icon: Car },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { title: 'Abastecimentos', href: '/fuel', icon: Fuel },
      { title: 'Quilometragem', href: '/mileage', icon: Route },
      { title: 'Manutenções', href: '/maintenance', icon: Wrench },
      { title: 'Aferições', href: '/calibrations', icon: Award },
      { title: 'Atendimentos', href: '/service-calls', icon: Headphones },
      { title: 'Infraestrutura', href: '/infrastructure', icon: Building2 },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { title: 'Faturamento', href: '/invoices', icon: Receipt },
      { title: 'Energia', href: '/energy', icon: Zap },
      { title: 'Internet', href: '/internet', icon: Wifi },
      { title: 'Adiantamentos', href: '/advances', icon: Wallet },
      { title: 'Tags Pedágio', href: '/tolls', icon: CreditCard },
    ],
  },
  {
    label: 'Métricas',
    items: [
      { title: 'Aproveitamento', href: '/image-metrics', icon: BarChart3 },
      { title: 'Infrações', href: '/infractions', icon: AlertTriangle },
      { title: 'Satisfação', href: '/satisfaction', icon: Star },
      { title: 'SLA', href: '/sla', icon: Target },
      { title: 'Metas', href: '/goals', icon: ClipboardCheck },
      { title: 'Pendências', href: '/issues', icon: AlertCircle },
    ],
  },
  {
    label: 'Suporte',
    items: [
      { title: 'Linhas / Chip', href: '/phone-lines', icon: Smartphone },
      { title: 'Lacres e OS', href: '/seals', icon: Tag },
      { title: 'Estoque', href: '/inventory', icon: Package },
      { title: 'Audit Log', href: '/audit', icon: History },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut, isAdmin, role } = useAuth();

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Radio className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">SpliceStream</h1>
            <p className="text-xs text-sidebar-foreground/60">ERP de Fiscalização</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.href}
                    >
                      <NavLink to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3 px-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-sm font-medium truncate w-full text-sidebar-foreground">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
                <span className="text-xs text-sidebar-foreground/60 capitalize">
                  {role || 'user'}
                </span>
              </div>
              <ChevronUp className="h-4 w-4 text-sidebar-foreground/60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
