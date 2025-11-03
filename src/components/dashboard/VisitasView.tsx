import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ScheduleVisitForm from '@/components/visits/ScheduleVisitForm';
import AutoSuggestVisits from '@/components/visits/AutoSuggestVisits';
import ScheduledVisitsList from '@/components/visits/ScheduledVisitsList';

interface VisitReport {
  id: string;
  data_visita: string;
  venda_realizada: boolean;
  valor_total: number;
  lead: {
    nome: string;
  };
  especialista: {
    nome: string;
  };
}

const VisitasView = () => {
  const [visits, setVisits] = useState<VisitReport[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      // @ts-ignore - Tabela será criada pela migration
      const { data, error } = await (supabase as any)
        .from('visit_reports')
        .select(`
          *,
          lead:leads(nome),
          especialista:profiles!visit_reports_especialista_id_fkey(nome)
        `)
        .order('data_visita', { ascending: false })
        .limit(20);

      if (error) throw error;

      const visitData = data || [];
      setVisits(visitData);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayVisits = visitData.filter((v: any) => 
        new Date(v.data_visita) >= todayStart
      ).length;

      const weekVisits = visitData.filter((v: any) => 
        new Date(v.data_visita) >= weekStart
      ).length;

      const monthVisits = visitData.filter((v: any) => 
        new Date(v.data_visita) >= monthStart
      ).length;

      const successfulVisits = visitData.filter((v: any) => v.venda_realizada).length;
      const successRate = visitData.length > 0 
        ? Math.round((successfulVisits / visitData.length) * 100) 
        : 0;

      setStats({
        today: todayVisits,
        thisWeek: weekVisits,
        thisMonth: monthVisits,
        successRate,
      });
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Visitas</h2>
          <p className="text-muted-foreground">Gerencie e acompanhe visitas realizadas</p>
        </div>
        <ScheduleVisitForm onSuccess={fetchVisits} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Visitas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">Visitas realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">Total de visitas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Visitas com venda</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Carregando visitas...
                </div>
              ) : visits.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma visita registrada ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Especialista</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-medium">
                          {(visit as any).lead?.nome}
                        </TableCell>
                        <TableCell>{(visit as any).especialista?.nome}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(visit.data_visita), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          {visit.venda_realizada ? (
                            <Badge variant="default">Venda Realizada</Badge>
                          ) : (
                            <Badge variant="secondary">Sem Venda</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {visit.venda_realizada ? (
                            `R$ ${visit.valor_total.toFixed(2)}`
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Visitas Agendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduledVisitsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <AutoSuggestVisits />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisitasView;
