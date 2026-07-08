import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Bot,
  MessageSquare,
  Kanban,
  LifeBuoy,
  Sparkles,
  Users,
  Clock,
  Layers
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: string;
  max_users: number;
  max_channels: number;
  max_messages: number;
  sla_first_response_minutes?: number;
}

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeModule, setActiveModule] = useState<'inbox' | 'kanban' | 'dashboard'>('inbox');

  useEffect(() => {
    fetch('http://localhost:8000/api/plans')
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        setLoadingPlans(false);
      })
      .catch((err) => {
        console.error('Error fetching plans:', err);
        setLoadingPlans(false);
      });
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: '¿Qué es ConectaCRM?',
      answer: 'ConectaCRM es una plataforma de gestión omnicanal inteligente que centraliza tus conversaciones de WhatsApp, Instagram y Telegram, integrando embudos de venta Kanban, sistema de tickets con SLA y automatización con Gemini AI.'
    },
    {
      question: '¿Puedo integrar mi propio número de WhatsApp Business?',
      answer: 'Sí. Soportamos la API oficial de WhatsApp Cloud, lo que te permite integrar tu número de negocio oficial de manera segura y sin riesgo de bloqueos.'
    },
    {
      question: '¿Cómo funciona la Inteligencia Artificial de Gemini?',
      answer: 'Conectamos de forma nativa con Gemini 1.5 de Google. La IA lee el contexto de la conversación, consulta tu base de conocimientos configurada y redacta respuestas precisas que tus agentes pueden aprobar o automatizar directamente.'
    },
    {
      question: '¿Cómo funciona el periodo de prueba y la facturación?',
      answer: 'Todos los planes incluyen 14 días de prueba gratuita sin compromiso. Gestionamos cobros de forma transparente a través de Lemon Squeezy (nuestro Merchant of Record), permitiéndote cambiar de plan o cancelar cuando desees.'
    }
  ];

  const formatLimit = (val: number) => (val >= 999 ? 'Ilimitado' : val.toLocaleString());

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#090b0f]/85 backdrop-blur-md border-b border-gray-800/60 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-xl">
        <div className="flex items-center space-x-2.5">
          <div className="bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            ConectaCRM
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-400">
          <a href="#how-it-works" className="hover:text-white transition">Cómo funciona</a>
          <a href="#modules" className="hover:text-white transition">Módulos</a>
          <a href="#pricing" className="hover:text-white transition">Precios</a>
          <a href="#faq" className="hover:text-white transition">Preguntas</a>
        </nav>

        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition">
            Iniciar Sesión
          </Link>
          <Link 
            to="/register" 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/25"
          >
            Empieza Gratis
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-40 max-w-7xl mx-auto text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-3.5 py-1.5 rounded-full mb-8 backdrop-blur-sm shadow-xl">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span>La evolución inteligente del CRM Omnicanal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-none mb-8">
            Conecta tus canales. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Vende y Atiende con IA
            </span>
          </h1>

          <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
            Centraliza WhatsApp, Instagram y Telegram en una sola bandeja. Administra embudos de venta Kanban, resuelve tickets con control de SLA y potencia a tus agentes con Gemini AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5">
            <Link 
              to="/register" 
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold px-8 py-4 rounded-2xl transition duration-200 shadow-2xl shadow-indigo-500/30 flex items-center justify-center space-x-2.5 group text-base"
            >
              <span>Comenzar Prueba de 14 Días</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <a 
              href="#modules" 
              className="w-full sm:w-auto bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-200 font-bold px-8 py-4 rounded-2xl transition duration-200 flex items-center justify-center text-base"
            >
              Explorar Módulos
            </a>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 border-t border-gray-900 bg-gray-950/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">¿Cómo funciona ConectaCRM?</h2>
            <p className="text-gray-400 text-base">Implementa una solución completa de atención y ventas en 3 sencillos pasos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#0f111a] border border-gray-800/80 p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/50 transition duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Conecta tus canales</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Vincula tus cuentas de WhatsApp Business, Instagram Direct y Telegram en segundos sin complicaciones técnicas.
              </p>
            </div>

            <div className="bg-[#0f111a] border border-gray-800/80 p-8 rounded-3xl relative overflow-hidden group hover:border-purple-500/50 transition duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Entrena tu IA con Gemini</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sube tus preguntas frecuentes y reglas de negocio. Gemini AI aprenderá el contexto y asistirá a tus agentes en tiempo real.
              </p>
            </div>

            <div className="bg-[#0f111a] border border-gray-800/80 p-8 rounded-3xl relative overflow-hidden group hover:border-pink-500/50 transition duration-300">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Vende y Resuelve con SLA</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Organiza tratos en tableros Kanban, asigna tickets y supervisa tiempos de respuesta con contadores visuales de SLA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules & Real Screenshots Section */}
      <section id="modules" className="py-24 max-w-7xl mx-auto px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Módulos diseñados para ganar</h2>
          <p className="text-gray-400 text-base">Explora las capturas reales de nuestra interfaz. Construido sin relleno, directo a la productividad.</p>
          
          {/* Module Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setActiveModule('inbox')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                activeModule === 'inbox' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                  : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Bandeja Omnicanal</span>
            </button>

            <button
              onClick={() => setActiveModule('kanban')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                activeModule === 'kanban' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <Kanban className="h-4 w-4" />
              <span>Embudos (Kanban)</span>
            </button>

            <button
              onClick={() => setActiveModule('dashboard')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                activeModule === 'dashboard' 
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' 
                  : 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Dashboard & Tickets SLA</span>
            </button>
          </div>
        </div>

        {/* Real Product Screenshot Display */}
        <div className="bg-[#0c0e17] border border-gray-800/80 rounded-3xl p-3 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 mb-4 px-2">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="text-xs text-gray-500 font-mono ml-4">
                app.conectacrm.io/{activeModule}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400">
              <Shield className="h-4 w-4" />
              <span>Captura Real del Sistema</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-800/60 bg-gray-950/80">
            {activeModule === 'inbox' && (
              <div>
                <img 
                  src="/screenshots/inbox.png" 
                  alt="Bandeja Omnicanal ConectaCRM" 
                  className="w-full h-auto block" 
                />
                <div className="p-6 bg-[#111422] border-t border-gray-800 grid sm:grid-cols-3 gap-4 text-left">
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <MessageSquare className="h-4 w-4 text-indigo-400" />
                      <span>Chats Centralizados</span>
                    </h4>
                    <p className="text-xs text-gray-400">WhatsApp, Instagram y Telegram en tiempo real con filtros por canal y estado.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <Bot className="h-4 w-4 text-purple-400" />
                      <span>Sugerencias Gemini AI</span>
                    </h4>
                    <p className="text-xs text-gray-400">La IA redacta respuestas basadas en el historial para que tus agentes respondan en un clic.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <Users className="h-4 w-4 text-pink-400" />
                      <span>Colaboración en Equipo</span>
                    </h4>
                    <p className="text-xs text-gray-400">Asigna conversaciones, deja notas internas ocultas y transfiere chats sin fricción.</p>
                  </div>
                </div>
              </div>
            )}

            {activeModule === 'kanban' && (
              <div>
                <img 
                  src="/screenshots/kanban.png" 
                  alt="Tablero Kanban ConectaCRM" 
                  className="w-full h-auto block" 
                />
                <div className="p-6 bg-[#111422] border-t border-gray-800 grid sm:grid-cols-3 gap-4 text-left">
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <Kanban className="h-4 w-4 text-purple-400" />
                      <span>Pipelines Personalizados</span>
                    </h4>
                    <p className="text-xs text-gray-400">Crea etapas comerciales a medida y arrastra tarjetas de trato de forma intuitiva.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      <span>Valoración en Tiempo Real</span>
                    </h4>
                    <p className="text-xs text-gray-400">Calcula automáticamente el valor de tu embudo y la probabilidad de cierre en cada columna.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>Historial del Trato</span>
                    </h4>
                    <p className="text-xs text-gray-400">Mantén trazabilidad de cada interacción, cotización o reunión asociada a tu cliente.</p>
                  </div>
                </div>
              </div>
            )}

            {activeModule === 'dashboard' && (
              <div>
                <img 
                  src="/screenshots/dashboard.png" 
                  alt="Dashboard y Tickets ConectaCRM" 
                  className="w-full h-auto block" 
                />
                <div className="p-6 bg-[#111422] border-t border-gray-800 grid sm:grid-cols-3 gap-4 text-left">
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <LifeBuoy className="h-4 w-4 text-pink-400" />
                      <span>Sistema de Tickets y SLA</span>
                    </h4>
                    <p className="text-xs text-gray-400">Semáforo de vencimiento SLA (Verde, Amarillo, Rojo) según el plan contratado por tu cliente.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      <span>Calificación CSAT</span>
                    </h4>
                    <p className="text-xs text-gray-400">Encuestas automáticas al cerrar tickets para medir la satisfacción (1 a 5 estrellas).</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1 flex items-center space-x-1.5">
                      <Layers className="h-4 w-4 text-emerald-400" />
                      <span>Checklist de Onboarding</span>
                    </h4>
                    <p className="text-xs text-gray-400">Guía interactiva in-app para que tu equipo conecte canales y empiece a operar al instante.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-950/40 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Precios transparentes y sincronizados</h2>
            <p className="text-gray-400 text-base">
              Nuestros precios se alimentan en tiempo real de nuestra base de datos. Sin tarifas ocultas. Todos los planes incluyen <strong>14 días de prueba gratis</strong>.
            </p>
          </div>

          {loadingPlans ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="text-sm font-semibold text-gray-400">Cargando planes en tiempo real...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {plans.map((plan) => {
                const isPro = plan.slug === 'pro' || plan.slug === 'crece';
                return (
                  <div 
                    key={plan.id} 
                    className={`bg-[#0f111a] border rounded-3xl p-8 flex flex-col justify-between relative transition duration-300 hover:-translate-y-1 ${
                      isPro ? 'border-indigo-500 shadow-2xl shadow-indigo-500/15' : 'border-gray-800/80 hover:border-gray-700'
                    }`}
                  >
                    {isPro && (
                      <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        Recomendado
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-black text-white mb-2">{plan.name}</h3>
                      <div className="flex items-baseline space-x-1 mb-6">
                        <span className="text-4xl sm:text-5xl font-black text-white">${plan.price}</span>
                        <span className="text-gray-400 text-sm font-semibold">/ mes</span>
                      </div>

                      <hr className="border-gray-800/80 mb-6" />

                      <ul className="space-y-4 mb-8">
                        <li className="flex items-center space-x-3 text-xs text-gray-300 font-semibold">
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span><strong>{formatLimit(plan.max_channels)}</strong> Canales conectados</span>
                        </li>
                        <li className="flex items-center space-x-3 text-xs text-gray-300 font-semibold">
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span><strong>{formatLimit(plan.max_users)}</strong> Usuarios / Agentes</span>
                        </li>
                        <li className="flex items-center space-x-3 text-xs text-gray-300 font-semibold">
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span><strong>{formatLimit(plan.max_messages)}</strong> Mensajes al mes</span>
                        </li>
                        <li className="flex items-center space-x-3 text-xs text-gray-300 font-semibold">
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span>SLA 1ra Respuesta: <strong>{plan.sla_first_response_minutes || 60} min</strong></span>
                        </li>
                        <li className="flex items-center space-x-3 text-xs text-gray-300 font-semibold">
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span>Asistente Gemini AI</span>
                        </li>
                        <li className="flex items-center space-x-3 text-xs text-gray-300 font-semibold">
                          <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span>Tableros Kanban & Tickets</span>
                        </li>
                      </ul>
                    </div>

                    <Link 
                      to={`/register?plan=${plan.slug}`}
                      className={`w-full text-center py-4 rounded-2xl font-bold text-xs transition duration-200 block ${
                        isPro 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/25' 
                          : 'bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800'
                      }`}
                    >
                      Empezar con {plan.name}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Preguntas Frecuentes</h2>
          <p className="text-gray-400 text-base">¿Tienes dudas sobre ConectaCRM? Aquí resolvemos las consultas más habituales.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-[#0f111a]/60 border border-gray-800/80 rounded-2xl overflow-hidden transition duration-200"
            >
              <button 
                onClick={() => toggleFaq(idx)} 
                className="w-full flex items-center justify-between p-6 text-left text-sm sm:text-base font-bold text-white focus:outline-none"
              >
                <span>{faq.question}</span>
                {activeFaq === idx ? (
                  <ChevronUp className="h-5 w-5 text-indigo-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                )}
              </button>
              
              {activeFaq === idx && (
                <div className="px-6 pb-6 text-xs sm:text-sm leading-relaxed text-gray-300 border-t border-gray-800/40 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative bg-gradient-to-b from-[#090b0f] to-[#0c0e17] text-center px-6 border-t border-gray-900">
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            ¿Listo para transformar tu soporte y ventas?
          </h2>
          <p className="text-gray-300 text-base sm:text-lg mb-10 max-w-xl mx-auto">
            Configura tu cuenta en 2 minutos. Comienza hoy mismo tu prueba de 14 días gratis sin ingresar tarjeta de crédito.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center space-x-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold px-10 py-5 rounded-2xl transition duration-200 shadow-2xl shadow-indigo-500/25 text-base"
          >
            <span>Crear Mi Cuenta Gratis</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12 px-6 max-w-7xl mx-auto text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-gray-300">ConectaCRM</span>
        </div>
        <p>&copy; {new Date().getFullYear()} ConectaCRM. Todos los derechos reservados. Desarrollado con Laravel, React y Gemini AI.</p>
        <div className="flex space-x-6 text-gray-400">
          <a href="#how-it-works" className="hover:text-white transition">Cómo funciona</a>
          <a href="#pricing" className="hover:text-white transition">Precios</a>
          <Link to="/login" className="hover:text-white transition">Login</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
