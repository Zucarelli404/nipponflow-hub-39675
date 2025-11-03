import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Organization {
  id: string;
  nome: string;
  unique_link: string;
  created_at: string;
}

const OrganizationLinks = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'Erro ao carregar organizações',
        description: 'Não foi possível carregar as organizações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const generateUniqueLink = () => {
    return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, insira um nome para a organização.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const uniqueLink = generateUniqueLink();
      const { error } = await (supabase as any)
        .from('organizations')
        .insert({
          nome: newOrgName.trim(),
          unique_link: uniqueLink,
        });

      if (error) throw error;

      toast({
        title: 'Organização criada',
        description: 'Link de candidatura gerado com sucesso.',
      });

      setNewOrgName('');
      setOpen(false);
      fetchOrganizations();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Erro ao criar organização',
        description: 'Não foi possível criar a organização.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (link: string) => {
    const fullUrl = `${window.location.origin}/candidatura/${link}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  const openLink = (link: string) => {
    const fullUrl = `${window.location.origin}/candidatura/${link}`;
    window.open(fullUrl, '_blank');
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Links de Candidatura</h2>
          <p className="text-muted-foreground">
            Gerencie os links de formulário de candidatos para cada organização
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Organização</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nome da Organização</Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Ex: Empresa ABC"
                />
              </div>
              <Button onClick={handleCreateOrganization} className="w-full">
                Criar e Gerar Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle>{org.nome}</CardTitle>
              <CardDescription>
                Criado em {new Date(org.created_at).toLocaleDateString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Link de Candidatura</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/candidatura/${org.unique_link}`}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(org.unique_link)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openLink(org.unique_link)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrganizationLinks;
