import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Webhook, MessageSquare, Users, Link2, Network } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersManagement from '@/components/settings/UsersManagement';
import OrganizationLinks from '@/components/settings/OrganizationLinks';
import TeamHierarchy from '@/components/settings/TeamHierarchy';
import WhatsAppConnection from '@/components/settings/WhatsAppConnection';

const SettingsView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações</h2>
        <p className="text-muted-foreground">Gerencie integrações e configurações do sistema</p>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertTitle>Área de Administrador</AlertTitle>
        <AlertDescription>
          Apenas administradores podem acessar e modificar as configurações do sistema.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="hierarchy" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hierarchy">
            <Network className="mr-2 h-4 w-4" />
            Hierarquia
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="links">
            <Link2 className="mr-2 h-4 w-4" />
            Links
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Webhook className="mr-2 h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="mr-2 h-4 w-4" />
            Mensagens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy" className="mt-6">
          <TeamHierarchy />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Atribua perfis e gerencie permissões dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <OrganizationLinks />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <WhatsAppConnection />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                <CardTitle>Mensagens Automáticas</CardTitle>
              </div>
              <CardDescription>
                Configure mensagens padrão do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Personalize as mensagens automáticas:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Saudação inicial</li>
                  <li>Mensagem de ausência</li>
                  <li>Encerramento de atendimento</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsView;
