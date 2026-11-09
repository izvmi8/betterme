import { describe, it, expect } from 'vitest';
import { compressImage, compressImageDataUrl } from './imageCompressor';

describe('imageCompressor Utility', () => {
  it('handles data URL and blob inputs cleanly in test environment', async () => {
    const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const blob = await compressImage(mockDataUrl);
    expect(blob).toBeInstanceOf(Blob);

    const compressedStr = await compressImageDataUrl(mockDataUrl);
    expect(typeof compressedStr).toBe('string');
  });

  it('preserves existing blob when canvas is not available', async () => {
    const inputBlob = new Blob(['test image data'], { type: 'image/jpeg' });
    const outputBlob = await compressImage(inputBlob);
    expect(outputBlob).toBeInstanceOf(Blob);
  });
});
