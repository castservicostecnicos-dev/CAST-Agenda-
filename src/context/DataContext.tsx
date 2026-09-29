import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appointment, Client, ServiceType, User, AppointmentStatus, CloudBackupRecord } from '../types';
import { StorageService } from '../lib/storage';
import { NotificationService } from '../lib/notifications';
import { useAuth } from './AuthContext';

interface DataContextType {
  appointments: Appointment[];
  services: ServiceType[];
  clients: Client[];
  users: User[];
  isOnline: boolean;
  backups: CloudBackupRecord[];
  
  // Appointment methods
  checkTimeConflict: (date: string, time: string, excludeId?: string) => Appointment | null;
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'toolChecklist'>) => Promise<Appointment>;
  updateAppointment: (appointment: Appointment) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  toggleToolCheck: (appointmentId: string, toolName: string) => Promise<void>;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => Promise<void>;

  // Client methods
  createOrUpdateClient: (client: Omit<Client, 'id' | 'createdAt'> & { id?: string }) => Promise<Client>;

  // Service methods (Master can manage, all can read)
  createServiceType: (name: string, description: string, tools: string[]) => Promise<ServiceType>;
  updateServiceType: (service: ServiceType) => Promise<void>;
  deleteServiceType: (id: string) => Promise<void>;

  // User management (Master only)
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  updateUser: (user: User) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string, newPass: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Backup system (Master only)
  createBackupNow: () => Promise<CloudBackupRecord>;
  restoreBackupFromData: (data: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const storage = StorageService.getInstance();

  const [appointments, setAppointments] = useState<Appointment[]>(() => storage.getAppointments());
  const [services, setServices] = useState<ServiceType[]>(() => storage.getServices());
  const [clients, setClients] = useState<Client[]>(() => storage.getClients());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [backups, setBackups] = useState<CloudBackupRecord[]>(() => storage.getBackups());
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to real-time updates via Firestore
  useEffect(() => {
    const unsubscribe = storage.subscribeToFirestore(
      (remoteAppointments) => setAppointments(remoteAppointments),
      (remoteClients) => setClients(remoteClients),
      (remoteServices) => setServices(remoteServices),
      (remoteUsers) => setUsers(remoteUsers)
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Periodic reminder checker for field appointments
  useEffect(() => {
    const interval = setInterval(() => {
      NotificationService.checkUpcomingAppointments(appointments);
    }, 60000); // check every minute

    return () => clearInterval(interval);
  }, [appointments]);

  // Conflict detection: checks if another appointment is at the same date and time
  const checkTimeConflict = useCallback((date: string, time: string, excludeId?: string): Appointment | null => {
    const match = appointments.find(a => 
      a.date === date && 
      a.time === time && 
      a.id !== excludeId && 
      a.status !== 'cancelled'
    );
    return match || null;
  }, [appointments]);

  // Create appointment
  const createAppointment = async (
    data: Omit<Appointment, 'id' | 'createdAt' | 'toolChecklist'>
  ): Promise<Appointment> => {
    // Find service to prefill tools
    const matchedService = services.find(s => s.id === data.serviceTypeId || s.name === data.serviceTypeName);
    const tools = data.tools && data.tools.length > 0 
      ? data.tools 
      : (matchedService?.tools || []);

    const initialChecklist: Record<string, boolean> = {};
    tools.forEach(t => {
      initialChecklist[t] = false;
    });

    const newApt: Appointment = {
      ...data,
      id: 'apt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tools,
      toolChecklist: initialChecklist,
      createdAt: new Date().toISOString(),
    };

    await storage.saveAppointment(newApt);
    setAppointments(storage.getAppointments());

    // Auto-save client if new address or name
    if (newApt.clientName && newApt.clientAddress) {
      const existingClient = clients.find(c => c.name.toLowerCase() === newApt.clientName.toLowerCase());
      if (!existingClient) {
        await createOrUpdateClient({
          name: newApt.clientName,
          address: newApt.clientAddress,
          phone: newApt.clientPhone || '',
        });
      }
    }

    return newApt;
  };

  const updateAppointment = async (appointment: Appointment): Promise<void> => {
    await storage.saveAppointment(appointment);
    setAppointments(storage.getAppointments());
  };

  const deleteAppointment = async (id: string): Promise<void> => {
    await storage.deleteAppointment(id);
    setAppointments(storage.getAppointments());
  };

  const toggleToolCheck = async (appointmentId: string, toolName: string): Promise<void> => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const currentChecked = apt.toolChecklist ? !!apt.toolChecklist[toolName] : false;
    const updatedChecklist = {
      ...(apt.toolChecklist || {}),
      [toolName]: !currentChecked,
    };

    const updatedApt = {
      ...apt,
      toolChecklist: updatedChecklist,
    };

    await updateAppointment(updatedApt);
  };

  const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus): Promise<void> => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const updatedApt = {
      ...apt,
      status,
    };

    await updateAppointment(updatedApt);
  };

  // Clients
  const createOrUpdateClient = async (
    data: Omit<Client, 'id' | 'createdAt'> & { id?: string }
  ): Promise<Client> => {
    const existing = data.id ? clients.find(c => c.id === data.id) : null;
    const client: Client = {
      id: data.id || 'cli_' + Date.now(),
      name: data.name.trim(),
      address: data.address.trim(),
      phone: data.phone?.trim() || '',
      notes: data.notes?.trim() || '',
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await storage.saveClient(client);
    setClients(storage.getClients());
    return client;
  };

  // Services
  const createServiceType = async (name: string, description: string, tools: string[]): Promise<ServiceType> => {
    const newService: ServiceType = {
      id: 'srv_' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      tools: tools.map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    await storage.saveService(newService);
    setServices(storage.getServices());
    return newService;
  };

  const updateServiceType = async (service: ServiceType): Promise<void> => {
    await storage.saveService(service);
    setServices(storage.getServices());
  };

  const deleteServiceType = async (id: string): Promise<void> => {
    await storage.deleteService(id);
    setServices(storage.getServices());
  };

  // Users (Master only)
  const createUser = async (data: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const newUser: User = {
      ...data,
      id: 'usr_' + Date.now(),
      email: data.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    await storage.saveUser(newUser);
    setUsers(storage.getUsers());
    return newUser;
  };

  const updateUser = async (userToUpdate: User): Promise<void> => {
    await storage.saveUser(userToUpdate);
    setUsers(storage.getUsers());
  };

  const toggleUserStatus = async (userId: string): Promise<void> => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    await updateUser({ ...target, status: newStatus });
  };

  const resetUserPassword = async (userId: string, newPass: string): Promise<void> => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    await updateUser({ ...target, password: newPass });
  };

  const deleteUser = async (userId: string): Promise<void> => {
    await storage.deleteUser(userId);
    setUsers(storage.getUsers());
  };

  // Backups
  const createBackupNow = async (): Promise<CloudBackupRecord> => {
    const rec = await storage.createBackup(user?.id || 'master_system');
    setBackups(storage.getBackups());
    return rec;
  };

  const restoreBackupFromData = async (data: string): Promise<boolean> => {
    const ok = await storage.restoreBackup(data);
    if (ok) {
      setAppointments(storage.getAppointments());
      setClients(storage.getClients());
      setServices(storage.getServices());
      setUsers(storage.getUsers());
      setBackups(storage.getBackups());
    }
    return ok;
  };

  return (
    <DataContext.Provider
      value={{
        appointments,
        services,
        clients,
        users,
        isOnline,
        backups,
        checkTimeConflict,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        toggleToolCheck,
        updateAppointmentStatus,
        createOrUpdateClient,
        createServiceType,
        updateServiceType,
        deleteServiceType,
        createUser,
        updateUser,
        toggleUserStatus,
        resetUserPassword,
        deleteUser,
        createBackupNow,
        restoreBackupFromData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
