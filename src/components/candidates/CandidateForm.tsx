import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';

interface CandidateFormProps {
  onSuccess?: () => void;
}

const CandidateForm = ({ onSuccess }: CandidateFormProps) => {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargoDesejado, setCargoDesejado] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // @ts-ignore - Tabela será criada pela migration
      const { error } = await (supabase as any).from('candidates').insert({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cargo_desejado: cargoDesejado.trim(),
        experiencia: experiencia.trim() || null,
        status: 'pendente',
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Candidato cadastrado',
        description: 'O candidato foi adicionado com sucesso.',
      });

      setNome('');
      setEmail('');
      setTelefone('');
      setCargoDesejado('');
      setExperiencia('');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating candidate:', error);
      toast({
        title: 'Erro ao cadastrar candidato',
        description: 'Não foi possível adicionar o candidato. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Candidato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Candidato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo do candidato"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="cargoDesejado">Cargo Desejado</Label>
              <Input
                id="cargoDesejado"
                value={cargoDesejado}
                onChange={(e) => setCargoDesejado(e.target.value)}
                placeholder="Ex: Vendedor, Gerente"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experiencia">Experiência Profissional</Label>
            <Textarea
              id="experiencia"
              value={experiencia}
              onChange={(e) => setExperiencia(e.target.value)}
              placeholder="Descreva a experiência profissional do candidato..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Cadastrando...' : 'Cadastrar Candidato'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateForm;
