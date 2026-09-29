import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { User, ServiceType, Client, Appointment, CloudBackupRecord } from '../types';
import { INITIAL_USERS, INITIAL_SERVICES, INITIAL_CLIENTS, getInitialAppointments } from './defaultData';

const STORAGE_KEYS = {
  USERS: 'cast_users_v1',
  SERVICES: 'cast_services_v1',
  CLIENTS: 'cast_clients_v1',
  APPOINTMENTS: 'cast_appointments_v1',
  BACKUPS: 'cast_backups_v1',
  CURRENT_USER: 'cast_auth_user_v1',
  ACTIVE_DASHBOARD: 'cast_active_dashboard_v1',
};

// Safe LocalStorage helpers
export const loadLocal = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key} from localStorage:`, e);
    return defaultValue;
  }
};

export const saveLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
};

// Initialize local seeds if empty and ensure Master user
export const initializeLocalStorage = () => {
  const existingUsers = loadLocal<User[]>(STORAGE_KEYS.USERS, []);
  if (!existingUsers || existingUsers.length === 0) {
    saveLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  } else {
    // Ensure ale11062@gmail.com exists with password cast@2468
    const masterIdx = existingUsers.findIndex(u => u.email === 'ale11062@gmail.com' || u.role === 'master');
    if (masterIdx >= 0) {
      existingUsers[masterIdx] = {
        ...existingUsers[masterIdx],
        name: 'Gestor Master CAST',
        email: 'ale11062@gmail.com',
        role: 'master',
        status: 'active',
        password: 'cast@2468',
      };
      saveLocal(STORAGE_KEYS.USERS, existingUsers);
    } else {
      existingUsers.unshift({
        id: 'user_master_1',
        name: 'Gestor Master CAST',
        email: 'ale11062@gmail.com',
        role: 'master',
        status: 'active',
        password: 'cast@2468',
        createdAt: '2026-01-15T08:00:00.000Z',
      });
      saveLocal(STORAGE_KEYS.USERS, existingUsers);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
    saveLocal(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    saveLocal(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    saveLocal(STORAGE_KEYS.APPOINTMENTS, getInitialAppointments());
  }
};

// Data persistence service
export class StorageService {
  private static instance: StorageService;
  private isOnline = navigator.onLine;

  private constructor() {
    initializeLocalStorage();
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return loadLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public async saveUser(user: User): Promise<void> {
    const current = this.getUsers();
    const idx = current.findIndex(u => u.id === user.id);
    let updated: User[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      updated = [user, ...current];
    }
    saveLocal(STORAGE_KEYS.USERS, updated);

    // Sync to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
      } catch (err) {
        console.warn('Firestore user save queued locally:', err);
      }
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    const current = this.getUsers().filter(u => u.id !== userId);
    saveLocal(STORAGE_KEYS.USERS, current);

    if (db) {
      try {
        await deleteDoc(doc(db, 'users', userId));
      } catch (err) {
        console.warn('Firestore user delete queued locally:', err);
      }
    }
  }

  // --- SERVICES ---
  public getServices(): ServiceType[] {
    return loadLocal<ServiceType[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }

  public async saveService(service: ServiceType): Promise<void> {
    const current = this.getServices();
    const idx = current.findIndex(s => s.id === service.id);
    let updated: ServiceType[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = service;
    } else {
      updated = [service, ...current];
    }
    saveLocal(STORAGE_KEYS.SERVICES, updated);

    if (db) {
      try {
        await setDoc(doc(db, 'serviceTypes', service.id), service, { merge: true });
      } catch (err) {
        console.warn('Firestore service save warning:', err);
      }
    }
  }

  public async deleteService(serviceId: string): Promise<void> {
    const current = this.getServices().filter(s => s.id !== serviceId);
    saveLocal(STORAGE_KEYS.SERVICES, current);

    if (db) {
      try {
        await deleteDoc(doc(db, 'serviceTypes', serviceId));
      } catch (err) {
        console.warn('Firestore service delete warning:', err);
      }
    }
  }

  // --- CLIENTS ---
  public getClients(): Client[] {
    return loadLocal<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  }

  public async saveClient(client: Client): Promise<void> {
    const current = this.getClients();
    const idx = current.findIndex(c => c.id === client.id);
    let updated: Client[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = client;
    } else {
      updated = [client, ...current];
    }
    saveLocal(STORAGE_KEYS.CLIENTS, updated);

    if (db) {
      try {
        await setDoc(doc(db, 'clients', client.id), client, { merge: true });
      } catch (err) {
        console.warn('Firestore client save warning:', err);
      }
    }
  }

  // --- APPOINTMENTS ---
  public getAppointments(): Appointment[] {
    return loadLocal<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, getInitialAppointments());
  }

  public async saveAppointment(appointment: Appointment): Promise<void> {
    const current = this.getAppointments();
    const idx = current.findIndex(a => a.id === appointment.id);
    let updated: Appointment[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...appointment, updatedAt: new Date().toISOString() };
    } else {
      updated = [appointment, ...current];
    }
    saveLocal(STORAGE_KEYS.APPOINTMENTS, updated);

    if (db) {
      try {
        await setDoc(doc(db, 'appointments', appointment.id), appointment, { merge: true });
      } catch (err) {
        console.warn('Firestore appointment save warning:', err);
      }
    }
  }

  public async deleteAppointment(appointmentId: string): Promise<void> {
    const current = this.getAppointments().filter(a => a.id !== appointmentId);
    saveLocal(STORAGE_KEYS.APPOINTMENTS, current);

    if (db) {
      try {
        await deleteDoc(doc(db, 'appointments', appointmentId));
      } catch (err) {
        console.warn('Firestore appointment delete warning:', err);
      }
    }
  }

  // --- CLOUD BACKUP SYSTEM (MASTER ONLY) ---
  public async createBackup(masterUserId: string): Promise<CloudBackupRecord> {
    const snapshot = {
      users: this.getUsers(),
      services: this.getServices(),
      clients: this.getClients(),
      appointments: this.getAppointments(),
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };

    const record: CloudBackupRecord = {
      id: 'backup_' + Date.now(),
      timestamp: new Date().toISOString(),
      createdBy: masterUserId,
      snapshotData: JSON.stringify(snapshot),
      stats: {
        usersCount: snapshot.users.length,
        servicesCount: snapshot.services.length,
        clientsCount: snapshot.clients.length,
        appointmentsCount: snapshot.appointments.length,
      }
    };

    // Save locally
    const backups = loadLocal<CloudBackupRecord[]>(STORAGE_KEYS.BACKUPS, []);
    saveLocal(STORAGE_KEYS.BACKUPS, [record, ...backups]);

    // Push to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'backups', record.id), record);
      } catch (err) {
        console.warn('Firestore backup push warning:', err);
      }
    }

    return record;
  }

  public getBackups(): CloudBackupRecord[] {
    return loadLocal<CloudBackupRecord[]>(STORAGE_KEYS.BACKUPS, []);
  }

  public async restoreBackup(backupData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(backupData);
      if (parsed.users) saveLocal(STORAGE_KEYS.USERS, parsed.users);
      if (parsed.services) saveLocal(STORAGE_KEYS.SERVICES, parsed.services);
      if (parsed.clients) saveLocal(STORAGE_KEYS.CLIENTS, parsed.clients);
      if (parsed.appointments) saveLocal(STORAGE_KEYS.APPOINTMENTS, parsed.appointments);

      // Push to Firestore
      if (db) {
        if (parsed.users) {
          for (const u of parsed.users) {
            await setDoc(doc(db, 'users', u.id), u, { merge: true });
          }
        }
        if (parsed.services) {
          for (const s of parsed.services) {
            await setDoc(doc(db, 'serviceTypes', s.id), s, { merge: true });
          }
        }
        if (parsed.clients) {
          for (const c of parsed.clients) {
            await setDoc(doc(db, 'clients', c.id), c, { merge: true });
          }
        }
        if (parsed.appointments) {
          for (const a of parsed.appointments) {
            await setDoc(doc(db, 'appointments', a.id), a, { merge: true });
          }
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  }

  // Real-time Firestore sync listener attach
  public subscribeToFirestore(
    onAppointmentsChange: (appointments: Appointment[]) => void,
    onClientsChange: (clients: Client[]) => void,
    onServicesChange: (services: ServiceType[]) => void,
    onUsersChange: (users: User[]) => void
  ) {
    if (!db) return () => {};

    const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: Appointment[] = [];
        snapshot.forEach(docSnap => {
          remote.push(docSnap.data() as Appointment);
        });
        saveLocal(STORAGE_KEYS.APPOINTMENTS, remote);
        onAppointmentsChange(remote);
      }
    }, (err) => console.warn('Appointments snapshot listener notice:', err));

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: Client[] = [];
        snapshot.forEach(docSnap => {
          remote.push(docSnap.data() as Client);
        });
        saveLocal(STORAGE_KEYS.CLIENTS, remote);
        onClientsChange(remote);
      }
    }, (err) => console.warn('Clients snapshot listener notice:', err));

    const unsubServices = onSnapshot(collection(db, 'serviceTypes'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: ServiceType[] = [];
        snapshot.forEach(docSnap => {
          remote.push(docSnap.data() as ServiceType);
        });
        saveLocal(STORAGE_KEYS.SERVICES, remote);
        onServicesChange(remote);
      }
    }, (err) => console.warn('Services snapshot listener notice:', err));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const remote: User[] = [];
        snapshot.forEach(docSnap => {
          remote.push(docSnap.data() as User);
        });
        saveLocal(STORAGE_KEYS.USERS, remote);
        onUsersChange(remote);
      }
    }, (err) => console.warn('Users snapshot listener notice:', err));

    return () => {
      unsubAppointments();
      unsubClients();
      unsubServices();
      unsubUsers();
    };
  }
}
