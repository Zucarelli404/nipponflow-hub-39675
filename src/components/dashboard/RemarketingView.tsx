import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Users, Target, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RemarketingLeadsList from '@/components/remarketing/RemarketingLeadsList';
import CampaignsList from '@/components/remarketing/CampaignsList';

const RemarketingView = () => {
  const [stats, setStats] = useState({
    lostLeads: 0,
    activeCampaigns: 0,
    totalContacts: 0,
    reconquered: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Lost leads
      const { count: lostCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'perdido');

      // Active campaigns
      // @ts-ignore
      const { count: campaignsCount } = await (supabase as any)
        .from('remarketing_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativa');

      // Total contacts and reconquered (from campaigns)
      // @ts-ignore
      const { data: campaignsData } = await (supabase as any)
        .from('remarketing_campaigns')
        .select('contatos_realizados, leads_reconquistados');

      const totalContacts = campaignsData?.reduce(
        (sum: number, c: any) => sum + (c.contatos_realizados || 0),
        0
      ) || 0;

      const totalReconquered = campaignsData?.reduce(
        (sum: number, c: any) => sum + (c.leads_reconquistados || 0),
        0
      ) || 0;

      setStats({
        lostLeads: lostCount || 0,
        activeCampaigns: campaignsCount || 0,
        totalContacts,
        reconquered: totalReconquered,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Remarketing</h2>
        <p className="text-muted-foreground">Reconquiste clientes e recupere oportunidades</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Perdidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lostLeads}</div>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Realizados</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconquistados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reconquered}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalContacts > 0
                ? `${Math.round((stats.reconquered / stats.totalContacts) * 100)}%`
                : '0%'}{' '}
              de sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leads">Leads para Reconquistar</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle>Leads Perdidos</CardTitle>
            </CardHeader>
            <CardContent>
              <RemarketingLeadsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RemarketingView;
