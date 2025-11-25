import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  role: z.enum(['consultor', 'gerente', 'diretor']),
});

type FormData = z.infer<typeof formSchema>;

interface AddTeamMemberFormProps {
  onSuccess?: () => void;
}

const AddTeamMemberForm = ({ onSuccess }: AddTeamMemberFormProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: Math.random().toString(36).slice(-12), // senha temporária
        options: {
          data: {
            nome: data.nome,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // 2. Atualizar profile com informações adicionais
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          diretor_id: user?.id, // Atribuir ao diretor atual
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // 3. Atribuir role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: data.role,
        });

      if (roleError) throw roleError;

      // 4. Criar registro de auditoria
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        acao: 'Adicionar membro da equipe',
        alvo_tipo: 'user',
        alvo_id: authData.user.id,
        detalhes: {
          nome: data.nome,
          email: data.email,
          role: data.role,
        },
      });

      toast.success('Membro adicionado com sucesso!', {
        description: `${data.nome} foi adicionado à equipe. Um email de boas-vindas foi enviado.`,
      });

      reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao adicionar membro:', error);
      toast.error('Erro ao adicionar membro', {
        description: error.message || 'Tente novamente mais tarde',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          placeholder="João Silva"
          {...register('nome')}
          disabled={loading}
        />
        {errors.nome && (
          <p className="text-xs text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="joao@exemplo.com"
          {...register('email')}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          placeholder="(11) 99999-9999"
          {...register('telefone')}
          disabled={loading}
        />
        {errors.telefone && (
          <p className="text-xs text-destructive">{errors.telefone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Cargo</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) => setValue('role', value as any)}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consultor">Consultor</SelectItem>
            <SelectItem value="gerente">Gerente</SelectItem>
            <SelectItem value="diretor">Diretor</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-xs text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="bg-accent/50 p-4 rounded-lg space-y-2">
        <p className="text-sm font-medium">Informações Importantes:</p>
        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
          <li>Uma senha temporária será gerada automaticamente</li>
          <li>O usuário receberá um email para redefinir a senha</li>
          <li>Ele será automaticamente vinculado à sua equipe</li>
        </ul>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adicionando...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Membro
          </>
        )}
      </Button>
    </form>
  );
};

export default AddTeamMemberForm;
