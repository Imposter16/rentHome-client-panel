import { apiClient, setAuthToken, clearAuthToken } from './apiClient';
import { UserProfile } from './tenantApi';

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  userType: 'TENANT' | 'LANDLORD';
}

/**
 * Authenticates user via email/mobile + password
 * POST /api/app/auth/login
 */
export async function loginUser(identifier: string, password: string): Promise<AuthResponse> {
  const formData = new FormData();
  formData.append('identifier', identifier.trim());
  formData.append('password', password);

  const response = await apiClient.post<AuthResponse>('/app/auth/login', formData, true);
  if (response?.token) {
    setAuthToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('renthome_user', JSON.stringify(response.user));
    }
  }
  return response;
}

/**
 * Onboards a new user (Tenant or Landlord)
 * POST /api/app/auth/register
 */
export async function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('fullName', payload.fullName.trim());
  formData.append('email', payload.email.trim());
  formData.append('mobileNumber', payload.mobileNumber.trim());
  formData.append('password', payload.password);
  formData.append('userType', payload.userType);

  return apiClient.post<UserProfile>('/app/auth/register', formData, true);
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('renthome_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout(): void {
  clearAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
