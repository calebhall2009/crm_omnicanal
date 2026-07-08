import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  Plug, 
  Users, 
  Kanban, 
  Sparkles, 
  X, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OnboardingChecklist: React.FC = () => {
  const { user } = useAuth();
  const [closed, setClosed] = useState(false);
  
  // Track completed steps in localStorage per company/user
  const storageKey = `onboarding_steps_${user?.company?.id || 'default'}`;
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const isClosed = localStorage.getItem(`onboarding_closed_${user?.company?.id || 'default'}`);
    if (isClosed === 'true') {
      setClosed(true);
    }
  }, [user]);

  const toggleStep = (stepId: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const handleClose = () => {
    setClosed(true);
    localStorage.setItem(`onboarding_closed_${user?.company?.id || 'default'}`, 'true');
  };

  if (closed) return null;

  const steps = [
    {
      id: 1,
      title: 'Conectar tu primer canal',
      description: 'Vincula WhatsApp, Instagram o Telegram para empezar a recibir mensajes.',
      icon: Plug,
      link: '/channels',
      cta: 'Conectar Canales',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 2,
      title: 'Invitar a un compañero de equipo',
      description: 'Suma agentes a tu cuenta para colaborar en la atención omnicanal.',
      icon: Users,
      link: '/clients',
      cta: 'Ver Equipo',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 3,
      title: 'Crear tu primer pipeline comercial',
      description: 'Organiza tus embudos de venta en el tablero Kanban interactivio.',
      icon: Kanban,
      link: '/kanban',
      cta: 'Ir al Kanban',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ];

  const progressPercentage = Math.round((completedSteps.length / steps.length) * 100);

  return (
    <div className="bg-gradient-to-r from-[#121524] via-[#181c32] to-[#151226] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Background glow */}
      <div className="absolute top-0 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-start justify-between relative z-10 mb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Guía de Inicio Rápido</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ¡Bienvenido a ConectaCRM, {user?.name}!
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            Completa estos tres pasos para configurar tu espacio de trabajo de <strong className="text-white">{user?.company?.name}</strong> y sacarle el máximo provecho a la inteligencia artificial.
          </p>
        </div>

        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800/60 transition"
          title="Descartar checklist"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mb-6">
        <div className="flex justify-between items-center text-xs font-bold mb-2">
          <span className="text-gray-300">Progreso de configuración</span>
          <span className="text-indigo-400">{completedSteps.length} de {steps.length} completados ({progressPercentage}%)</span>
        </div>
        <div className="w-full bg-gray-900/80 h-2.5 rounded-full overflow-hidden border border-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {steps.map((step) => {
          const isDone = completedSteps.includes(step.id);
          const IconComponent = step.icon;
          return (
            <div 
              key={step.id}
              className={`bg-[#0d0f17]/80 border rounded-2xl p-5 flex flex-col justify-between transition duration-200 ${
                isDone 
                  ? 'border-emerald-500/40 bg-emerald-950/10' 
                  : 'border-gray-800/80 hover:border-indigo-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${step.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <button 
                    onClick={() => toggleStep(step.id)}
                    className="text-gray-400 hover:text-white focus:outline-none transition"
                    title={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400 fill-emerald-950" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-600 hover:text-indigo-400" />
                    )}
                  </button>
                </div>
                <h3 className={`text-sm font-bold mb-1.5 ${isDone ? 'text-gray-300 line-through decoration-gray-500' : 'text-white'}`}>
                  {step.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  {step.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-800/60 mt-2">
                <Link 
                  to={step.link}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 group transition"
                >
                  <span>{step.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {isDone && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Listo
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
