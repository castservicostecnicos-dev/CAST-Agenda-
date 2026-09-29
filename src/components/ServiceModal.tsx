import React, { useState } from 'react';
import { X, Wrench, Plus, Trash2, Clock, DollarSign, Check, AlertCircle, Sparkles } from 'lucide-react';
import { ServiceType } from '../types';
import { useData } from '../context/DataContext';

interface ServiceModalProps {
  serviceToEdit?: ServiceType | null;
  onClose: () => void;
  onSaved: (service: ServiceType) => void;
}

const COMMON_TOOL_SUGGESTIONS = [
  'Furadeira',
  'Parafusadeira',
  'Escada',
  'Multímetro',
  'Alicate de corte',
  'Alicate de crimpar',
  'Passa-fio',
  'Fita isolante',
  'Testador de cabos',
  'Chave Philips',
  'Chave de fenda',
  'Nível',
  'Extensão elétrica',
  'EPIs (Óculos/Luvas)',
  'Notebook / Cabo console',
  'Brocas para concreto',
];

const DURATION_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1h 30m', value: 90 },
  { label: '2 horas', value: 120 },
  { label: '3 horas', value: 180 },
  { label: '4 horas', value: 240 },
];

export const ServiceModal: React.FC<ServiceModalProps> = ({
  serviceToEdit,
  onClose,
  onSaved,
}) => {
  const { createServiceType, updateServiceType, deleteServiceType } = useData();

  const [name, setName] = useState(serviceToEdit?.name || '');
  const [description, setDescription] = useState(serviceToEdit?.description || '');
  const [tools, setTools] = useState<string[]>(serviceToEdit?.tools ? [...serviceToEdit.tools] : []);
  const [toolInput, setToolInput] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>(
    serviceToEdit?.estimatedDuration || 60
  );
  const [basePrice, setBasePrice] = useState<string>(
    serviceToEdit?.basePrice ? String(serviceToEdit.basePrice) : ''
  );
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = Boolean(serviceToEdit && serviceToEdit.id);

  // Add tool to list
  const handleAddTool = () => {
    const trimmed = toolInput.trim();
    if (!trimmed) return;
    if (tools.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setToolInput('');
      return;
    }
    setTools(prev => [...prev, trimmed]);
    setToolInput('');
  };

  const handleKeyDownTool = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTool();
    }
  };

  const handleToggleSuggestion = (tool: string) => {
    if (tools.includes(tool)) {
      setTools(prev => prev.filter(t => t !== tool));
    } else {
      setTools(prev => [...prev, tool]);
    }
  };

  const handleRemoveTool = (toolToRemove: string) => {
    setTools(prev => prev.filter(t => t !== toolToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Por favor, informe o nome do serviço.');
      return;
    }

    if (tools.length === 0) {
      setFormError('Adicione pelo menos 1 ferramenta necessária para o checklist do técnico.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedPrice = basePrice ? parseFloat(basePrice.replace(',', '.')) : undefined;

      if (isEditing && serviceToEdit) {
        const updated: ServiceType = {
          ...serviceToEdit,
          name: name.trim(),
          description: description.trim(),
          tools,
          estimatedDuration,
          basePrice: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : undefined,
          updatedAt: new Date().toISOString(),
        };
        await updateServiceType(updated);
        onSaved(updated);
      } else {
        const created = await createServiceType({
          name: name.trim(),
          description: description.trim(),
          tools,
          estimatedDuration,
          basePrice: parsedPrice && !isNaN(parsedPrice) ? parsedPrice : undefined,
        });
        onSaved(created);
      }
    } catch (err: any) {
      console.error('Error saving service:', err);
      setFormError('Não foi possível salvar o serviço. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToEdit) return;
    setIsSubmitting(true);
    try {
      await deleteServiceType(serviceToEdit.id);
      onClose();
    } catch (err) {
      setFormError('Erro ao excluir o serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">
                {isEditing ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Atualize os dados, descrição e ferramentas deste serviço'
                  : 'Adicione este tipo de serviço para usar nos agendamentos da agenda'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Nome do Serviço */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Nome do Serviço *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Instalação de Câmeras IP, Manutenção de Interfone..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Descrição do Serviço (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o procedimento, especificações ou passos a seguir..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Ferramentas Obrigatórias / Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Ferramentas do Checklist * ({tools.length})
              </label>
              <span className="text-[11px] text-slate-400">
                O técnico confirmará estas ferramentas no campo
              </span>
            </div>

            {/* Input de Ferramenta */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  onKeyDown={handleKeyDownTool}
                  placeholder="Nome da ferramenta (ex: Furadeira de impacto)..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTool}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {/* Ferramentas já adicionadas */}
            {tools.length > 0 ? (
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <div className="text-[11px] text-slate-400 mb-2 font-medium">
                  Ferramentas cadastradas para este serviço:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {tools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/40 text-cyan-200 text-xs border border-cyan-800/50"
                    >
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span>{tool}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(tool)}
                        className="ml-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover ferramenta"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Nenhuma ferramenta adicionada ainda. Digite acima ou selecione das sugestões abaixo.
              </div>
            )}

            {/* Sugestões rápidas de ferramentas comuns */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Sugestões rápidas (clique para incluir):</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {COMMON_TOOL_SUGGESTIONS.map((sug, idx) => {
                  const isSelected = tools.includes(sug);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleSuggestion(sug)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-cyan-900/40 text-cyan-300 border-cyan-700/60'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {sug}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Duração Estimada & Valor Base */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            {/* Duração */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Duração Estimada</span>
              </label>
              <div className="grid grid-cols-4 gap-1 mb-2">
                {DURATION_PRESETS.slice(0, 4).map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setEstimatedDuration(p.value)}
                    className={`py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                      estimatedDuration === p.value
                        ? 'bg-cyan-600 text-white border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedDuration || ''}
                  onChange={(e) => setEstimatedDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Minutos"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-400 shrink-0">minutos</span>
              </div>
            </div>

            {/* Valor Base */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Preço Base Sugerido (R$)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">
                  R$
                </span>
                <input
                  type="text"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="150,00 (opcional)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Valor de referência para orçamentos e relatórios
              </span>
            </div>
          </div>

          {/* Delete section if editing */}
          {isEditing && (
            <div className="pt-3 border-t border-slate-800/80">
              {showDeleteConfirm ? (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-2">
                  <div className="text-xs text-rose-300 font-medium">
                    Tem certeza que deseja excluir o serviço <strong>"{serviceToEdit?.name}"</strong>?
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDelete}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Sim, Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir este serviço</span>
                </button>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Salvando...'
                : isEditing
                ? 'Salvar Alterações'
                : 'Cadastrar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
