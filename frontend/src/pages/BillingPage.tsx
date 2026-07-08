import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, MessageSquare, ExternalLink } from 'lucide-react';

interface BillingInfo {
  status: 'free_trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  trial_days_left: number;
  plan: {
    name: string;
    slug: string;
    price: number;
    max_users: number;
    max_channels: number;
    max_messages: number;
  };
  portal_url: string | null;
  next_billing_date: string | null;
}

export const BillingPage: React.FC = () => {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

  const fetchBillingInfo = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/billing/info`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setBilling(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planSlug: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan_slug: planSlug })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error generando checkout');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  if (loading || !billing) {
    return (
      <div className="flex-1 p-8 text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
        Cargando información de facturación...
      </div>
    );
  }

  const { status, trial_days_left, plan, portal_url, next_billing_date } = billing;

  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'free_trial': return 'bg-indigo-950 text-indigo-400 border-indigo-800';
      case 'past_due': return 'bg-red-950 text-red-400 border-red-800';
      case 'expired': return 'bg-red-950 text-red-400 border-red-800';
      case 'cancelled': return 'bg-yellow-950 text-yellow-400 border-yellow-800';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'active': return 'Suscripción Activa';
      case 'free_trial': return `Periodo de Prueba (${trial_days_left} días restantes)`;
      case 'past_due': return 'Pago Atrasado';
      case 'expired': return 'Prueba Expirada';
      case 'cancelled': return 'Cancelada (En gracia)';
      default: return status;
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-[#161824] p-6 rounded-2xl border border-gray-800/80">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-indigo-400" />
                Facturación y Plan
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Gestiona tu suscripción, métodos de pago y límites de uso.
              </p>
            </div>
            {portal_url && (
              <a href={portal_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition">
                Portal de Facturas <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Current Plan Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#161824] p-6 rounded-2xl border border-gray-800/80 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Plan Actual</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor()}`}>
                  {getStatusLabel()}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-white mb-1">{plan.name}</p>
              <p className="text-gray-400 text-sm mb-2">${plan.price} / mes</p>
              {next_billing_date && (
                <p className="text-xs text-slate-400 mb-6">Próximo cobro: {new Date(next_billing_date).toLocaleDateString()}</p>
              )}
            </div>

            {(status === 'free_trial' || status === 'expired' || status === 'past_due') && (
              <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl">
                <p className="text-sm text-indigo-300 mb-3">
                  {status === 'expired' 
                    ? 'Tu periodo de prueba ha terminado. Actualiza tu plan para seguir usando OmniFlow.' 
                    : 'Actualiza ahora para no perder acceso a tus clientes cuando termine la prueba.'}
                </p>
                <button 
                  onClick={() => handleCheckout(plan.slug)}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition"
                >
                  Mejorar Plan Ahora
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#161824] p-6 rounded-2xl border border-gray-800/80">
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Uso de Recursos</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400"/> IA & Automatizaciones</span>
                  <span className="text-gray-400 font-medium">0 / {plan.max_messages === 999999 ? 'Ilimitado' : plan.max_messages}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-400"/> Canales Conectados</span>
                  <span className="text-gray-400 font-medium">1 / {plan.max_channels}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(1/plan.max_channels)*100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
