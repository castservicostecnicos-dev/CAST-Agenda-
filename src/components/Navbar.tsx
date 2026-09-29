import React from 'react';
import { Shield, LogOut, Wifi, WifiOff, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { appLogo } from '../assets/logo';

interface NavbarProps {
  onOpenVoice: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVoice }) => {
  const { user, activeDashboard, switchDashboard, logout } = useAuth();
  const { isOnline } = useData();

  if (!user) return null;

  const isMaster = user.role === 'master';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 shadow-md shadow-cyan-950/40 bg-slate-900">
              <img src={appLogo} alt="CAST Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                CAST <span className="text-cyan-400 font-semibold text-xs">Técnicos</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-none">
                {user.name.split(' ')[0]} ({user.role === 'master' ? 'Master' : 'Técnico'})
              </div>
            </div>
          </div>

          {/* Master Switcher Toggle */}
          {isMaster && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => switchDashboard('master')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeDashboard === 'master'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dashboard Administrativa Master"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">MASTER</span>
              </button>

              <button
                type="button"
                onClick={() => switchDashboard('technician')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeDashboard === 'technician'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dashboard Operacional de Usuário / Técnico"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">TÉCNICO</span>
              </button>
            </div>
          )}

          {/* Right actions: Online Status, Logout */}
          <div className="flex items-center gap-2">
            {/* Connectivity */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                isOnline
                  ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                  : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
              }`}
              title={isOnline ? 'Sincronizado na nuvem (Firebase)' : 'Modo local offline'}
            >
              {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              <span className="hidden sm:inline">{isOnline ? 'Nuvem' : 'Offline'}</span>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Sair do aplicativo"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
