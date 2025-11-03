import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role?: 'admin' | 'diretor' | 'gerente' | null;
  diretor_id?: string | null;
}

interface TeamNode {
  user: UserProfile;
  children: TeamNode[];
}

const TeamHierarchy = () => {
  const [hierarchy, setHierarchy] = useState<TeamNode[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserProfile[] = profiles.map((profile: any) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
        };
      });

      const tree = buildTree(usersWithRoles);
      setHierarchy(tree);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      toast({
        title: 'Erro ao carregar hierarquia',
        description: 'Não foi possível carregar a estrutura da equipe.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (users: UserProfile[]): TeamNode[] => {
    const map = new Map<string, TeamNode>();
    const roots: TeamNode[] = [];

    users.forEach((user) => {
      map.set(user.id, { user, children: [] });
    });

    users.forEach((user) => {
      const node = map.get(user.id)!;
      if (user.diretor_id && map.has(user.diretor_id)) {
        map.get(user.diretor_id)!.children.push(node);
      } else if (user.role === 'admin' || user.role === 'diretor' || !user.diretor_id) {
        roots.push(node);
      }
    });

    return roots;
  };

  const getRoleLabel = (role: string | null | undefined) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'diretor':
        return 'Diretor';
      case 'gerente':
        return 'Gerente';
      default:
        return 'Usuário';
    }
  };

  const getRoleBadgeColor = (role: string | null | undefined) => {
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

  const TreeNode = ({ node, level = 0 }: { node: TeamNode; level?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children.length > 0;

    return (
      <div className="space-y-2">
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors',
            level > 0 && 'ml-8'
          )}
        >
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-muted rounded transition-transform"
            >
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  expanded && 'rotate-90'
                )}
              />
            </button>
          ) : (
            <div className="w-6" />
          )}

          {hasChildren ? (
            <Users className="h-5 w-5 text-primary" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}

          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium">{node.user.nome}</p>
              <p className="text-sm text-muted-foreground">{node.user.email}</p>
            </div>
            <Badge className={getRoleBadgeColor(node.user.role)}>
              {getRoleLabel(node.user.role)}
            </Badge>
            {hasChildren && (
              <Badge variant="outline" className="ml-2">
                {node.children.length} {node.children.length === 1 ? 'membro' : 'membros'}
              </Badge>
            )}
          </div>
        </div>

        {expanded && hasChildren && (
          <div className="space-y-1">
            {node.children.map((child) => (
              <TreeNode key={child.user.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">
          Carregando hierarquia...
        </p>
      </Card>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">
          Nenhuma estrutura hierárquica encontrada
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Estrutura da Equipe</h3>
        </div>

        <div className="space-y-2">
          {hierarchy.map((node) => (
            <TreeNode key={node.user.id} node={node} />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default TeamHierarchy;
