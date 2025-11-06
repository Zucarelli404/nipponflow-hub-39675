import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TrailLevel {
  id: string;
  nivel: number;
  tipo: "task" | "checkpoint";
  titulo: string;
  descricao: string;
  icone: string;
  recompensa_xp: number;
  recompensa_diamantes: number;
  requisito_tipo: string;
  requisito_quantidade: number;
  ordem: number;
}

export interface TrailProgress {
  id: string;
  level_id: string;
  status: "locked" | "available" | "in_progress" | "completed";
  progresso_atual: number;
  completed_at: string | null;
  level: TrailLevel;
}

export interface UserProgression {
  id: string;
  current_checkpoint: string;
  nivel_atual: number;
  vendas_totais: number;
  visitas_completadas: number;
  leads_cadastrados: number;
  diamantes: number;
  vidas: number;
  ofensiva_dias: number;
  ultima_atividade: string;
}

export const useTrailProgression = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userProgression, isLoading: progressionLoading } = useQuery({
    queryKey: ["user-progression", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_progression")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as UserProgression;
    },
    enabled: !!user,
  });

  const { data: trailProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["trail-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_trail_progress")
        .select(`
          *,
          level:trail_levels(*)
        `)
        .eq("user_id", user.id)
        .order("level(ordem)");

      if (error) throw error;
      return data as TrailProgress[];
    },
    enabled: !!user,
  });

  const refreshProgress = () => {
    queryClient.invalidateQueries({ queryKey: ["user-progression"] });
    queryClient.invalidateQueries({ queryKey: ["trail-progress"] });
  };

  const getCheckpointLabel = (checkpoint: string) => {
    switch (checkpoint) {
      case "distribuidor":
        return "Distribuidor Independente";
      case "consultor":
        return "Consultor";
      default:
        return "Graduado";
    }
  };

  const calculateOverallProgress = () => {
    if (!trailProgress || trailProgress.length === 0) return 0;
    const completed = trailProgress.filter((p) => p.status === "completed").length;
    return Math.round((completed / trailProgress.length) * 100);
  };

  return {
    userProgression,
    trailProgress,
    isLoading: progressionLoading || progressLoading,
    refreshProgress,
    getCheckpointLabel,
    calculateOverallProgress,
  };
};
