import { apiClient } from './client';

export const authService = {
  login: async (email: string, password: string) => {
    // FastAPI OAuth2PasswordRequestForm expects URL-encoded form data
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 expects 'username', not 'email'
    formData.append('password', password);

    const response = await apiClient.post<{ access_token: string; token_type: string }>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },
  
  register: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/register', { email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  }
};
