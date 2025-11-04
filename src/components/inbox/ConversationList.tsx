import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  origem: string;
  created_at: string;
  last_message_at?: string;
  unread_count?: number;
}

interface ConversationListProps {
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
}

const ConversationList = ({ selectedLeadId, onSelectLead }: ConversationListProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    if (!searchTerm) {
      setFilteredLeads(leads);
      return;
    }

    const filtered = leads.filter(lead =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm)
    );
    setFilteredLeads(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      novo: 'bg-blue-500',
      contatado: 'bg-yellow-500',
      qualificado: 'bg-purple-500',
      proposta: 'bg-orange-500',
      negociacao: 'bg-indigo-500',
      ganho: 'bg-green-500',
      perdido: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      novo: 'Novo',
      contatado: 'Contatado',
      qualificado: 'Qualificado',
      proposta: 'Proposta',
      negociacao: 'Negociação',
      ganho: 'Ganho',
      perdido: 'Perdido',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando conversas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => onSelectLead(lead.id)}
                className={`w-full p-2.5 sm:p-3 rounded-lg text-left transition-colors hover:bg-accent ${
                  selectedLeadId === lead.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs sm:text-sm truncate">{lead.nome}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{lead.telefone}</span>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(lead.status)} text-white text-[10px] sm:text-xs flex-shrink-0`}>
                    {getStatusLabel(lead.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground capitalize">
                    {lead.origem}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
