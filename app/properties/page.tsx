'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchProperties, PropertyDetails } from '@/lib/tenantApi';
import { getCurrentUser, logout } from '@/lib/authApi';
import {
  Building2,
  Search,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Filter,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Star,
  User,
  Settings
} from 'lucide-react';
import { UserProfile } from '@/lib/userApi';

export default function PropertiesDiscoveryPage() {
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<'submittedDate' | 'price_asc' | 'price_desc'>('submittedDate');

  const [user, setUser] = useState<UserProfile | null>(null);

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

  const loadProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProperties({
        keyword: keyword.trim() || undefined,
        category: category || undefined,
        sortBy,
      });
      setProperties(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [category, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProperties();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">RentHome</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Tenant Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
                  title="My Profile & Settings"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.profileImageUrl || (user.profileImage && user.profileImage.startsWith('http')) ? (
                      <img
                        src={user.profileImageUrl || user.profileImage}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name ? user.name[0].toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Account Settings</div>
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
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Search Banner */}
      <section className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white px-4 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-indigo-200 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Find Verified Premium Rentals with Instant Screening</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white">
            Discover Your Next Ideal Home
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Browse verified listings directly uploaded by verified landlords with instant tour scheduling and paperless application workflows.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="pt-4 max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by city, neighborhood, or building name..."
                className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg"
              />
            </div>
            <button
              type="submit"
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] font-bold text-sm text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Category Pills & Sorting Filter Strip */}
      <section className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { label: 'All Listings', value: '' },
              { label: 'Apartments', value: 'APARTMENT' },
              { label: 'Flats', value: 'FLAT' },
              { label: 'Villas', value: 'VILLA' },
              { label: 'Rooms', value: 'ROOM' },
              { label: 'PG / Co-living', value: 'PG' },
            ].map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  category === cat.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="submittedDate">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading verified properties...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">Unable to Fetch Properties</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
            <button
              onClick={loadProperties}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Listings Matched Your Search</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria, removing category filters, or exploring all properties.
            </p>
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                setCategory('');
                setSortBy('submittedDate');
              }}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {properties.map((prop) => (
              <Link
                key={prop.id}
                href={`/properties/${prop.id}`}
                className="group bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg transition-all overflow-hidden flex flex-col"
              >
                {/* Property Card Hero Image */}
                <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                  <img
                    src={prop.imageUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'}
                    alt={prop.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-white/95 text-slate-900 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Verified
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-slate-950/70 text-white px-2 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-xs">
                      {prop.category}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-xl font-bold font-display text-slate-900">
                        ${prop.price?.toLocaleString()}
                        <span className="text-xs font-medium text-slate-500"> / mo</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 shadow-2xs">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{prop.averageRating && prop.averageRating > 0 ? prop.averageRating.toFixed(1) : 'New'}</span>
                          {prop.totalReviews && prop.totalReviews > 0 ? (
                            <span className="text-[10px] text-amber-800/80 font-medium">({prop.totalReviews})</span>
                          ) : null}
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {prop.name}
                    </h3>

                    <p className="flex items-center gap-1 text-slate-500 text-xs mt-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{prop.address ? `${prop.address}, ${prop.city}` : prop.location}</span>
                    </p>
                  </div>

                  {/* Specs footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-medium">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.beds || 1} bd</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.baths || 1} ba</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prop.sqft || 800} sqft</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
