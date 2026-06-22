export const APPS_SCRIPT_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbwUEmYMbulz-MNWO4TC6RXPqxp6yCcrMhn9Qx_ktlqsHeuAVYLiiHOfpahzVLgA3_ec/exec';

export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export const fetchApi = async (
  action: string, 
  payload: Record<string, any> = {}, 
  method: 'GET' | 'POST' = 'POST'
): Promise<ApiResponse> => {
  try {
    let url = APPS_SCRIPT_URL;
    let options: RequestInit = { method };

    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...payload });
      // Remove any undefined or null values from payload
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    } else {
      // JSON.stringify for POST
      options.body = JSON.stringify({ action, ...payload });
    }

    const res = await fetch(url, options);
    const data = await res.json();
    
    // Normalize data property for React components
    if (data.success) {
      if (data.users && !data.data) data.data = data.users;
      if (data.requests && !data.data) data.data = data.requests;
      if (data.reports && !data.data) data.data = data.reports;
      if (data.tasks && !data.data) data.data = data.tasks;
      if (data.records && !data.data) data.data = data.records;
      if (data.config && !data.data) data.data = data.config;
      if (data.holidays && !data.data) data.data = data.holidays;
      if (data.positions && !data.data) data.data = data.positions;
      if (data.divisions && !data.data) data.data = data.divisions;
      if (data.report && !data.data) data.data = data.report;
    }

    return data as ApiResponse;
  } catch (error: any) {
    console.error('API Error:', error);
    return { success: false, message: 'Gagal terhubung ke server. Cek koneksi internet Anda.' };
  }
};

/**
 * Convert any Google Drive URL to a public thumbnail URL that browsers can render without CORS issues.
 */
export const formatDriveUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  // Already a thumbnail / googleusercontent CDN url -- keep it
  if (url.includes('drive.google.com/thumbnail')) return url;
  // lh3 redirect -- replace with thumbnail api
  let id = '';
  const matchId = url.match(/[?&]id=([^&]+)/);
  if (matchId) {
    id = matchId[1];
  } else {
    const matchD = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (matchD) id = matchD[1];
  }
  if (id) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  }
  return url;
};
