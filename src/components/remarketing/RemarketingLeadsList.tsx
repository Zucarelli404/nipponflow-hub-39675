import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  origem: string;
  created_at: string;
  updated_at: string;
}

const RemarketingLeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [contactType, setContactType] = useState<string>('');
  const [contactNotes, setContactNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLostLeads();
  }, []);

  const fetchLostLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'perdido')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching lost leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!selectedLead || !contactType || !contactNotes.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSubmitting(true);
    try {
      // Add note about remarketing contact
      const { error: noteError } = await supabase.from('notes').insert({
        lead_id: selectedLead.id,
        autor_id: (await supabase.auth.getUser()).data.user?.id,
        texto: `[Remarketing - ${contactType}] ${contactNotes.trim()}`,
      });

      if (noteError) throw noteError;

      // Update lead status back to contacted
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'contatado' as any })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;

      toast.success('Contato registrado com sucesso');
      setSelectedLead(null);
      setContactType('');
      setContactNotes('');
      fetchLostLeads();
    } catch (error) {
      console.error('Error registering contact:', error);
      toast.error('Erro ao registrar contato');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando leads...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum lead perdido no momento
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{lead.nome}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.telefone}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {lead.origem}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(lead.updated_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLead(lead)}
                    >
                      Contatar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Contato de Remarketing</DialogTitle>
                      <DialogDescription>
                        Lead: {lead.nome} - {lead.telefone}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Tipo de Contato</Label>
                        <Select value={contactType} onValueChange={setContactType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="telefone">Telefone</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="presencial">Presencial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                          placeholder="Descreva o contato realizado..."
                          value={contactNotes}
                          onChange={(e) => setContactNotes(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleContact}
                        disabled={submitting || !contactType || !contactNotes.trim()}
                        className="w-full"
                      >
                        {submitting ? 'Salvando...' : 'Registrar Contato'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default RemarketingLeadsList;
