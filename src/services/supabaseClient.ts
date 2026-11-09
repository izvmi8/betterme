import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20 &&
    !supabaseUrl.includes('your-project')
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Uploads a base64 Data URL or Blob to Supabase Storage ('betterme-media' bucket)
 * and returns the public CDN HTTPS URL.
 */
export async function uploadMedia(
  dataOrUrl: string | Blob,
  fileName: string,
  contentType = 'image/jpeg'
): Promise<string> {
  if (!supabase || !isSupabaseConfigured()) {
    // Return original data URL or string if Supabase is not configured
    return typeof dataOrUrl === 'string' ? dataOrUrl : URL.createObjectURL(dataOrUrl);
  }

  try {
    let fileBody: Blob;

    if (typeof dataOrUrl === 'string') {
      if (dataOrUrl.startsWith('data:')) {
        // Convert base64 Data URL to Blob
        const [header, base64Data] = dataOrUrl.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : contentType;
        const binary = atob(base64Data);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        fileBody = new Blob([array], { type: mime });
      } else {
        // Already a remote URL
        return dataOrUrl;
      }
    } else {
      fileBody = dataOrUrl;
    }

    const uniquePath = `uploads/${Date.now()}_${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('betterme-media')
      .upload(uniquePath, fileBody, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Błąd uploadu do Supabase Storage, używam fallbacku:', uploadError.message);
      return typeof dataOrUrl === 'string' ? dataOrUrl : '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('betterme-media')
      .getPublicUrl(uniquePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Błąd podczas uploadu mediów do Supabase:', err);
    return typeof dataOrUrl === 'string' ? dataOrUrl : '';
  }
}
