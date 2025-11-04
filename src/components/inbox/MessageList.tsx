import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { z } from 'zod';
import { handleError } from '@/lib/errorHandler';

const messageSchema = z.object({
  conteudo: z.string()
    .trim()
    .min(1, 'Mensagem não pode estar vazia')
    .max(10000, 'Máximo 10.000 caracteres'),
  lead_id: z.string().uuid(),
  tipo: z.enum(['text', 'image', 'video', 'audio', 'document'])
});

interface Message {
  id: string;
  lead_id: string;
  conteudo: string | null;
  direction: 'in' | 'out';
  tipo: 'text' | 'image' | 'video' | 'audio' | 'document';
  media_url: string | null;
  created_at: string;
  autor_id: string | null;
  autor?: {
    nome: string;
  };
}

interface MessageListProps {
  leadId: string;
  refreshKey?: number;
}

const MessageList = ({ leadId, refreshKey }: MessageListProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (leadId) {
      fetchMessages();
    }
  }, [leadId, refreshKey]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      handleError(error, 'Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);
      
      // Validate message
      const validated = messageSchema.parse({
        conteudo: newMessage.trim(),
        lead_id: leadId,
        tipo: 'text'
      });
      
      const { error } = await supabase
        .from('messages')
        .insert({
          lead_id: validated.lead_id,
          conteudo: validated.conteudo,
          direction: 'out',
          tipo: validated.tipo,
          autor_id: user.id,
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages();
      toast.success('Mensagem enviada');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        handleError(error, 'Erro ao enviar mensagem');
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm mt-1">Envie a primeira mensagem para iniciar a conversa</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === 'out' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.direction === 'out'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.direction === 'in' && (
                    <p className="text-xs font-semibold mb-1">Cliente</p>
                  )}
                  {message.direction === 'out' && (
                    <p className="text-xs font-semibold mb-1 opacity-90">
                      Você
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.conteudo}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.direction === 'out' ? 'opacity-75' : 'text-muted-foreground'
                    }`}
                  >
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {newMessage.length} / 10.000 caracteres
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              maxLength={10000}
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageList;
