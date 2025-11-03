import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Plus } from 'lucide-react';

interface ScheduleVisitFormProps {
  onSuccess?: () => void;
}

interface Lead {
  id: string;
  nome: string;
  telefone: string;
}

interface Especialista {
  id: string;
  nome: string;
}

const ScheduleVisitForm = ({ onSuccess }: ScheduleVisitFormProps) => {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [leadId, setLeadId] = useState('');
  const [especialistaId, setEspecialistaId] = useState('');
  const [dataAgendada, setDataAgendada] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchLeads();
      fetchEspecialistas();
    }
  }, [open]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome, telefone')
        .neq('status', 'perdido')
        .order('nome');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !leadId || !especialistaId || !dataAgendada) return;

    setLoading(true);
    try {
      // @ts-ignore
      const { error } = await (supabase as any).from('scheduled_visits').insert({
        lead_id: leadId,
        especialista_id: especialistaId,
        data_agendada: dataAgendada,
        observacoes: observacoes.trim() || null,
        status: 'agendada',
        created_by: user.id,
      });

      if (error) throw error;

      // Update lead status_visita
      // @ts-ignore
      await (supabase as any)
        .from('leads')
        .update({ status_visita: 'agendada' })
        .eq('id', leadId);

      toast.success('Visita agendada com sucesso');
      setOpen(false);
      setLeadId('');
      setEspecialistaId('');
      setDataAgendada('');
      setObservacoes('');
      onSuccess?.();
    } catch (error) {
      console.error('Error scheduling visit:', error);
      toast.error('Erro ao agendar visita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agendar Visita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Visita Manualmente
          </DialogTitle>
          <DialogDescription>
            Agende uma visita para um lead específico
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead">Lead</Label>
            <Select value={leadId} onValueChange={setLeadId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.nome} - {lead.telefone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialista">Especialista</Label>
            <Select
              value={especialistaId}
              onValueChange={setEspecialistaId}
              required
            >
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
            <Label htmlFor="dataAgendada">Data e Hora</Label>
            <Input
              id="dataAgendada"
              type="datetime-local"
              value={dataAgendada}
              onChange={(e) => setDataAgendada(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes sobre a visita..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Agendando...' : 'Agendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleVisitForm;
