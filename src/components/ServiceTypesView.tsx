import React, { useState } from 'react';
import {
  Wrench,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ServiceType } from '../types';
import { ServiceModal } from './ServiceModal';

export const ServiceTypesView: React.FC = () => {
  const { services, deleteServiceType } = useData();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceType | null>(null);

  // Delete confirm state
  const [serviceToDelete, setServiceToDelete] = useState<ServiceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
    s.tools.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: ServiceType, e: React.MouseEvent) => {
    e.stopPropagation();
    setServiceToEdit(service);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteServiceType(serviceToDelete.id);
      setServiceToDelete(null);
    } catch (err) {
      console.error('Error deleting service:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (mins?: number) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {/* Top Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>Catálogo de Serviços Técnicos</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {services.length} serviços cadastrados com ferramentas e checklist automático
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-950/50 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Cadastrar Novo Serviço</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar serviços, procedimentos ou ferramentas necessárias..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
            <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">
              Nenhum serviço encontrado
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {search ? 'Tente outros termos de busca' : 'Comece cadastrando seu primeiro serviço técnico'}
            </p>
            {!search && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                + Cadastrar Serviço
              </button>
            )}
          </div>
        ) : (
          filtered.map(service => {
            const isExpanded = expandedId === service.id;
            const durationLabel = formatDuration(service.estimatedDuration);

            return (
              <div
                key={service.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 transition-all shadow-sm hover:border-slate-700/80 overflow-hidden"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : service.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        {service.name}
                      </h3>
                      {durationLabel && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          <span>{durationLabel}</span>
                        </span>
                      )}
                      {service.basePrice !== undefined && service.basePrice > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-md font-mono">
                          <span>R$ {service.basePrice.toFixed(2)}</span>
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                      {service.tools.length} ferramentas
                    </span>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(service, e)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
                      title="Editar serviço completo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setServiceToDelete(service);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 hover:text-white text-slate-400 transition-colors cursor-pointer"
                      title="Excluir serviço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-500 pl-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                    {service.description && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-1">
                          Descrição do Procedimento:
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                          {service.description}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Ferramentas Necessárias para o Atendimento ({service.tools.length}):</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(service, e)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                        >
                          + Adicionar / Editar ferramentas
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {service.tools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 text-xs border border-slate-700/60"
                          >
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>{tool}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick footer with edit full button */}
                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(service, e)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Serviço Completo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Excluir Serviço</h3>
                <p className="text-xs text-slate-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Tem certeza que deseja remover o serviço <strong>"{serviceToDelete.name}"</strong>?
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Create / Edit Modal */}
      {isModalOpen && (
        <ServiceModal
          serviceToEdit={serviceToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setServiceToEdit(null);
          }}
          onSaved={() => {
            setIsModalOpen(false);
            setServiceToEdit(null);
          }}
        />
      )}
    </div>
  );
};
