import { apiClient } from './apiClient';
import { getCurrentUser } from './authApi';

export interface PropertyDetails {
  id: number;
  name: string;
  location: string;
  price: number;
  landlord: string;
  category: 'ROOM' | 'PG' | 'FLAT' | 'APARTMENT' | 'VILLA';
  beds: number;
  baths: number;
  sqft: number;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  imageUrls?: string[];
  ownerEmail?: string;
  ownerName?: string;
  description?: string;
  securityDeposit?: number;
  address?: string;
  city?: string;
  isAvailable?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  averageRating?: number;
  totalReviews?: number;
}

export interface BookingInquiryPayload {
  propertyId: number;
  fullName: string;
  occupation: string;
  monthlyNetIncome: number;
  numberOfOccupants: number;
  preferredMoveInDate: string; // YYYY-MM-DD
  preferredVisitSlot?: string; // e.g. "2026-11-02 10:00 AM"
}

export interface BookingInquiryResponse {
  id: number;
  fullName: string;
  occupation: string;
  monthlyNetIncome: number;
  numberOfOccupants: number;
  preferredMoveInDate: string;
  preferredVisitSlot?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'VISIT_SCHEDULED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  property: PropertyDetails;
  remarks?: string;
  tenantEmail?: string;
  tenantMobile?: string;
  tenantName?: string;
  propertyName?: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  countryCode: string;
  mobileNumber: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  profileImage?: string;
  profileImageUrl?: string;
  userType: 'TENANT' | 'LANDLORD' | 'ADMIN';
  status: string;
  isPrime?: boolean;
}

export interface PropertyFilterParams {
  keyword?: string;
  location?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'submittedDate';
  page?: number;
  size?: number;
}

/**
 * Fetch list of approved & available properties with optional filters
 * GET /api/app/tenant/properties
 */
export async function fetchProperties(filters?: PropertyFilterParams): Promise<PropertyDetails[]> {
  return apiClient.get<PropertyDetails[]>('/app/tenant/properties', filters);
}

/**
 * Fetch detailed single property by ID
 * Supports both tenant view and landlord owner preview (even if pending approval)
 * GET /api/app/tenant/properties/{id} with fallback to /api/app/landlord/properties/{id}
 */
export async function fetchPropertyById(id: string | number): Promise<PropertyDetails> {
  try {
    return await apiClient.get<PropertyDetails>(`/app/tenant/properties/${id}`);
  } catch (err: any) {
    const user = getCurrentUser();
    if (user?.userType === 'LANDLORD') {
      try {
        const landlordProp = await apiClient.get<any>(`/app/landlord/properties/${id}`);
        if (landlordProp) {
          return {
            id: landlordProp.id,
            name: landlordProp.title,
            location: (landlordProp.address ? `${landlordProp.address}, ${landlordProp.city || ''}` : landlordProp.city) || '',
            price: landlordProp.monthlyRent,
            landlord: user.name || 'Owner',
            category: landlordProp.category,
            beds: landlordProp.beds || 0,
            baths: landlordProp.baths || 0,
            sqft: landlordProp.sqft || 0,
            amenities: landlordProp.amenities || [],
            latitude: landlordProp.latitude,
            longitude: landlordProp.longitude,
            imageUrl: landlordProp.imageUrl,
            imageUrls: landlordProp.imageUrls || (landlordProp.imageUrl ? landlordProp.imageUrl.split(',').filter(Boolean) : []),
            ownerEmail: user.email,
            ownerName: user.name,
            description: landlordProp.description,
            securityDeposit: landlordProp.securityDeposit,
            address: landlordProp.address,
            city: landlordProp.city,
            isAvailable: landlordProp.isAvailable,
            status: landlordProp.status,
          };
        }
      } catch {
        // Fall back to original error
      }
    }
    throw err;
  }
}

/**
 * Submit rental booking inquiry application
 * POST /api/app/tenant/bookings/inquire
 */
export async function submitBookingInquiry(payload: BookingInquiryPayload): Promise<BookingInquiryResponse> {
  return apiClient.post<BookingInquiryResponse>('/app/tenant/bookings/inquire', payload);
}

/**
 * Fetch current authenticated tenant's booking inquiry history
 * GET /api/app/tenant/bookings
 */
export async function fetchUserBookings(): Promise<BookingInquiryResponse[]> {
  return apiClient.get<BookingInquiryResponse[]>('/app/tenant/bookings');
}

/**
 * Fetch details of a specific booking inquiry made by tenant
 * GET /api/app/tenant/bookings/{id}
 */
export async function fetchBookingById(id: string | number): Promise<BookingInquiryResponse> {
  return apiClient.get<BookingInquiryResponse>(`/app/tenant/bookings/${id}`);
}

/**
 * Self-cancel an unfinalized booking inquiry
 * POST /api/app/tenant/bookings/{id}/cancel
 */
export async function cancelBookingInquiry(id: string | number): Promise<BookingInquiryResponse> {
  return apiClient.post<BookingInquiryResponse>(`/app/tenant/bookings/${id}/cancel`);
}

import { getUserProfile, updateUserProfile, changePassword } from './userApi';
export { getUserProfile, updateUserProfile, changePassword };

/**
 * Fetch authenticated user profile for auto-fill & settings
 * GET /api/app/user/profile
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  return getUserProfile();
}

export interface PropertyReview {
  id: number;
  tenantName: string;
  tenantProfileImage?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PropertyRatingSummary {
  averageRating: number;
  totalReviews: number;
  reviewsList: PropertyReview[];
}

export interface SubmitReviewRequest {
  propertyId: number;
  rating: number;
  comment: string;
}

/**
 * Submit property review and rating by authenticated tenant
 * POST /api/app/tenant/reviews/submit
 */
export async function submitPropertyReview(payload: SubmitReviewRequest): Promise<PropertyReview> {
  return apiClient.post<PropertyReview>('/app/tenant/reviews/submit', payload);
}

/**
 * Fetch rating summary and reviews for a property
 * GET /api/app/properties/{propertyId}/reviews
 */
export async function fetchPropertyReviews(propertyId: string | number): Promise<PropertyRatingSummary> {
  return apiClient.get<PropertyRatingSummary>(`/app/properties/${propertyId}/reviews`);
}

