import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupNome, setSignupNome] = useState('');

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      const isInvalidCreds = error.message === 'Invalid login credentials' || /invalid login/i.test(error.message);
      toast({
        title: 'Erro ao fazer login',
        description: isInvalidCreds
          ? 'Email ou senha incorretos. Verifique os dados ou use “Esqueci minha senha”.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo à Plataforma Genius.',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!loginEmail) {
      toast({
        title: 'Informe seu email',
        description: 'Digite seu email no campo acima para recuperar a senha.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: 'Link de recuperação enviado',
        description: 'Verifique seu email e siga as instruções para redefinir sua senha.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar recuperação',
        description: error?.message || 'Não foi possível enviar o link de recuperação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupEmail || !signupPassword || !signupNome) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(signupEmail, signupPassword, signupNome);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já está registrado. Faça login ou use outro email.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao criar conta',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso. Você já pode fazer login.',
      });
      // Reset form
      setSignupEmail('');
      setSignupPassword('');
      setSignupNome('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative p-4" style={{ backgroundColor: '#0a0a0a', fontFamily: 'Poppins, sans-serif' }}>
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-20 h-20 border-2 rounded-lg animate-float" style={{ 
          borderColor: 'rgba(255, 165, 0, 0.25)', 
          top: '10%', 
          left: '15%',
          animationDelay: '0s'
        }} />
        <div className="absolute w-30 h-30 border-2 rounded-lg animate-float" style={{ 
          borderColor: 'rgba(255, 165, 0, 0.25)', 
          top: '60%', 
          left: '70%',
          animationDelay: '2s'
        }} />
        <div className="absolute w-25 h-25 border-2 rounded-lg animate-float" style={{ 
          borderColor: 'rgba(255, 165, 0, 0.25)', 
          top: '30%', 
          left: '85%',
          transform: 'rotate(45deg)',
          animationDelay: '4s'
        }} />
        <div className="absolute w-36 h-36 border-2 rounded-lg animate-float" style={{ 
          borderColor: 'rgba(255, 165, 0, 0.1)', 
          top: '75%', 
          left: '20%',
          animationDelay: '6s'
        }} />
      </div>

      {/* Login Box */}
      <div className="relative z-10 w-full max-w-[380px] mx-auto p-6 sm:p-12 rounded-3xl text-center animate-fade-in" style={{
        background: 'rgba(17, 17, 17, 0.95)',
        boxShadow: '0 0 40px rgba(255, 165, 0, 0.25)'
      }}>
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ letterSpacing: '0.5px' }}>
            Graduação<span style={{ color: '#ffa500' }}>Infinita</span>
          </h1>
          <div className="text-xl sm:text-2xl transform rotate-12" style={{ color: '#ffa500' }}>∞</div>
        </div>
        
        <h2 className="text-sm sm:text-base font-normal mb-6 sm:mb-8" style={{ color: '#aaa' }}>
          Acesse sua jornada de aprendizado
        </h2>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6" style={{ background: '#1a1a1a' }}>
            <TabsTrigger value="login" className="data-[state=active]:bg-[#ffa500] data-[state=active]:text-black">
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-[#ffa500] data-[state=active]:text-black">
              Criar Conta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={isLoading}
                required
                className="px-5 py-4 rounded-xl text-base border-none focus-visible:ring-2"
                style={{ background: '#1a1a1a', color: '#fff' }}
              />
              <Input
                type="password"
                placeholder="Senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={isLoading}
                required
                className="px-5 py-4 rounded-xl text-base border-none focus-visible:ring-2"
                style={{ background: '#1a1a1a', color: '#fff' }}
              />
              <Button
                type="submit"
                className="py-4 rounded-xl font-semibold text-base transition-all hover:shadow-lg"
                disabled={isLoading}
                style={{ 
                  background: '#ffa500', 
                  color: '#000',
                  border: 'none'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isLoading}
                className="text-xs underline"
                style={{ color: '#ffa500' }}
              >
                Esqueci minha senha
              </button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="flex flex-col gap-5">
              <Input
                type="text"
                placeholder="Nome Completo"
                value={signupNome}
                onChange={(e) => setSignupNome(e.target.value)}
                disabled={isLoading}
                required
                className="px-5 py-4 rounded-xl text-base border-none focus-visible:ring-2"
                style={{ background: '#1a1a1a', color: '#fff' }}
              />
              <Input
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                disabled={isLoading}
                required
                className="px-5 py-4 rounded-xl text-base border-none focus-visible:ring-2"
                style={{ background: '#1a1a1a', color: '#fff' }}
              />
              <Input
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                disabled={isLoading}
                required
                className="px-5 py-4 rounded-xl text-base border-none focus-visible:ring-2"
                style={{ background: '#1a1a1a', color: '#fff' }}
              />
              <Button
                type="submit"
                className="py-4 rounded-xl font-semibold text-base transition-all hover:shadow-lg"
                disabled={isLoading}
                style={{ 
                  background: '#ffa500', 
                  color: '#000',
                  border: 'none'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-sm" style={{ color: '#888' }}>
          Dúvidas? <a href="#" className="transition-all" style={{ color: '#ffa500', textDecoration: 'none' }}>Entre em contato</a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
