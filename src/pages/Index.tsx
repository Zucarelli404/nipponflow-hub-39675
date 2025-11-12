import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import InboxView from '@/components/dashboard/InboxView';
import LeadsView from '@/components/dashboard/LeadsView';
import VisitasView from '@/components/dashboard/VisitasView';
import VendasView from '@/components/dashboard/VendasView';
import RemarketingView from '@/components/dashboard/RemarketingView';
import EquipeView from '@/components/dashboard/EquipeView';
import CandidatosView from '@/components/dashboard/CandidatosView';
import EstoqueView from '@/components/dashboard/EstoqueView';
import CursosView from '@/components/dashboard/CursosView';
import GamificacaoView from '@/components/dashboard/GamificacaoView';
import GraduacaoView from '@/components/dashboard/GraduacaoView';
import GraduacaoRankingView from '@/components/trail/GraduacaoRankingView';
import RelatoriosView from '@/components/dashboard/RelatoriosView';
import AnalyticsView from '@/components/dashboard/AnalyticsView';
import SettingsView from '@/components/dashboard/SettingsView';
import ConsultorView from '@/components/dashboard/ConsultorView';
import DistribuidorView from '@/components/dashboard/DistribuidorView';
import { GamificationNotifications } from '@/components/gamification/GamificationNotifications';
import { AgendaRapidaView } from '@/components/dashboard/AgendaRapidaView';
import { ProductStore } from '@/components/store/ProductStore';
import { ProductRequestHistory } from '@/components/store/ProductRequestHistory';
import { BottomNav } from '@/components/layout/BottomNav';
import { Loader2 } from 'lucide-react';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import { DemoNotificationsPanel } from '@/components/notifications/DemoNotificationsPanel';
import { NotificationBridge } from '@/components/notifications/NotificationBridge';
import { AutoSystemNotifications } from '@/components/notifications/AutoSystemNotifications';
import CanalAguiaRealView from '@/components/demo/CanalAguiaRealView';
import OnboardingModal from '@/components/demo/OnboardingModal';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasModulePermission, loading: loadingPermissions } = useModulePermissions();
  const [activePage, setActivePage] = useState('graduacao');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDemoNotifs, setShowDemoNotifs] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Exibe onboarding na primeira visita após login
  useEffect(() => {
    if (user) {
      const seen = localStorage.getItem('onboarding_seen');
      if (seen !== 'true') {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  // Sincroniza página ativa com a URL (?p=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('p');
    if (p) {
      setActivePage(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Habilita painel de demonstração SOMENTE em DEV e com query ?demo_notifs=1
  useEffect(() => {
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.search);
      setShowDemoNotifs(params.get('demo_notifs') === '1');
    } else {
      setShowDemoNotifs(false);
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('p') !== activePage) {
      navigate({ pathname: '/', search: `?p=${activePage}` }, { replace: true });
    }
  }, [activePage, navigate, location.search]);

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActivePage(customEvent.detail);
    };
    window.addEventListener('navigate', handleNav);
    return () => window.removeEventListener('navigate', handleNav);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    // Bloqueio genérico por módulo (admin sempre tem acesso)
    const canViewActive = hasModulePermission(activePage) || userRole === 'admin';
    if (!canViewActive) {
      return <GraduacaoView />;
    }

    switch (activePage) {
      case 'graduacao':
        return <GraduacaoView />;
      case 'graduacao-ranking':
        return <GraduacaoRankingView />;
      case 'inbox':
        return <InboxView />;
      case 'leads':
        return <LeadsView />;
      case 'visitas':
        return <VisitasView />;
      case 'vendas':
        return <VendasView />;
      case 'remarketing':
        return <RemarketingView />;
      case 'equipe':
        return <EquipeView />;
      case 'candidatos':
        return <CandidatosView />;
      case 'estoque':
        return <EstoqueView />;
      case 'cursos':
        return <CursosView />;
      case 'gamificacao':
        return <GamificacaoView />;
      case 'relatorios':
        return <RelatoriosView />;
      case 'analytics':
        return userRole === 'admin' || userRole === 'diretor' ? <AnalyticsView /> : <LeadsView />;
      case 'configuracoes':
        return userRole === 'admin' ? <SettingsView /> : <LeadsView />;
      case 'consultor':
        return <ConsultorView />;
      case 'distribuidor':
        return <DistribuidorView />;
      case 'agenda-rapida':
        return <AgendaRapidaView />;
      case 'loja-produtos':
        return <ProductStore />;
      case 'historico-produtos':
        return <ProductRequestHistory />;
      case 'relatorio-vendas':
        return <VendasView />;
      case 'canal-aguia-real':
        return <CanalAguiaRealView />;
      default:
        return <GraduacaoView />;
    }
  };

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GamificationNotifications />
      {/* Ponte: transforma registros do mock supabase em notificações do sistema */}
      <NotificationBridge />
      {/* Geração automática em modo offline para experiência natural */}
      <AutoSystemNotifications />
      {showDemoNotifs && <DemoNotificationsPanel />}
      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => localStorage.setItem('onboarding_seen', 'true')}
      />
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 overflow-hidden lg:pl-64 xl:pl-72">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar activePage={activePage} onNavigate={setActivePage} />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar activePage={activePage} onNavigate={handleNavigate} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-auto pb-20">
          {loadingPermissions ? (
            <div className="min-h-[200px] flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Carregando permissões...</span>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Bottom Navigation - Fixo em todas as páginas */}
      <BottomNav activePage={activePage} onNavigate={setActivePage} />
    </div>
  );
};

export default Index;
