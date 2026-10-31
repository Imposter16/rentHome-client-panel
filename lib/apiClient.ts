/**
 * Centralized API Client for RentHome Web Client
 * 
 * Strict Architectural Rules:
 * - Base URL: http://localhost:8080/api
 * - Uses ONLY GET and POST HTTP methods (No PUT, PATCH, DELETE)
 * - Standardized ApiResponse unwrap: { status: boolean, message: string, data: T }
 * - Attaches Authorization: Bearer <token> from localStorage / cookie
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('renthome_token') || getCookie('renthome_token');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('renthome_token', token);
  document.cookie = `renthome_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('renthome_token');
  localStorage.removeItem('renthome_user');
  document.cookie = 'renthome_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

import Swal from 'sweetalert2';

let isSessionExpiring = false;

export function handleSessionExpired(): void {
  // a. Instantly purge all saved auth tokens and user data
  clearAuthToken();

  if (typeof window === 'undefined') return;
  if (isSessionExpiring) return;
  isSessionExpiring = true;

  // b. Trigger SweetAlert2 popup
  Swal.fire({
    title: 'Session Expired',
    text: 'Your session has expired or is unauthenticated. Please log in again.',
    icon: 'warning',
    confirmButtonText: 'Log In Now',
    confirmButtonColor: '#4f46e5',
    allowOutsideClick: true,
    allowEscapeKey: true,
  }).then(() => {
    // c. Forcefully redirect to /login
    isSessionExpiring = false;
    window.location.href = '/login';
  });
}

export function isSessionExpiredPayload(status: number, payload: any): boolean {
  if (status === 401) {
    return true;
  }
  if (payload && typeof payload === 'object') {
    if (payload.status === false && typeof payload.message === 'string') {
      const msg = payload.message.toLowerCase();
      if (
        msg.includes('user is not authenticated') ||
        msg.includes('token expired') ||
        msg.includes('unauthorized')
      ) {
        return true;
      }
    }
  }
  return false;
}

async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: any,
  isFormData: boolean = false
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let finalBody = body;
  if (body && !isFormData && method === 'POST') {
    headers['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === 'POST' ? finalBody : undefined,
    });

    const text = await res.text();
    let json: ApiResponse<T> | null = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    // Inspect API response payload & status for session expiration
    if (isSessionExpiredPayload(res.status, json)) {
      handleSessionExpired();
      const errorMsg = json?.message || 'Your session has expired or is unauthenticated. Please log in again.';
      throw new Error(errorMsg);
    }

    if (!res.ok) {
      const errorMsg = json?.message || `Request failed (${res.status})`;
      throw new Error(errorMsg);
    }

    if (json) {
      if (json.status === false) {
        throw new Error(json.message || 'Operation failed');
      }
      return json.data as T;
    }

    throw new Error('Empty response from server');
  } catch (err: any) {
    console.error(`[API Error] ${method} ${url}:`, err.message);
    throw err;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return request<T>(url, 'GET');
  },

  post: <T>(endpoint: string, body?: any, isFormData: boolean = false) => {
    return request<T>(endpoint, 'POST', body, isFormData);
  },
};
