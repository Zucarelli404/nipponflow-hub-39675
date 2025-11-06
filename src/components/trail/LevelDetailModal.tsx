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
import { useNavigate } from "react-router-dom";

interface LevelDetailModalProps {
  progress: TrailProgress | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LevelDetailModal = ({ progress, open, onOpenChange }: LevelDetailModalProps) => {
  const navigate = useNavigate();

  if (!progress) return null;

  const { level, progresso_atual, status } = progress;
  const Icon = (LucideIcons as any)[level.icone] || LucideIcons.Star;
  const isCompleted = status === "completed";
  const progressPercent = level.requisito_quantidade > 0 
    ? (progresso_atual / level.requisito_quantidade) * 100 
    : 0;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{level.titulo}</DialogTitle>
          </div>
          <DialogDescription className="text-base">{level.descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Progress */}
          {!isCompleted && level.requisito_quantidade > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-semibold">
                  {progresso_atual} / {level.requisito_quantidade}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          )}

          {/* Rewards */}
          {(level.recompensa_xp > 0 || level.recompensa_diamantes > 0) && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Recompensas:</p>
              <div className="flex gap-4">
                {level.recompensa_xp > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <span className="font-bold text-amber-600">+{level.recompensa_xp} XP</span>
                  </div>
                )}
                {level.recompensa_diamantes > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <span className="font-bold text-cyan-600">+{level.recompensa_diamantes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {getActionButton()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
