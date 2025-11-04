import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Award, TrendingUp } from "lucide-react";

interface UserPoints {
  total_points: number;
  current_level: number;
  points_to_next_level: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  conquistado_em: string;
  badges: {
    nome: string;
    descricao: string;
    icone: string;
    cor: string;
  };
}

export function UserProfile() {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Buscar pontos do usuário
      const { data: pointsData, error: pointsError } = await supabase
        .from("user_points" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pointsError) throw pointsError;
      setUserPoints(pointsData as unknown as UserPoints);

      // Buscar badges do usuário
      const { data: badgesData, error: badgesError } = await supabase
        .from("user_badges" as any)
        .select(`
          *,
          badges (nome, descricao, icone, cor)
        `)
        .eq("user_id", user.id)
        .order("conquistado_em", { ascending: false });

      if (badgesError) throw badgesError;
      setUserBadges((badgesData as unknown as UserBadge[]) || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando perfil...</div>;
  }

  const progressPercent = userPoints
    ? ((userPoints.total_points % 100) / 100) * 100
    : 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Seu Nível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {userPoints?.current_level || 1}
              </div>
              <p className="text-sm text-muted-foreground">Nível Atual</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className="font-medium">
                  {userPoints?.total_points || 0} pontos
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {userPoints?.points_to_next_level || 100} pontos para o próximo nível
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {userPoints?.total_points || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total de Pontos</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {userBadges.length}
                </div>
                <p className="text-xs text-muted-foreground">Conquistas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Suas Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBadges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Você ainda não possui conquistas.</p>
              <p className="text-sm mt-1">Complete metas e realize ações para desbloquear badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userBadges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${userBadge.badges.cor}20` }}
                  >
                    <Trophy
                      className="h-8 w-8"
                      style={{ color: userBadge.badges.cor }}
                    />
                  </div>
                  <h4 className="font-semibold text-sm text-center">
                    {userBadge.badges.nome}
                  </h4>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {userBadge.badges.descricao}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {new Date(userBadge.conquistado_em).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
