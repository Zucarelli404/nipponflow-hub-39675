import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';

interface Candidate {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo_desejado: string;
  status: string;
  created_at: string;
}

const CandidatesList = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      // @ts-ignore - Tabela será criada pela migration
      const { data, error } = await (supabase as any)
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data as any || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      // @ts-ignore - Tabela será criada pela migration
      const { error } = await (supabase as any)
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidateId);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: 'O status do candidato foi atualizado com sucesso.',
      });

      fetchCandidates();
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pendente: { variant: 'secondary', icon: Clock, label: 'Pendente' },
      em_analise: { variant: 'default', icon: Eye, label: 'Em Análise' },
      aprovado: { variant: 'default', icon: CheckCircle2, label: 'Aprovado' },
      reprovado: { variant: 'destructive', icon: XCircle, label: 'Reprovado' },
    };

    const config = variants[status] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canEdit = userRole === 'admin' || userRole === 'gerente';

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando candidatos...</div>;
  }

  if (candidates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Nenhum candidato cadastrado ainda
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Cargo Desejado</TableHead>
          <TableHead>Status</TableHead>
          {canEdit && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => (
          <TableRow key={candidate.id}>
            <TableCell className="font-medium">{candidate.nome}</TableCell>
            <TableCell>{candidate.email}</TableCell>
            <TableCell>{candidate.telefone}</TableCell>
            <TableCell>{candidate.cargo_desejado}</TableCell>
            <TableCell>{getStatusBadge(candidate.status)}</TableCell>
            {canEdit && (
              <TableCell>
                <Select
                  value={candidate.status}
                  onValueChange={(value) => handleStatusChange(candidate.id, value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CandidatesList;
