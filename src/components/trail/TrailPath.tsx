import { TrailLevel } from "./TrailLevel";
import { TrailCheckpoint } from "./TrailCheckpoint";
import { TrailProgress } from "@/hooks/useTrailProgression";

interface TrailPathProps {
  trailProgress: TrailProgress[];
  onLevelClick: (progress: TrailProgress) => void;
}

export const TrailPath = ({ trailProgress, onLevelClick }: TrailPathProps) => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="relative">
          {/* Vertical Connection Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-border" />

          {/* Trail Levels */}
          <div className="space-y-8 relative">
            {trailProgress.map((progress) => (
              <div key={progress.id}>
                {progress.level.tipo === "checkpoint" ? (
                  <TrailCheckpoint progress={progress} onClick={() => onLevelClick(progress)} />
                ) : (
                  <TrailLevel progress={progress} onClick={() => onLevelClick(progress)} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
