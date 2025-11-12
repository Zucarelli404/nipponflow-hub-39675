import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';

const visitItemSchema = z.object({
  descricao: z.string().trim().min(1, 'Descrição é obrigatória').max(200),
  quantidade: z.number().int().positive('Quantidade deve ser positiva'),
  valor_unitario: z.number().nonnegative('Valor deve ser positivo'),
});

const visitReportSchema = z.object({
  especialistaId: z.string().uuid('ID de especialista inválido'),
  dataVisita: z.string().min(1, 'Data da visita é obrigatória'),
  quilometragem: z.number().nonnegative('Quilometragem deve ser positiva').optional(),
  vendaRealizada: z.boolean(),
  formaPagamento: z.string().optional(),
  observacoes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
  itens: z.array(visitItemSchema).optional(),
}).refine((data) => !data.vendaRealizada || (data.formaPagamento && data.itens && data.itens.length > 0), {
  message: 'Para vendas realizadas, forma de pagamento e itens são obrigatórios',
});

// Interfaces
interface Lead {
  id: string;
  nome: string;
  telefone: string;
}

interface VisitReportFormProps {
  leadId?: string;
  onSuccess?: () => void;
}

interface VendaItem {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

interface Especialista {
  id: string;
  nome: string;
}

const VisitReportForm = ({ leadId, onSuccess }: VisitReportFormProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || '');
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [especialistaId, setEspecialistaId] = useState('');
  const [dataVisita, setDataVisita] = useState('');
  const [quilometragem, setQuilometragem] = useState('');
  const [vendaRealizada, setVendaRealizada] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<VendaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEspecialistas();
    if (!leadId) {
      fetchLeads();
    }
  }, [leadId]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nome, telefone')
        .order('nome');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
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

  const addItem = () => {
    setItens([...itens, { descricao: '', quantidade: 1, valor_unitario: 0 }]);
  };

  const removeItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof VendaItem, value: string | number) => {
    const newItens = [...itens];
    if (field === 'quantidade') {
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      newItens[index] = { ...newItens[index], [field]: isNaN(numValue) ? 0 : numValue };
    } else if (field === 'valor_unitario') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      newItens[index] = { ...newItens[index], [field]: isNaN(numValue) ? 0 : numValue };
    } else {
      newItens[index] = { ...newItens[index], [field]: value as string };
    }
    setItens(newItens);
  };

  const calculateTotal = () => {
    return itens.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !especialistaId || !dataVisita) return;

    setLoading(true);
    try {
      const valorTotal = calculateTotal();

      // Validate input
      const validatedData = visitReportSchema.parse({
        especialistaId,
        dataVisita,
        quilometragem: quilometragem ? parseFloat(quilometragem) : undefined,
        vendaRealizada,
        formaPagamento: vendaRealizada ? formaPagamento : undefined,
        observacoes: observacoes || undefined,
        itens: vendaRealizada ? itens : undefined,
      });

      // @ts-ignore - visit_reports types will be generated
      const { data: report, error: reportError } = await (supabase as any)
        .from('visit_reports')
        .insert({
          lead_id: selectedLeadId,
          especialista_id: validatedData.especialistaId,
          data_visita: validatedData.dataVisita,
          km_percorrido: validatedData.quilometragem || null,
          venda_realizada: validatedData.vendaRealizada,
          forma_pagamento: validatedData.formaPagamento || null,
          valor_total: vendaRealizada ? valorTotal : 0,
          observacoes: validatedData.observacoes || null,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      if (vendaRealizada && itens.length > 0) {
        const itemsToInsert = itens.map(item => ({
          visit_report_id: (report as any).id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        }));

        // @ts-ignore - visit_items types will be generated
        const { error: itemsError } = await (supabase as any)
          .from('visit_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Notificação de evento (venda realizada)
      if (vendaRealizada) {
        const leadNome = leads.find(l => l.id === selectedLeadId)?.nome;
        await (supabase as any)
          .from('event_notifications')
          .insert({
            id: `evt-${Date.now()}`,
            user_id: user.id,
            type: 'sale',
            entity_id: (report as any).id,
            message: `Venda registrada${leadNome ? ` para ${leadNome}` : ''}`,
            created_at: new Date().toISOString(),
            read: false,
            metadata: {
              lead_id: selectedLeadId,
              lead_nome: leadNome,
              valor_total: valorTotal,
              data: validatedData.dataVisita,
            },
          });

        // Dispara atualização local (DEMO)
        window.dispatchEvent(new CustomEvent('event-notifications-updated'));
      }

      toast({
        title: 'Relatório criado',
        description: 'O relatório de visita foi registrado com sucesso.',
      });

      // Reset form
      setSelectedLeadId('');
      setEspecialistaId('');
      setDataVisita('');
      setQuilometragem('');
      setVendaRealizada(false);
      setFormaPagamento('');
      setObservacoes('');
      setItens([]);

      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Dados inválidos',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar relatório',
          description: 'Não foi possível criar o relatório. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Relatório de Visita</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!leadId && (
            <div className="space-y-2">
              <Label htmlFor="lead">Cliente</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
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
          )}
          
          <div className="space-y-2">
            <Label htmlFor="especialista">Especialista</Label>
            <Select value={especialistaId} onValueChange={setEspecialistaId} required>
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
            <Label htmlFor="dataVisita">Data da Visita</Label>
            <Input
              id="dataVisita"
              type="datetime-local"
              value={dataVisita}
              onChange={(e) => setDataVisita(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quilometragem">Quilometragem Percorrida (km)</Label>
            <Input
              id="quilometragem"
              type="number"
              step="0.1"
              value={quilometragem}
              onChange={(e) => setQuilometragem(e.target.value)}
              placeholder="Ex: 50.5"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="vendaRealizada"
              checked={vendaRealizada}
              onCheckedChange={setVendaRealizada}
            />
            <Label htmlFor="vendaRealizada">Venda Realizada</Label>
          </div>

          {vendaRealizada && (
            <>
              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Itens Vendidos</Label>
                  <Button type="button" onClick={addItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>

                {itens.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm">Item {index + 1}</Label>
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Descrição do item"
                      value={item.descricao}
                      onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Quantidade"
                        min="1"
                        value={item.quantidade || ''}
                        onChange={(e) => updateItem(index, 'quantidade', e.target.value)}
                        required
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor unitário"
                        min="0"
                        value={item.valor_unitario || ''}
                        onChange={(e) => updateItem(index, 'valor_unitario', e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Subtotal: R$ {(item.quantidade * item.valor_unitario).toFixed(2)}
                    </p>
                  </div>
                ))}

                {itens.length > 0 && (
                  <div className="text-right font-bold">
                    Total: R$ {calculateTotal().toFixed(2)}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a visita..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar Relatório'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VisitReportForm;
