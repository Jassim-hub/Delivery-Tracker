// PWA and Web Push Manager

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  badge?: string;
  icon?: string;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private isSupported: boolean = false;

  private constructor() {
    this.isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
  }

  public static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  public async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.isSupported) return;

    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: payload.badge || '/favicon.svg',
            data: { url: payload.url || '/' },
          });
        } else {
          new Notification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/icons/icon-192x192.png',
          });
        }
      } catch (err) {
        console.warn('Could not display local notification:', err);
      }
    }
  }

  public isIos(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  public isStandalonePwa(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  }
}

export const pushManager = PushNotificationManager.getInstance();
