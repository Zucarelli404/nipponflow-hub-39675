import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { handleError } from '@/lib/errorHandler';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Download, Search, Filter, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  origem: string;
  created_at: string;
  updated_at: string;
  responsavel?: {
    nome: string;
  } | null;
  visit_count?: number;
  sale_count?: number;
  total_value?: number;
}

const LeadsTable = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const { userRole } = useAuth();
  const { toast } = useToast();
  const { logLeadAction } = useAuditLog();

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select(`
          id,
          nome,
          telefone,
          status,
          origem,
          created_at,
          updated_at,
          responsavel_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar dados de visitas e vendas para cada lead
      const { data: visitsData } = await (supabase as any)
        .from('visit_reports')
        .select('lead_id, venda_realizada, valor_total');

      // Buscar informações dos responsáveis
      const responsavelIds = [...new Set(leadsData?.map((l: any) => l.responsavel_id).filter(Boolean))];
      const { data: profilesData } = responsavelIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', responsavelIds)
        : { data: [] };

      // Consolidar dados
      const leadsWithMetrics = leadsData?.map((lead: any) => {
        const leadVisits = visitsData?.filter((v: any) => v.lead_id === lead.id) || [];
        const leadSales = leadVisits.filter((v: any) => v.venda_realizada);
        const totalValue = leadSales.reduce((sum: number, v: any) => sum + Number(v.valor_total || 0), 0);
        const responsavel = profilesData?.find((p: any) => p.id === lead.responsavel_id);

        return {
          ...lead,
          responsavel: responsavel ? { nome: responsavel.nome } : null,
          visit_count: leadVisits.length,
          sale_count: leadSales.length,
          total_value: totalValue,
        };
      }) || [];

      setLeads(leadsWithMetrics);
    } catch (error) {
      handleError(error, 'Não foi possível carregar os leads. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.telefone.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Nome',
      'Telefone',
      'Status',
      'Origem',
      'Responsável',
      'Visitas',
      'Vendas',
      'Valor Total',
      'Data de Criação'
    ];
    
    const rows = filteredLeads.map((lead) => [
      lead.nome,
      lead.telefone,
      getStatusLabel(lead.status),
      lead.origem,
      lead.responsavel?.nome || '-',
      lead.visit_count || 0,
      lead.sale_count || 0,
      `R$ ${(lead.total_value || 0).toFixed(2)}`,
      new Date(lead.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `leads_completo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exportado com sucesso',
      description: `${filteredLeads.length} leads exportados com dados de visitas e vendas.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo':
        return 'bg-primary text-primary-foreground';
      case 'em_atendimento':
        return 'bg-accent text-accent-foreground';
      case 'fechado':
        return 'bg-success text-success-foreground';
      case 'perdido':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
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

  const handleDelete = async () => {
    if (!leadToDelete) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDelete);

      if (error) throw error;

      await logLeadAction('excluir_lead', leadToDelete);

      toast({
        title: 'Lead excluído',
        description: 'Lead foi removido com sucesso.',
      });

      fetchLeads();
    } catch (error) {
      handleError(error, 'Não foi possível excluir o lead.');
    } finally {
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
    }
  };

  const canExport = userRole === 'admin' || userRole === 'diretor';
  const canEdit = userRole === 'admin' || userRole === 'gerente' || userRole === 'diretor';
  const canDelete = userRole === 'admin';

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canExport && (
          <Button
            onClick={exportToCSV}
            disabled={filteredLeads.length === 0}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-center">Visitas</TableHead>
              <TableHead className="text-center">Vendas</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Criado</TableHead>
              {(canEdit || canDelete) && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Carregando leads...</p>
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Nenhum lead encontrado com os filtros aplicados'
                      : 'Nenhum lead cadastrado ainda'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>{lead.telefone}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', getStatusColor(lead.status))}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.origem}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{lead.visit_count || 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={lead.sale_count ? 'default' : 'secondary'}>
                      {lead.sale_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {lead.total_value ? `R$ ${lead.total_value.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>{lead.responsavel?.nome || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(lead.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: 'Em desenvolvimento',
                                description: 'Função de edição será implementada em breve.',
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadToDelete(lead.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Mostrando {filteredLeads.length} de {leads.length} leads
        </p>
      </div>
      </div>
    </>
  );
};

export default LeadsTable;
