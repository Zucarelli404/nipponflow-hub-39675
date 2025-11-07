import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { format, isSameDay } from "date-fns";
import { Clock, User } from "lucide-react";

interface Visit {
  id: string;
  data_visita: string;
  status: 'agendada' | 'realizada' | 'cancelada';
  lead: {
    nome: string;
  };
  especialista: {
    nome: string;
  };
}

interface VisitsCalendarProps {
  visits: Visit[];
  onDateSelect?: (date: Date | undefined) => void;
}

export const VisitsCalendar = ({ visits, onDateSelect }: VisitsCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const getVisitsForDate = (date: Date) => {
    return visits.filter(visit => 
      isSameDay(new Date(visit.data_visita), date)
    );
  };

  const selectedDayVisits = selectedDate ? getVisitsForDate(selectedDate) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendada':
        return 'bg-primary/10 text-primary border-primary';
      case 'realizada':
        return 'bg-green-500/10 text-green-600 border-green-600';
      case 'cancelada':
        return 'bg-red-500/10 text-red-600 border-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'agendada': return 'Agendada';
      case 'realizada': return 'Realizada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const modifiers = {
    hasVisit: (date: Date) => getVisitsForDate(date).length > 0,
  };

  const modifiersClassNames = {
    hasVisit: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Calendário de Visitas</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={ptBR}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border pointer-events-auto"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDayVisits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma visita agendada para este dia</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {selectedDayVisits.map((visit) => (
                <div
                  key={visit.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4 bg-card hover:bg-accent/50 transition-colors",
                    visit.status === 'agendada' && "border-l-primary",
                    visit.status === 'realizada' && "border-l-green-500",
                    visit.status === 'cancelada' && "border-l-red-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {format(new Date(visit.data_visita), "HH:mm")}
                        </span>
                      </div>
                      <p className="font-semibold truncate">{(visit as any).lead?.nome}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{(visit as any).especialista?.nome}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("flex-shrink-0", getStatusColor(visit.status))}>
                      {getStatusLabel(visit.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
