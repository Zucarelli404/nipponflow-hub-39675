import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const whatsappConnectionSchema = z.object({
  instance_name: z.string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Apenas letras, números, _ e -'),
  evolution_api_url: z.string()
    .url('URL inválida')
    .max(255, 'URL muito longa')
    .refine(url => url.startsWith('https://'), 'URL deve usar HTTPS'),
  api_key: z.string()
    .trim()
    .min(20, 'API key muito curta')
    .max(200, 'API key muito longa')
});

interface WhatsAppConnectionData {
  id: string;
  instance_name: string;
  evolution_api_url: string;
  api_key: string;
  status: string;
  qr_code?: string;
  phone_number?: string;
}

const WhatsAppConnection = () => {
  const [connection, setConnection] = useState<WhatsAppConnectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    instance_name: '',
    evolution_api_url: '',
    api_key: '',
  });

  useEffect(() => {
    fetchConnection();
  }, []);

  const fetchConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // @ts-ignore - whatsapp_connections table types not yet generated
      const { data, error } = await supabase
        // @ts-ignore
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const connectionData = data as any;
        setConnection(connectionData);
        setFormData({
          instance_name: connectionData.instance_name,
          evolution_api_url: connectionData.evolution_api_url,
          api_key: connectionData.api_key,
        });
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar conexão do WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validate input
      const validatedData = whatsappConnectionSchema.parse(formData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const connectionData = {
        user_id: user.id,
        ...validatedData,
        status: 'disconnected',
      };

      if (connection) {
        // @ts-ignore - whatsapp_connections table types not yet generated
        const { error } = await supabase
          // @ts-ignore
          .from('whatsapp_connections')
          .update(connectionData)
          .eq('id', connection.id);

        if (error) throw error;
      } else {
        // @ts-ignore - whatsapp_connections table types not yet generated
        const { error } = await supabase
          // @ts-ignore
          .from('whatsapp_connections')
          // @ts-ignore
          .insert(connectionData);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Conexão salva com sucesso',
      });

      await fetchConnection();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Dados inválidos',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
      console.error('Error saving connection:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar conexão',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    try {
      // @ts-ignore - whatsapp_connections table types not yet generated
      const { error } = await supabase
        // @ts-ignore
        .from('whatsapp_connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Conexão removida com sucesso',
      });

      setConnection(null);
      setFormData({
        instance_name: '',
        evolution_api_url: '',
        api_key: '',
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover conexão',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
      case 'disconnected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Desconectado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Conexão WhatsApp</span>
          {connection && getStatusBadge(connection.status)}
        </CardTitle>
        <CardDescription>
          Configure sua conexão com a EvolutionAPI para integrar o WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instance_name">Nome da Instância</Label>
          <Input
            id="instance_name"
            value={formData.instance_name}
            onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
            placeholder="minha-instancia"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="evolution_api_url">URL da EvolutionAPI</Label>
          <Input
            id="evolution_api_url"
            value={formData.evolution_api_url}
            onChange={(e) => setFormData({ ...formData, evolution_api_url: e.target.value })}
            placeholder="https://api.evolution.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="api_key">API Key</Label>
          <Input
            id="api_key"
            type="password"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            placeholder="sua-api-key"
          />
        </div>

        {connection?.phone_number && (
          <div className="space-y-2">
            <Label>Número Conectado</Label>
            <p className="text-sm text-muted-foreground">{connection.phone_number}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !formData.instance_name || !formData.evolution_api_url || !formData.api_key}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {connection ? 'Atualizar' : 'Salvar'} Conexão
          </Button>

          {connection && (
            <>
              <Button variant="outline" onClick={fetchConnection}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Status
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                Desconectar
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>• Você precisará de uma instância EvolutionAPI configurada</p>
          <p>• Cada usuário pode conectar seu próprio WhatsApp</p>
          <p>• A conexão é individual e não compartilhada</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnection;
