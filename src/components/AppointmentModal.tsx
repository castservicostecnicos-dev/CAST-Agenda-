import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Wrench, Bell, AlertCircle, Plus, Phone, Edit2 } from 'lucide-react';
import { Appointment, ServiceType, Client } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ConflictWarningDialog } from './ConflictWarningDialog';
import { ServiceModal } from './ServiceModal';

interface AppointmentModalProps {
  initialAppointment?: Appointment | null;
  defaultDate?: string;
  onClose: () => void;
  onSaved: (appointment: Appointment) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  initialAppointment,
  defaultDate,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const {
    services,
    clients,
    checkTimeConflict,
    createAppointment,
    updateAppointment,
    createOrUpdateClient,
  } = useData();

  // Selected client or free input
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState(initialAppointment?.clientName || '');
  const [clientAddress, setClientAddress] = useState(initialAppointment?.clientAddress || '');
  const [clientPhone, setClientPhone] = useState(initialAppointment?.clientPhone || '');

  // Service Type
  const [serviceTypeId, setServiceTypeId] = useState(initialAppointment?.serviceTypeId || (services[0]?.id || ''));
  const [selectedService, setSelectedService] = useState<ServiceType | undefined>(() => {
    return services.find(s => s.id === (initialAppointment?.serviceTypeId || services[0]?.id));
  });

