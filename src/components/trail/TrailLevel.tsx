import { Check, Lock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { TrailProgress } from "@/hooks/useTrailProgression";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface TrailLevelProps {
  progress: TrailProgress;
  onClick: () => void;
}

export const TrailLevel = ({ progress, onClick }: TrailLevelProps) => {
  const { level, status, progresso_atual } = progress;
  const Icon = (LucideIcons as any)[level.icone] || LucideIcons.Star;

  const isCompleted = status === "completed";
  const isAvailable = status === "available" || status === "in_progress";
  const isLocked = status === "locked";
  const hasProgress = progresso_atual > 0 && level.requisito_quantidade > 0;

  return (
    <div className="flex items-start gap-4">
      {/* Icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all shadow-md",
          isCompleted && "bg-primary text-primary-foreground ring-4 ring-primary/20",
          isAvailable && !isCompleted && "bg-card border-4 border-primary text-primary",
          isLocked && "bg-muted border-4 border-border text-muted-foreground"
        )}
      >
        {isCompleted && <Check className="w-8 h-8" />}
        {isAvailable && !isCompleted && <Icon className="w-8 h-8" />}
        {isLocked && <Lock className="w-6 h-6" />}
      </div>

      {/* Content Card */}
      <div
        onClick={onClick}
        className={cn(
          "flex-1 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md",
          isCompleted && "bg-card border-2 border-primary",
          isAvailable && !isCompleted && "bg-card border-2 border-border hover:border-primary",
          isLocked && "bg-muted border-2 border-border opacity-60"
        )}
      >
        <div className="space-y-2">
          <h3 className="font-bold text-base text-foreground">{level.titulo}</h3>
          <p className="text-sm text-muted-foreground">{level.descricao}</p>

          {/* Progress Bar */}
          {hasProgress && !isCompleted && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span className="font-semibold">
                  {progresso_atual} / {level.requisito_quantidade}
                </span>
              </div>
              <Progress
                value={(progresso_atual / level.requisito_quantidade) * 100}
                className="h-2"
              />
            </div>
          )}

          {/* Rewards */}
          {(level.recompensa_xp > 0 || level.recompensa_diamantes > 0) && (
            <div className="flex gap-3 text-xs">
              {level.recompensa_xp > 0 && (
                <span className="text-primary font-bold">+{level.recompensa_xp} XP</span>
              )}
              {level.recompensa_diamantes > 0 && (
                <span className="text-primary font-bold">+{level.recompensa_diamantes} 💎</span>
              )}
            </div>
          )}

          {/* Status Badge or Action */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              <Check className="w-3 h-3" />
              COMPLETO
            </span>
          )}
          {isAvailable && !isCompleted && (
            <button className="w-full mt-2 px-4 py-2 bg-primary hover:bg-primary text-primary-foreground text-sm font-bold rounded-lg transition-colors">
              INICIAR
            </button>
          )}
          {isLocked && (
            <span className="inline-block px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
              🔒 Bloqueado
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
