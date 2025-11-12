import LeadsTable from '@/components/leads/LeadsTable';
import LeadForm from '@/components/leads/LeadForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

const LeadsView = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-muted-foreground">Visualização e gestão de leads</p>
        </div>
        <LeadForm onSuccess={() => setRefreshKey(prev => prev + 1)} />
      </div>
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
    </div>
  );
};

export default LeadsView;
