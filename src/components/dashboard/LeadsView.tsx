import LeadsTable from '@/components/leads/LeadsTable';
import LeadForm from '@/components/leads/LeadForm';
import LeadAnalytics from '@/components/leads/LeadAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { BarChart3, Table as TableIcon } from 'lucide-react';

const LeadsView = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-muted-foreground">Análise completa do funil de conversão</p>
        </div>
        <LeadForm onSuccess={() => setRefreshKey(prev => prev + 1)} />
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análise de Dados
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            Tabela Completa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <LeadAnalytics key={refreshKey} />
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Leads</CardTitle>
              <CardDescription>
                Visualização detalhada com dados de visitas e vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsTable key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadsView;
