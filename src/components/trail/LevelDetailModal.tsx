import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrailProgress } from "@/hooks/useTrailProgression";
import * as LucideIcons from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Lightbulb, Target, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface LevelDetailModalProps {
  progress: TrailProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LevelDetailModal = ({ progress, open, onOpenChange }: LevelDetailModalProps) => {
  const navigate = useNavigate();

  if (!progress) return null;

  const { level, progresso_atual, status, created_at, completed_at } = progress;
  const Icon = (LucideIcons as any)[level.icone] || LucideIcons.Star;
  const isCompleted = status === "completed";
  const isLocked = status === "locked";
  const progressPercent = level.requisito_quantidade > 0 
    ? (progresso_atual / level.requisito_quantidade) * 100 
    : 0;

  // Metas relacionadas ao requisito para avançar
  const [relatedGoals, setRelatedGoals] = useState<any[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    const loadGoals = async () => {
      setLoadingGoals(true);
      const categoria = level?.requisito_tipo;
      
      const goalData = await supabase
        .from("goals" as any)
        .select("*")
        .or("tipo.eq.individual,tipo.eq.geral")
        .eq("status", "ativa");

      if (goalData.error) {
        console.error("Error loading goals:", goalData.error);
      } else {
        const list = (goalData.data as any[]) || [];
        const filtered = categoria ? list.filter((g) => g.categoria === categoria) : list;
        setRelatedGoals(filtered);
      }
      setLoadingGoals(false);
    };

    loadGoals();
  }, [open, level?.requisito_tipo]);

  // Tips based on level type
  const getLevelTips = () => {
    const tips: Record<number, string[]> = {
      2: [
        "💡 Cadastre pelo menos 5 leads para começar",
        "📝 Inclua telefone e nome completo",
        "🎯 Priorize leads com maior potencial de compra",
        "⚡ Quanto mais leads, mais oportunidades de venda"
      ],
      3: [
        "📅 Escolha horários com boa disponibilidade",
        "📍 Confirme endereço antes de agendar",
        "⏰ Ligue para confirmar 1 dia antes",
        "🎒 Prepare materiais de demonstração"
      ],
      4: [
        "💰 Registre todas as vendas no sistema",
        "📦 Confirme disponibilidade dos produtos",
        "🤝 Ofereça condições de pagamento atrativas",
        "📈 Mantenha seu histórico atualizado"
      ],
      5: [
        "🎯 Foco na consistência diária",
        "📊 Acompanhe suas métricas semanais",
        "💪 Mantenha contato com leads antigos",
        "🚀 Busque referências de clientes satisfeitos"
      ],
      8: [
        "📦 Cadastre produtos com fotos e descrições",
        "💵 Defina preços competitivos",
        "📊 Controle seu estoque regularmente",
        "🏷️ Organize por categorias"
      ],
      9: [
        "👥 Cadastre consultores qualificados",
        "📚 Compartilhe materiais de treinamento",
        "🎓 Acompanhe o desenvolvimento da equipe",
        "🤝 Incentive a troca de experiências"
      ],
      10: [
        "📊 Analise relatórios semanalmente",
        "📈 Identifique padrões de vendas",
        "🎯 Use dados para definir metas",
        "💡 Compartilhe insights com a equipe"
      ]
    };
    return tips[level.nivel] || [
      "💪 Mantenha o foco e consistência",
      "📈 Acompanhe seu progresso regularmente",
      "🎯 Celebre cada conquista no caminho",
      "🚀 Não desista, você está progredindo!"
    ];
  };

  // Get requirement details
  const getRequirementDetails = () => {
    if (level.tipo === "checkpoint") {
      return {
        title: "Requisitos do Checkpoint",
        description: `Alcance ${level.requisito_quantidade} ${level.requisito_tipo || "vendas"} para conquistar este checkpoint importante.`,
        details: [
          `Meta: ${level.requisito_quantidade} ${level.requisito_tipo || "vendas"}`,
          `Progresso atual: ${progresso_atual}`,
          `Faltam: ${Math.max(0, level.requisito_quantidade - progresso_atual)}`
        ]
      };
    }
    
    return {
      title: "Como completar este nível",
      description: level.requisito_tipo 
        ? `Complete ${level.requisito_quantidade} ${level.requisito_tipo}`
        : "Complete as tarefas indicadas para avançar",
      details: level.requisito_tipo ? [
        `Tipo de ação: ${level.requisito_tipo}`,
        `Quantidade necessária: ${level.requisito_quantidade}`,
        `Seu progresso: ${progresso_atual}/${level.requisito_quantidade}`
      ] : []
    };
  };

  const getActionButton = () => {
    if (isCompleted) {
      return (
        <Button onClick={() => onOpenChange(false)} className="w-full">
          Voltar à Trilha
        </Button>
      );
    }

    // Map levels to actions
    switch (level.nivel) {
      case 2:
        return (
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate("/");
              setTimeout(() => {
                const event = new CustomEvent("navigate", { detail: "leads" });
                window.dispatchEvent(event);
              }, 100);
            }}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Cadastrar Leads
          </Button>
        );
      case 3:
        return (
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate("/");
              setTimeout(() => {
                const event = new CustomEvent("navigate", { detail: "visitas" });
                window.dispatchEvent(event);
              }, 100);
            }}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Agendar Visita
          </Button>
        );
      case 4:
        return (
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate("/");
              setTimeout(() => {
                const event = new CustomEvent("navigate", { detail: "visitas" });
                window.dispatchEvent(event);
              }, 100);
            }}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Registrar Venda
          </Button>
        );
      case 8:
        return (
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate("/");
              setTimeout(() => {
                const event = new CustomEvent("navigate", { detail: "estoque" });
                window.dispatchEvent(event);
              }, 100);
            }}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Cadastrar Produtos
          </Button>
        );
      case 9:
        return (
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate("/");
              setTimeout(() => {
                const event = new CustomEvent("navigate", { detail: "equipe" });
                window.dispatchEvent(event);
              }, 100);
            }}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Cadastrar Consultores
          </Button>
        );
      case 10:
        return (
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate("/");
              setTimeout(() => {
                const event = new CustomEvent("navigate", { detail: "relatorios" });
                window.dispatchEvent(event);
              }, 100);
            }}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            Ver Relatórios
          </Button>
        );
      default:
        return (
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Continuar Vendendo
          </Button>
        );
    }
  };

  const requirements = getRequirementDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isCompleted ? "bg-green-100" : isLocked ? "bg-gray-100" : "bg-primary/10"
              }`}>
                <Icon className={`w-7 h-7 ${
                  isCompleted ? "text-green-600" : isLocked ? "text-gray-400" : "text-primary"
                }`} />
              </div>
              <div>
                <DialogTitle className="text-2xl">{level.titulo}</DialogTitle>
                <Badge variant={isCompleted ? "default" : isLocked ? "secondary" : "outline"} className="mt-1">
                  {isCompleted ? "✓ Completo" : isLocked ? "🔒 Bloqueado" : "Em Andamento"}
                </Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              Nível {level.nivel}
            </div>
          </div>
          <DialogDescription className="text-base">{level.descricao}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <Target className="w-4 h-4 mr-1" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="requirements">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Requisitos
            </TabsTrigger>
            <TabsTrigger value="progress">
              <TrendingUp className="w-4 h-4 mr-1" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="tips">
              <Lightbulb className="w-4 h-4 mr-1" />
              Dicas
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="w-4 h-4 mr-1" />
              Metas para Avanço
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Progress */}
            {!isCompleted && level.requisito_quantidade > 0 && (
              <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progresso Atual</span>
                  <span className="font-bold text-primary">
                    {progresso_atual} / {level.requisito_quantidade}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  Faltam {Math.max(0, level.requisito_quantidade - progresso_atual)} para completar
                </p>
              </div>
            )}

            {isCompleted && completed_at && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Nível Completado!</span>
                </div>
                <p className="text-sm text-green-600">
                  Concluído em {format(new Date(completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}

            {/* Rewards */}
            {(level.recompensa_xp > 0 || level.recompensa_diamantes > 0) && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold mb-3 text-amber-900">🎁 Recompensas:</p>
                <div className="flex gap-4">
                  {level.recompensa_xp > 0 && (
                    <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <p className="font-bold text-amber-600">+{level.recompensa_xp} XP</p>
                        <p className="text-xs text-amber-700">Experiência</p>
                      </div>
                    </div>
                  )}
                  {level.recompensa_diamantes > 0 && (
                    <div className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2">
                      <span className="text-2xl">💎</span>
                      <div>
                        <p className="font-bold text-cyan-600">+{level.recompensa_diamantes}</p>
                        <p className="text-xs text-cyan-700">Diamantes</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              {getActionButton()}
            </div>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{requirements.title}</h3>
              <p className="text-sm text-blue-700 mb-3">{requirements.description}</p>
              {requirements.details.length > 0 && (
                <ul className="space-y-2">
                  {requirements.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {level.tipo === "checkpoint" && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2">⭐ Checkpoint Especial</h3>
                <p className="text-sm text-amber-700">
                  Este é um marco importante na sua jornada! Ao completá-lo, você desbloqueará novos recursos e funcionalidades.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Progress History Tab */}
          <TabsContent value="progress" className="space-y-4 mt-4">
            <div className="space-y-3">
              {created_at && (
                <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Nível Desbloqueado</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {progresso_atual > 0 && !isCompleted && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-blue-900">Progresso Atual</p>
                    <p className="text-xs text-blue-700">
                      {progresso_atual} de {level.requisito_quantidade} completados ({Math.round(progressPercent)}%)
                    </p>
                  </div>
                </div>
              )}

              {isCompleted && completed_at && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-green-900">Nível Completado</p>
                    <p className="text-xs text-green-700">
                      {format(new Date(completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {!isCompleted && progresso_atual === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Ainda não há progresso neste nível</p>
                  <p className="text-xs mt-1">Comece agora para ver seu histórico aqui!</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-3 mt-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Dicas para completar este nível</h3>
              </div>
              <div className="space-y-2">
                {getLevelTips().map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-purple-800 bg-white/50 rounded-lg p-2">
                    <span className="flex-shrink-0">{tip.split(" ")[0]}</span>
                    <span>{tip.substring(tip.indexOf(" ") + 1)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium">
                💪 Mantenha a consistência e você chegará lá!
              </p>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold text-gray-900">Metas que aceleram o avanço</h3>
              <p className="text-sm text-muted-foreground">
                Complete estas metas para avançar ao próximo nível e cargo
              </p>
            </div>

            {loadingGoals ? (
              <div className="text-sm text-muted-foreground">Carregando metas...</div>
            ) : relatedGoals.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma meta relacionada ativa no momento.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {relatedGoals.map((goal) => {
                  const pct = goal.meta_valor > 0 ? Math.min(100, (goal.valor_atual / goal.meta_valor) * 100) : 0;
                  const isCompletedGoal = pct >= 100;
                  return (
                    <Card key={goal.id} className={isCompletedGoal ? "border-green-500" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{goal.titulo}</CardTitle>
                            <CardDescription className="mt-1">{goal.descricao}</CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {goal.tipo === "geral" ? "Geral" : "Individual"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">
                            {goal.valor_atual} / {goal.meta_valor} {goal.unidade}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{pct.toFixed(0)}% completo</span>
                          <span className="font-medium">+{goal.pontos_recompensa} pontos</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
