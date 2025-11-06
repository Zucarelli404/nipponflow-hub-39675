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
          isCompleted && "bg-green-500 text-white ring-4 ring-green-100",
          isAvailable && !isCompleted && "bg-white border-4 border-green-500 text-green-600",
          isLocked && "bg-gray-100 border-4 border-gray-300 text-gray-400"
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
          isCompleted && "bg-green-50 border-2 border-green-200",
          isAvailable && !isCompleted && "bg-white border-2 border-green-400 hover:border-green-500",
          isLocked && "bg-gray-50 border-2 border-gray-200 opacity-60"
        )}
      >
        <div className="space-y-2">
          <h3 className="font-bold text-base text-gray-900">{level.titulo}</h3>
          <p className="text-sm text-gray-600">{level.descricao}</p>

          {/* Progress Bar */}
          {hasProgress && !isCompleted && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
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
                <span className="text-amber-600 font-bold">+{level.recompensa_xp} XP</span>
              )}
              {level.recompensa_diamantes > 0 && (
                <span className="text-cyan-600 font-bold">+{level.recompensa_diamantes} 💎</span>
              )}
            </div>
          )}

          {/* Status Badge or Action */}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              <Check className="w-3 h-3" />
              COMPLETO
            </span>
          )}
          {isAvailable && !isCompleted && (
            <button className="w-full mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors">
              INICIAR
            </button>
          )}
          {isLocked && (
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              🔒 Bloqueado
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
