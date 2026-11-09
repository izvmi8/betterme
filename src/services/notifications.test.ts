import { describe, it, expect } from 'vitest';
import {
  isNotificationSupported,
  isNotificationGranted,
  requestNotificationPermission,
  sendSystemNotification,
} from './notifications';

describe('Notifications Service', () => {
  it('detects notification support safely in test environment', () => {
    const supported = isNotificationSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('checks granted permission state', () => {
    const granted = isNotificationGranted();
    expect(typeof granted).toBe('boolean');
  });

  it('handles requestNotificationPermission gracefully', async () => {
    const res = await requestNotificationPermission();
    expect(typeof res).toBe('boolean');
  });

  it('triggers sendSystemNotification without throwing errors', () => {
    expect(() => {
      sendSystemNotification('Trening!', 'Filip dodał trening');
    }).not.toThrow();
  });
});
