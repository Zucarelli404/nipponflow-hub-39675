import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLiveToggle } from "@/hooks/useLiveToggle";
import { Badge } from "@/components/ui/badge";
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
  Radio,
  PanelLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Sidebar = ({ activePage, onNavigate }: SidebarProps) => {
  const { user, userRole } = useAuth();
  const [openGroups, setOpenGroups] = useState<string[]>(["clientes", "equipe", "administracao"]);
  const [modulePermissions, setModulePermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [compact, setCompact] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { isLive, viewers } = useLiveToggle({ intervalMs: 120000, initialLive: true });

  // Em mobile dentro do Sheet, manter expandido para melhor navegação
  useEffect(() => {
    setCollapsed(false);
  }, [isMobile]);

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
    // BLOQUEADO PARA PRODUÇÃO: Principal (Graduação Infinita, Consultor, Distribuidor)
    // {
    //   id: "principal",
    //   label: "Principal",
    //   roles: ["admin", "gerente", "diretor"],
    //   items: [
    //     { id: "graduacao", label: "Graduação Infinita", icon: Target },
    //     { id: "consultor", label: "Consultor", icon: UserCheck },
    //     { id: "distribuidor", label: "Distribuidor", icon: BarChart3 },
    //   ],
    // },
    {
      id: "clientes",
      label: "Clientes",
      roles: ["admin", "gerente", "diretor"],
      items: [
        // BLOQUEADO PARA PRODUÇÃO: Chat
        // { id: "inbox", label: "Chat", icon: MessageSquare },
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
        // BLOQUEADO PARA PRODUÇÃO: Cursos e Gamificação
        // { id: "cursos", label: "Cursos", icon: BookOpen },
        // { id: "gamificacao", label: "Gamificação", icon: Trophy },
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

  const flatItems = visibleGroups.flatMap((group) => group.items);

  if (loading) {
    return (
      <aside className="w-64 border-r bg-card shadow-sm">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </aside>
    );
  }

  const asideClass = isMobile
    ? "w-full border-r bg-card shadow-sm"
    : `${collapsed ? "w-16" : "w-64 xl:w-72"} fixed left-0 top-16 bottom-0 border-r bg-card shadow-sm transition-all duration-300 z-40`;

  return (
    <aside aria-label="Barra lateral" className={asideClass}>
      <div className="flex flex-col h-full">
        {/* BLOQUEADO PARA PRODUÇÃO: Canal Águia Real (Graduação Infinita) */}
        {/* {(isMobile || !collapsed) && hasModulePermission("canal-aguia-real") && (
          <div className="p-4 border-b animate-fade-in">
            <Button
              variant="outline"
              className="w-full justify-start overflow-hidden rounded-xl px-3 py-2"
              onClick={() => onNavigate("canal-aguia-real")}
            >
              <div className="flex w-full items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate max-w-[200px] xl:max-w-[260px]">Graduação infinita</span>
                    {isLive ? (
                      <Badge className="bg-destructive text-destructive-foreground shrink-0 min-w-[44px] px-2 py-1 leading-tight text-[10px] flex flex-col items-center">
                        <span>AO</span>
                        <span>VIVO</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground shrink-0">Offline</Badge>
                    )}
                  </div>
                  {isLive && (
                    <div className="text-xs text-muted-foreground mt-1">{viewers} assistindo</div>
                  )}
                </div>
              </div>
            </Button>
          </div>
        )} */}
        <div className="p-3 border-b animate-fade-in flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Menu</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            onClick={() => setCollapsed((c) => !c)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
          {collapsed ? (
            <div className="space-y-1">
              {flatItems.map((item, itemIndex) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <div
                    key={item.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${itemIndex * 40}ms` }}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-center",
                        isMobile ? "h-10" : "h-9",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                      )}
                      onClick={() => onNavigate(item.id)}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            visibleGroups.map((group, groupIndex) => (
              <div
                key={group.id}
                className="animate-fade-in"
                style={{ animationDelay: `${groupIndex * 50}ms` }}
              >
                <Collapsible open={openGroups.includes(group.id)} onOpenChange={() => toggleGroup(group.id)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between font-semibold uppercase tracking-wide transition-all duration-200 hover:bg-accent",
                        isMobile ? "text-sm h-11" : compact ? "text-[10px] h-8" : "text-xs h-9",
                      )}
                    >
                      {group.label}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-300",
                          openGroups.includes(group.id) && "transform rotate-180",
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.id;
                      return (
                        <div
                          key={item.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${(groupIndex * 50) + (itemIndex * 30)}ms` }}
                        >
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start rounded-md transition-all duration-200 border-l-2",
                              isMobile ? "pl-5 h-11 text-sm" : compact ? "pl-4 h-8 text-sm" : "pl-6 h-9 text-sm",
                              isActive
                                ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary"
                                : "border-transparent",
                            )}
                            onClick={() => onNavigate(item.id)}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Button>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))
          )}
        </nav>
        {isMobile && (
          <div className="border-t p-2 grid grid-cols-2 gap-2">
            {/* BLOQUEADO: Chat removido */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title="Visitas"
              aria-label="Visitas"
              disabled={!hasModulePermission("visitas")}
              onClick={() => onNavigate("visitas")}
            >
              <Calendar className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              title="Configurações"
              aria-label="Configurações"
              disabled={!hasModulePermission("configuracoes")}
              onClick={() => onNavigate("configuracoes")}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
