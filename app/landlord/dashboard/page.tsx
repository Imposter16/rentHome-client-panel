'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/authApi';
import { apiClient } from '@/lib/apiClient';
import {
  Building2,
  Users,
  CalendarCheck,
  CheckCircle,
  Clock,
  LogOut,
  PlusCircle,
  Eye,
  ShieldCheck,
  Loader2,
  TrendingUp,
  FileText,
  Pencil,
  Lock
} from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import ImageUploader, { ImageItem, parseImageUrlsToItems } from '@/components/ImageUploader';
import { showToast, toast } from '@/components/Toast';

const defaultSampleImages: ImageItem[] = [
  { id: 'sample-1', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80', isExisting: true },
  { id: 'sample-2', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', isExisting: true },
  { id: 'sample-3', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', isExisting: true }
];

function LandlordDashboardInner() {
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [images, setImages] = useState<ImageItem[]>(defaultSampleImages);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState = {
    title: '',
    description: '',
    category: 'VILLA',
    monthlyRent: 2500,
    securityDeposit: 5000,
    address: '123 Palm Ave',
    city: 'Miami',
    beds: 3,
    baths: 2,
    sqft: 2000,
    amenities: 'WiFi, Pool, Garden, Parking'
  };

  const [form, setForm] = useState(initialFormState);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    const handleUserUpdate = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
      } else {
        setUser(getCurrentUser());
      }
    };
    window.addEventListener('renthome_user_updated', handleUserUpdate);
    return () => window.removeEventListener('renthome_user_updated', handleUserUpdate);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propsData, bookingsData] = await Promise.allSettled([
        apiClient.get<any[]>('/app/landlord/properties'),
        apiClient.get<any[]>('/app/landlord/bookings')
      ]);

      if (propsData.status === 'fulfilled') setProperties(propsData.value || []);
      if (bookingsData.status === 'fulfilled') setBookings(bookingsData.value || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPropertyId(null);
    setForm(initialFormState);
    setImages(defaultSampleImages);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (prop: any) => {
    setEditingPropertyId(prop.id);
    setForm({
      title: prop.title || prop.name || '',
      description: prop.description || '',
      category: prop.category || 'VILLA',
      monthlyRent: prop.monthlyRent || prop.price || 0,
      securityDeposit: prop.securityDeposit || 0,
      address: prop.address || prop.location || '',
      city: prop.city || '',
      beds: prop.beds || 1,
      baths: prop.baths || 1,
      sqft: prop.sqft || 500,
      amenities: Array.isArray(prop.amenities)
        ? prop.amenities.join(', ')
        : (prop.amenities || 'WiFi, AC')
    });

    const parsedImages = parseImageUrlsToItems(prop.imageUrls || prop.imageUrl);
    setImages(parsedImages.length > 0 ? parsedImages : defaultSampleImages);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Business rule: Minimum 3 photos, Maximum 10 photos
    if (images.length < 3) {
      setFormError(`At least 3 photos are required for listing submission (currently ${images.length}/3). Please add more photos.`);
      return;
    }
    if (images.length > 10) {
      setFormError(`Maximum 10 photos allowed (currently ${images.length}/10). Please remove excess photos.`);
      return;
    }

    try {
      setSubmitting(true);

      // Bundle into multipart/form-data
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('monthlyRent', String(Number(form.monthlyRent)));
      formData.append('securityDeposit', String(Number(form.securityDeposit)));
      formData.append('address', form.address.trim());
      formData.append('city', form.city.trim());
      formData.append('beds', String(Number(form.beds)));
      formData.append('baths', String(Number(form.baths)));
      formData.append('sqft', String(Number(form.sqft)));

      // Amenities array
      const amenitiesArr = form.amenities.split(',').map((s) => s.trim()).filter(Boolean);
      amenitiesArr.forEach((amenity) => {
        formData.append('amenities', amenity);
      });

      // Images: append newly selected files to 'images' and retained URLs to 'imageUrls'
      images.forEach((img) => {
        if (img.file) {
          formData.append('images', img.file);
        } else if (img.url && !img.url.startsWith('blob:')) {
          formData.append('imageUrls', img.url);
        }
      });

      if (editingPropertyId) {
        await apiClient.post(`/app/landlord/properties/${editingPropertyId}/update`, formData, true);
      } else {
        await apiClient.post('/app/landlord/properties', formData, true);
      }

      setModalOpen(false);
      setEditingPropertyId(null);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save property listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (id: number) => {
    const target = properties.find((p) => p.id === id);
    if (target && target.status !== 'APPROVED') {
      showToast('Availability can only be toggled for properties approved by an admin.', 'warning');
      return;
    }
    try {
      await apiClient.post(`/app/landlord/properties/${id}/toggle-availability`);
      showToast('Property availability toggled successfully.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle availability', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-slate-900 tracking-tight">RentHome</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  Landlord Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500">Property portfolio & booking inquiries</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                {user?.profileImageUrl || (user?.profileImage && user?.profileImage.startsWith('http')) ? (
                  <img
                    src={user.profileImageUrl || user.profileImage}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'L'}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                  {user?.name || 'Landlord'}
                </p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">Account & Settings</p>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                Verified Landlord Partner
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display">Manage Your Listings</h1>
            <p className="text-indigo-200 text-xs mt-1">
              Upload properties with high-resolution image galleries, track approval status, and manage inquiry requests.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 font-bold rounded-xl text-xs hover:bg-indigo-50 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Post New Property</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Properties</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-display text-slate-900 mt-2">
              {properties.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Approved Listings</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-display text-emerald-600 mt-2">
              {properties.filter((p) => p.status === 'APPROVED').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-display text-amber-600 mt-2">
              {properties.filter((p) => p.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Booking Inquiries</span>
              <CalendarCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold font-display text-purple-600 mt-2">
              {bookings.length}
            </div>
          </div>
        </div>

        {/* Properties Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">My Properties</h2>
              <p className="text-xs text-slate-500">Real-time status of your active and pending property submissions</p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Listing</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading properties...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">No properties listed yet.</p>
              <p className="text-xs text-slate-400">Click &quot;Post New Property&quot; to submit your first room, flat, or apartment.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.map((prop) => {
                const firstImage =
                  (prop.imageUrls && prop.imageUrls[0]) ||
                  (prop.imageUrl ? prop.imageUrl.split(',')[0].trim() : '') ||
                  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80';

                const photoCount = prop.imageUrls?.length || (prop.imageUrl ? prop.imageUrl.split(',').filter(Boolean).length : 0);

                return (
                  <div key={prop.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={firstImage}
                          alt={prop.title || prop.name}
                          className="w-full h-full object-cover"
                        />
                        {photoCount > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                            {photoCount} photos
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{prop.title || prop.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                            {prop.category}
                          </span>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            prop.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                              : prop.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200/80'
                              : 'bg-amber-50 text-amber-800 border-amber-200/80'
                          }`}>
                            {prop.status === 'PENDING'
                              ? 'PENDING ADMIN APPROVAL'
                              : prop.status === 'APPROVED'
                              ? 'APPROVED'
                              : prop.status === 'REJECTED'
                              ? 'REJECTED'
                              : prop.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          ${prop.monthlyRent || prop.price} / mo • {prop.beds} beds • {prop.baths} baths • {prop.city}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(prop.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          prop.status !== 'APPROVED'
                            ? 'bg-slate-100 text-slate-400 border border-slate-200/80 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
                            : prop.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title={
                          prop.status !== 'APPROVED'
                            ? 'Approval required to toggle availability'
                            : prop.isAvailable
                            ? 'Currently listed for rent. Click to pause.'
                            : 'Currently paused/hidden. Click to list as available.'
                        }
                      >
                        {prop.status !== 'APPROVED' ? (
                          <>
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Availability Locked</span>
                          </>
                        ) : prop.isAvailable ? (
                          'Status: Available'
                        ) : (
                          'Status: Paused'
                        )}
                      </button>

                      {/* Edit Property Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prop)}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer shadow-2xs"
                        title="Edit property details & photos"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Public listing view button */}
                      <Link
                        href={`/properties/${prop.id}`}
                        className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="View public listing"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inquiries Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold font-display text-slate-900">Tenant Booking Inquiries</h2>
            <p className="text-xs text-slate-500">Inbound requests from prospective tenants interested in your listings</p>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading inquiries...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-1">
              <CalendarCheck className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-xs font-medium">No booking inquiries received yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <div key={b.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{b.tenantName}</span>
                      <span className="text-[10px] text-slate-400">• {b.tenantEmail}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Property: <span className="font-semibold text-slate-800">{b.propertyName}</span>
                    </p>
                    {b.message && (
                      <p className="text-xs text-slate-500 italic mt-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        &quot;{b.message}&quot;
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                      {b.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tour: {b.preferredTourDate || 'Not specified'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload / Edit Property Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[92vh]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-lg font-bold font-display text-slate-900">
                    {editingPropertyId ? 'Edit Property Listing' : 'Post New Property'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPropertyId
                      ? 'Update listing details and manage high-quality gallery photos.'
                      : 'Submitted listings require admin approval before appearing publicly.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProperty} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Property Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Skyline Heights Penthouse"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="VILLA">Villa</option>
                      <option value="APARTMENT">Apartment</option>
                      <option value="FLAT">Flat</option>
                      <option value="ROOM">Room</option>
                      <option value="PG">PG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent ($) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.monthlyRent}
                      onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit ($) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.securityDeposit}
                      onChange={(e) => setForm({ ...form, securityDeposit: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Miami"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. 123 Palm Ave"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Beds *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.beds}
                      onChange={(e) => setForm({ ...form, beds: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Baths *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.baths}
                      onChange={(e) => setForm({ ...form, baths: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sqft *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.sqft}
                      onChange={(e) => setForm({ ...form, sqft: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Professional Multi-Image Uploader Component */}
                <div className="pt-2 pb-2">
                  <ImageUploader
                    images={images}
                    onChange={setImages}
                    min={3}
                    max={10}
                    label="Property Listing Photos"
                    helperText="Upload 3 to 10 photos. The first photo will be used as the hero cover across all tenant searches."
                    themeColor="indigo"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={form.amenities}
                    onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                    placeholder="WiFi, Pool, Garden, Parking"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Property overview..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {images.length < 3 ? (
                      <span className="text-amber-600 font-semibold">⚠️ Minimum 3 photos required</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">✓ {images.length} photos ready for submission</span>
                    )}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || images.length < 3 || images.length > 10}
                      className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{editingPropertyId ? 'Save Changes' : 'Submit Listing for Approval'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LandlordDashboardPage() {
  return (
    <RoleGuard allowedRoles={['LANDLORD']}>
      <LandlordDashboardInner />
    </RoleGuard>
  );
}
