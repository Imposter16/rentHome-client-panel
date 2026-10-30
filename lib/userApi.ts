import { apiClient } from './apiClient';
import { UserProfile } from './tenantApi';

export type { UserProfile };

export interface UpdateUserProfilePayload {
  name?: string;
  countryCode?: string;
  mobileNumber?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  profileImageUrl?: string;
  profileImage?: File | null;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Fetches the currently authenticated user's profile
 * GET /api/app/user/profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const profile = await apiClient.get<UserProfile>('/app/user/profile');
  if (typeof window !== 'undefined' && profile) {
    localStorage.setItem('renthome_user', JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('renthome_user_updated', { detail: profile }));
  }
  return profile;
}

/**
 * Updates user profile details (supports both JSON and multipart form-data for avatar upload)
 * POST /api/app/user/profile/update
 */
export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
  let updatedUser: UserProfile;

  if (payload.profileImage instanceof File) {
    const formData = new FormData();
    if (payload.name) formData.append('name', payload.name.trim());
    if (payload.countryCode) formData.append('countryCode', payload.countryCode.trim());
    if (payload.mobileNumber) formData.append('mobileNumber', payload.mobileNumber.trim());
    if (payload.address !== undefined) formData.append('address', payload.address.trim());
    if (payload.latitude !== undefined && payload.latitude !== null && !isNaN(payload.latitude)) {
      formData.append('latitude', String(payload.latitude));
    }
    if (payload.longitude !== undefined && payload.longitude !== null && !isNaN(payload.longitude)) {
      formData.append('longitude', String(payload.longitude));
    }
    if (payload.profileImageUrl) formData.append('profileImageUrl', payload.profileImageUrl.trim());
    formData.append('profileImage', payload.profileImage);

    updatedUser = await apiClient.post<UserProfile>('/app/user/profile/update', formData, true);
  } else {
    const body: Record<string, any> = {};
    if (payload.name !== undefined) body.name = payload.name.trim();
    if (payload.countryCode !== undefined) body.countryCode = payload.countryCode.trim();
    if (payload.mobileNumber !== undefined) body.mobileNumber = payload.mobileNumber.trim();
    if (payload.address !== undefined) body.address = payload.address.trim();
    if (payload.latitude !== undefined && payload.latitude !== null && !isNaN(payload.latitude)) {
      body.latitude = payload.latitude;
    }
    if (payload.longitude !== undefined && payload.longitude !== null && !isNaN(payload.longitude)) {
      body.longitude = payload.longitude;
    }
    if (payload.profileImageUrl !== undefined) body.profileImageUrl = payload.profileImageUrl.trim();

    updatedUser = await apiClient.post<UserProfile>('/app/user/profile/update', body);
  }

  if (typeof window !== 'undefined' && updatedUser) {
    localStorage.setItem('renthome_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent('renthome_user_updated', { detail: updatedUser }));
  }

  return updatedUser;
}

/**
 * Changes user password after validating current password
 * POST /api/app/user/change-password
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  return apiClient.post<void>('/app/user/change-password', payload);
}
