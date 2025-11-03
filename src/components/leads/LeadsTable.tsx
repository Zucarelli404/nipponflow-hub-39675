import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { useToast } from '@/hooks/use-toast';
import { Download, Search, Filter } from 'lucide-react';
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
  status_visita?: string;
  responsavel?: {
    nome: string;
  };
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
  const { userRole } = useAuth();
  const { toast } = useToast();

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
          status_visita,
          origem,
          created_at,
          updated_at,
          responsavel_id,
          responsavel:profiles!leads_responsavel_id_fkey(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar dados de visitas e vendas para cada lead
      const { data: visitsData } = await (supabase as any)
        .from('visit_reports')
        .select('lead_id, venda_realizada, valor_total');

      // Consolidar dados
      const leadsWithMetrics = leadsData?.map((lead: any) => {
        const leadVisits = visitsData?.filter((v: any) => v.lead_id === lead.id) || [];
        const leadSales = leadVisits.filter((v: any) => v.venda_realizada);
        const totalValue = leadSales.reduce((sum: number, v: any) => sum + Number(v.valor_total || 0), 0);

        return {
          ...lead,
          visit_count: leadVisits.length,
          sale_count: leadSales.length,
          total_value: totalValue,
        };
      }) || [];

      setLeads(leadsWithMetrics);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar os leads. Tente novamente.',
        variant: 'destructive',
      });
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
      'Status Visita',
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
      lead.status_visita || 'pendente',
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

  const canExport = userRole === 'admin' || userRole === 'diretor';

  return (
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
              <TableHead>Status Visita</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-center">Visitas</TableHead>
              <TableHead className="text-center">Vendas</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Criado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Carregando leads...</p>
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
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
                    <Badge variant="secondary" className="text-xs">
                      {lead.status_visita || 'pendente'}
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
  );
};

export default LeadsTable;
