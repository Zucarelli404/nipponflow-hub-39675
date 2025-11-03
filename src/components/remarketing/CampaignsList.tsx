import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Users, TrendingUp } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Campaign {
  id: string;
  nome: string;
  descricao: string;
  meta_contatos: number;
  contatos_realizados: number;
  leads_reconquistados: number;
  status: 'ativa' | 'pausada' | 'concluida';
  created_at: string;
}

const CampaignsList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCampaign, setNewCampaign] = useState({
    nome: '',
    descricao: '',
    meta_contatos: 10,
  });
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      // @ts-ignore - Tabela será criada pela migration
      const { data, error } = await (supabase as any)
        .from('remarketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.nome.trim()) {
      toast.error('Digite um nome para a campanha');
      return;
    }

    setSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      // @ts-ignore
      const { error } = await (supabase as any).from('remarketing_campaigns').insert({
        nome: newCampaign.nome.trim(),
        descricao: newCampaign.descricao.trim(),
        meta_contatos: newCampaign.meta_contatos,
        contatos_realizados: 0,
        leads_reconquistados: 0,
        status: 'ativa',
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success('Campanha criada com sucesso');
      setNewCampaign({ nome: '', descricao: '', meta_contatos: 10 });
      setDialogOpen(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Erro ao criar campanha');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'bg-green-500';
      case 'pausada':
        return 'bg-yellow-500';
      case 'concluida':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando campanhas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Campanhas de Remarketing</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure os detalhes da campanha de remarketing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input
                  placeholder="Ex: Reconquista Q1 2025"
                  value={newCampaign.nome}
                  onChange={(e) => setNewCampaign({ ...newCampaign, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva os objetivos da campanha..."
                  value={newCampaign.descricao}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, descricao: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta de Contatos</Label>
                <Input
                  type="number"
                  min="1"
                  value={newCampaign.meta_contatos}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      meta_contatos: parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>
              <Button
                onClick={handleCreateCampaign}
                disabled={submitting || !newCampaign.nome.trim()}
                className="w-full"
              >
                {submitting ? 'Criando...' : 'Criar Campanha'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              Nenhuma campanha criada ainda
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Crie sua primeira campanha de remarketing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const progress =
              campaign.meta_contatos > 0
                ? (campaign.contatos_realizados / campaign.meta_contatos) * 100
                : 0;
            const conversionRate =
              campaign.contatos_realizados > 0
                ? (campaign.leads_reconquistados / campaign.contatos_realizados) * 100
                : 0;

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{campaign.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campaign.descricao}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {campaign.contatos_realizados} / {campaign.meta_contatos}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {campaign.leads_reconquistados}
                        </p>
                        <p className="text-xs text-muted-foreground">Reconquistados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{conversionRate.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Criada{' '}
                    {formatDistanceToNow(new Date(campaign.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CampaignsList;
