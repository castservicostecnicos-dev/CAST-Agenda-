// Local and Web notification scheduler for field technician appointments
import { Appointment } from '../types';

export class NotificationService {
  private static permissionRequested = false;

  public static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }

  public static sendLocalAlert(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Native notification failed, falling back:', e);
      }
    }
  }

  public static checkUpcomingAppointments(appointments: Appointment[]): void {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    appointments.forEach(apt => {
      if (apt.date !== today || apt.status !== 'scheduled' || !apt.reminderMinutes || apt.reminderMinutes <= 0) {
        return;
      }

      const [hours, minutes] = apt.time.split(':').map(Number);
      const appointmentMinutes = hours * 60 + minutes;
      const diffMinutes = appointmentMinutes - currentMinutes;

      // Trigger if within 2 minutes of the configured reminder time
      if (diffMinutes === apt.reminderMinutes) {
        const title = `Lembrete de Atendimento CAST (${apt.time})`;
        const body = `Cliente: ${apt.clientName} - ${apt.serviceTypeName} em ${apt.clientAddress}`;
        this.sendLocalAlert(title, body);
      }
    });
  }
}
