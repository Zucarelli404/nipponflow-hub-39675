import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConversationList from '@/components/inbox/ConversationList';
import MessageList from '@/components/inbox/MessageList';
import LeadDetails from '@/components/inbox/LeadDetails';
import { MessageSquare, ArrowLeft, Info } from 'lucide-react';

const InboxView = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'details'>('list');

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setMobileView('chat');
  };

  const handleBackToList = () => {
    setMobileView('list');
    setSelectedLeadId(null);
  };

  const handleShowDetails = () => {
    setMobileView('details');
  };

  const handleBackToChat = () => {
    setMobileView('chat');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie suas conversas com clientes e leads
        </p>
      </div>

      {/* Layout Desktop */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
        {/* Lista de Conversas */}
        <Card className="col-span-3 flex flex-col overflow-hidden">
          <ConversationList
            selectedLeadId={selectedLeadId}
            onSelectLead={setSelectedLeadId}
          />
        </Card>

        {/* Área de Mensagens e Detalhes */}
        {selectedLeadId ? (
          <>
            {/* Mensagens */}
            <Card className="col-span-6 flex flex-col overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Conversa</h2>
              </div>
              <MessageList leadId={selectedLeadId} />
            </Card>

            {/* Detalhes do Lead */}
            <Card className="col-span-3 flex flex-col overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Detalhes</h2>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <LeadDetails leadId={selectedLeadId} />
              </div>
            </Card>
          </>
        ) : (
          <Card className="col-span-9 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-sm">
                Escolha uma conversa da lista à esquerda para começar
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Layout Mobile/Tablet */}
      <div className="lg:hidden">
        {/* Lista de Conversas */}
        {mobileView === 'list' && (
          <Card className="flex flex-col overflow-hidden h-[calc(100vh-10rem)]">
            <ConversationList
              selectedLeadId={selectedLeadId}
              onSelectLead={handleSelectLead}
            />
          </Card>
        )}

        {/* Chat View */}
        {mobileView === 'chat' && selectedLeadId && (
          <Card className="flex flex-col overflow-hidden h-[calc(100vh-10rem)]">
            <div className="p-3 sm:p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold text-sm sm:text-base">Conversa</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShowDetails}
                className="h-8 w-8"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <MessageList leadId={selectedLeadId} />
          </Card>
        )}

        {/* Details View */}
        {mobileView === 'details' && selectedLeadId && (
          <Card className="flex flex-col overflow-hidden h-[calc(100vh-10rem)]">
            <div className="p-3 sm:p-4 border-b flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToChat}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold text-sm sm:text-base">Detalhes</h2>
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-4">
              <LeadDetails leadId={selectedLeadId} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InboxView;
