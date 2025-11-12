import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users, CheckCircle, Clock } from 'lucide-react';
import CandidateForm from '@/components/candidates/CandidateForm';
import CandidatesList from '@/components/candidates/CandidatesList';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type CandidateStats = {
  novos: number;
  emProcesso: number;
  aprovadosMes: number;
  total: number;
};

const CandidatosView = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<CandidateStats>({ novos: 0, emProcesso: 0, aprovadosMes: 0, total: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('candidates' as any)
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        const candidates = (data as any[]) || [];
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        const aprovadosMes = candidates.filter((c) => {
          const dt = new Date(c.created_at);
          return c.status === 'aprovado' && dt.getMonth() === month && dt.getFullYear() === year;
        }).length;

        const novos = candidates.filter((c) => c.status === 'pendente').length;
        const emProcesso = candidates.filter((c) => c.status === 'em_analise').length;
        const total = candidates.length;
        setStats({ novos, emProcesso, aprovadosMes, total });
      } catch (err) {
        if (import.meta.env.DEV) console.error('Erro ao carregar estatísticas de candidatos:', err);
      }
    };
    fetchStats();
  }, [refreshKey]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Candidatos</h2>
          <p className="text-muted-foreground">Gerencie processos seletivos e candidaturas</p>
        </div>
        <CandidateForm onSuccess={() => setRefreshKey(prev => prev + 1)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.novos}</div>
            <p className="text-xs text-muted-foreground">Aguardando triagem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Processo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emProcesso}</div>
            <p className="text-xs text-muted-foreground">Em avaliação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aprovadosMes}</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Na base</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Candidatos</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidatesList key={refreshKey} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidatosView;
