import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const DemoAutoNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const now = new Date();

      // Toast de demonstração
      toast({
        title: "Notificação de demonstração",
        description: `Disparo automático às ${now.toLocaleTimeString()}`,
        duration: 4000,
      });

      // Inserir na lista de notificações para o sino (mock supabase)
      try {
        const id = `demo-${Date.now()}`;
        await supabase
          .from("event_notifications" as any)
          .insert({
            id,
            user_id: user.id,
            type: "visit",
            entity_id: "demo",
            message: "Notificação automática de demonstração",
            created_at: now.toISOString(),
            read: false,
            metadata: { data: now.toISOString() },
          })
          .then(() => {
            // Forçar atualização local da lista do sino
            window.dispatchEvent(new CustomEvent("event-notifications-updated"));
          });
      } catch (error) {
        // Silencioso em DEMO
        console.warn("Falha ao inserir notificação de demo:", error);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  return null;
};