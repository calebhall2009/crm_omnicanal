import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Building2, Users, Target, MessageSquare, AlertCircle } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { completeOnboarding, logout } = useAuth();
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [mainGoal, setMainGoal] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const industries = [
    'E-commerce / Retail',
    'Servicios Financieros',
    'Educación',
    'Salud y Bienestar',
    'Inmobiliaria',
    'Soporte de Software (SaaS)',
    'Turismo / Gastronomía',
    'Otro'
  ];

  const teamSizes = [
    'Solo yo',
    '1 - 5 personas',
    '6 - 15 personas',
    '16 - 50 personas',
    'Más de 50 personas'
  ];

  const goals = [
    'Automatizar soporte con IA (Gemini)',
    'Centralizar chats para agentes humanos',
    'Envío de campañas masivas y marketing',
    'Ventas y CRM'
  ];

  const availableChannels = [
    { id: 'whatsapp', name: 'WhatsApp Business', color: 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-950/10' },
    { id: 'instagram', name: 'Instagram Direct', color: 'border-pink-500/20 hover:border-pink-500/40 text-pink-400 bg-pink-950/10' },
    { id: 'telegram', name: 'Telegram Bot', color: 'border-blue-500/20 hover:border-blue-500/40 text-blue-400 bg-blue-950/10' }
  ];

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName || !industry || !teamSize || selectedChannels.length === 0 || !mainGoal) {
      setError('Por favor completa todos los campos del formulario.');
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        company_name: companyName,
        industry,
        team_size: teamSize,
        channels: selectedChannels,
        main_goal: mainGoal
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar los datos de onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-[#0f111a]/80 border border-gray-800/80 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        {/* Logo & Header */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white mb-3">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Personaliza tu espacio de trabajo</h2>
          <p className="text-gray-400 text-xs mt-1">Paso 2 de 2: Formulario de onboarding</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-6 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Nombre de la Empresa o Proyecto</span>
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mi Empresa S.A.S."
              className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 px-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Industria</label>
              <select
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 px-4 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">Selecciona...</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Team Size */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span>Tamaño del equipo</span>
              </label>
              <select
                required
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 px-4 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">Selecciona...</option>
                {teamSizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Channels Selection */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
              <span>¿Qué canales te gustaría conectar?</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableChannels.map((channel) => {
                const isSelected = selectedChannels.includes(channel.id);
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleChannelToggle(channel.id)}
                    className={`border p-4 rounded-xl flex flex-col items-center justify-center text-center transition ${channel.color} ${
                      isSelected 
                        ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-950/20' 
                        : 'border-gray-800/80 bg-gray-900/30'
                    }`}
                  >
                    <span className="text-xs font-semibold">{channel.name}</span>
                    <span className="text-[9px] text-gray-500 mt-1">
                      {isSelected ? 'Seleccionado' : 'Hacer clic para añadir'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Goal */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Target className="h-3.5 w-3.5 text-indigo-400" />
              <span>¿Cuál es tu objetivo principal?</span>
            </label>
            <select
              required
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 px-4 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">Selecciona...</option>
              {goals.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="button"
              onClick={() => logout()}
              className="flex-1 bg-gray-950 hover:bg-gray-900 text-gray-400 font-semibold py-3.5 rounded-xl text-xs border border-gray-800 transition"
            >
              Salir
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl text-xs transition duration-200 shadow-lg shadow-indigo-600/15"
            >
              {submitting ? 'Guardando...' : 'Finalizar y Entrar al Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
