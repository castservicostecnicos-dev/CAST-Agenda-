import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Wrench,
  CheckSquare,
  Square,
  Navigation,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';
import { useData } from '../context/DataContext';

interface AppointmentDetailModalProps {
  appointment: Appointment;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onDeleted: () => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  onClose,
  onEdit,
  onDeleted,
}) => {
  const { toggleToolCheck, updateAppointmentStatus, deleteAppointment } = useData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Tools stats
  const totalTools = appointment.tools.length;
  const checkedToolsCount = appointment.tools.filter(t => appointment.toolChecklist?.[t]).length;
  const isAllChecked = totalTools > 0 && checkedToolsCount === totalTools;

  const handleStatusChange = async (status: AppointmentStatus) => {
    await updateAppointmentStatus(appointment.id, status);
  };

  const handleDelete = async () => {
    await deleteAppointment(appointment.id);
    onDeleted();
  };

  const openNavigation = () => {
    const encoded = encodeURIComponent(appointment.clientAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const openWhatsApp = () => {
    if (!appointment.clientPhone) return;
    const cleanPhone = appointment.clientPhone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${appointment.clientName}, aqui é da CAST Serviços Técnicos referente ao seu atendimento de ${appointment.serviceTypeName}.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return { label: 'Realizado', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'in_progress':
        return { label: 'Em andamento', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'cancelled':
        return { label: 'Cancelado', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      default:
        return { label: 'Agendado', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    }
  };

  const statusBadge = getStatusBadge(appointment.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {appointment.time}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Editar atendimento"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Excluir atendimento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Info Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Serviço Técnico
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {appointment.serviceTypeName}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{appointment.date.split('-').reverse().join('/')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono font-medium">{appointment.time}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-xs">
              <div className="flex items-start gap-2 text-slate-300 font-semibold">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="text-sm text-white">{appointment.clientName}</span>
              </div>

              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{appointment.clientAddress}</span>
              </div>
            </div>

            {/* Quick Actions (Maps, WhatsApp, Phone) */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={openNavigation}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Rotas (Maps)</span>
              </button>

              {appointment.clientPhone && (
                <>
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <a
                    href={`tel:${appointment.clientPhone.replace(/\D/g, '')}`}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-center transition-colors"
                    title="Ligar para o cliente"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Status Alteration Buttons */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
              Status do Atendimento
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('scheduled')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  appointment.status === 'scheduled'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Agendado
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('in_progress')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  appointment.status === 'in_progress'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Em andamento
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('completed')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  appointment.status === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Realizado
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('cancelled')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                  appointment.status === 'cancelled'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Cancelado
              </button>
            </div>
          </div>

          {/* Observations */}
          {appointment.notes && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Observações:</span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}

          {/* FERRAMENTAS NECESSÁRIAS & CHECKLIST */}
          <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  Ferramentas Necessárias
                </h3>
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                  isAllChecked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {checkedToolsCount}/{totalTools} prontas
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  isAllChecked ? 'bg-emerald-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${totalTools > 0 ? (checkedToolsCount / totalTools) * 100 : 0}%` }}
              />
            </div>

            {/* Tool Checkbox List */}
            {appointment.tools.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Nenhuma ferramenta cadastrada para este tipo de serviço.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {appointment.tools.map((tool, idx) => {
                  const isChecked = !!appointment.toolChecklist?.[tool];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleToolCheck(appointment.id, tool)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className={isChecked ? 'line-through text-slate-400' : 'font-medium'}>
                        {tool}
                      </span>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Excluir Atendimento</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Tem certeza que deseja excluir o atendimento de {appointment.clientName}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
