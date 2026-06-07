const _e = "Y2V4ZS9jZV8zQWdMVnpoYXBmT0hpaUxZVkF1ZUhzcWx0a194UTluaE1yY0N5NnB4cVBYUjZDVDRPV05NLXpsdWJNWW1FVXdiY3lmS0Evcy9zb3JjYW0vbW9jLmVsZ29vZy50cGlyY3MvLzpzcHR0aA==";
export const APPS_SCRIPT_URL = atob(_e).split('').reverse().join('');

export interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export const fetchApi = async (action: string, payload: Record<string, any> = {}): Promise<ApiResponse> => {
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  } catch (error: any) {
    console.error('API Error:', error);
    return { success: false, message: 'Gagal terhubung ke server. Cek koneksi internet Anda.' };
  }
};
