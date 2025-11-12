import { Home, BarChart3, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrailFooterProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const TrailFooter = ({ activePage, onNavigate }: TrailFooterProps) => {
  const navItems = [
    { id: "graduacao", label: "Início", icon: Home },
    { id: "analytics", label: "Estatísticas", icon: BarChart3 },
    { id: "equipe", label: "Equipe", icon: Users },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50 lg:hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-4 gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
