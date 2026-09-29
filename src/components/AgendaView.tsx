import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Wrench,
  Search,
  Plus,
  Mic,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Navigation,
  Filter
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { useData } from '../context/DataContext';

interface AgendaViewProps {
  onOpenNewAppointment: () => void;
  onOpenVoiceAssistant: () => void;
  onSelectAppointment: (appointment: Appointment) => void;
}

type TabType = 'today' | 'tomorrow' | 'week' | 'month';

export const AgendaView: React.FC<AgendaViewProps> = ({
  onOpenNewAppointment,
  onOpenVoiceAssistant,
  onSelectAppointment,
}) => {
  const { appointments } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dates
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  // Week range
  const next7DaysStr = useMemo(() => {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered & sorted appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(apt => {
        // Tab filter
        if (activeTab === 'today') {
          if (apt.date !== todayStr) return false;
        } else if (activeTab === 'tomorrow') {
          if (apt.date !== tomorrowStr) return false;
        } else if (activeTab === 'week') {
          if (apt.date < todayStr || apt.date > next7DaysStr) return false;
        }
        // 'month' shows current month or upcoming
        else if (activeTab === 'month') {
          const currentMonth = todayStr.substring(0, 7);
          if (!apt.date.startsWith(currentMonth)) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && apt.status !== statusFilter) {
          return false;
        }

        // Search query: Nome do cliente, Local, Tipo de serviço, Data
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchClient = apt.clientName.toLowerCase().includes(q);
          const matchLocation = apt.clientAddress.toLowerCase().includes(q);
          const matchService = apt.serviceTypeName.toLowerCase().includes(q);
          const matchDate = apt.date.includes(q) || apt.date.split('-').reverse().join('/').includes(q);
          if (!matchClient && !matchLocation && !matchService && !matchDate) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Order chronologically by date and time
        const dtA = `${a.date} ${a.time}`;
        const dtB = `${b.date} ${b.time}`;
        return dtA.localeCompare(dtB);
      });
  }, [appointments, activeTab, statusFilter, searchQuery, todayStr, tomorrowStr, next7DaysStr]);

  // Next upcoming appointment for today
  const nextTodayAppointment = useMemo(() => {
    if (activeTab !== 'today') return null;
    const currentTime = now.toTimeString().substring(0, 5);
    return filteredAppointments.find(
      a => a.date === todayStr && a.time >= currentTime && a.status !== 'completed' && a.status !== 'cancelled'
    ) || filteredAppointments.find(a => a.status === 'in_progress');
  }, [filteredAppointments, activeTab, todayStr]);

  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Realizado',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          indicator: 'bg-emerald-500',
        };
      case 'in_progress':
        return {
          label: 'Em andamento',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          indicator: 'bg-amber-500',
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          indicator: 'bg-rose-500',
        };
      default:
        return {
          label: 'Agendado',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          indicator: 'bg-cyan-500',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar: Search, Voice Button, New Appointment */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar cliente, local, serviço ou data..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Gemini Voice Trigger */}
          <button
            type="button"
            onClick={onOpenVoiceAssistant}
            className="flex-1 sm:flex-initial py-2.5 px-3.5 bg-slate-900 hover:bg-slate-850 border border-cyan-500/40 text-cyan-400 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-cyan-500/10 active:scale-[0.98] cursor-pointer"
            title="Comando de Voz Gemini"
          >
            <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Voz Gemini</span>
          </button>

          {/* New Appointment Button */}
          <button
            type="button"
            onClick={onOpenNewAppointment}
            className="flex-1 sm:flex-initial py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Date Period Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'today'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tomorrow')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'tomorrow'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Amanhã
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('week')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'week'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Semana
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('month')}
          className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'month'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mês
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'scheduled', label: 'Agendados' },
          { key: 'in_progress', label: 'Em andamento' },
          { key: 'completed', label: 'Realizados' },
          { key: 'cancelled', label: 'Cancelados' },
        ].map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setStatusFilter(filter.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${
              statusFilter === filter.key
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-transparent text-slate-400 border-slate-800/80 hover:text-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Next Appointment Spotlight (if on Today tab) */}
      {nextTodayAppointment && !searchQuery && statusFilter === 'all' && (
        <div
          onClick={() => onSelectAppointment(nextTodayAppointment)}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/40 shadow-lg cursor-pointer hover:border-cyan-400 transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Próximo Atendimento de Hoje
            </span>
            <span className="text-xs font-mono font-bold text-white bg-cyan-600/30 px-2 py-0.5 rounded-md border border-cyan-500/30">
              {nextTodayAppointment.time}
            </span>
          </div>

          <div className="text-sm font-bold text-white mb-0.5">
            {nextTodayAppointment.serviceTypeName}
          </div>
          <div className="text-xs text-slate-300 font-medium truncate">
            {nextTodayAppointment.clientName} • {nextTodayAppointment.clientAddress}
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-2.5">
        {filteredAppointments.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
            <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">
              Nenhum atendimento encontrado
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Utilize o botão "Novo" ou comando de voz para agendar serviços técnicos.
            </p>
          </div>
        ) : (
          filteredAppointments.map(appointment => {
            const status = getStatusStyle(appointment.status);
            const totalTools = appointment.tools.length;
            const checkedTools = appointment.tools.filter(t => appointment.toolChecklist?.[t]).length;

            return (
              <div
                key={appointment.id}
                onClick={() => onSelectAppointment(appointment)}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99] relative overflow-hidden"
              >
                {/* Left indicator bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${status.indicator}`} />

                <div className="pl-1.5 space-y-2">
                  {/* Top line: Time & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        {appointment.time}
                      </span>
                      {activeTab !== 'today' && (
                        <span className="text-xs text-slate-400 font-medium">
                          {appointment.date.split('-').reverse().join('/')}
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Client & Service */}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">
                      {appointment.clientName}
                    </h3>
                    <div className="text-xs font-medium text-cyan-400">
                      {appointment.serviceTypeName}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{appointment.clientAddress}</span>
                  </div>

                  {/* Bottom Line: Tools count & Arrow */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Wrench className="w-3 h-3 text-slate-500" />
                      <span className="text-[11px]">
                        {checkedTools}/{totalTools} ferramentas
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-cyan-400 font-medium text-[11px]">
                      <span>Detalhes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
