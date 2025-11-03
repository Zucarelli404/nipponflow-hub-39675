import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import InboxView from '@/components/dashboard/InboxView';
import LeadsView from '@/components/dashboard/LeadsView';
import VisitasView from '@/components/dashboard/VisitasView';
import VendasView from '@/components/dashboard/VendasView';
import RemarketingView from '@/components/dashboard/RemarketingView';
import EquipeView from '@/components/dashboard/EquipeView';
import CandidatosView from '@/components/dashboard/CandidatosView';
import EstoqueView from '@/components/dashboard/EstoqueView';
import RelatoriosView from '@/components/dashboard/RelatoriosView';
import AnalyticsView from '@/components/dashboard/AnalyticsView';
import SettingsView from '@/components/dashboard/SettingsView';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('leads');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
    switch (activePage) {
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
      case 'relatorios':
        return <RelatoriosView />;
      case 'analytics':
        return userRole === 'admin' || userRole === 'diretor' ? <AnalyticsView /> : <LeadsView />;
      case 'configuracoes':
        return userRole === 'admin' ? <SettingsView /> : <LeadsView />;
      default:
        return <LeadsView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
