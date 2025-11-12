import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Crown, Clock, Gift, Play } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const OnboardingModal = ({ open, onClose, onComplete }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const total = 3;

  useEffect(() => {
    if (!open) {
      setStep(1);
    }
  }, [open]);

  const pct = useMemo(() => (step / total) * 100, [step, total]);

  const next = () => {
    if (step < total) {
      setStep(step + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const prev = () => setStep((s) => Math.max(1, s - 1));

  const skip = () => {
    onComplete?.();
    onClose();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[520px] md:max-w-[680px] rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="px-2 py-0.5">Bem-vindo(a)</Badge>
            <span className="text-muted-foreground">{step} de {total}</span>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Fechar</Button>
          </DialogClose>
        </div>

        <div className="mt-2">
          <Progress value={pct} className="h-2" />
        </div>

        <DialogHeader className="mt-2">
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Missão de Boas-vindas
          </DialogTitle>
          <DialogDescription>
            Complete os passos para desbloquear recursos e acelerar seus primeiros resultados.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm font-medium">Tempo Limitado</p>
                    <p className="text-xs text-muted-foreground">Missões iniciais em 72 horas</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <Gift className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium">Recompensas</p>
                    <p className="text-xs text-muted-foreground">Pontos + bônus ao concluir</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-accent">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Prêmio Final Exclusivo</p>
                <p className="text-xs text-muted-foreground">Benefícios extras após completar as missões</p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/VBb6ngKUmRk?rel=0&modestbranding=1"
                title="Apresentação da Plataforma"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Play className="h-4 w-4" />
              Assista ao vídeo para entender os principais recursos.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm">Tutorial rápido</p>
            <ul className="grid grid-cols-1 gap-2 text-sm">
              <li className="p-3 rounded-lg border bg-card">Sidebar: navegue entre módulos como Leads, Vendas e Visitas.</li>
              <li className="p-3 rounded-lg border bg-card">Navbar: veja notificações, perfil e alterne claro/escuro.</li>
              <li className="p-3 rounded-lg border bg-card">Filtros e busca: refine listas com rapidez.</li>
              <li className="p-3 rounded-lg border bg-card">Ações: use botões principais para criar, editar e acompanhar.</li>
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 1}>
            Anterior
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={skip}>Pular</Button>
            <Button onClick={next}>{step === total ? "Concluir" : "Próximo"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
