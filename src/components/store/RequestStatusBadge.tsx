import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RequestStatusBadgeProps {
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'entregue' | 'cancelado';
  className?: string;
}

export const RequestStatusBadge = ({ status, className }: RequestStatusBadgeProps) => {
  const statusConfig = {
    pendente: {
      label: 'Pendente',
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    },
    aprovado: {
      label: 'Aprovado',
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
    },
    rejeitado: {
      label: 'Rejeitado',
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
    },
    entregue: {
      label: 'Entregue',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    cancelado: {
      label: 'Cancelado',
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};
