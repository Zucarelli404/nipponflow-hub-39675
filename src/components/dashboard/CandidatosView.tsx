import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Users, CheckCircle, Clock } from 'lucide-react';
import CandidateForm from '@/components/candidates/CandidateForm';
import CandidatesList from '@/components/candidates/CandidatesList';
import { useState } from 'react';

const CandidatosView = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Candidatos</h2>
          <p className="text-muted-foreground">Gerencie processos seletivos e candidaturas</p>
        </div>
        <CandidateForm onSuccess={() => setRefreshKey(prev => prev + 1)} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Aguardando triagem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Processo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Em avaliação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Na base</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Candidatos</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidatesList key={refreshKey} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidatosView;
