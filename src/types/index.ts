export type UserRole = 'master' | 'technician';
export type UserStatus = 'active' | 'inactive';
export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  tools: string[];
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  serviceTypeId: string;
  serviceTypeName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  tools: string[];
  toolChecklist: Record<string, boolean>; // toolName -> isChecked
  reminderMinutes: number; // 0, 15, 30, 60
  assignedTo?: string; // userId or 'all'
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CloudBackupRecord {
  id: string;
  timestamp: string;
  createdBy: string;
  snapshotData: string;
  stats: {
    usersCount: number;
    servicesCount: number;
    clientsCount: number;
    appointmentsCount: number;
  };
}

export interface VoiceInterpretation {
  action: 'create_appointment' | 'query_agenda' | 'incomplete_command' | 'unknown';
  clientName?: string;
  clientAddress?: string;
  serviceTypeName?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  notes?: string;
  missingFields?: string[];
  clarificationMessage?: string;
  queryType?: 'today' | 'tomorrow' | 'next' | 'afternoon' | 'address' | 'all';
  responseSpeech?: string;
}
