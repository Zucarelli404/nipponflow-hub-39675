import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditLogParams {
  acao: string;
  alvo_tipo?: string;
  alvo_id?: string;
  detalhes?: Record<string, any>;
}

export const useAuditLog = () => {
  const { toast } = useToast();

  const logAction = async ({ acao, alvo_tipo, alvo_id, detalhes }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          acao,
          alvo_tipo,
          alvo_id,
          detalhes,
        });

      if (error) {
        console.error('Erro ao registrar log de auditoria:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const logLeadAction = (acao: string, leadId: string, detalhes?: Record<string, any>) => {
    return logAction({
      acao,
      alvo_tipo: 'lead',
      alvo_id: leadId,
      detalhes,
    });
  };

  const logVisitAction = (acao: string, visitId: string, detalhes?: Record<string, any>) => {
    return logAction({
      acao,
      alvo_tipo: 'visita',
      alvo_id: visitId,
      detalhes,
    });
  };

  const logSystemAction = (acao: string, detalhes?: Record<string, any>) => {
    return logAction({
      acao,
      alvo_tipo: 'sistema',
      detalhes,
    });
  };

  return {
    logAction,
    logLeadAction,
    logVisitAction,
    logSystemAction,
  };
};
