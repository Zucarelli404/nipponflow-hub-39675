import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Radio, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LivePlayerProps {
  courseId: string;
  titulo: string;
  descricao: string;
  dataLive: string;
  streamUrl?: string;
  onClose: () => void;
}

const LivePlayer = ({ courseId, titulo, descricao, dataLive, streamUrl, onClose }: LivePlayerProps) => {
  const [viewers, setViewers] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se a live está no ar
    const now = new Date();
    const liveDate = new Date(dataLive);
    const isCurrentlyLive = now >= liveDate && now <= new Date(liveDate.getTime() + 2 * 60 * 60 * 1000);
    setIsLive(isCurrentlyLive);

    // Simular contador de viewers
    if (isCurrentlyLive) {
      setViewers(Math.floor(Math.random() * 100) + 10);
    }
  }, [dataLive]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            {titulo}
            {isLive && (
              <Badge className="bg-destructive text-destructive-foreground animate-pulse min-w-[44px] px-2 py-1 leading-tight text-[10px] flex flex-col items-center">
                <span>AO</span>
                <span>VIVO</span>
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          {/* Player de vídeo */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {streamUrl ? (
                <iframe
                  src={streamUrl}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Radio className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-foreground font-semibold">
                        {isLive ? 'Aguardando transmissão...' : 'Live ainda não iniciada'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Programada para: {new Date(dataLive).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Informações da live */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {viewers} assistindo
                  </Badge>
                </div>
                <h3 className="font-semibold mb-2">Sobre esta Live</h3>
                <p className="text-sm text-muted-foreground">{descricao}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chat lateral */}
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 flex flex-col p-4">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <MessageSquare className="h-4 w-4" />
                  <h3 className="font-semibold">Chat da Live</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  <div className="text-sm text-center text-muted-foreground py-8">
                    Chat será habilitado quando a live iniciar
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                    disabled={!isLive}
                  />
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={!isLive}
                  >
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LivePlayer;
