import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  Users, 
  Briefcase, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles 
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price: string;
  max_users: number;
  max_channels: number;
  max_messages: number;
}

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Step wizard state: 1 = Empresa, 2 = Plan, 3 = Dueño
  const [step, setStep] = useState<number>(1);

  // Step 1: Company Info
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('SaaS / Tecnología');
  const [teamSize, setTeamSize] = useState('1 - 5 personas');

  // Step 2: Plan Selection
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>(
    searchParams.get('plan') || 'pro'
  );

  // Step 3: Owner Info & Turnstile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileVerifying, setTurnstileVerifying] = useState(true);
  const [turnstileSuccess, setTurnstileSuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch plans on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/plans')
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        setLoadingPlans(false);
        if (!selectedPlanSlug && data.length > 0) {
          setSelectedPlanSlug(data[0].slug);
        }
      })
      .catch((err) => {
        console.error('Error fetching plans:', err);
        setLoadingPlans(false);
      });
  }, [selectedPlanSlug]);

  // Turnstile simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setTurnstileVerifying(false);
      setTurnstileSuccess(true);
      setTurnstileToken('1x000000000000000000000000000000AA');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1 && !companyName.trim()) {
      setError('Por favor ingresa el nombre de tu empresa.');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!turnstileToken) {
      setError('Por favor completa la verificación de seguridad.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        turnstile_token: turnstileToken,
        company_name: companyName,
        industry,
        team_size: teamSize,
        plan_slug: selectedPlanSlug,
      });
      // Backend marks onboarded = true and assigns plan/trial.
      // Redirect directly to Dashboard to show the interactive OnboardingChecklist!
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al crear tu cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-[#0f111a]/90 border border-gray-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-md">
        {/* Logo & Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <Link to="/" className="flex items-center space-x-2 mb-4 group">
            <div className="bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Bot className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">ConectaCRM</span>
          </Link>
          
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {step === 1 && 'Paso 1: Datos de tu Empresa'}
            {step === 2 && 'Paso 2: Elige tu Plan de Suscripción'}
            {step === 3 && 'Paso 3: Crea tu Usuario Dueño'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {step === 1 && 'Cuéntanos un poco sobre tu organización para personalizar tu experiencia.'}
            {step === 2 && 'Todos los planes incluyen 14 días de prueba gratis. Sin tarjeta de crédito.'}
            {step === 3 && 'Tus credenciales de administrador para ingresar al sistema.'}
          </p>
        </div>

        {/* Wizard Progress Bar */}
        <div className="flex items-center justify-between mb-8 max-w-xs mx-auto">
          {[1, 2, 3].map((item) => (
            <React.Fragment key={item}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  step === item 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-110' 
                    : step > item 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-800 text-gray-500'
                }`}
              >
                {step > item ? <Check className="h-4 w-4" /> : item}
              </div>
              {item < 3 && (
                <div 
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors duration-300 ${
                    step > item ? 'bg-emerald-500' : 'bg-gray-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-2xl mb-6 flex items-start space-x-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: COMPANY DATA */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Nombre de la Empresa</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. Acme Corporation"
                  className="w-full bg-[#141622] border border-gray-800 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Industria / Sector</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Briefcase className="h-4 w-4" />
                </div>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-[#141622] border border-gray-800 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="SaaS / Tecnología">SaaS / Tecnología</option>
                  <option value="E-commerce / Retail">E-commerce / Retail</option>
                  <option value="Servicios Profesionales">Servicios Profesionales</option>
                  <option value="Educación / Academias">Educación / Academias</option>
                  <option value="Salud / Clínicas">Salud / Clínicas</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Tamaño del Equipo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Users className="h-4 w-4" />
                </div>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full bg-[#141622] border border-gray-800 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="1 - 5 personas">1 - 5 personas</option>
                  <option value="6 - 15 personas">6 - 15 personas</option>
                  <option value="16 - 50 personas">16 - 50 personas</option>
                  <option value="50+ personas">50+ personas</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl text-sm transition duration-200 shadow-xl shadow-indigo-600/20 flex items-center justify-center space-x-2 mt-6"
            >
              <span>Siguiente: Elegir Plan</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STEP 2: PLAN SELECTION */}
        {step === 2 && (
          <div className="space-y-6">
            {loadingPlans ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="text-xs text-gray-400 font-medium">Cargando planes disponibles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {plans.map((plan) => {
                  const isSelected = selectedPlanSlug === plan.slug;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanSlug(plan.slug)}
                      className={`cursor-pointer rounded-2xl p-4 border transition duration-200 flex flex-col justify-between relative ${
                        isSelected 
                          ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20' 
                          : 'bg-[#141622]/60 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-sm mb-1">{plan.name}</h4>
                        <div className="text-xl font-black text-indigo-400 mb-2">${plan.price}<span className="text-[10px] text-gray-400 font-normal">/mes</span></div>
                        <ul className="text-[11px] text-gray-300 space-y-1">
                          <li>• {plan.max_users >= 999 ? 'Ilimitados' : plan.max_users} Agentes</li>
                          <li>• {plan.max_channels >= 999 ? 'Ilimitados' : plan.max_channels} Canales</li>
                          <li>• Gemini AI + SLA</li>
                        </ul>
                      </div>
                      <div className="mt-3 text-[10px] font-bold text-center py-1 rounded bg-gray-900/80 text-gray-400">
                        14 Días Gratis
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-1/3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold py-3.5 rounded-2xl text-xs transition flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
              >
                <span>Siguiente: Datos del Dueño</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OWNER USER INFO */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full bg-[#141622] border border-gray-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Correo Electrónico de Trabajo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@empresa.com"
                  className="w-full bg-[#141622] border border-gray-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#141622] border border-gray-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Confirmar Contraseña</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#141622] border border-gray-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Turnstile verification simulation widget */}
            <div className="bg-[#141622] border border-gray-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <input 
                  type="checkbox" 
                  checked={turnstileSuccess} 
                  readOnly 
                  className="h-4 w-4 rounded border-gray-800 bg-[#0d0f14] text-indigo-600 focus:ring-indigo-500" 
                />
                <span className="text-xs font-semibold text-gray-300">No soy un robot</span>
              </div>
              
              <div className="flex flex-col items-end">
                {turnstileVerifying ? (
                  <div className="flex items-center space-x-1.5 text-gray-500">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-t border-b border-gray-400"></div>
                    <span className="text-[10px]">Verificando...</span>
                  </div>
                ) : turnstileSuccess ? (
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Turnstile OK</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-500">Cloudflare Turnstile</span>
                )}
                <span className="text-[8px] text-gray-600 font-mono mt-0.5">turnstile.cloudflare</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="w-1/3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 font-bold py-4 rounded-2xl text-xs transition flex items-center justify-center space-x-1 disabled:opacity-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Atrás</span>
              </button>
              <button
                type="submit"
                disabled={submitting || turnstileVerifying}
                className="w-2/3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold py-4 rounded-2xl text-xs transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <span>Creando tu cuenta...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Crear Cuenta e Iniciar Prueba</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-gray-500 mt-8 border-t border-gray-800/60 pt-4">
          ¿Ya tienes una cuenta en ConectaCRM?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition font-bold">
            Inicia Sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
