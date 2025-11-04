import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gift, ShoppingCart, Star, Check } from "lucide-react";

interface Reward {
  id: string;
  titulo: string;
  descricao: string | null;
  custo_pontos: number;
  tipo: string;
  quantidade_disponivel: number | null;
  imagem_url: string | null;
  is_active: boolean;
}

interface UserPoints {
  total_points: number;
}

export function RewardsStore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rewardsRes, pointsRes] = await Promise.all([
        supabase
          .from("rewards" as any)
          .select("*")
          .eq("is_active", true)
          .order("custo_pontos", { ascending: true }),
        supabase
          .from("user_points" as any)
          .select("total_points")
          .eq("user_id", user?.id)
          .maybeSingle(),
      ]);

      if (rewardsRes.error) throw rewardsRes.error;
      if (pointsRes.error) throw pointsRes.error;

      setRewards((rewardsRes.data as unknown as Reward[]) || []);
      setUserPoints(pointsRes.data as unknown as UserPoints);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user) return;

    if (!userPoints || userPoints.total_points < reward.custo_pontos) {
      toast({
        title: "Pontos insuficientes",
        description: `Você precisa de ${reward.custo_pontos} pontos para resgatar este prêmio.`,
        variant: "destructive",
      });
      return;
    }

    setRedeeming(reward.id);

    try {
      const { error } = await supabase
        .from("reward_redemptions" as any)
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          pontos_gastos: reward.custo_pontos,
          status: "pendente",
        });

      if (error) throw error;

      toast({
        title: "Resgate solicitado!",
        description: "Sua solicitação está sendo processada pela equipe.",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Erro ao resgatar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setRedeeming(null);
    }
  };

  const canAfford = (custo: number) => {
    return userPoints && userPoints.total_points >= custo;
  };

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      fisico: "Prêmio Físico",
      experiencia: "Experiência",
      bonus: "Bônus",
      folga: "Folga",
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return <div>Carregando loja...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seus Pontos</p>
                <p className="text-3xl font-bold">
                  {userPoints?.total_points.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <Gift className="h-12 w-12 text-primary/20" />
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-medium mb-4">Prêmios Disponíveis</h3>
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Nenhum prêmio disponível no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const affordable = canAfford(reward.custo_pontos);
              const outOfStock =
                reward.quantidade_disponivel !== null &&
                reward.quantidade_disponivel <= 0;

              return (
                <Card
                  key={reward.id}
                  className={`relative ${
                    !affordable || outOfStock ? "opacity-60" : ""
                  }`}
                >
                  {reward.imagem_url && (
                    <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={reward.imagem_url}
                        alt={reward.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{reward.titulo}</CardTitle>
                      <Badge variant="secondary">{getTypeLabel(reward.tipo)}</Badge>
                    </div>
                    {reward.descricao && (
                      <CardDescription>{reward.descricao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="text-2xl font-bold">
                          {reward.custo_pontos.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">pontos</span>
                      </div>
                      {reward.quantidade_disponivel !== null && (
                        <Badge variant="outline">
                          {reward.quantidade_disponivel} disponíveis
                        </Badge>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      disabled={!affordable || outOfStock || redeeming === reward.id}
                      onClick={() => handleRedeem(reward)}
                    >
                      {redeeming === reward.id ? (
                        "Resgatando..."
                      ) : outOfStock ? (
                        "Esgotado"
                      ) : affordable ? (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Resgatar
                        </>
                      ) : (
                        "Pontos Insuficientes"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
