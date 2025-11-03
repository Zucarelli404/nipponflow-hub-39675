import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConversationList from '@/components/inbox/ConversationList';
import MessageList from '@/components/inbox/MessageList';
import LeadDetails from '@/components/inbox/LeadDetails';
import { MessageSquare } from 'lucide-react';

const InboxView = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">
          Gerencie suas conversas com clientes e leads
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
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
              <div className="flex-1 overflow-auto">
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
    </div>
  );
};

export default InboxView;
