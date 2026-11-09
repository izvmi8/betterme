import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// Mock navigator.vibrate
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: vi.fn().mockReturnValue(true),
  });

  // Mock navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    writable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  });
}

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock HTMLAudioElement play/pause
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();

// Mock MediaRecorder
class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  start = vi.fn(() => {
    this.state = 'recording';
  });
  stop = vi.fn(() => {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  });
  static isTypeSupported = vi.fn().mockReturnValue(true);
}

Object.defineProperty(window, 'MediaRecorder', {
  writable: true,
  configurable: true,
  value: MockMediaRecorder,
});