  // Date & Time
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialAppointment?.date || defaultDate || today);
  const [time, setTime] = useState(initialAppointment?.time || '08:00');

  // Notes & Reminders
  const [notes, setNotes] = useState(initialAppointment?.notes || '');
  const [reminderMinutes, setReminderMinutes] = useState<number>(initialAppointment?.reminderMinutes ?? 30);

  // Validation & Conflict
  const [formError, setFormError] = useState('');
  const [conflictingAppointment, setConflictingAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Service Management Modal State (Create new service or edit selected service on the fly)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceType | null>(null);

  // Sync service changes
  useEffect(() => {
    const s = services.find(item => item.id === serviceTypeId) || services[0];
    setSelectedService(s);
    if (!serviceTypeId && s) {
      setServiceTypeId(s.id);
    }
  }, [serviceTypeId, services]);

  // When picking existing client, auto-fill address and phone
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;

    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientAddress(found.address);
      setClientPhone(found.phone || '');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent, forceSave = false) => {
    e.preventDefault();
    setFormError('');

    if (!clientName.trim()) {
      setFormError('Informe o nome do cliente.');
      return;
    }
    if (!clientAddress.trim()) {
      setFormError('Informe o local/endereço do atendimento.');
      return;
    }
    if (!serviceTypeId || !selectedService) {
      setFormError('Selecione o tipo de serviço.');
      return;
    }
    if (!date) {
      setFormError('Informe a data do atendimento.');
      return;
    }
    if (!time) {
      setFormError('Informe o horário do atendimento.');
      return;
    }

    // Check conflict unless forceSave is true
    if (!forceSave) {
      const conflict = checkTimeConflict(date, time, initialAppointment?.id);
      if (conflict) {
        setConflictingAppointment(conflict);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (initialAppointment) {
        const updated: Appointment = {
          ...initialAppointment,
          clientName: clientName.trim(),
          clientAddress: clientAddress.trim(),
          clientPhone: clientPhone.trim(),
          serviceTypeId: selectedService.id,
          serviceTypeName: selectedService.name,
          date,
          time,
          notes: notes.trim(),
          reminderMinutes,
          tools: selectedService.tools,
        };
        await updateAppointment(updated);
        onSaved(updated);
      } else {
        const created = await createAppointment({
          clientName: clientName.trim(),
          clientAddress: clientAddress.trim(),
          clientPhone: clientPhone.trim(),
          serviceTypeId: selectedService.id,
          serviceTypeName: selectedService.name,
          date,
          time,
          status: 'scheduled',
          notes: notes.trim(),
          tools: selectedService.tools,
          reminderMinutes,
          createdBy: user?.id || 'master',
        });
        onSaved(created);
      }
    } catch (err: any) {
      setFormError('Erro ao salvar o atendimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-white text-base">
                {initialAppointment ? 'Editar Atendimento' : 'Novo Atendimento'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={(e) => handleFormSubmit(e, false)} className="p-5 overflow-y-auto space-y-4">
            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Client Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Cliente *
                </label>
                {clients.length > 0 && (
                  <span className="text-[11px] text-cyan-400">
                    Sugerir cliente existente
                  </span>
                )}
              </div>

              {clients.length > 0 && (
                <div className="mb-2">
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Selecionar ou digitar novo cliente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.address.split('-')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (selectedClientId) setSelectedClientId('');
                  }}
                  placeholder="Nome completo do cliente"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Local do Atendimento *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Telefone / WhatsApp (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Service Type */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                  Tipo de Serviço *
                </label>
                <div className="flex items-center gap-1.5">
                  {selectedService && (
                    <button
                      type="button"
                      onClick={() => {
                        setServiceToEdit(selectedService);
                        setIsServiceModalOpen(true);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800"
                      title="Editar todos os dados deste serviço"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar serviço</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setServiceToEdit(null);
                      setIsServiceModalOpen(true);
                    }}
                    className="text-[11px] text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors bg-cyan-950/60 hover:bg-cyan-900/70 px-2 py-0.5 rounded-lg border border-cyan-700/50"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Novo Serviço</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={serviceTypeId}
                  onChange={(e) => setServiceTypeId(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                >
                  {services.length === 0 && (
                    <option value="">Nenhum serviço cadastrado ainda</option>
                  )}
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.basePrice ? `• R$ ${s.basePrice.toFixed(2)}` : ''}
                    </option>
                  ))}
                </select>

                {selectedService && (
                  <button
                    type="button"
                    onClick={() => {
                      setServiceToEdit(selectedService);
                      setIsServiceModalOpen(true);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer shrink-0"
                    title="Editar dados e ferramentas deste serviço"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setServiceToEdit(null);
                    setIsServiceModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-colors cursor-pointer shrink-0 shadow-sm shadow-cyan-950/40"
                  title="Cadastrar um novo tipo de serviço agora"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Automatic Tools Preview */}
              {selectedService && selectedService.tools.length > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-400 mb-2">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Ferramentas vinculadas automaticamente ({selectedService.tools.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {selectedService.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[11px] border border-slate-700/50"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Data *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Horário *
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Reminder Config */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Lembrete de Atendimento
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: 0, label: 'Desativado' },
                  { value: 15, label: '15 min' },
                  { value: 30, label: '30 min' },
                  { value: 60, label: '1 hora' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setReminderMinutes(item.value)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      reminderMinutes === item.value
                        ? 'bg-cyan-600 text-white border border-cyan-400/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Observações
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais, interfone, instruções de acesso..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-cyan-600/20 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Atendimento'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Conflict Warning Dialog if applicable */}
      {conflictingAppointment && (
        <ConflictWarningDialog
          conflictingAppointment={conflictingAppointment}
          onBackAndChange={() => setConflictingAppointment(null)}
          onContinueAnyway={() => {
            setConflictingAppointment(null);
            handleFormSubmit({ preventDefault: () => {} } as any, true);
          }}
        />
      )}

      {/* Service Modal (Create new service or edit selected service on the fly) */}
      {isServiceModalOpen && (
        <ServiceModal
          serviceToEdit={serviceToEdit}
          onClose={() => {
            setIsServiceModalOpen(false);
            setServiceToEdit(null);
          }}
          onSaved={(savedService) => {
            setServiceTypeId(savedService.id);
            setSelectedService(savedService);
            setIsServiceModalOpen(false);
            setServiceToEdit(null);
          }}
        />
      )}
    </>
  );
};
