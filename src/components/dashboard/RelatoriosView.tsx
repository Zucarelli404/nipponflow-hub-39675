import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, Download, TrendingUp } from 'lucide-react';

const RelatoriosView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
        <p className="text-muted-foreground">Análises e relatórios gerenciais</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gráficos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exportações</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Indicador geral</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Central de Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Módulo em desenvolvimento
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosView;
