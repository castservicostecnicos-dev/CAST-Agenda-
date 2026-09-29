import React from 'react';
import { AlertTriangle, Clock, MapPin, User } from 'lucide-react';
import { Appointment } from '../types';

interface ConflictWarningDialogProps {
  conflictingAppointment: Appointment;
  onBackAndChange: () => void;
  onContinueAnyway: () => void;
}

export const ConflictWarningDialog: React.FC<ConflictWarningDialogProps> = ({
  conflictingAppointment,
  onBackAndChange,
  onContinueAnyway,
}) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-400 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">
              Conflito de Horário
            </h3>
            <p className="text-xs text-amber-400/90 font-medium">
              Já existe um atendimento agendado para este horário.
            </p>
          </div>
        </div>

        {/* Existing appointment snapshot */}
        <div className="my-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{conflictingAppointment.time} - {conflictingAppointment.serviceTypeName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{conflictingAppointment.clientName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{conflictingAppointment.clientAddress}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={onBackAndChange}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Voltar e alterar o horário
          </button>
          
          <button
            type="button"
            onClick={onContinueAnyway}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            Continuar mesmo assim
          </button>
        </div>
      </div>
    </div>
  );
};
