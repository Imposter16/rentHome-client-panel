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
  FileText
} from 'lucide-react';

export default function LandlordDashboardPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
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
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    amenities: 'WiFi, Pool, Garden, Parking'
  });

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

  const handleUploadProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        monthlyRent: Number(form.monthlyRent),
        securityDeposit: Number(form.securityDeposit),
        address: form.address,
        city: form.city,
        beds: Number(form.beds),
        baths: Number(form.baths),
        sqft: Number(form.sqft),
        imageUrl: form.imageUrl,
        amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean)
      };

      await apiClient.post('/app/landlord/properties', payload);
      setModalOpen(false);
      setForm({
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
        imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
        amenities: 'WiFi, Pool, Garden, Parking'
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to upload property');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async (id: number) => {
    try {
      await apiClient.post(`/app/landlord/properties/${id}/toggle-availability`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
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
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">RentHome</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                Landlord Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
              title="My Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.profileImageUrl || (user?.profileImage && user?.profileImage.startsWith('http')) ? (
                  <img
                    src={user.profileImageUrl || user.profileImage}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name ? user.name[0].toUpperCase() : 'L'
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Landlord'}</div>
                <div className="text-[10px] text-purple-700 font-semibold">Account Settings</div>
              </div>
            </Link>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">My Listings</div>
              <div className="text-2xl font-bold font-display text-slate-900">{properties.length}</div>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Inbound Inquiries</div>
              <div className="text-2xl font-bold font-display text-slate-900">{bookings.length}</div>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Active Rentals</div>
              <div className="text-2xl font-bold font-display text-slate-900">
                {properties.filter((p) => p.isAvailable).length}
              </div>
            </div>
          </div>
        </div>

        {/* Inbound Booking Inquiries */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">Inbound Rental Applications</h2>
              <p className="text-xs text-slate-500">Tenant inquiries submitted for your properties</p>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
              {bookings.length} Total
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No tenant applications received yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((booking) => (
                <div key={booking.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{booking.fullName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700">
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {booking.occupation} • Net Income: ${booking.monthlyNetIncome?.toLocaleString()} / mo • Occupants: {booking.numberOfOccupants}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Property: <strong>{booking.property?.name}</strong> • Preferred Move-in: {booking.preferredMoveInDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs text-slate-400">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Properties List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">Portfolio Properties</h2>
              <p className="text-xs text-slate-500">Manage availability and review statuses</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Property</span>
              </button>
              <Link
                href="/properties"
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
              >
                <span>Marketplace</span>
                <Eye className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No properties listed yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {properties.map((prop) => (
                <div key={prop.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={prop.imageUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80'}
                      alt={prop.title || prop.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{prop.title || prop.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                          {prop.category}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          prop.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {prop.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        ${prop.monthlyRent || prop.price} / mo • {prop.beds} beds • {prop.baths} baths • {prop.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(prop.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        prop.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {prop.isAvailable ? 'Status: Available' : 'Status: Unavailable'}
                    </button>
                    <Link
                      href={`/properties/${prop.id}`}
                      className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      title="View public listing"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Property Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-lg font-bold font-display text-slate-900">Post New Property</h3>
                  <p className="text-xs text-slate-500">Submitted listings require admin approval before appearing publicly.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadProperty} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Property Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Test Villa"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street Address"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent ($) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.monthlyRent}
                      onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit ($) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.securityDeposit}
                      onChange={(e) => setForm({ ...form, securityDeposit: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit for Approval</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
