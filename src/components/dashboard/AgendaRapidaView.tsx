import { useState } from "react";
import ScheduledVisitsList from "@/components/visits/ScheduledVisitsList";
import ScheduleVisitForm from "@/components/visits/ScheduleVisitForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const AgendaRapidaView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Agenda de Visitas</h2>
          <p className="text-muted-foreground mt-1">Gerencie suas visitas agendadas</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Agendar Nova Visita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Nova Visita</DialogTitle>
            </DialogHeader>
            <ScheduleVisitForm onSuccess={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <ScheduledVisitsList />
    </div>
  );
};
