// Get API base URL - handle mobile devices by using current hostname
const getApiBaseUrl = (): string => {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // For client-side (browser), detect if we're on mobile/network
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If not localhost, use the same hostname (works for mobile accessing dev machine)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000`;
    }
  }
  
  // Default to localhost for desktop development
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

export type ConvertResponse =
  | { status: 'success'; mode: 'single'; downloadUrl: string; meta?: { outputFormat?: string; originalName?: string; [key: string]: any } }
  | { status: 'success'; mode: 'multi'; zipUrl: string; meta?: any }
  | { status: 'error'; code?: string; message: string };

export async function uploadAndConvert(
  files: File[],
  targetFormat: string
): Promise<ConvertResponse> {
  const form = new FormData();

  // Append each file with 'files[]' key
  files.forEach((file) => {
    form.append('files[]', file);
  });

  // Append target format
  form.append('targetFormat', targetFormat);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/convert`, {
      method: 'POST',
      body: form,
    });
  } catch (fetchError: any) {
    // Handle network errors (server not running, CORS, etc.)
    if (fetchError.message?.includes('fetch') || fetchError.message?.includes('Failed to fetch') || fetchError.name === 'TypeError') {
      throw new Error('Network error: Could not connect to the server. Please make sure the backend server is running on http://localhost:3000');
    }
    throw fetchError;
  }

  // Check if response is HTML (404 page or error page)
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype')) {
    throw new Error('Server returned HTML instead of JSON. Check API URL. Make sure backend is running on http://localhost:3000');
  }

  // Parse JSON response
  let data;
  try {
    data = JSON.parse(text);
  } catch (parseError) {
    throw new Error(`Failed to parse JSON response. Server returned: ${text.substring(0, 100)}...`);
  }

  // If HTTP status is not 2xx, throw error
  if (!response.ok) {
    // Handle quota/rate limit errors (429)
    if (response.status === 429) {
      const errorMsg = data.error?.message || data.message || 'Rate limit or quota exceeded';
      throw new Error(errorMsg);
    }
    
    // Handle other errors
    throw new Error(
      data.message || data.error?.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // If API returned error status, throw error
  if (data.status === 'error' || data.success === false) {
    const errorMsg = data.message || data.error?.message || 'Conversion failed';
    throw new Error(errorMsg);
  }

  // Return success response
  return data as ConvertResponse;
}

