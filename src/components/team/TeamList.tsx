import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, Mail, Phone, Calendar, Briefcase } from 'lucide-react';

interface TeamMember {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  telefone?: string;
  data_admissao?: string;
  ativo: boolean;
  created_at: string;
  diretor_id?: string | null;
  diretor?: { nome: string } | null;
  user_roles: Array<{ role: string }>;
}

const TeamList = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*, user_roles(role), diretor:diretor_id(nome)')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setMembers(data as any || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (roles: Array<{ role: string }>) => {
    if (!roles || roles.length === 0) return null;
    
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      gerente: 'Gerente',
      diretor: 'Diretor',
      especialista: 'Especialista',
    };

    return roles.map((r, idx) => (
      <Badge key={idx} variant="secondary">
        {roleLabels[r.role] || r.role}
      </Badge>
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando equipe...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Nenhum membro da equipe cadastrado
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">
                  {getInitials(member.nome)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{member.nome}</h3>
                {member.cargo && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {member.cargo}
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {getRoleBadge(member.user_roles)}
              </div>

              {member.diretor && (
                <div className="w-full py-2 px-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Equipe de</p>
                  <p className="text-sm font-medium">{member.diretor.nome}</p>
                </div>
              )}

              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{member.email}</span>
                </div>

                {member.telefone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{member.telefone}</span>
                  </div>
                )}

                {member.data_admissao && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Desde {new Date(member.data_admissao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {!member.data_admissao && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      Cadastrado {formatDistanceToNow(new Date(member.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TeamList;
