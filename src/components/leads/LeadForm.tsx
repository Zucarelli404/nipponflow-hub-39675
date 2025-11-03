import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { z } from 'zod';

const leadSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  telefone: z.string().trim().regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Formato de telefone inválido (ex: (00) 00000-0000)'),
  origem: z.enum(['whatsapp', 'facebook', 'instagram', 'google', 'indicacao', 'site', 'outros']),
});

interface LeadFormProps {
  onSuccess?: () => void;
}

const LeadForm = ({ onSuccess }: LeadFormProps) => {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [origem, setOrigem] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Validate input
      const validatedData = leadSchema.parse({
        nome,
        telefone,
        origem,
      });

      const { error } = await supabase.from('leads').insert({
        nome: validatedData.nome,
        telefone: validatedData.telefone,
        origem: validatedData.origem,
        status: 'novo',
        responsavel_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Lead cadastrado',
        description: 'O lead foi adicionado com sucesso.',
      });

      setNome('');
      setTelefone('');
      setOrigem('whatsapp');
      setOpen(false);
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
          title: 'Erro ao cadastrar lead',
          description: 'Não foi possível adicionar o lead. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="indicacao">Indicação</SelectItem>
                <SelectItem value="site">Site</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Cadastrando...' : 'Cadastrar Lead'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadForm;
