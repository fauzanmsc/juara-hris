const _e = "Y2V4ZS9ndFNtM3hIdFVydmtRZHhkaUxGVHk2QzM2YnNDNENUQkdjSWxlY09GQ2p6OVBuWEVVUEliVmhLR3VybkRjSUtmeXliY3lmS0Evcy9zb3JjYW0vbW9jLmVsZ29vZy50cGlyY3MvLzpzcHR0aA==";
export const APPS_SCRIPT_URL = import.meta.env.VITE_GAS_URL || atob(_e).split('').reverse().join('');

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
      if (data.holidays && !data.data) data.data = data.holidays;
      if (data.config && !data.data) data.data = data.config;
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
