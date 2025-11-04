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
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const Sidebar = ({ activePage, onNavigate }: SidebarProps) => {
  const { userRole } = useAuth();
  const [openGroups, setOpenGroups] = useState<string[]>(["clientes", "equipe", "administracao"]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  };

  const menuGroups = [
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

  const visibleGroups = menuGroups.filter((group) => userRole && group.roles.includes(userRole));

  return (
    <aside className="w-64 border-r bg-card shadow-sm">
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
