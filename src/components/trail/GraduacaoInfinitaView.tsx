import { useState, useEffect } from "react";
import { TrailHeader } from "./TrailHeader";
import { TrailPath } from "./TrailPath";
import { TrailFooter } from "./TrailFooter";
import { LevelDetailModal } from "./LevelDetailModal";
import { useTrailProgression, TrailProgress } from "@/hooks/useTrailProgression";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const GraduacaoInfinitaView = () => {
  const { user } = useAuth();
  const {
    userProgression,
    trailProgress,
    isLoading,
    getCheckpointLabel,
    calculateOverallProgress,
  } = useTrailProgression();
  
  useStreakTracker();

  const [selectedLevel, setSelectedLevel] = useState<TrailProgress | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleLevelClick = (progress: TrailProgress) => {
    if (progress.status === "locked") {
      toast.error("Complete o nível anterior para desbloquear");
      return;
    }
    setSelectedLevel(progress);
    setModalOpen(true);
  };

  const handleNavigate = (page: string) => {
    if (page === "graduacao") return;
    
    // Dispatch custom event to navigate in Index.tsx
    const event = new CustomEvent("navigate", { detail: page });
    window.dispatchEvent(event);
  };

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("trail-progress-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_trail_progress",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          const oldStatus = (payload.old as any).status;

          // Show notification when level is completed
          if (oldStatus !== "completed" && newStatus === "completed") {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
            toast.success("🎉 Nível completado!", {
              description: "Você ganhou recompensas!",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Toggle Trilha/Ranking */}
      <div className="container mx-auto px-4 pt-4 sm:pt-6">
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-lg border bg-card">
            <button
              className="px-3 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-l-lg"
              onClick={() => handleNavigate("graduacao")}
            >
              Trilha
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded-r-lg hover:bg-accent"
              onClick={() => handleNavigate("graduacao-ranking")}
            >
              Ranking
            </button>
          </div>
        </div>
      </div>
      <TrailHeader 
        userProgression={userProgression}
        checkpointLabel={getCheckpointLabel(userProgression?.current_checkpoint || "graduado")}
        overallProgress={calculateOverallProgress()}
      />
      <TrailPath
        trailProgress={trailProgress || []}
        onLevelClick={handleLevelClick}
      />
      <TrailFooter activePage="graduacao" onNavigate={handleNavigate} />
      <LevelDetailModal
        progress={selectedLevel}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default GraduacaoInfinitaView;
