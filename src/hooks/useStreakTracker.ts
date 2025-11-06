import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export const useStreakTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Update streak on mount
    const updateStreak = async () => {
      try {
        await supabase.rpc("update_user_streak");
        queryClient.invalidateQueries({ queryKey: ["user-progression"] });
      } catch (error) {
        console.error("Error updating streak:", error);
      }
    };

    updateStreak();

    // Set up interval to check daily
    const interval = setInterval(updateStreak, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [user, queryClient]);
};
