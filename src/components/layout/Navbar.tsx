import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, LogOut, User, Settings, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, userRole, signOut } = useAuth();

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "diretor":
        return "Diretor";
      case "gerente":
        return "Gerente Comercial";
      default:
        return "Usuário";
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case "admin":
        return "bg-destructive text-destructive-foreground";
      case "diretor":
        return "bg-warning text-warning-foreground";
      case "gerente":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const [isDark, setIsDark] = useState(false);

  // Initialize and persist theme: default to light (white version)
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initialDark = stored ? stored === "dark" : false;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary rounded-lg shadow-glow">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                <span className="text-primary"> Genius</span>
                <span className="text-xs ml-1 text-muted-foreground">BETA</span>
              </h1>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold text-foreground">
                Genius<span className="text-primary text-xs ml-1">BETA</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userRole && (
              <Badge className={`${getRoleColor(userRole)} text-xs hidden sm:inline-flex`}>
                {getRoleLabel(userRole)}
              </Badge>
            )}

            {/* Centro unificado de notificações */}
            <NotificationCenter />

            {/* Modo offline: dados mockados sempre ativos (toggle removido) */}

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              title="Alternar tema"
              aria-label="Alternar tema"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 sm:h-10 sm:w-10"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                {userRole === "admin" && (
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
