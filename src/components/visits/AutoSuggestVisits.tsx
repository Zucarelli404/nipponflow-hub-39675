import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Calendar, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SuggestedLead {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  created_at: string;
  updated_at: string;
  reason: string;
}

interface Especialista {
  id: string;
  nome: string;
}

const AutoSuggestVisits = () => {
  const [suggestions, setSuggestions] = useState<SuggestedLead[]>([]);
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<SuggestedLead | null>(null);
  const [especialistaId, setEspecialistaId] = useState('');
  const [dataAgendada, setDataAgendada] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchSuggestions();
    fetchEspecialistas();
  }, []);

  const fetchEspecialistas = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setEspecialistas(data || []);
    } catch (error) {
      console.error('Error fetching especialistas:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      // Get all leads that are not lost and don't have scheduled visits
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .neq('status', 'perdido')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const suggestedLeads: SuggestedLead[] = [];

      for (const lead of leads || []) {
        const createdDate = new Date(lead.created_at);
        const updatedDate = new Date(lead.updated_at);
        const daysSinceCreated = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysSinceUpdated = Math.floor(
          (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        let reason = '';

        if (lead.status === 'novo' && daysSinceCreated >= 3) {
          reason = 'Lead novo há mais de 3 dias sem visita';
          suggestedLeads.push({ ...lead, reason });
        } else if ((lead.status as any) === 'contatado' && daysSinceUpdated >= 7) {
          reason = 'Lead contatado há mais de 7 dias sem progressão';
          suggestedLeads.push({ ...lead, reason });
        } else if ((lead.status as any) === 'qualificado') {
          reason = 'Lead qualificado aguardando visita';
          suggestedLeads.push({ ...lead, reason });
        } else if (daysSinceUpdated >= 14) {
          reason = 'Lead sem atividade há mais de 14 dias';
          suggestedLeads.push({ ...lead, reason });
        }
      }

      setSuggestions(suggestedLeads.slice(0, 10));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedLead || !especialistaId || !dataAgendada || !user) return;

    setScheduling(true);
    try {
      // @ts-ignore
      const { error } = await (supabase as any).from('scheduled_visits').insert({
        lead_id: selectedLead.id,
        especialista_id: especialistaId,
        data_visita: dataAgendada,
        status: 'agendada',
      });

      if (error) throw error;

      // Notificação de evento (visita agendada automaticamente)
      const leadNome = selectedLead?.nome;
      await (supabase as any)
        .from('event_notifications')
        .insert({
          id: `evt-${Date.now()}`,
          user_id: user.id,
          type: 'visit',
          entity_id: selectedLead.id,
          message: `Visita agendada${leadNome ? ` para ${leadNome}` : ''}`,
          created_at: new Date().toISOString(),
          read: false,
          metadata: {
            lead_id: selectedLead.id,
            lead_nome: leadNome,
            data: dataAgendada,
          },
        });

      // Dispara atualização local (DEMO)
      window.dispatchEvent(new CustomEvent('event-notifications-updated'));

      toast.success('Visita agendada automaticamente');
      setSelectedLead(null);
      setEspecialistaId('');
      setDataAgendada('');
      fetchSuggestions();
    } catch (error) {
      console.error('Error scheduling visit:', error);
      toast.error('Erro ao agendar visita');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Analisando leads...
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhuma sugestão automática no momento
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os leads estão em dia
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Sugestões Automáticas de Visitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((lead) => (
              <div
                key={lead.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{lead.nome}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {lead.telefone}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {lead.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Clock className="h-3 w-3" />
                  <span>{lead.reason}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>
                    Criado{' '}
                    {formatDistanceToNow(new Date(lead.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <span>
                    Atualizado{' '}
                    {formatDistanceToNow(new Date(lead.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() => setSelectedLead(lead)}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Visita
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Visita Automática</DialogTitle>
            <DialogDescription>
              Lead: {selectedLead?.nome} - {selectedLead?.telefone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Especialista</Label>
              <Select value={especialistaId} onValueChange={setEspecialistaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o especialista" />
                </SelectTrigger>
                <SelectContent>
                  {especialistas.map((esp) => (
                    <SelectItem key={esp.id} value={esp.id}>
                      {esp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data e Hora</Label>
              <Input
                type="datetime-local"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <Button
              onClick={handleSchedule}
              disabled={scheduling || !especialistaId || !dataAgendada}
              className="w-full"
            >
              {scheduling ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutoSuggestVisits;
