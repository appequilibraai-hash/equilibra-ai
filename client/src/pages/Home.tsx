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
  Sparkles,
  Play,
  Star,
  Zap,
  Shield,
  Heart
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// URLs das imagens ilustrativas
const IMAGES = {
  hero: "https://private-us-east-1.manuscdn.com/sessionFile/zzBJEAWa6t4bzzUkBdknzk/sandbox/kw1I1FeG3weE1NSxH7ImVi_1770344056441_na1fn_aGVyby1pbGx1c3RyYXRpb24.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvenpCSkVBV2E2dDRienpVa0Jka256ay9zYW5kYm94L2t3MUkxRmVHM3dlRTFOU3hIN0ltVmlfMTc3MDM0NDA1NjQ0MV9uYTFmbl9hR1Z5YnkxcGJHeDFjM1J5WVhScGIyNC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=UDsyauA7aUhdqaFczbTby~gaj6ixcHCA-kem4ZbPAwsJV0vJ8DrcJH1BzsD37DZUWswGdIH3UZbmHWn0s0DU1ceTR9fwuaG0mTYg5FQ37a3gBVzhNa66nPyd37HiT1Fm08e36LGK9Z0Q~YiZujHETxK7KDMNw50hsqInpmG~OUh8AHWCg-IHQsLDVOq9NUbm-c9OJQyppOnno9BPEaVtyJtQzRVwk5c2sYOfyuxBypJ48SzUT8uldcvZ7mJhr~e3PmPc51HAeTXpUejg7kPHo504MPGGmD5BW5MJ~A3VNtC-ey8sQSGu5nrVlAyuIsX2l9HK9-dv-9q49K3NydDldw__",
  featureCamera: "https://private-us-east-1.manuscdn.com/sessionFile/zzBJEAWa6t4bzzUkBdknzk/sandbox/kw1I1FeG3weE1NSxH7ImVi_1770344056442_na1fn_ZmVhdHVyZS1jYW1lcmE.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvenpCSkVBV2E2dDRienpVa0Jka256ay9zYW5kYm94L2t3MUkxRmVHM3dlRTFOU3hIN0ltVmlfMTc3MDM0NDA1NjQ0Ml9uYTFmbl9abVZoZEhWeVpTMWpZVzFsY21FLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Q5JpLpT1AZoJIzXZuUUjvmj5-7F8M8il~ntcuKLpJLIEY5sDWap849cNO7PprR2yTZlp-sHnUkMe3sEzASDoaco-nt7fjs9IcwbSwnQKvoB6WlFsNpcY6vdtB4IVuQRHrW1WMacDwEYeD~BihZpHn9SBymSOWS0v87r3fOFtE0FLbKGRxW591HunfpHjItkKlYd8xORZjig5w~3mCNZ~5bmG2G6w1ejmtWYl1upIHzzG0h6vWL8mwOp4ymbNCTXIMmPxiBgmHvOAWAIHLidkRNMXCKKD8dDaVv4d7tKKOUMxyfKL4nhbYGz3iyJ60GrKxP4KS1qicndG7nd9Jxd6yg__",
  featureNutrition: "https://private-us-east-1.manuscdn.com/sessionFile/zzBJEAWa6t4bzzUkBdknzk/sandbox/kw1I1FeG3weE1NSxH7ImVi_1770344056442_na1fn_ZmVhdHVyZS1udXRyaXRpb24.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvenpCSkVBV2E2dDRienpVa0Jka256ay9zYW5kYm94L2t3MUkxRmVHM3dlRTFOU3hIN0ltVmlfMTc3MDM0NDA1NjQ0Ml9uYTFmbl9abVZoZEhWeVpTMXVkWFJ5YVhScGIyNC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=VOmim-fNBnu~eNccIiXAw8cZqWnXCKPI~MLV7jBcPxPK18fj3f7rHA~NMVtHS~EnsD5SabV2klfjvKS3OQZKvt2UWySl7zyZxzsaMpbL~IwuZ52aeIdBWADNfWiUJqOOx8CrvIWE-DGf77nwpuvFNpqp21Q9ZjaaJnJ4lGNr-2Iv3HaHkdDrLFJ3BotPnltlmkjtnb8vtNe8mbwD6n~EHtXwAY5wg2x0Gjhux2WOVQ21qmpxetCKQMGBftY0C-TpVXxekrEdGzGQDPtI8K766wyuLpBtYfto3EU8dcZX2zOjzh5MWPlkbqW3jibYKuU-SQUx5vbdYC~171jBiYIFFg__",
  featureRecommendation: "https://private-us-east-1.manuscdn.com/sessionFile/zzBJEAWa6t4bzzUkBdknzk/sandbox/kw1I1FeG3weE1NSxH7ImVi_1770344056442_na1fn_ZmVhdHVyZS1yZWNvbW1lbmRhdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvenpCSkVBV2E2dDRienpVa0Jka256ay9zYW5kYm94L2t3MUkxRmVHM3dlRTFOU3hIN0ltVmlfMTc3MDM0NDA1NjQ0Ml9uYTFmbl9abVZoZEhWeVpTMXlaV052YlcxbGJtUmhkR2x2YmcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=sSsn0TM7iCMK47Nendq-viYI~PFnQ2LGzKSdoi-qgxf-R0aFwNCFnRSzX8txAj2GvJY~acIKue1WtvE-f9OSmDVKA4yrovOZX9VRMrmc1ju7IJZX4yXTHzmsMxojL9Smoo6-xr9E6nEN-JqcsPvVHGEOUEoNBxd-2WbxSkH4sZabGkWlbFi74mPMjCdz9xoHwZPBw~EZBqoUJ0tf7DhT0hXcdtBg0jj8aNmgA9OPI9vCsfdn5Om7crL0cE9BEgJoEiKvR6kKojIhn-59BJOB3Dljj1Be7AT4ow-aFvmRG8g49Z1HRf1KS~Svg~swtB4Tn3lDGQQ8fATGvZCDma6lcA__",
  logo: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663337256181/erpgTEmjyYjDwKvH.png"
};

