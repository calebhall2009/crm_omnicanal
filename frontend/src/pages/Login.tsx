import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, backendUrl } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 2FA challenge state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (show2FA) {
        // Submit 2FA code to Fortify 2FA challenge endpoint
        const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        const xsrfToken = xsrf ? decodeURIComponent(xsrf[1]) : '';
        const body = useRecovery
          ? { recovery_code: recoveryCode }
          : { code: twoFactorCode };

        const res = await fetch(`${backendUrl}/two-factor-challenge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Código de seguridad incorrecto.');
        }

        // Let AuthContext refresh and React Router handle the navigation.
        navigate('/dashboard', { replace: true });
      } else {
        // Standard credentials login
        await login({ email, password });
        // Use React Router navigation so the SPA does not full-reload.
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error(err);

      // Check if Fortify requires 2FA challenge
      if (err.message && (err.message.includes('two_factor') || err.message.includes('Two factor'))) {
        setShow2FA(true);
      } else {
        setError(err.message || 'Credenciales incorrectas o problema de red.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0f111a]/80 border border-gray-800/80 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white mb-3">
            <Bot className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {show2FA ? 'Verificación de Seguridad' : 'Iniciar Sesión'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {show2FA 
              ? 'Ingresa el código generado en tu aplicación de autenticación' 
              : 'Bienvenido de nuevo a OmniFlow'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-6 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!show2FA ? (
            <>
              {/* Email Field */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
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
                    className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contraseña</label>
                  <Link to="/forgot-password" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition">
                    ¿La olvidaste?
                  </Link>
                </div>
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
            </>
          ) : (
            <>
              {/* 2FA Input Field */}
              {!useRecovery ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Código de Autenticación (6 dígitos)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 tracking-[0.3em] font-mono transition text-center"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Código de Recuperación</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="abcdef-123456"
                    className="w-full bg-[#141622] border border-gray-800 rounded-xl py-3 px-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono transition"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setUseRecovery(!useRecovery)}
                className="text-[10px] text-gray-500 hover:text-indigo-400 transition underline block w-full text-center"
              >
                {useRecovery ? 'Usar código de autenticación de App' : 'Usar código de recuperación de emergencia'}
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-xs transition duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/15"
          >
            {submitting 
              ? 'Procesando...' 
              : show2FA 
                ? 'Verificar Código' 
                : 'Iniciar Sesión'
            }
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition font-medium">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
