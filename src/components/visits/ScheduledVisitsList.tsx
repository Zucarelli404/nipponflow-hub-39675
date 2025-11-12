import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, Phone, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ScheduledVisit {
  id: string;
  data_visita: string;
  status: 'agendada' | 'realizada' | 'cancelada';
  observacoes: string | null;
  lead: {
    nome: string;
    telefone: string;
  };
  especialista: {
    nome: string;
  };
}

const ScheduledVisitsList = () => {
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledVisits();
  }, []);

  const fetchScheduledVisits = async () => {
    try {
      // @ts-ignore
      const { data, error } = await (supabase as any)
        .from('scheduled_visits')
        .select(`
          *,
          lead:leads(nome, telefone),
          especialista:profiles!scheduled_visits_especialista_id_fkey(nome)
        `)
        .order('data_visita', { ascending: true });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching scheduled visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    visit: ScheduledVisit,
    status: 'realizada' | 'cancelada'
  ) => {
    try {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from('scheduled_visits')
        .update({ status })
        .eq('id', visit.id);

      if (error) throw error;

      // Quando marcar como realizada, criar automaticamente um relatório em "visitas"
      if (status === 'realizada') {
        const reportId = `report-${Date.now()}`;
        const payload = {
          id: reportId,
          lead_id: (visit as any).lead_id,
          especialista_id: (visit as any).especialista_id,
          data_visita: visit.data_visita,
          venda_realizada: false,
          forma_pagamento: null,
          valor_total: 0,
          observacoes: (visit as any).observacoes || null,
          // Campos aninhados para compatibilidade com UI em modo DEMO
          lead: { nome: (visit as any).lead?.nome },
          especialista: { nome: (visit as any).especialista?.nome },
          visit_items: [],
        };

        // @ts-ignore
        const { error: insertError } = await (supabase as any)
          .from('visit_reports')
          .insert(payload);

        if (insertError) {
          console.error('Erro ao criar relatório de visita:', insertError);
        }
      }

      toast.success(
        status === 'realizada' ? 'Visita marcada como realizada' : 'Visita cancelada'
      );
      fetchScheduledVisits();
    } catch (error) {
      console.error('Error updating visit status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'bg-primary/10 text-primary border-primary';
      case 'realizada':
        return 'bg-green-500/10 text-green-600 border-green-600';
      case 'cancelada':
        return 'bg-red-500/10 text-red-600 border-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'Agendada';
      case 'realizada':
        return 'Realizada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando visitas agendadas...
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhuma visita agendada</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Especialista</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => (
            <TableRow key={visit.id}>
              <TableCell className="hidden sm:table-cell">
                <div>
                  <div className="font-medium">{(visit as any).lead?.nome}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {(visit as any).lead?.telefone}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {(visit as any).especialista?.nome}
                </div>
              </TableCell>
              <TableCell>
                <div className="sm:hidden font-medium mb-1">
                  {(visit as any).lead?.nome}
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {new Date(visit.data_visita).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(visit.data_visita).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${getStatusColor(visit.status)} text-xs`}>
                  {getStatusLabel(visit.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {visit.status === 'agendada' && (
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(visit, 'realizada')}
                      title="Marcar como realizada"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(visit, 'cancelada')}
                      title="Cancelar visita"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ScheduledVisitsList;
