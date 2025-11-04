import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users,
  MessageSquare,
  Hand,
  ScreenShare,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeleAulaRoomProps {
  courseId: string;
  titulo: string;
  descricao: string;
  onClose: () => void;
}

const TeleAulaRoom = ({ courseId, titulo, descricao, onClose }: TeleAulaRoomProps) => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [participants, setParticipants] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simular número de participantes
    setParticipants(Math.floor(Math.random() * 20) + 5);
  }, []);

  const toggleVideo = async () => {
    if (!isVideoOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
        toast({
          title: 'Câmera ativada',
          description: 'Sua câmera está ligada',
        });
      } catch (error) {
        toast({
          title: 'Erro ao acessar câmera',
          description: 'Verifique as permissões do navegador',
          variant: 'destructive',
        });
      }
    } else {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
    }
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    toast({
      title: isAudioOn ? 'Microfone desativado' : 'Microfone ativado',
      description: isAudioOn ? 'Você está mudo' : 'Você pode falar',
    });
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    toast({
      title: isHandRaised ? 'Mão abaixada' : 'Mão levantada',
      description: isHandRaised ? 'Você abaixou a mão' : 'O instrutor foi notificado',
    });
  };

  const handleLeave = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleLeave}>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {titulo}
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {participants} participantes
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          {/* Área principal de vídeo */}
          <div className="lg:col-span-3 space-y-4">
            {/* Vídeo do instrutor (principal) */}
            <Card className="flex-1">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                        <Users className="h-12 w-12 text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground font-semibold">Instrutor</p>
                        <Badge variant="secondary" className="mt-2">Apresentando</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid de participantes */}
            <div className="grid grid-cols-4 gap-2">
              {/* Seu vídeo */}
              <Card>
                <CardContent className="p-2">
                  <div className="relative aspect-video bg-black rounded overflow-hidden">
                    {isVideoOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <VideoOff className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1">
                      <Badge variant="secondary" className="text-xs w-full justify-center">
                        Você {isHandRaised && '🖐️'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Outros participantes (mockup) */}
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-2">
                    <div className="relative aspect-video bg-muted rounded overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="absolute bottom-1 left-1 right-1">
                        <Badge variant="secondary" className="text-xs w-full justify-center">
                          Participante {i}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Controles */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant={isAudioOn ? 'default' : 'secondary'}
                    onClick={toggleAudio}
                    className="h-12 w-12"
                  >
                    {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    size="icon"
                    variant={isVideoOn ? 'default' : 'secondary'}
                    onClick={toggleVideo}
                    className="h-12 w-12"
                  >
                    {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    size="icon"
                    variant={isHandRaised ? 'default' : 'outline'}
                    onClick={toggleHandRaise}
                    className="h-12 w-12"
                  >
                    <Hand className="h-5 w-5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12"
                  >
                    <ScreenShare className="h-5 w-5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    className="h-12 w-12"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>

                  <div className="flex-1" />

                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={handleLeave}
                    className="h-12 w-12"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel lateral - Chat e Participantes */}
          <div className="lg:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 flex flex-col p-4">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                  <MessageSquare className="h-4 w-4" />
                  <h3 className="font-semibold">Chat</h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  <div className="text-sm text-center text-muted-foreground py-8">
                    Bem-vindo à TeleAula!
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                  <Button className="w-full" size="sm">
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

export default TeleAulaRoom;
