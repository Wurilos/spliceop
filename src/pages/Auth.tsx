import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';
import { z } from 'zod';
import spliceIcon from '@/assets/splice-icon.png';

const ALLOWED_EMAIL_DOMAIN = '@splice.com.br';
const ADMIN_EMAIL = 'sergio.silva@splice.com.br';

const emailSchema = z.string().email('E-mail inválido');
const corporateEmailSchema = z.string()
  .email('E-mail inválido')
  .refine(
    (email) => email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN),
    { message: `Apenas e-mails corporativos ${ALLOWED_EMAIL_DOMAIN} são permitidos` }
  );
const passwordSchema = z.string().min(6, 'Senha deve ter pelo menos 6 caracteres');
const nameSchema = z.string().min(2, 'Nome deve ter pelo menos 2 caracteres');

const isAdminEmail = (email: string) => email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      nameSchema.parse(signupName);
      corporateEmailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupName);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'Este e-mail já está cadastrado.';
      }
      toast({
        title: 'Erro ao cadastrar',
        description: message,
        variant: 'destructive',
      });
    } else {
      // Admin email doesn't need confirmation message
      if (isAdminEmail(signupEmail)) {
        toast({
          title: 'Cadastro de administrador realizado!',
          description: 'Sua conta foi criada com sucesso. Você já pode fazer login.',
        });
      } else {
        toast({
          title: 'Cadastro realizado!',
          description: 'Um e-mail de confirmação foi enviado para ativar sua conta. Verifique sua caixa de entrada.',
        });
      }
      // Clear form after successful signup
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidebar relative overflow-hidden flex items-center justify-center p-6">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/5 blur-2xl" />
      </div>
      
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left side - Branding */}
        <div className="flex-1 text-left max-w-md">
          {/* Logo Box */}
          <div className="flex items-center gap-4 mb-8">
            <img 
              src={spliceIcon} 
              alt="Splice" 
              className="h-14 w-auto rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground">
                Sistema Splice
              </h1>
              <p className="text-sm text-sidebar-foreground/70">
                Gestão Operacional Integrada
              </p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-sidebar-foreground mb-6">
            Plataforma completa para gestão empresarial
          </h2>

          {/* Features List */}
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sidebar-foreground/90">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>19 módulos integrados de gestão</span>
            </li>
            <li className="flex items-center gap-3 text-sidebar-foreground/90">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>Controle de contratos e centro de custos</span>
            </li>
            <li className="flex items-center gap-3 text-sidebar-foreground/90">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>Gestão de equipamentos e manutenções</span>
            </li>
            <li className="flex items-center gap-3 text-sidebar-foreground/90">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>Relatórios e análises em tempo real</span>
            </li>
            <li className="flex items-center gap-3 text-sidebar-foreground/90">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>Importação de planilhas Excel</span>
            </li>
          </ul>
        </div>

        {/* Right side - Auth forms */}
        <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <img 
                src={spliceIcon} 
                alt="Splice" 
                className="h-10 w-auto rounded-lg"
              />
            </div>
            <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
            <CardDescription>
              Entre com suas credenciais ou crie uma nova conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Usuário ou Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="bg-muted/30 border-input focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="bg-muted/30 border-input focus:border-primary"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  <div className="text-center">
                    <button 
                      type="button"
                      className="text-sm text-primary hover:text-primary/80 hover:underline"
                      onClick={() => toast({
                        title: 'Recuperação de senha',
                        description: 'Funcionalidade em desenvolvimento.',
                      })}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      className="bg-muted/30 border-input focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className="bg-muted/30 border-input focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      className="bg-muted/30 border-input focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar senha</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      className="bg-muted/30 border-input focus:border-primary"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
