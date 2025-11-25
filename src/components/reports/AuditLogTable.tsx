import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, User as UserIcon } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string;
  acao: string;
  alvo_tipo: string | null;
  alvo_id: string | null;
  detalhes: any;
  created_at: string;
  user_nome?: string;
  user_email?: string;
}

interface AuditLogTableProps {
  userId?: string;
  limit?: number;
}

const AuditLogTable = ({ userId, limit = 50 }: AuditLogTableProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [userId, limit]);

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: logsData, error } = await query;
      if (error) throw error;

      // Buscar informações dos usuários
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      const profilesMap = new Map<string, { id: string; nome: string; email: string }>(
        profiles?.map(p => [p.id, p]) || []
      );

      const logsWithProfiles = logsData?.map(log => ({
        ...log,
        user_nome: profilesMap.get(log.user_id)?.nome,
        user_email: profilesMap.get(log.user_id)?.email,
      })) || [];

      setLogs(logsWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (acao: string) => {
    if (acao.includes('criar') || acao.includes('adicionar')) return 'bg-success/10 text-success';
    if (acao.includes('editar') || acao.includes('atualizar')) return 'bg-accent/10 text-accent';
    if (acao.includes('excluir') || acao.includes('deletar')) return 'bg-destructive/10 text-destructive';
    return 'bg-muted/10 text-muted-foreground';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">Carregando logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Registro de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma atividade registrada
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{log.user_nome || 'Usuário'}</p>
                          <p className="text-xs text-muted-foreground">{log.user_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.acao)}>
                        {log.acao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.alvo_tipo && (
                        <span className="text-sm text-muted-foreground capitalize">
                          {log.alvo_tipo}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLogTable;
