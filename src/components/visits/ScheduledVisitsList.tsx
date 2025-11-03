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
  data_agendada: string;
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
        .order('data_agendada', { ascending: true });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching scheduled visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    visitId: string,
    status: 'realizada' | 'cancelada'
  ) => {
    try {
      // @ts-ignore
      const { error } = await (supabase as any)
        .from('scheduled_visits')
        .update({ status })
        .eq('id', visitId);

      if (error) throw error;

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
        return 'bg-blue-500';
      case 'realizada':
        return 'bg-green-500';
      case 'cancelada':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Especialista</TableHead>
          <TableHead>Data Agendada</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visits.map((visit) => (
          <TableRow key={visit.id}>
            <TableCell>
              <div>
                <div className="font-medium">{(visit as any).lead?.nome}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {(visit as any).lead?.telefone}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                {(visit as any).especialista?.nome}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">
                  {new Date(visit.data_agendada).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(visit.data_agendada).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {formatDistanceToNow(new Date(visit.data_agendada), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={`${getStatusColor(visit.status)} text-white`}>
                {getStatusLabel(visit.status)}
              </Badge>
            </TableCell>
            <TableCell>
              {visit.status === 'agendada' && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(visit.id, 'realizada')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(visit.id, 'cancelada')}
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
  );
};

export default ScheduledVisitsList;
