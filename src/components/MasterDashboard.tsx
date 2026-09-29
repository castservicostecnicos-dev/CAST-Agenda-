import React, { useState } from 'react';
import {
  Users,
  Shield,
  Wrench,
  Database,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import { User, ServiceType, CloudBackupRecord } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ServiceModal } from './ServiceModal';

type MasterTab = 'overview' | 'users' | 'services' | 'tools' | 'backup';

export const MasterDashboard: React.FC = () => {
  const { switchDashboard } = useAuth();
  const {
    users,
    services,
    appointments,
    clients,
    backups,
    createUser,
    updateUser,
    toggleUserStatus,
    resetUserPassword,
    deleteUser,
    createServiceType,
    updateServiceType,
    deleteServiceType,
    createBackupNow,
    restoreBackupFromData,
  } = useData();

  const [activeTab, setActiveTab] = useState<MasterTab>('overview');

  // User modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'master' | 'technician'>('technician');
  const [userPassword, setUserPassword] = useState('123');
  const [userError, setUserError] = useState('');

  // Password reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Delete user confirmation
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Service modal state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceToolsStr, setServiceToolsStr] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [serviceToDelete, setServiceToDelete] = useState<ServiceType | null>(null);

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // User filters
  const [userSearch, setUserSearch] = useState('');
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Handlers for User Management
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('technician');
    setUserPassword('123');
    setUserError('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserPassword(u.password || '123');
    setUserError('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    if (!userName.trim()) {
      setUserError('Informe o nome.');
      return;
    }
    if (!userEmail.trim()) {
      setUserError('Informe o e-mail/usuário.');
      return;
    }

    try {
      if (editingUser) {
        await updateUser({
          ...editingUser,
          name: userName.trim(),
          email: userEmail.trim().toLowerCase(),
          role: userRole,
          password: userPassword || editingUser.password,
        });
      } else {
        await createUser({
          name: userName.trim(),
          email: userEmail.trim().toLowerCase(),
          role: userRole,
          status: 'active',
          password: userPassword || '123',
        });
      }
      setIsUserModalOpen(false);
    } catch (err) {
      setUserError('Erro ao salvar usuário.');
    }
  };

  const handleOpenResetPassword = (u: User) => {
    setTargetResetUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setIsResetModalOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResetUser) return;
    if (!newPassword.trim()) {
      setResetError('Informe a nova senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('As senhas não coincidem.');
      return;
    }

    await resetUserPassword(targetResetUser.id, newPassword.trim());
    setIsResetModalOpen(false);
    setBackupNotice(`Senha de ${targetResetUser.name} redefinida com sucesso.`);
    setTimeout(() => setBackupNotice(null), 4000);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    await deleteUser(userToDelete.id);
    setUserToDelete(null);
  };

  // Handlers for Services
  const handleOpenNewService = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDesc('');
    setServiceToolsStr('');
    setServiceError('');
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: ServiceType) => {
    setEditingService(s);
    setServiceName(s.name);
    setServiceDesc(s.description || '');
    setServiceToolsStr(s.tools.join(', '));
    setServiceError('');
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError('');
    if (!serviceName.trim()) {
      setServiceError('Informe o nome do serviço.');
      return;
    }

    const toolsArr = serviceToolsStr
      .split(/[,;\n]/)
      .map(t => t.trim())
      .filter(Boolean);

    try {
      if (editingService) {
        await updateServiceType({
          ...editingService,
          name: serviceName.trim(),
          description: serviceDesc.trim(),
          tools: toolsArr,
        });
      } else {
        await createServiceType(serviceName.trim(), serviceDesc.trim(), toolsArr);
      }
      setIsServiceModalOpen(false);
    } catch (e) {
      setServiceError('Erro ao salvar serviço.');
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    await deleteServiceType(serviceToDelete.id);
    setServiceToDelete(null);
  };

  // Handlers for Backup
  const handleCreateCloudBackup = async () => {
    setBackupLoading(true);
    try {
      const rec = await createBackupNow();
      setBackupNotice(`Backup em nuvem criado com sucesso! ID: ${rec.id}`);
    } catch (e) {
      setBackupNotice('Erro ao gerar backup em nuvem.');
    } finally {
      setBackupLoading(false);
      setTimeout(() => setBackupNotice(null), 5000);
    }
  };

  const handleDownloadBackupFile = () => {
    const data = {
      users,
      services,
      clients,
      appointments,
      exportedAt: new Date().toISOString(),
      system: 'CAST Serviços Técnicos',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cast_backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const ok = await restoreBackupFromData(content);
        if (ok) {
          setBackupNotice('Dados restaurados com sucesso do arquivo!');
        } else {
          setBackupNotice('Arquivo inválido de backup.');
        }
      } catch (err) {
        setBackupNotice('Falha ao processar arquivo.');
      }
      setTimeout(() => setBackupNotice(null), 5000);
    };
    reader.readAsText(file);
  };

  // Consolidated tools across all services
  const consolidatedTools = React.useMemo(() => {
    const map = new Map<string, string[]>();
    services.forEach(s => {
      s.tools.forEach(t => {
        const existing = map.get(t) || [];
        existing.push(s.name);
        map.set(t, existing);
      });
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [services]);

  return (
    <div className="space-y-4">
      {/* Direct Jump to User/Technician Dashboard */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900 border border-cyan-500/40 shadow-lg flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
            Painel Administrativo Master
          </div>
          <h2 className="text-base font-bold text-white">
            Controle Geral do Sistema
          </h2>
        </div>

        <button
          type="button"
          onClick={() => switchDashboard('technician')}
          className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Acessar Dashboard de Usuário</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notice Banner */}
      {backupNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* Master Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[90px] py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Visão Geral
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[80px] py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Usuários ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex-1 min-w-[100px] py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'services'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tipos de Serviço
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`flex-1 min-w-[90px] py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ferramentas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex-1 min-w-[100px] py-2 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Backup em Nuvem
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Usuários</span>
              <div className="text-xl font-bold text-white mt-1">{users.length}</div>
              <span className="text-[11px] text-emerald-400">
                {users.filter(u => u.status === 'active').length} ativos
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Atendimentos</span>
              <div className="text-xl font-bold text-white mt-1">{appointments.length}</div>
              <span className="text-[11px] text-cyan-400">Total geral</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Clientes</span>
              <div className="text-xl font-bold text-white mt-1">{clients.length}</div>
              <span className="text-[11px] text-slate-400">Cadastrados</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500">Serviços Técnicos</span>
              <div className="text-xl font-bold text-white mt-1">{services.length}</div>
              <span className="text-[11px] text-slate-400">{consolidatedTools.length} ferramentas</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm">Ações Administrativas Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleOpenNewUser}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-cyan-400 mb-1" />
                <div className="text-xs font-bold text-white">Cadastrar Usuário</div>
                <div className="text-[11px] text-slate-400">Adicionar técnico ou master</div>
              </button>

              <button
                type="button"
                onClick={handleOpenNewService}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-cyan-400 mb-1" />
                <div className="text-xs font-bold text-white">Cadastrar Tipo de Serviço</div>
                <div className="text-[11px] text-slate-400">Vincular ferramentas necessárias</div>
              </button>

              <button
                type="button"
                onClick={handleCreateCloudBackup}
                disabled={backupLoading}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-left transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-cyan-400 mb-1" />
                <div className="text-xs font-bold text-white">Criar Backup na Nuvem</div>
                <div className="text-[11px] text-slate-400">Salvar snapshot no Firestore</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuário por nome ou e-mail..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenNewUser}
              className="py-2 px-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          <div className="space-y-2">
            {filteredUsers.map(u => (
              <div
                key={u.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{u.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'master'
                          ? 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                          : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                      }`}
                    >
                      {u.role === 'master' ? 'Master' : 'Técnico'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        u.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                          : 'bg-rose-950/40 text-rose-400 border-rose-800/40'
                      }`}
                    >
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {u.email} • Cadastro: {u.createdAt ? u.createdAt.substring(0, 10).split('-').reverse().join('/') : 'N/D'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {/* Password Reset */}
                  <button
                    type="button"
                    onClick={() => handleOpenResetPassword(u)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                    title="Redefinir senha do usuário"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline text-[11px]">Senha</span>
                  </button>

                  {/* Toggle Active / Inactive */}
                  <button
                    type="button"
                    onClick={() => toggleUserStatus(u.id)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer ${
                      u.status === 'active'
                        ? 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border-emerald-800/40'
                    }`}
                    title={u.status === 'active' ? 'Desativar usuário' : 'Ativar usuário'}
                  >
                    {u.status === 'active' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[11px] text-rose-400">Desativar</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Ativar</span>
                      </>
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditUser(u)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                    title="Editar informações"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setUserToDelete(u)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-rose-400 border border-slate-800 cursor-pointer"
                    title="Excluir usuário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SERVICES MANAGEMENT TAB */}
      {activeTab === 'services' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Catálogo de Serviços da Empresa
            </span>
            <button
              type="button"
              onClick={handleOpenNewService}
              className="py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Tipo de Serviço</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {services.map(s => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{s.name}</h4>
                    {s.description && (
                      <p className="text-xs text-slate-400">{s.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditService(s)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 cursor-pointer"
                      title="Editar tipo de serviço"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceToDelete(s)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-rose-400 border border-slate-800 cursor-pointer"
                      title="Excluir serviço"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Tools Tag list */}
                <div className="pt-2 border-t border-slate-800/70">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Ferramentas relacionadas ({s.tools.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {s.tools.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[11px] border border-slate-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TOOLS TAB */}
      {activeTab === 'tools' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Total de {consolidatedTools.length} ferramentas cadastradas no ecossistema CAST.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {consolidatedTools.map(([toolName, serviceList], idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">{toolName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Utilizada em: {serviceList.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CLOUD BACKUP TAB (MASTER ONLY) */}
      {activeTab === 'backup' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Sistema de Backup em Nuvem (Exclusivo Master)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Garante que todos os atendimentos, cadastros de clientes, usuários e tipos de serviço estejam protegidos e sincronizados no Firestore.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreateCloudBackup}
                disabled={backupLoading}
                className="py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${backupLoading ? 'animate-spin' : ''}`} />
                <span>Criar Snapshot na Nuvem Agora</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBackupFile}
                className="py-3 px-4 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Arquivo JSON de Backup</span>
              </button>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                Restaurar a partir de arquivo de backup
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFromFile}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Backup History */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
              Histórico de Backups ({backups.length})
            </span>

            {backups.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
                Nenhum backup em nuvem gerado ainda. Clique em "Criar Snapshot na Nuvem Agora".
              </div>
            ) : (
              backups.map(b => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-white">{b.id}</div>
                    <div className="text-slate-400 text-[11px]">
                      {new Date(b.timestamp).toLocaleString('pt-BR')} • {b.stats.appointmentsCount} atendimentos, {b.stats.clientsCount} clientes, {b.stats.usersCount} usuários
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => restoreBackupFromData(b.snapshotData)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Restaurar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* USER CREATE / EDIT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
              <h3 className="font-bold text-white text-base">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5">
              {userError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{userError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="ex: Lucas Martins"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  E-mail / Usuário de Acesso *
                </label>
                <input
                  type="text"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="lucas@cast.com.br"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Perfil de Acesso *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserRole('technician')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      userRole === 'technician'
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Técnico / Usuário
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole('master')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      userRole === 'master'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Master (Admin)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  {editingUser ? 'Alterar Senha' : 'Senha Inicial'}
                </label>
                <input
                  type="text"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL (MASTER) */}
      {isResetModalOpen && targetResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-base">Redefinir Senha</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="p-5 space-y-3.5">
              <div className="text-xs text-slate-300">
                Definindo nova senha para o usuário: <br />
                <strong className="text-white">{targetResetUser.name}</strong> ({targetResetUser.email})
              </div>

              {resetError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {resetError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold"
                >
                  Confirmar Redefinição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Excluir Usuário</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Deseja realmente excluir permanentemente o usuário <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.email})?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE CREATE / EDIT MODAL */}
      {isServiceModalOpen && (
        <ServiceModal
          serviceToEdit={editingService}
          onClose={() => {
            setIsServiceModalOpen(false);
            setEditingService(null);
          }}
          onSaved={() => {
            setIsServiceModalOpen(false);
            setEditingService(null);
          }}
        />
      )}

      {/* SERVICE DELETE CONFIRMATION */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Excluir Tipo de Serviço</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Deseja realmente remover o serviço <strong className="text-white">{serviceToDelete.name}</strong>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
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
