const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export type ConvertResponse =
  | { status: 'success'; mode: 'single'; downloadUrl: string; meta?: any }
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

  const response = await fetch(`${API_BASE_URL}/api/convert`, {
    method: 'POST',
    body: form,
  });

  // Parse JSON response
  const data = await response.json();

  // If HTTP status is not 2xx, throw error
  if (!response.ok) {
    throw new Error(
      data.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // If API returned error status, throw error
  if (data.status === 'error') {
    throw new Error(data.message || 'Conversion failed');
  }

  // Return success response
  return data as ConvertResponse;
}

