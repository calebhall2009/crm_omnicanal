import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bot, User, LogOut, LayoutDashboard, Users, Kanban, MessageSquare, Layers, Ticket, CreditCard } from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Resumen', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Bandeja Omnicanal', path: '/inbox', icon: MessageSquare },
    { name: 'Tickets Soporte', path: '/tickets', icon: Ticket },
    { name: 'Clientes CRM', path: '/clients', icon: Users },
    { name: 'Embudos (Kanban)', path: '/kanban', icon: Kanban },
    { name: 'Canales', path: '/channels', icon: Layers },
    { name: 'Asistente IA', path: '/ai-assistant', icon: Bot },
    { name: 'Facturación', path: '/billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#090b0f] text-gray-100 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-[#0f111a] border-b border-gray-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition duration-200">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              OmniFlow
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-[#161824] p-1 rounded-xl border border-gray-800/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Status & Actions */}
        <div className="flex items-center space-x-5">
          <div className="hidden sm:flex items-center space-x-3 bg-[#161824] px-3.5 py-1.5 rounded-xl border border-gray-800/60">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="flex items-center space-x-1.5 text-xs text-gray-300">
              <User className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-medium">{user?.name}</span>
              <span className="text-gray-500 font-mono text-[10px] bg-gray-800 px-1.5 py-0.5 rounded uppercase">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 px-3 py-2 rounded-xl transition duration-150 font-medium"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
