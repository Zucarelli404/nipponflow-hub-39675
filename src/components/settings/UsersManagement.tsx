import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserCog, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
  role?: 'admin' | 'diretor' | 'gerente' | null;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // First, delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // Then insert new role
      const { error } = await supabase.from('user_roles').insert([{
        user_id: userId,
        role: newRole as any,
      }]);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole as any } : user
        )
      );

      toast({
        title: 'Perfil atualizado',
        description: 'O perfil do usuário foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível atualizar o perfil. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'diretor':
        return 'Diretor';
      case 'gerente':
        return 'Gerente';
      default:
        return 'Sem perfil';
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'diretor':
        return 'bg-warning text-warning-foreground';
      case 'gerente':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Gerenciamento de Perfis</AlertTitle>
        <AlertDescription>
          Atribua perfis aos usuários para controlar as permissões de acesso. Apenas administradores podem gerenciar perfis.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.ativo ? (
                      <Badge variant="outline" className="bg-success/10 text-success">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={user.role || 'none'}
                      onValueChange={(value) =>
                        value !== 'none' && handleRoleChange(user.id, value)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <UserCog className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Atribuir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="diretor">Diretor</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Total de usuários: {users.length}</p>
      </div>
    </div>
  );
};

export default UsersManagement;