const features = [
  {
    image: IMAGES.featureCamera,
    title: "Análise por Foto",
    description: "Tire uma foto da sua refeição e nossa IA identifica automaticamente os alimentos e calcula as informações nutricionais completas.",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    image: IMAGES.featureNutrition,
    title: "Dados Nutricionais",
    description: "Visualize calorias, proteínas, carboidratos, gorduras e micronutrientes de forma clara e detalhada.",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    image: IMAGES.featureRecommendation,
    title: "IA Inteligente",
    description: "Receba recomendações personalizadas para suas próximas refeições baseadas nas suas metas e preferências.",
    color: "from-violet-500/20 to-purple-500/20",
  },
];

const stats = [
  { value: "99%", label: "Precisão na análise" },
  { value: "< 5s", label: "Tempo de resposta" },
  { value: "200+", label: "Alimentos reconhecidos" },
  { value: "24/7", label: "Disponibilidade" },
];

const testimonials = [
  {
    name: "Maria Silva",
    role: "Nutricionista",
    content: "O Equilibra AI revolucionou a forma como acompanho a alimentação dos meus pacientes. A precisão da análise é impressionante!",
    rating: 5,
  },
  {
    name: "João Santos",
    role: "Atleta",
    content: "Uso diariamente para controlar meus macros. A facilidade de apenas tirar uma foto e ter todos os dados é incrível.",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Entusiasta de saúde",
    content: "Finalmente consegui entender o que estou comendo. As recomendações me ajudaram a melhorar minha dieta significativamente.",
    rating: 5,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Tire uma foto",
    description: "Fotografe sua refeição usando a câmera do app",
    icon: Camera,
  },
  {
    step: "02",
    title: "IA analisa",
    description: "Nossa inteligência artificial identifica os alimentos",
    icon: Zap,
  },
  {
    step: "03",
    title: "Veja os dados",
    description: "Receba informações nutricionais completas",
    icon: BarChart3,
  },
  {
    step: "04",
    title: "Alcance metas",
    description: "Acompanhe seu progresso e receba recomendações",
    icon: Heart,
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src={IMAGES.logo} alt="Equilibra AI" className="w-20 h-20 rounded-2xl shadow-lg" />
        </motion.div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-cyan-50/50 overflow-x-hidden">
      {/* Floating Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      }`}>
        <div className="container py-4">
          <nav className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <img src={IMAGES.logo} alt="Equilibra AI" className="w-10 h-10 rounded-xl shadow-md" />
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Equilibra AI
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
              >
                Começar Grátis
              </Button>
            </motion.div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-200/20 to-cyan-200/20 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full text-emerald-700 text-sm font-medium mb-6 shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="h-4 w-4" />
                Tecnologia de ponta em nutrição
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Controle sua{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  alimentação
                </span>{" "}
                com uma simples foto
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Nossa inteligência artificial analisa suas refeições instantaneamente, 
                fornecendo dados nutricionais precisos e recomendações personalizadas.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = getLoginUrl()}
                  className="text-lg px-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all"
                >
                  Começar Agora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-lg px-8 border-2 hover:bg-gray-50"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Como Funciona
                </Button>
              </div>

              {/* Stats mini */}
              <div className="mt-12 flex flex-wrap gap-8 justify-center lg:justify-start">
                {stats.slice(0, 3).map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative"
            >
              <div className="relative z-10">
                <img 
                  src={IMAGES.hero} 
                  alt="Equilibra AI - Análise nutricional por foto" 
                  className="w-full max-w-lg mx-auto drop-shadow-2xl"
                />
              </div>
              
              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-10 -left-4 bg-white rounded-2xl shadow-xl p-4 border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Análise completa</p>
                    <p className="text-xs text-gray-500">Em segundos</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-20 -right-4 bg-white rounded-2xl shadow-xl p-4 border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">450 kcal</p>
                    <p className="text-xs text-gray-500">Detectado</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Simples e Rápido
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Como o Equilibra AI funciona
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Em apenas 4 passos simples, você terá controle total sobre sua alimentação
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all group">
                  <span className="text-6xl font-bold text-gray-100 absolute top-4 right-4 group-hover:text-emerald-100 transition-colors">
                    {item.step}
                  </span>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-300 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-emerald-50/50">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Recursos Poderosos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Tudo que você precisa para uma vida saudável
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden group h-full">
                  <div className={`h-48 bg-gradient-to-br ${feature.color} flex items-center justify-center p-6`}>
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Depoimentos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              O que nossos usuários dizem
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border border-gray-100 shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 p-12 md:p-16"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Comece sua jornada para uma vida mais saudável
              </h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                Junte-se a milhares de pessoas que já estão usando o Equilibra AI 
                para alcançar seus objetivos nutricionais.
              </p>
              <Button 
                size="lg" 
                onClick={() => window.location.href = getLoginUrl()}
                className="text-lg px-10 bg-white text-emerald-600 hover:bg-gray-100 shadow-xl"
              >
                Criar Conta Gratuita
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={IMAGES.logo} alt="Equilibra AI" className="w-10 h-10 rounded-xl" />
              <span className="font-bold text-xl text-white">Equilibra AI</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Termos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contato</a>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Equilibra AI. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
