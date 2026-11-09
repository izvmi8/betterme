/**
 * Web Push & System Notifications service.
 * Triggers native system notifications and haptic vibrations.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isNotificationGranted(): boolean {
  if (!isNotificationSupported()) return false;
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export function sendSystemNotification(title: string, body: string, icon?: string): void {
  // 1. Tactile haptic feedback on phones
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 60, 120]);
    } catch {
      // Ignore vibration errors
    }
  }

  // 2. Native OS / Browser notification if granted
  if (isNotificationGranted()) {
    try {
      new Notification(title, {
        body,
        icon: icon || '/logo.svg',
        badge: '/logo.svg',
      });
    } catch {
      // Fallback if Notification constructor fails (e.g. mobile Chrome requires ServiceWorkerRegistration)
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(title, {
              body,
              icon: icon || '/logo.svg',
              badge: '/logo.svg',
            });
          })
          .catch(() => {});
      }
    }
  }
}
