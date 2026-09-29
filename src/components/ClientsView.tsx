import React, { useState, useMemo } from 'react';
import { User, MapPin, Phone, Plus, Search, Calendar, Edit2, X, AlertCircle } from 'lucide-react';
import { Client } from '../types';
import { useData } from '../context/DataContext';

interface ClientsViewProps {
  onScheduleForClient: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ onScheduleForClient }) => {
  const { clients, createOrUpdateClient } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  }, [clients, searchQuery]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName('');
    setAddress('');
    setPhone('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setAddress(client.address);
    setPhone(client.phone || '');
    setNotes(client.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome do cliente.');
      return;
    }
    if (!address.trim()) {
      setFormError('Informe o endereço do cliente.');
      return;
    }

    try {
      await createOrUpdateClient({
        id: editingClient?.id,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      });
      setIsModalOpen(false);
    } catch (e) {
      setFormError('Erro ao salvar cliente.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top search & Add Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, endereço ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Clients List */}
      <div className="space-y-2.5">
        {filteredClients.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
            <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">Nenhum cliente cadastrado</h4>
            <p className="text-xs text-slate-500 mt-1">Toque em "Novo Cliente" para adicionar.</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm sm:text-base text-white">
                  {client.name}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(client)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Editar dados do cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onScheduleForClient(client)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    title="Novo agendamento para este cliente"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar</span>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>{client.address}</span>
              </div>

              {client.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}

              {client.notes && (
                <div className="text-xs text-slate-500 italic pt-1 border-t border-slate-800/60">
                  {client.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
              <h3 className="font-bold text-white text-base">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Endereço / Local Padrão *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, complemento, bairro"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções de acesso, ponto de referência..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
