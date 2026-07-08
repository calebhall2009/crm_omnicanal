import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { backendUrl } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = searchParams.get('token') || '';
    const e = searchParams.get('email') || '';
    setToken(t);
    setEmail(e);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al restablecer la contraseña.');
      }

      setStatus(data.status || 'Tu contraseña ha sido restablecida exitosamente.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0f111a]/80 border border-gray-800/80 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white mb-3">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Crea tu nueva contraseña</h2>
          <p className="text-gray-400 text-xs mt-1">Ingresa tu contraseña y confírmala para completar la recuperación</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-6 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {status && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl mb-6 flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{status}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (readonly or prefilled) */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input
              type="email"
              required
              readOnly
              value={email}
              className="w-full bg-[#141622]/50 border border-gray-800 text-gray-400 rounded-xl py-3 px-4 text-xs focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nueva Contraseña</label>
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
                className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Confirmar Nueva Contraseña</label>
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
                className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-xs transition duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/15"
          >
            {submitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link to="/login" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition">
            <span>Iniciar Sesión</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
