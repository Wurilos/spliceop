import { useState } from 'react';
import { Shield, Users, Activity, HardDrive } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTab } from '@/components/admin/UsersTab';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import { BackupTab } from '@/components/admin/BackupTab';

export default function AuditLog() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel de Administração</h1>
            <p className="text-muted-foreground">
              Gerencie usuários e monitore atividades do sistema.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs de Auditoria
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Backup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <AuditLogsTab />
          </TabsContent>

          <TabsContent value="backup" className="mt-6">
            <BackupTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
