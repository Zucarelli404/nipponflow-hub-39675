import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Clock, FileText, Tag as TagIcon, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import VisitReportForm from '@/components/visits/VisitReportForm';
import VisitReportsList from '@/components/visits/VisitReportsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { handleError } from '@/lib/errorHandler';

interface LeadDetailsProps {
  leadId: string | null;
}

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  origem: string;
  created_at: string;
  updated_at: string;
  responsavel_id?: string;
  status_visita?: string;
}

interface Note {
  id: string;
  texto: string;
  created_at: string;
  autor: {
    nome: string;
  };
}

const LeadDetails = ({ leadId }: LeadDetailsProps) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshReports, setRefreshReports] = useState(0);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
      fetchNotes();
    }
  }, [leadId]);

  const fetchLeadDetails = async () => {
    if (!leadId) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error) {
      handleError(error, 'Erro ao carregar detalhes do lead');
    }
  };

  const fetchNotes = async () => {
    if (!leadId) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*, autor:profiles!notes_autor_id_fkey(nome)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data as any || []);
    } catch (error) {
      handleError(error, 'Erro ao carregar notas');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!leadId || !lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus as any })
        .eq('id', leadId);

      if (error) throw error;

      setLead({ ...lead, status: newStatus });
      toast({
        title: 'Status atualizado',
        description: 'O status do lead foi atualizado com sucesso.',
      });
    } catch (error) {
      handleError(error, 'Erro ao atualizar status');
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !leadId || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('notes').insert({
        lead_id: leadId,
        autor_id: user.id,
        texto: newNote.trim(),
      });

      if (error) throw error;

      setNewNote('');
      fetchNotes();
      toast({
        title: 'Nota adicionada',
        description: 'A nota foi salva com sucesso.',
      });
    } catch (error) {
      handleError(error, 'Erro ao adicionar nota');
      toast({
        title: 'Erro ao adicionar nota',
        description: 'Não foi possível salvar a nota. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'novo':
        return 'Novo';
      case 'em_atendimento':
        return 'Em Atendimento';
      case 'fechado':
        return 'Fechado';
      case 'perdido':
        return 'Perdido';
      default:
        return status;
    }
  };

  const getStatusVisitaLabel = (status?: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'agendada':
        return 'Agendada';
      case 'visitado_vendido':
        return 'Visitado - Venda Realizada';
      case 'visitado_sem_venda':
        return 'Visitado - Sem Venda';
      default:
        return 'Pendente';
    }
  };

  const handleVisitReportSuccess = () => {
    fetchLeadDetails();
    setRefreshReports(prev => prev + 1);
  };

  if (!leadId || !lead) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
        </CardContent>
      </Card>
    );
  }

  const canEdit = userRole === 'admin' || userRole === 'gerente';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Informações do Lead</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{lead.nome}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{lead.telefone}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              Criado{' '}
              {formatDistanceToNow(new Date(lead.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={lead.status}
              onValueChange={handleStatusChange}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{lead.origem}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Status da Visita</Label>
            </div>
            <Badge variant="secondary">{getStatusVisitaLabel(lead.status_visita)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes" className="text-xs sm:text-sm">Notas</TabsTrigger>
          <TabsTrigger value="visits" className="text-xs sm:text-sm">Visitas</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Notas Internas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Adicione uma nota interna..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={loading || !newNote.trim()}
              size="sm"
              className="w-full"
            >
              Adicionar Nota
            </Button>
          </div>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma nota ainda
              </p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-3 space-y-2">
                  <p className="text-sm">{note.texto}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{(note as any).autor?.nome}</span>
                    <span>
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="visits" className="space-y-3 sm:space-y-4">
          {canEdit && <VisitReportForm leadId={leadId} onSuccess={handleVisitReportSuccess} />}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm sm:text-base">Histórico de Visitas</CardTitle>
            </CardHeader>
            <CardContent>
              <VisitReportsList key={refreshReports} leadId={leadId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadDetails;
