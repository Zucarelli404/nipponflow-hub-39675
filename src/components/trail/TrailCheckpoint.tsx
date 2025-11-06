import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { TrailProgress } from "@/hooks/useTrailProgression";
import { Progress } from "@/components/ui/progress";

interface TrailCheckpointProps {
  progress: TrailProgress;
  onClick: () => void;
}

export const TrailCheckpoint = ({ progress, onClick }: TrailCheckpointProps) => {
  const { level, status, progresso_atual } = progress;
  const Icon = (LucideIcons as any)[level.icone] || LucideIcons.Trophy;

  const isCompleted = status === "completed";
  const isAvailable = status === "available" || status === "in_progress";
  const isLocked = status === "locked";
  const hasProgress = progresso_atual > 0 && level.requisito_quantidade > 0;
  const progressPercent = level.requisito_quantidade > 0 
    ? (progresso_atual / level.requisito_quantidade) * 100 
    : 0;

  return (
    <div className="flex justify-center my-8">
      <div 
        className={cn(
          "relative max-w-md w-full bg-gradient-to-br rounded-xl p-6 border-4 transition-all duration-300 cursor-pointer",
          {
            "from-amber-400 to-yellow-500 border-yellow-600 shadow-2xl": isCompleted,
            "from-amber-300 to-yellow-400 border-yellow-500 shadow-xl animate-pulse": isAvailable,
            "from-gray-300 to-gray-400 border-gray-500 opacity-60": isLocked,
          }
        )}
        onClick={isAvailable || isCompleted ? onClick : undefined}
      >
        {/* Shimmer effect for checkpoints */}
        {(isCompleted || isAvailable) && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        )}

        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/40">
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white text-center mb-2">
            {level.titulo}
          </h3>
          <p className="text-white/90 text-center text-sm mb-4">{level.descricao}</p>

          {/* Progress */}
          {hasProgress && !isCompleted && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-white/90">
                <span>Progresso</span>
                <span className="font-bold">
                  {progresso_atual} / {level.requisito_quantidade}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3 bg-white/20" />
            </div>
          )}

          {/* Rewards */}
          <div className="flex justify-center gap-4 mb-4">
            {level.recompensa_xp > 0 && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-bold">+{level.recompensa_xp} XP</span>
              </div>
            )}
            {level.recompensa_diamantes > 0 && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-bold">+{level.recompensa_diamantes} 💎</span>
              </div>
            )}
          </div>

          {/* Unlocks for Consultor Avançado */}
          {level.nivel === 6 && isCompleted && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 space-y-2">
              <p className="text-white font-semibold text-sm mb-2">Parabéns! Você desbloqueou:</p>
              <ul className="text-white/90 text-xs space-y-1">
                <li>✓ Acesso a materiais avançados</li>
                <li>✓ Metas progressivas mais desafiadoras</li>
              </ul>
            </div>
          )}

          {/* Unlocks for Distribuidor checkpoint */}
          {level.nivel === 7 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 space-y-2">
              <p className="text-white font-semibold text-sm mb-2">Desbloqueios:</p>
              <ul className="text-white/90 text-xs space-y-1">
                <li>✓ Cadastre produtos</li>
                <li>✓ Cadastre consultores</li>
                <li>✓ Acesse relatórios da rede</li>
              </ul>
            </div>
          )}

          {/* Status Badge */}
          {isCompleted && (
            <div className="text-center mt-4">
              <span className="inline-block px-4 py-2 bg-white text-yellow-600 font-bold rounded-full text-sm">
                ✨ CONQUISTADO ✨
              </span>
            </div>
          )}
          {isLocked && (
            <div className="text-center mt-4">
              <span className="inline-block px-4 py-2 bg-white/20 text-white font-medium rounded-full text-sm">
                🔒 Complete os níveis anteriores
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
