import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { AgendaView } from './components/AgendaView';
import { MasterDashboard } from './components/MasterDashboard';
import { ClientsView } from './components/ClientsView';
import { ServiceTypesView } from './components/ServiceTypesView';
import { AppointmentModal } from './components/AppointmentModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { Appointment, Client } from './types';
import { Calendar, Users, Wrench, Plus, Mic, ArrowLeft, Shield } from 'lucide-react';

type TechTab = 'agenda' | 'clients' | 'services';

const MainLayout: React.FC = () => {
  const { user, activeDashboard, switchDashboard } = useAuth();
  const [techTab, setTechTab] = useState<TechTab>('agenda');

  // Modals state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  // If user is not logged in, render the login screen
  if (!user) {
    return <LoginScreen />;
  }

  const isMaster = user.role === 'master';

  const handleOpenNewAppointment = () => {
    setEditingAppointment(null);
    setIsAppointmentModalOpen(true);
  };

  const handleScheduleForClient = (client: Client) => {
    // Open new appointment with client prefilled
    setEditingAppointment({
      id: '',
      clientName: client.name,
      clientAddress: client.address,
      clientPhone: client.phone || '',
      serviceTypeId: '',
      serviceTypeName: '',
      date: new Date().toISOString().split('T')[0],
      time: '08:00',
      status: 'scheduled',
      tools: [],
      toolChecklist: {},
      reminderMinutes: 30,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    });
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentSaved = (saved: Appointment) => {
    setIsAppointmentModalOpen(false);
    setSelectedAppointment(saved);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 sm:pb-8">
      {/* Top Navbar */}
      <Navbar onOpenVoice={() => setIsVoiceOpen(true)} />

      {/* Master Mode Switch Return Banner (When Master is inside Technician Dashboard) */}
      {isMaster && activeDashboard === 'technician' && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 border-b border-blue-700/50 py-2 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-200">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Você está navegando na <strong>Dashboard de Usuário</strong> (Operacional).</span>
            </div>
            <button
              type="button"
              onClick={() => switchDashboard('master')}
              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Dashboard Master</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3.5 sm:p-6">
        {isMaster && activeDashboard === 'master' ? (
          <MasterDashboard />
        ) : (
          <div>
            {techTab === 'agenda' && (
              <AgendaView
                onOpenNewAppointment={handleOpenNewAppointment}
                onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
                onSelectAppointment={(apt) => setSelectedAppointment(apt)}
              />
            )}

            {techTab === 'clients' && (
              <ClientsView onScheduleForClient={handleScheduleForClient} />
            )}

            {techTab === 'services' && (
              <ServiceTypesView />
            )}
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation (Technician view) */}
      {activeDashboard === 'technician' && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around sm:hidden">
          <button
            type="button"
            onClick={() => setTechTab('agenda')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              techTab === 'agenda'
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span>Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setTechTab('clients')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              techTab === 'clients'
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Clientes</span>
          </button>

          {/* Center Prominent New Appointment Button */}
          <button
            type="button"
            onClick={handleOpenNewAppointment}
            className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30 border-2 border-slate-900 active:scale-95 transition-all cursor-pointer"
            title="Novo Atendimento"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => setTechTab('services')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              techTab === 'services'
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span>Serviços</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <Mic className="w-5 h-5 mb-0.5 text-cyan-400" />
            <span>Voz Gemini</span>
          </button>
        </nav>
      )}

      {/* Floating Action Button on Desktop for Quick Voice */}
      <button
        type="button"
        onClick={() => setIsVoiceOpen(true)}
        className="fixed bottom-6 right-6 z-30 hidden sm:flex items-center gap-2 py-3 px-4 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-xl shadow-cyan-600/25 active:scale-95 transition-all cursor-pointer border border-cyan-400/30"
        title="Assistente de Voz Gemini"
      >
        <Mic className="w-4 h-4 animate-pulse" />
        <span>Comando de Voz</span>
      </button>

      {/* Create / Edit Appointment Modal */}
      {isAppointmentModalOpen && (
        <AppointmentModal
          initialAppointment={editingAppointment}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setEditingAppointment(null);
          }}
          onSaved={handleAppointmentSaved}
        />
      )}

      {/* Appointment Details & Checklist Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={(apt) => {
            setSelectedAppointment(null);
            setEditingAppointment(apt);
            setIsAppointmentModalOpen(true);
          }}
          onDeleted={() => setSelectedAppointment(null)}
        />
      )}

      {/* Gemini Voice Assistant Modal */}
      {isVoiceOpen && (
        <VoiceAssistantModal
          onClose={() => setIsVoiceOpen(false)}
          onAppointmentCreated={(created) => {
            setIsVoiceOpen(false);
            setSelectedAppointment(created);
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}
