import { Calendar, ShoppingBag, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const BottomNav = ({ activePage, onNavigate }: BottomNavProps) => {
  const navItems = [
    { id: "agenda-rapida", label: "Agenda", icon: Calendar },
    { id: "loja-produtos", label: "VENDER", icon: ShoppingBag, isMain: true },
    { id: "relatorio-vendas", label: "Relatório", icon: BarChart3 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50 pb-safe">
      <div className="container mx-auto px-4 max-w-screen-xl">
        <div className="grid grid-cols-3 gap-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            if (item.isMain) {
              // Botão VENDER - Grande e redondo
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex flex-col items-center gap-1 relative"
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
                        "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
                        "hover:scale-110 active:scale-95",
                        isActive && "ring-4 ring-green-400/50"
                      )}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600 mt-11">
                    {item.label}
                  </span>
                </button>
              );
            }

            // Botões normais (Agenda e Relatório)
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-lg transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
