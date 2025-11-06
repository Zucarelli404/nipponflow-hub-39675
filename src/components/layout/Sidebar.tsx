import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  ChevronDown,
  UserCheck,
  Calendar,
  ShoppingCart,
  RefreshCw,
  UserPlus,
  Package,
  BookOpen,
  Trophy,
  Target,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Sidebar = ({ activePage, onNavigate }: SidebarProps) => {
  const { user, userRole } = useAuth();
  const [openGroups, setOpenGroups] = useState<string[]>(["clientes", "equipe", "administracao"]);
  const [modulePermissions, setModulePermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  };

  useEffect(() => {
    if (user?.id) {
      fetchModulePermissions();
    }
  }, [user?.id]);

  const fetchModulePermissions = async () => {
    if (!user?.id) return;

    try {
      // Buscar role_id do usuário (pode estar em role ou role_id)
      const { data: userRoleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role, role_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError || !userRoleData) {
        setLoading(false);
        return;
      }

      let roleId = (userRoleData as any).role_id;

      // Se role_id não existe, buscar pelo enum role
      if (!roleId && (userRoleData as any).role) {
        const { data: roleData } = await supabase
          .from("roles" as any)
          .select("id")
          .ilike("nome", (userRoleData as any).role)
          .maybeSingle();

        roleId = (roleData as any)?.id;
      }

      if (!roleId) {
        setLoading(false);
        return;
      }

      // Buscar permissões do role
      const { data: permissions, error: permError } = await supabase
        .from("role_module_permissions" as any)
        .select(`
          module_id,
          can_view,
          modules!inner(codigo)
        `)
        .eq("role_id", roleId)
        .eq("can_view", true);

      if (permError) throw permError;

      // Criar mapa de permissões por código do módulo
      const permMap: Record<string, boolean> = {};
      (permissions as any[])?.forEach((perm: any) => {
        if (perm.modules?.codigo) {
          permMap[perm.modules.codigo] = true;
        }
      });

      setModulePermissions(permMap);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasModulePermission = (moduleCode: string) => {
    // Admin sempre tem acesso
    if (userRole === "admin") return true;
    // Verificar permissão específica
    return modulePermissions[moduleCode] === true;
  };

  const menuGroups = [
    {
      id: "principal",
      label: "Principal",
      roles: ["admin", "gerente", "diretor"],
      items: [
        { id: "graduacao", label: "Graduação Infinita", icon: Target },
      ],
    },
    {
      id: "clientes",
      label: "Clientes",
      roles: ["admin", "gerente", "diretor"],
      items: [
        { id: "inbox", label: "Chat", icon: MessageSquare },
        { id: "leads", label: "Clientes", icon: Users },
        { id: "visitas", label: "Visitas", icon: Calendar },
        { id: "vendas", label: "Vendas", icon: ShoppingCart },
        { id: "remarketing", label: "Revistas (Remarketing)", icon: RefreshCw },
      ],
    },
    {
      id: "equipe",
      label: "Equipe",
      roles: ["admin", "gerente"],
      items: [
        { id: "equipe", label: "Equipe", icon: UserCheck },
        { id: "candidatos", label: "Candidatos", icon: UserPlus },
        { id: "estoque", label: "Estoque", icon: Package },
        { id: "cursos", label: "Cursos", icon: BookOpen },
        { id: "gamificacao", label: "Gamificação", icon: Trophy },
      ],
    },
    {
      id: "administracao",
      label: "Administração",
      roles: ["admin", "diretor"],
      items: [
        { id: "relatorios", label: "Relatórios", icon: BarChart3 },
        { id: "configuracoes", label: "Configurações", icon: Settings },
      ],
    },
  ];

  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasModulePermission(item.id)),
    }))
    .filter((group) => group.items.length > 0);

  if (loading) {
    return (
      <aside className="w-64 border-r bg-card shadow-sm">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-[calc(100vh-57px)] lg:h-[calc(100vh-61px)] border-r bg-card shadow-sm">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Menu</h2>
        </div>

        <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
          {visibleGroups.map((group) => (
            <Collapsible key={group.id} open={openGroups.includes(group.id)} onOpenChange={() => toggleGroup(group.id)}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between font-semibold text-xs uppercase tracking-wide"
                >
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      openGroups.includes(group.id) && "transform rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activePage === item.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start pl-6",
                        activePage === item.id && "bg-primary/10 text-primary hover:bg-primary/20",
                      )}
                      onClick={() => onNavigate(item.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>Plataforma Genius BETA</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
