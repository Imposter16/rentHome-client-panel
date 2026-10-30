import { apiClient } from './apiClient';

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
  ownerEmail?: string;
  ownerName?: string;
  description?: string;
  securityDeposit?: number;
  address?: string;
  city?: string;
  isAvailable?: boolean;
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
}

export interface BookingInquiryResponse {
  id: number;
  fullName: string;
  occupation: string;
  monthlyNetIncome: number;
  numberOfOccupants: number;
  preferredMoveInDate: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'VISIT_SCHEDULED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  property: PropertyDetails;
  remarks?: string;
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
 * GET /api/app/tenant/properties/{id}
 */
export async function fetchPropertyById(id: string | number): Promise<PropertyDetails> {
  return apiClient.get<PropertyDetails>(`/app/tenant/properties/${id}`);
}

/**
 * Submit rental booking inquiry application
 * POST /api/app/tenant/bookings/inquire
 */
export async function submitBookingInquiry(payload: BookingInquiryPayload): Promise<BookingInquiryResponse> {
  const formData = new FormData();
  formData.append('propertyId', String(payload.propertyId));
  formData.append('fullName', payload.fullName);
  formData.append('occupation', payload.occupation);
  formData.append('monthlyNetIncome', String(payload.monthlyNetIncome));
  formData.append('numberOfOccupants', String(payload.numberOfOccupants));
  formData.append('preferredMoveInDate', payload.preferredMoveInDate);

  return apiClient.post<BookingInquiryResponse>('/app/tenant/bookings/inquire', formData, true);
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

