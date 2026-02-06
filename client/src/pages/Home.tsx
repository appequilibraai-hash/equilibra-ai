import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { 
  Camera, 
  BarChart3, 
  Lightbulb, 
  Utensils,
  ArrowRight,
  Check,
  Sparkles
} from "lucide-react";
import { useEffect } from "react";

const features = [
  {
    icon: Camera,
    title: "Análise por Foto",
    description: "Tire uma foto da sua refeição e nossa IA identifica automaticamente os alimentos e calcula as informações nutricionais.",
  },
  {
    icon: BarChart3,
    title: "Acompanhamento Detalhado",
    description: "Visualize seu progresso com gráficos interativos de calorias, proteínas, carboidratos e gorduras.",
  },
  {
    icon: Lightbulb,
    title: "Recomendações Inteligentes",
    description: "Receba sugestões personalizadas para suas próximas refeições baseadas nas suas metas e preferências.",
  },
  {
    icon: Utensils,
    title: "Histórico Completo",
    description: "Acesse todo o histórico das suas refeições com fotos, datas e análises nutricionais detalhadas.",
  },
];

const benefits = [
  "Identificação automática de alimentos por IA",
  "Cálculo preciso de calorias e macronutrientes",
  "Detecção de ingredientes e molhos",
  "Análise de micronutrientes (vitaminas e minerais)",
  "Metas personalizadas de consumo diário",
  "Gráficos de evolução semanal",
  "Recomendações baseadas no seu perfil",
  "Interface intuitiva e responsiva",
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/KjysyrPrcMHEAShv.jpeg" alt="Equilibra AI" className="w-16 h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      {/* Header */}
      <header className="container py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/KjysyrPrcMHEAShv.jpeg" alt="Equilibra AI" className="w-10 h-10 rounded-xl" />
            <span className="font-bold text-xl text-primary">Equilibra AI</span>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Entrar
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Powered by AI
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Controle sua alimentação com{" "}
            <span className="text-primary">inteligência artificial</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tire uma foto da sua refeição e descubra instantaneamente as calorias, 
            macronutrientes, ingredientes e receba recomendações personalizadas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = getLoginUrl()}
              className="text-lg px-8"
            >
              Começar Agora
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-8"
            >
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Funcionalidades Principais
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tudo o que você precisa para monitorar sua alimentação de forma inteligente
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Por que escolher o Equilibra AI?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-8 flex items-center justify-center">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/KjysyrPrcMHEAShv.jpeg" 
                  alt="Equilibra AI" 
                  className="w-48 h-48 rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-card p-4 rounded-xl shadow-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Análise Instantânea</p>
                    <p className="text-xs text-muted-foreground">Resultados em segundos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto text-center bg-primary/5 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Comece a controlar sua alimentação hoje
          </h2>
          <p className="text-muted-foreground mb-8">
            Junte-se a milhares de pessoas que já estão usando o Equilibra AI 
            para alcançar seus objetivos nutricionais.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = getLoginUrl()}
            className="text-lg px-8"
          >
            Criar Conta Gratuita
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/KjysyrPrcMHEAShv.jpeg" alt="Equilibra AI" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold text-primary">Equilibra AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Equilibra AI. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
