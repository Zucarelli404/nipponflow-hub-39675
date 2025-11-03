import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Target, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ConversionMetrics {
  totalLeads: number;
  leadsComVisita: number;
  leadsComVenda: number;
  taxaVisita: number;
  taxaConversao: number;
  valorTotalVendas: number;
  ticketMedio: number;
  leadsPorOrigem: Record<string, number>;
  conversaoPorOrigem: Record<string, { total: number; vendas: number; taxa: number }>;
}

const LeadAnalytics = () => {
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    totalLeads: 0,
    leadsComVisita: 0,
    leadsComVenda: 0,
    taxaVisita: 0,
    taxaConversao: 0,
    valorTotalVendas: 0,
    ticketMedio: 0,
    leadsPorOrigem: {},
    conversaoPorOrigem: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Buscar todos os leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, origem, status');

      if (leadsError) throw leadsError;

      // Buscar todas as visitas com vendas
      const { data: visits, error: visitsError } = await (supabase as any)
        .from('visit_reports')
        .select(`
          id,
          lead_id,
          venda_realizada,
          valor_total,
          lead:leads(origem)
        `);

      if (visitsError) throw visitsError;

      const totalLeads = leads?.length || 0;
      const leadsComVisita = new Set(visits?.map((v: any) => v.lead_id)).size;
      const vendasRealizadas = visits?.filter((v: any) => v.venda_realizada) || [];
      const leadsComVenda = new Set(vendasRealizadas.map((v: any) => v.lead_id)).size;
      
      const valorTotalVendas = vendasRealizadas.reduce(
        (sum: number, v: any) => sum + Number(v.valor_total || 0),
        0
      );

      const ticketMedio = leadsComVenda > 0 ? valorTotalVendas / leadsComVenda : 0;
      const taxaVisita = totalLeads > 0 ? (leadsComVisita / totalLeads) * 100 : 0;
      const taxaConversao = totalLeads > 0 ? (leadsComVenda / totalLeads) * 100 : 0;

      // Análise por origem
      const leadsPorOrigem: Record<string, number> = {};
      const conversaoPorOrigem: Record<string, { total: number; vendas: number; taxa: number }> = {};

      leads?.forEach((lead: any) => {
        const origem = lead.origem || 'desconhecido';
        leadsPorOrigem[origem] = (leadsPorOrigem[origem] || 0) + 1;
        
        if (!conversaoPorOrigem[origem]) {
          conversaoPorOrigem[origem] = { total: 0, vendas: 0, taxa: 0 };
        }
        conversaoPorOrigem[origem].total++;
      });

      vendasRealizadas.forEach((venda: any) => {
        const origem = venda.lead?.origem || 'desconhecido';
        if (conversaoPorOrigem[origem]) {
          conversaoPorOrigem[origem].vendas++;
        }
      });

      // Calcular taxa de conversão por origem
      Object.keys(conversaoPorOrigem).forEach((origem) => {
        const { total, vendas } = conversaoPorOrigem[origem];
        conversaoPorOrigem[origem].taxa = total > 0 ? (vendas / total) * 100 : 0;
      });

      setMetrics({
        totalLeads,
        leadsComVisita,
        leadsComVenda,
        taxaVisita,
        taxaConversao,
        valorTotalVendas,
        ticketMedio,
        leadsPorOrigem,
        conversaoPorOrigem,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Carregando análises...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Base total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Visita</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taxaVisita.toFixed(1)}%</div>
            <Progress value={metrics.taxaVisita} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.leadsComVisita} leads visitados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.taxaConversao.toFixed(1)}%</div>
            <Progress value={metrics.taxaConversao} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.leadsComVenda} leads convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.ticketMedio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: R$ {metrics.valorTotalVendas.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Leads Captados</span>
                </div>
                <span className="font-bold">{metrics.totalLeads}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span className="font-medium">Leads com Visita</span>
                </div>
                <span className="font-bold">{metrics.leadsComVisita}</span>
              </div>
              <Progress value={metrics.taxaVisita} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.taxaVisita.toFixed(1)}% dos leads receberam visita
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-medium">Leads Convertidos</span>
                </div>
                <span className="font-bold">{metrics.leadsComVenda}</span>
              </div>
              <Progress value={metrics.taxaConversao} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.taxaConversao.toFixed(1)}% dos leads geraram venda
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance por Origem */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Origem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.conversaoPorOrigem)
              .sort(([, a], [, b]) => b.taxa - a.taxa)
              .map(([origem, data]) => (
                <div key={origem} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium capitalize">{origem}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.vendas} vendas de {data.total} leads
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.taxa >= metrics.taxaConversao ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm font-bold">{data.taxa.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={data.taxa} className="h-2" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadAnalytics;
