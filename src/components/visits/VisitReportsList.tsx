import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle, Calendar, User, MapPin, CreditCard } from 'lucide-react';

interface VisitReportsListProps {
  leadId: string;
}

interface VisitReport {
  id: string;
  data_visita: string;
  quilometragem_percorrida: number | null;
  venda_realizada: boolean;
  forma_pagamento: string | null;
  valor_total: number;
  observacoes: string | null;
  created_at: string;
  especialista: {
    nome: string;
  };
  visit_items: Array<{
    id: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
}

const VisitReportsList = ({ leadId }: VisitReportsListProps) => {
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [leadId]);

  const fetchReports = async () => {
    try {
      // @ts-ignore - Tabelas serão criadas pela migration
      const { data, error } = await (supabase as any)
        .from('visit_reports')
        .select(`
          *,
          especialista:profiles!visit_reports_especialista_id_fkey(nome),
          visit_items(*)
        `)
        .eq('lead_id', leadId)
        .order('data_visita', { ascending: false });

      if (error) throw error;
      setReports(data as any || []);
    } catch (error) {
      console.error('Error fetching visit reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando relatórios...</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Nenhum relatório de visita ainda
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {report.venda_realizada ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Venda Realizada
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    Sem Venda
                  </>
                )}
              </CardTitle>
              <Badge variant="outline">
                {formatDistanceToNow(new Date(report.data_visita), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Especialista:</span>
              <span>{(report as any).especialista?.nome}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Data:</span>
              <span>{new Date(report.data_visita).toLocaleString('pt-BR')}</span>
            </div>

            {report.quilometragem_percorrida && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Quilometragem:</span>
                <span>{report.quilometragem_percorrida} km</span>
              </div>
            )}

            {report.venda_realizada && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Forma de Pagamento:</span>
                  <span className="capitalize">{report.forma_pagamento?.replace('_', ' ')}</span>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Itens Vendidos:</p>
                  <div className="space-y-2">
                    {report.visit_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm bg-muted p-2 rounded">
                        <div>
                          <p className="font-medium">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantidade}x R$ {item.valor_unitario.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium">R$ {item.valor_total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-right font-bold">
                    Total: R$ {report.valor_total.toFixed(2)}
                  </div>
                </div>
              </>
            )}

            {report.observacoes && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-1">Observações:</p>
                <p className="text-sm text-muted-foreground">{report.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VisitReportsList;
