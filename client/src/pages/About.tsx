import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Camera, 
  Brain, 
  TrendingUp, 
  Target, 
  Sparkles, 
  Shield, 
  Zap, 
  Users,
  ChevronRight
} from "lucide-react";

const FEATURE_CAMERA = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/glBXsoBlqohYlKQc.png";
const FEATURE_NUTRITION = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/PAWxBjxFqnIVTmfu.png";
const FEATURE_RECOMMENDATION = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/ulduxfKzkyvCRZjC.png";

export default function About() {
  const features = [
    {
      icon: Camera,
      title: "Escaneie Alimentos",
      description: "Tire uma foto da sua refeição e nossa IA identifica automaticamente todos os alimentos, porções e ingredientes.",
      image: FEATURE_CAMERA,
    },
    {
      icon: Brain,
      title: "Análise Inteligente",
      description: "Contabilização precisa de calorias, macronutrientes (proteínas, carboidratos, gorduras) e micronutrientes essenciais.",
      image: FEATURE_NUTRITION,
    },
    {
      icon: Target,
      title: "Recomendações Personalizadas",
      description: "Receba sugestões de refeições baseadas nos seus objetivos, histórico alimentar e preferências pessoais.",
      image: FEATURE_RECOMMENDATION,
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Rápido e Fácil",
      description: "Análise em segundos, sem necessidade de digitar ou pesquisar alimentos manualmente.",
    },
    {
      icon: TrendingUp,
      title: "Acompanhe seu Progresso",
      description: "Visualize sua evolução com gráficos detalhados e estimativas de quando atingirá seus objetivos.",
    },
    {
      icon: Shield,
      title: "Nutricionista IA Esportivo",
      description: "Receba orientações de suplementação e ajustes na dieta para otimizar sua performance.",
    },
    {
      icon: Users,
      title: "Personalizado para Você",
      description: "Metas calculadas com base no seu perfil biométrico e nível de atividade física.",
    },
  ];

  const stats = [
    { value: "99%", label: "Precisão na identificação" },
    { value: "3s", label: "Tempo médio de análise" },
    { value: "50+", label: "Micronutrientes rastreados" },
    { value: "24/7", label: "Disponível sempre" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-emerald-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Tecnologia de ponta em nutrição
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sua alimentação sob{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                controle total
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              O Equilibra AI usa inteligência artificial avançada para analisar suas refeições 
              através de fotos, fornecendo informações nutricionais precisas e recomendações 
              personalizadas para alcançar seus objetivos de saúde.
            </p>
            <Link href="/">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg"
              >
                Começar Agora
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-gray-600 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como o Equilibra AI funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Três passos simples para transformar sua relação com a alimentação
            </p>
          </div>

          <div className="space-y-20">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-emerald-600">Passo {i + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-lg text-gray-600">{feature.description}</p>
                </div>
                <div className={i % 2 === 1 ? "md:order-1" : ""}>
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full max-w-md mx-auto rounded-2xl shadow-xl"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-white to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o Equilibra AI?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Benefícios que fazem a diferença na sua jornada de saúde
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-teal-500">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para transformar sua alimentação?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Comece agora mesmo a analisar suas refeições e receber recomendações personalizadas.
            </p>
            <Link href="/">
              <Button 
                size="lg" 
                className="bg-white text-emerald-600 hover:bg-emerald-50 px-8 py-6 text-lg font-semibold"
              >
                Analisar Minha Primeira Refeição
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
