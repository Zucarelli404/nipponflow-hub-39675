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

  const circleClasses = cn(
    "w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300",
    {
      "bg-green-500 border-green-600": isCompleted,
      "bg-gradient-to-br from-green-400 to-emerald-500 border-green-600 shadow-lg animate-pulse": isAvailable,
      "bg-gray-300 border-gray-400": isLocked,
    }
  );

  return (
    <div className="flex items-center gap-4 group">
      {/* Node Circle */}
      <div className="relative flex-shrink-0">
        <div className={circleClasses}>
          {isCompleted && <Check className="w-8 h-8 text-white" strokeWidth={3} />}
          {isAvailable && <Icon className="w-8 h-8 text-white" />}
          {isLocked && <Lock className="w-6 h-6 text-gray-500" />}
        </div>
        
        {/* Glow effect for available levels */}
        {isAvailable && (
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-30 blur-xl animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">{level.titulo}</h3>
            <p className="text-sm text-muted-foreground mt-1">{level.descricao}</p>

            {/* Progress Bar */}
            {hasProgress && !isCompleted && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>
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
              <div className="mt-2 flex gap-3 text-xs">
                {level.recompensa_xp > 0 && (
                  <span className="text-amber-600 font-medium">+{level.recompensa_xp} XP</span>
                )}
                {level.recompensa_diamantes > 0 && (
                  <span className="text-cyan-600 font-medium">+{level.recompensa_diamantes} 💎</span>
                )}
              </div>
            )}

            {/* Status Badge */}
            {isCompleted && (
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                COMPLETO
              </span>
            )}
            {isLocked && (
              <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                Complete o nível anterior
              </span>
            )}
          </div>

          {/* Action Button */}
          {isAvailable && (
            <Button
              onClick={onClick}
              className="bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg animate-pulse"
            >
              COMEÇAR
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
