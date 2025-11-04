import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, TrendingUp, Users, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Goal {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  categoria: string;
  meta_valor: number;
  valor_atual: number;
  unidade: string;
  pontos_recompensa: number;
  premio_descricao: string | null;
  data_inicio: string;
  data_fim: string;
  status: string;
}

export function GoalsManager() {
  const { user, userRole } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("goals" as any)
        .select("*")
        .or(`user_id.eq.${user.id},tipo.eq.geral,tipo.eq.equipe`)
        .eq("status", "ativa")
        .order("data_fim", { ascending: true });

      if (error) throw error;
      setGoals((data as unknown as Goal[]) || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercent = (goal: Goal) => {
    return Math.min((goal.valor_atual / goal.meta_valor) * 100, 100);
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "individual":
        return <User className="h-4 w-4" />;
      case "equipe":
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case "individual":
        return "Individual";
      case "equipe":
        return "Equipe";
      default:
        return "Geral";
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case "vendas":
        return "bg-green-500";
      case "visitas":
        return "bg-blue-500";
      case "leads":
        return "bg-purple-500";
      case "conversao":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return <div>Carregando metas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Metas e Objetivos</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe seu progresso e conquiste recompensas
          </p>
        </div>
        {(userRole === "admin" || userRole === "gerente" || userRole === "diretor") && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Button>
        )}
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Nenhuma meta ativa no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = getProgressPercent(goal);
            const isCompleted = progress >= 100;

            return (
              <Card key={goal.id} className={isCompleted ? "border-green-500" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.titulo}</CardTitle>
                      <CardDescription className="mt-1">
                        {goal.descricao}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {getTypeIcon(goal.tipo)}
                      <span className="ml-1">{getTypeLabel(goal.tipo)}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {goal.valor_atual.toLocaleString()} /{" "}
                        {goal.meta_valor.toLocaleString()} {goal.unidade}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{progress.toFixed(0)}% completo</span>
                      {isCompleted && (
                        <Badge variant="default" className="text-xs">
                          ✓ Concluída
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getCategoryColor(
                          goal.categoria
                        )}`}
                      />
                      <span className="text-sm text-muted-foreground capitalize">
                        {goal.categoria}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        +{goal.pontos_recompensa} pts
                      </div>
                      <div className="text-xs text-muted-foreground">
                        até {format(new Date(goal.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>

                  {goal.premio_descricao && (
                    <div className="bg-accent/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="font-medium">Prêmio:</span>
                        <span className="text-muted-foreground">
                          {goal.premio_descricao}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
