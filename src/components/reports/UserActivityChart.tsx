import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface UserActivity {
  user_id: string;
  nome: string;
  total_acoes: number;
  ultima_atividade: string;
}

const UserActivityChart = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: logsData, error } = await supabase
        .from('audit_logs')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar usuários únicos
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.nome]) || []);

      // Agrupar por usuário
      const grouped = (logsData || []).reduce((acc: Record<string, UserActivity>, log) => {
        const userId = log.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            nome: profilesMap.get(userId) || 'Usuário',
            total_acoes: 0,
            ultima_atividade: log.created_at,
          };
        }
        acc[userId].total_acoes += 1;
        return acc;
      }, {});

      const result = Object.values(grouped).sort((a, b) => b.total_acoes - a.total_acoes);
      setActivities(result);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxActions = Math.max(...activities.map(a => a.total_acoes), 1);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">Carregando atividades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Atividade por Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma atividade registrada
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.user_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{activity.nome}</span>
                  <span className="text-sm text-muted-foreground">{activity.total_acoes} ações</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${(activity.total_acoes / maxActions) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserActivityChart;
