import { useState, useEffect } from "react";
import ScheduledVisitsList from "@/components/visits/ScheduledVisitsList";
import ScheduleVisitForm from "@/components/visits/ScheduleVisitForm";
import { VisitsCalendar } from "@/components/visits/VisitsCalendar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar as CalendarIcon, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const AgendaRapidaView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduledVisits = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('scheduled_visits')
        .select(`
          *,
          lead:leads(nome, telefone),
          especialista:profiles!scheduled_visits_especialista_id_fkey(nome)
        `)
        .order('data_visita', { ascending: true });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching scheduled visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledVisits();
  }, []);

  const handleVisitCreated = () => {
    setDialogOpen(false);
    fetchScheduledVisits();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Agenda de Visitas</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie suas visitas agendadas
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Agendar Nova Visita</span>
              <span className="sm:hidden">Nova Visita</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Nova Visita</DialogTitle>
            </DialogHeader>
            <ScheduleVisitForm onSuccess={handleVisitCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Calendário</span>
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Lista</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando visitas...
            </div>
          ) : (
            <VisitsCalendar visits={visits} />
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <div className="overflow-x-auto">
            <ScheduledVisitsList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
