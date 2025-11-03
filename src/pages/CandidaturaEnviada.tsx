import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CandidaturaEnviada = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Candidatura Enviada!</CardTitle>
          <CardDescription>
            Sua candidatura foi recebida com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Obrigado por seu interesse em fazer parte da nossa equipe. Analisaremos seu perfil e
            entraremos em contato em breve.
          </p>
          <p className="text-sm text-muted-foreground">
            Caso tenha alguma dúvida, aguarde nosso contato.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidaturaEnviada;
