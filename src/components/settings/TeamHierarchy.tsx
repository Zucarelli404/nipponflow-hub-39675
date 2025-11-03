import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TeamMemberHierarchy {
  id: string;
  nome: string;
  email: string;
  role?: 'admin' | 'diretor' | 'gerente' | null;
  team_members: TeamMemberHierarchy[];
}

const TeamHierarchy = () => {
  const [hierarchy, setHierarchy] = useState<TeamMemberHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDiretors, setExpandedDiretors] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('ativo', true);

      if (profilesError) throw profilesError;

      // Buscar roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Montar estrutura hierárquica
      const profilesWithRoles = profiles.map((p: any) => ({
        ...p,
        role: roles.find((r) => r.user_id === p.id)?.role || null,
      }));

      // Separar diretores
      const diretores = profilesWithRoles.filter((p: any) => p.role === 'diretor');

      // Construir árvore
      const tree = diretores.map((diretor: any) => ({
        id: diretor.id,
        nome: diretor.nome,
        email: diretor.email,
        role: diretor.role,
        team_members: profilesWithRoles
          .filter((p: any) => p.diretor_id === diretor.id)
          .map((member: any) => ({
            id: member.id,
            nome: member.nome,
            email: member.email,
            role: member.role,
            team_members: [],
          })),
      }));

      // Adicionar admins e usuários sem diretor
      const admins = profilesWithRoles.filter((p: any) => p.role === 'admin');
      const orphans = profilesWithRoles.filter(
        (p: any) => !p.diretor_id && p.role !== 'admin' && p.role !== 'diretor'
      );

      const additionalNodes = [...admins, ...orphans].map((p: any) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        role: p.role,
        team_members: [],
      }));

      setHierarchy([...tree, ...additionalNodes]);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiretor = (id: string) => {
    setExpandedDiretors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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
        return 'Membro';
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando hierarquia...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Hierarquia da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hierarchy.map((node) => (
            <div key={node.id}>
              {node.team_members.length > 0 ? (
                <Collapsible
                  open={expandedDiretors.has(node.id)}
                  onOpenChange={() => toggleDiretor(node.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      {expandedDiretors.has(node.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(node.nome)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{node.nome}</div>
                        <div className="text-xs text-muted-foreground">{node.email}</div>
                      </div>
                      <Badge className={getRoleBadgeColor(node.role)}>
                        {getRoleLabel(node.role)}
                      </Badge>
                      <Badge variant="outline" className="ml-2">
                        {node.team_members.length} {node.team_members.length === 1 ? 'membro' : 'membros'}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-8 mt-2 space-y-2 border-l-2 border-muted pl-4">
                      {node.team_members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{member.nome}</div>
                            <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {getRoleLabel(member.role)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(node.nome)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{node.nome}</div>
                    <div className="text-xs text-muted-foreground">{node.email}</div>
                  </div>
                  <Badge className={getRoleBadgeColor(node.role)}>
                    {getRoleLabel(node.role)}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamHierarchy;
