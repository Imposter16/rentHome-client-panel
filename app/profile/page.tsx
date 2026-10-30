'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getUserProfile,
  updateUserProfile,
  changePassword,
  UserProfile,
} from '@/lib/userApi';
import { getCurrentUser, logout } from '@/lib/authApi';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Compass,
  ShieldCheck,
  Key,
  Lock,
  Camera,
  Upload,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Sparkles,
  ArrowLeft,
  LogOut,
  Eye,
  EyeOff,
  Star,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Award,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  // Active Tab: 'details' | 'security' | 'overview'
  const [activeTab, setActiveTab] = useState<'details' | 'security' | 'overview'>('details');

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form State: Personal Details
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status Alerts
  const [submittingDetails, setSubmittingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [detectingGps, setDetectingGps] = useState(false);

  // Initial Load
  useEffect(() => {
    const cachedUser = getCurrentUser();
    if (!cachedUser) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const data = await getUserProfile();
        populateForm(data);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        // Fallback to cached user if backend network hiccup
        if (cachedUser) {
          populateForm(cachedUser);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const populateForm = (data: UserProfile) => {
    setProfile(data);
    setName(data.name || '');
    setCountryCode(data.countryCode || '+1');
    setMobileNumber(data.mobileNumber || '');
    setAddress(data.address || '');
    setLatitude(data.latitude !== undefined && data.latitude !== null ? data.latitude : '');
    setLongitude(data.longitude !== undefined && data.longitude !== null ? data.longitude : '');
    setProfileImageUrl(data.profileImageUrl || (data.profileImage?.startsWith('http') ? data.profileImage : ''));
    if (data.profileImageUrl) {
      setAvatarPreview(data.profileImageUrl);
    } else if (data.profileImage?.startsWith('http')) {
      setAvatarPreview(data.profileImage);
    } else {
      setAvatarPreview(null);
    }
  };

  // Avatar file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setDetailsSuccess(null);
      setDetailsError(null);
    }
  };

  // Detect GPS
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetailsError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(6)));
        setLongitude(Number(position.coords.longitude.toFixed(6)));
        setDetectingGps(false);
        setDetailsSuccess('Current GPS coordinates detected successfully.');
        setTimeout(() => setDetailsSuccess(null), 3000);
      },
      (error) => {
        setDetectingGps(false);
        setDetailsError(`GPS Detection failed: ${error.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit Profile Details
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    setDetailsSuccess(null);

    if (!name.trim()) {
      setDetailsError('Full name is required.');
      return;
    }

    try {
      setSubmittingDetails(true);
      const updated = await updateUserProfile({
        name: name.trim(),
        countryCode: countryCode.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
        latitude: latitude === '' ? undefined : Number(latitude),
        longitude: longitude === '' ? undefined : Number(longitude),
        profileImageUrl: profileImageUrl.trim() || undefined,
        profileImage: avatarFile,
      });

      populateForm(updated);
      setAvatarFile(null);
      setDetailsSuccess('Your personal profile details have been saved successfully!');
      setTimeout(() => setDetailsSuccess(null), 4000);
    } catch (err: any) {
      setDetailsError(err.message || 'Failed to update profile details.');
    } finally {
      setSubmittingDetails(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }

    try {
      setSubmittingPassword(true);
      await changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess('Password successfully updated! Use your new password on your next login.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium text-sm">Loading account profile...</p>
        </div>
      </div>
    );
  }

  const isLandlord = profile?.userType === 'LANDLORD';
  const roleName = isLandlord ? 'Landlord' : 'Tenant';
  const portalPath = isLandlord ? '/landlord/dashboard' : '/properties';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={portalPath}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Return to portal"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">RentHome</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                Account Settings
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={portalPath}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              {isLandlord ? <Building2 className="w-3.5 h-3.5 text-purple-600" /> : <Compass className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{isLandlord ? 'Landlord Hub' : 'Browse Listings'}</span>
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

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 lg:px-8 py-8 space-y-6">
        
        {/* Profile Hero Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none"></div>

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Circle */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white/20 bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-xl flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={profile?.name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-white">
                    {profile?.name
                      ? profile.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : 'U'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('details');
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="text-center sm:text-left space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  isLandlord
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                }`}>
                  {roleName} Account
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>

                {profile?.isPrime && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    Prime Member
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
                {profile?.name || 'My Profile'}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {profile?.email}
                </span>
                {profile?.mobileNumber && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    {profile.countryCode} {profile.mobileNumber}
                  </span>
                )}
                {profile?.address && (
                  <span className="inline-flex items-center gap-1.5 truncate max-w-xs">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {profile.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Details</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Account Overview</span>
          </button>
        </div>

        {/* TAB A: Personal Details */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold font-display text-slate-900">Personal Details & Contact</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your name, primary contact numbers, physical residence, and GPS coordinates used for rental verification.
              </p>
            </div>

            {detailsSuccess && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{detailsSuccess}</span>
              </div>
            )}

            {detailsError && (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{detailsError}</span>
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="space-y-6">
              
              {/* Avatar Selector Strip */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-lg flex items-center justify-center shrink-0 border border-slate-200">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      'U'
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Profile Photo</div>
                    <p className="text-xs text-slate-500">
                      Upload an official JPG or PNG photo, or provide a public image URL.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Choose File</span>
                    </button>

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                          setProfileImageUrl('');
                        }}
                        className="px-3 py-2 text-slate-400 hover:text-red-600 text-xs font-semibold transition cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Or Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={profileImageUrl}
                    onChange={(e) => {
                      setProfileImageUrl(e.target.value);
                      if (e.target.value.startsWith('http')) {
                        setAvatarPreview(e.target.value);
                      }
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <Lock className="w-2.5 h-2.5" />
                      Verified & Locked
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ''}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                {/* Mobile Number with Country Code */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      placeholder="+1"
                      className="col-span-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none text-center font-semibold transition"
                    />
                    <div className="col-span-3 relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Residential / Operating Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Apartment / Suite number, City, State, ZIP code"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                    />
                  </div>
                </div>

                {/* GPS Latitude & Longitude */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    GPS Latitude
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 40.7128"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      GPS Longitude
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingGps}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      {detectingGps ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <Compass className="w-3 h-3" />
                          <span>Detect Location</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. -74.0060"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={submittingDetails}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {submittingDetails ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile Details...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB B: Security & Password */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold font-display text-slate-900">Security & Credentials</h2>
              <p className="text-xs text-slate-500 mt-1">
                Protect your account by creating a strong password that you do not use on other platforms.
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-xl">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements List */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="font-semibold text-slate-700">Password Checklist:</div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                    newPassword.length >= 6 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    ✓
                  </span>
                  <span>Minimum 6 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                    newPassword && newPassword === confirmPassword ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    ✓
                  </span>
                  <span>Passwords match</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {submittingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB C: Account Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              
              {/* Account Type Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Account Type</div>
                  <div className="text-xl font-bold font-display text-slate-900 mt-0.5">
                    {roleName}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isLandlord
                    ? 'Authorized to publish rental listings, manage tenant inquiry queues, and approve visits.'
                    : 'Authorized to search verified listings, submit booking applications, and leave ratings.'}
                </p>
              </div>

              {/* Security & Standing Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Verification Standing</div>
                  <div className="text-xl font-bold font-display text-emerald-700 mt-0.5 flex items-center gap-1.5">
                    <span>Active Standing</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your identity and mobile authentication are in full compliance with RentHome security policies.
                </p>
              </div>

              {/* Prime Status Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Membership Tier</div>
                  <div className="text-xl font-bold font-display text-slate-900 mt-0.5">
                    {profile?.isPrime ? 'RentHome Prime' : 'Standard Member'}
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {profile?.isPrime
                    ? 'Enjoy priority tenant placement, instant review badges, and dedicated concierge.'
                    : 'Standard rental marketplace access with zero subscription charges.'}
                </p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-bold font-display text-slate-900">
                Workspace Shortcuts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href={portalPath}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/70 hover:border-indigo-200 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white shadow-2xs text-indigo-600">
                      {isLandlord ? <Building2 className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {isLandlord ? 'Manage Property Listings' : 'Explore Rental Properties'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isLandlord ? 'View inbound tenant inquiries & metrics' : 'Discover certified rooms, flats, and villas'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-red-50/60 border border-slate-200/70 hover:border-red-200 transition-all flex items-center justify-between group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white shadow-2xs text-red-600">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition">
                        Sign Out of Session
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Safely terminate authentication token on this device
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
