import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Gift, TrendingUp, Users, Award } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalPoints: number;
  activeGoals: number;
  completedGoals: number;
  totalBadges: number;
  badgesAwarded: number;
  pendingRedemptions: number;
  totalRedemptions: number;
}

export function GamificationStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPoints: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalBadges: 0,
    badgesAwarded: 0,
    pendingRedemptions: 0,
    totalRedemptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        usersRes,
        pointsRes,
        goalsRes,
        badgesRes,
        userBadgesRes,
        redemptionsRes,
      ] = await Promise.all([
        supabase.from("user_points" as any).select("*", { count: "exact" }),
        supabase.from("user_points" as any).select("total_points"),
        supabase.from("goals" as any).select("status"),
        supabase.from("badges" as any).select("*", { count: "exact" }),
        supabase.from("user_badges" as any).select("*", { count: "exact" }),
        supabase.from("reward_redemptions" as any).select("status"),
      ]);

      const totalPoints =
        (pointsRes.data as any[])?.reduce((sum, u) => sum + (u.total_points || 0), 0) || 0;

      const activeGoals =
        (goalsRes.data as any[])?.filter((g) => g.status === "ativa").length || 0;
      const completedGoals =
        (goalsRes.data as any[])?.filter((g) => g.status === "concluida").length || 0;

      const pendingRedemptions =
        (redemptionsRes.data as any[])?.filter((r) => r.status === "pendente").length || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalPoints,
        activeGoals,
        completedGoals,
        totalBadges: badgesRes.count || 0,
        badgesAwarded: userBadgesRes.count || 0,
        pendingRedemptions,
        totalRedemptions: redemptionsRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Estatísticas de Gamificação</h3>
        <p className="text-sm text-muted-foreground">
          Visão geral do sistema de gamificação
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Participando do sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Distribuídos entre todos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedGoals} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.badgesAwarded}</div>
            <p className="text-xs text-muted-foreground">
              De {stats.totalBadges} disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Conquistas
            </CardTitle>
            <CardDescription>Performance de badges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Badges</span>
              <span className="text-2xl font-bold">{stats.totalBadges}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Badges Conquistadas</span>
              <span className="text-2xl font-bold">{stats.badgesAwarded}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taxa de Conquista</span>
              <span className="text-2xl font-bold">
                {stats.totalBadges > 0
                  ? ((stats.badgesAwarded / (stats.totalBadges * stats.totalUsers)) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Resgates
            </CardTitle>
            <CardDescription>Performance de prêmios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Resgates</span>
              <span className="text-2xl font-bold">{stats.totalRedemptions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pendentes</span>
              <span className="text-2xl font-bold text-orange-500">
                {stats.pendingRedemptions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aprovados</span>
              <span className="text-2xl font-bold text-green-500">
                {stats.totalRedemptions - stats.pendingRedemptions}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
