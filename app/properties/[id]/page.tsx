'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  fetchPropertyById, 
  submitBookingInquiry, 
  fetchUserProfile, 
  fetchPropertyReviews,
  submitPropertyReview,
  PropertyDetails, 
  UserProfile,
  PropertyRatingSummary,
  PropertyReview
} from '@/lib/tenantApi';
import { getCurrentUser } from '@/lib/authApi';
import { toast, showToast } from '@/components/Toast';
import {
  ArrowLeft,
  Share2,
  Heart,
  ShieldCheck,
  Camera,
  Layers,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Wifi,
  Waves,
  Zap,
  Dumbbell,
  Dog,
  Shirt,
  Building,
  MapPin,
  Star,
  X,
  Send,
  AlertCircle,
  Loader2,
  Check,
  MessageSquare,
  User
} from 'lucide-react';

function PropertyDetailInner({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.id;
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Current authenticated user & role detection
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleUserUpdate = (e: any) => {
      setCurrentUser(e.detail || getCurrentUser());
    };
    window.addEventListener('renthome_user_updated', handleUserUpdate);
    return () => window.removeEventListener('renthome_user_updated', handleUserUpdate);
  }, []);

  const isLandlord = currentUser?.userType === 'LANDLORD';
  const isOwnerOrLandlord = isLandlord || (currentUser?.email && property?.ownerEmail && currentUser.email.toLowerCase() === property.ownerEmail.toLowerCase());
  const backDestination = isLandlord ? '/landlord/dashboard' : '/properties';
  const backLabel = isLandlord ? 'Back to Landlord Dashboard' : 'Back to Property Discovery';

  // User Profile for Pre-fill
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Application Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationSuccess, setApplicationSuccess] = useState<boolean>(false);

  // Reviews State
  const [ratingSummary, setRatingSummary] = useState<PropertyRatingSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      const data = await fetchPropertyReviews(propertyId);
      setRatingSummary(data);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [propertyId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);

    const currentUser = getCurrentUser();
    if (!currentUser) {
      setReviewError('Please sign in to submit a review.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError('Please write a comment for your review.');
      return;
    }

    try {
      setSubmittingReview(true);
      await submitPropertyReview({
        propertyId: Number(propertyId),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSuccess('Thank you! Your review has been published.');
      setReviewComment('');
      setReviewRating(5);
      await loadReviews();
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewSuccess(null);
      }, 1500);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Form Fields matching Spring Boot backend AppBookingInquiryRequestDto
  const [fullName, setFullName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyNetIncome, setMonthlyNetIncome] = useState<number | ''>(6500);
  const [numberOfOccupants, setNumberOfOccupants] = useState<number>(1);
  const [preferredMoveInDate, setPreferredMoveInDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [termsAgreed, setTermsAgreed] = useState(true);

  // Micro-interactions
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(0);

  const slots = [
    { day: 'Thu, Oct 3', time: '10:00 AM' },
    { day: 'Fri, Oct 4', time: '02:30 PM' },
    { day: 'Sat, Oct 5', time: '11:15 AM' },
  ];

  // Load Property Details
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPropertyById(propertyId);
        setProperty(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load property details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propertyId]);

  // Load User Profile on mount or when modal opens to auto-fill
  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await fetchUserProfile();
        setUserProfile(profile);
        if (profile?.name && !fullName) {
          setFullName(profile.name);
        }
      } catch {
        // Fallback to locally cached user
        const local = getCurrentUser();
        if (local) {
          setUserProfile(local);
          if (local.name && !fullName) {
            setFullName(local.name);
          }
        }
      }
    }
    loadUser();
  }, []);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenApplicationModal = () => {
    setSubmitError(null);
    setApplicationSuccess(false);
    if (!fullName && userProfile?.name) {
      setFullName(userProfile.name);
    }
    setModalOpen(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    if (!termsAgreed) {
      setSubmitError('Please accept the background verification terms to proceed.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitBookingInquiry({
        propertyId: property.id,
        fullName: fullName.trim(),
        occupation: occupation.trim() || 'Professional',
        monthlyNetIncome: Number(monthlyNetIncome) || 5000,
        numberOfOccupants: Number(numberOfOccupants) || 1,
        preferredMoveInDate,
      });
      setApplicationSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Application submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet') || lower.includes('fiber')) return <Wifi className="w-4 h-4 text-indigo-600" />;
    if (lower.includes('pool')) return <Waves className="w-4 h-4 text-indigo-600" />;
    if (lower.includes('ev') || lower.includes('charg')) return <Zap className="w-4 h-4 text-indigo-600" />;
    if (lower.includes('gym') || lower.includes('fit')) return <Dumbbell className="w-4 h-4 text-indigo-600" />;
    if (lower.includes('pet')) return <Dog className="w-4 h-4 text-indigo-600" />;
    if (lower.includes('laundry') || lower.includes('washer')) return <Shirt className="w-4 h-4 text-indigo-600" />;
    return <Sparkles className="w-4 h-4 text-indigo-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading property details & specifications...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Property Listing Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">{error || 'This property is currently inactive or undergoing administrative review.'}</p>
          <Link
            href={backDestination}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
        </div>
      </div>
    );
  }

  const allImages: string[] = (property.imageUrls && property.imageUrls.length > 0)
    ? property.imageUrls
    : (property.imageUrl ? property.imageUrl.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

  const defaultHeroFallback = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';
  const activeHeroImage = allImages[selectedImageIndex] || allImages[0] || property.imageUrl || defaultHeroFallback;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Chrome */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={backDestination}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label={backLabel}
              title={backLabel}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Link href={backDestination} className="font-display font-bold text-lg text-slate-900 tracking-tight hover:text-indigo-600 transition-colors">
                RentHome
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                {property.category}
              </span>
              {property.status && property.status !== 'APPROVED' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  property.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  {property.status === 'PENDING' ? 'Pending Approval' : property.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
              }`}
              aria-label="Favorite property"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <Link
              href="/profile"
              className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
              title="My Account Settings"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
        {/* Status Notice Banner for Owner / Landlord */}
        {property.status === 'PENDING' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3 shadow-xs">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-sm text-amber-950">Property Listing Under Review</p>
              <p className="text-amber-800">
                Your property listing has been submitted and is currently <strong>Pending Admin Approval</strong>. It is only visible to you. Once an administrator approves your listing, it will become publicly discoverable by tenants.
              </p>
            </div>
          </div>
        )}
        {property.status === 'REJECTED' && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-sm text-rose-950">Listing Rejected / Archived</p>
              <p className="text-rose-800">
                This listing was rejected or archived by administrators. You can update the details or photos from your landlord dashboard to request re-review.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (col-span-8): Hero, Specs, Overview, Amenities */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Hero Gallery Card & Thumbnail Selector */}
            <div className="space-y-3">
              <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden shadow-md bg-slate-900 group">
                <img
                  src={activeHeroImage}
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none"></div>

                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-600/90 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified PropTech Partner
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    <Camera className="w-3.5 h-3.5" />
                    {selectedImageIndex + 1} / {allImages.length || 1} Photos
                  </span>
                </div>

                {/* Bottom Hero Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 text-sm font-semibold drop-shadow">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{property.category} • Prime Exclusive</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info('Launching immersive 3D Virtual Tour viewer...')}
                    className="px-3 py-1.5 bg-white/95 hover:bg-white text-indigo-700 font-semibold text-xs rounded-xl backdrop-blur-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>3D Virtual Tour</span>
                  </button>
                </div>
              </div>

              {/* Photo Strip Carousel when multiple images exist */}
              {allImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md scale-102'
                          : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Photo thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Location Header with Rating Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
                  {property.name}
                </h1>
                <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{property.address ? `${property.address}, ${property.city}` : property.location}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-900 rounded-full border border-amber-200/80 shadow-2xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="font-bold text-sm">
                    {ratingSummary && ratingSummary.totalReviews > 0
                      ? ratingSummary.averageRating.toFixed(1)
                      : 'New'}
                  </span>
                  <span className="text-amber-700/80 text-xs font-medium">
                    ({ratingSummary?.totalReviews || 0} {ratingSummary?.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Specs Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Bedrooms</div>
                  <div className="text-sm font-bold text-slate-900">{property.beds || 1} Beds</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Bath className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Bathrooms</div>
                  <div className="text-sm font-bold text-slate-900">{property.baths || 1} Baths</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Interior Area</div>
                  <div className="text-sm font-bold text-slate-900">{property.sqft || 850} Sqft</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Property Type</div>
                  <div className="text-sm font-bold text-slate-900">{property.category}</div>
                </div>
              </div>
            </div>

            {/* Architectural Overview */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs space-y-3">
              <h2 className="text-lg font-bold font-display text-slate-900">Architectural Overview</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {property.description ||
                  'Architecturally curated contemporary home featuring soundproof European acoustics, premium appliances, open-concept layout, natural ambient lighting, and dedicated secured parking.'}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Inspected & Certified Listing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>Managed by {property.landlord || property.ownerName || 'Verified Host'}</span>
                </div>
              </div>
            </div>

            {/* Curated Amenities Grid */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-slate-900">Curated Amenities</h2>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {property.amenities?.length || 0} Perks Included
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities && property.amenities.length > 0 ? (
                  property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="p-1.5 bg-white rounded-lg shadow-2xs">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="text-xs font-medium text-slate-800 truncate">{amenity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 col-span-3">Standard residence amenities included.</p>
                )}
              </div>
            </div>

            {/* Customer Reviews & Ratings Section */}
            <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold font-display text-slate-900">Customer Reviews & Ratings</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verified feedback from tenants who rented or toured this property</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const user = getCurrentUser();
                    if (!user) {
                      router.push('/login');
                      return;
                    }
                    setReviewError(null);
                    setReviewSuccess(null);
                    setReviewModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-indigo-200/70 shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                  <span>Write a Review</span>
                </button>
              </div>

              {/* Rating Score Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-extrabold font-display text-slate-900">
                    {ratingSummary && ratingSummary.totalReviews > 0
                      ? ratingSummary.averageRating.toFixed(1)
                      : '—'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            ratingSummary && star <= Math.round(ratingSummary.averageRating)
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-1">
                      {ratingSummary?.totalReviews || 0} total {ratingSummary?.totalReviews === 1 ? 'rating' : 'ratings'}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center justify-start sm:justify-end text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All reviews are authenticated and submitted by registered tenants.</span>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">Loading reviews...</span>
                </div>
              ) : !ratingSummary?.reviewsList || ratingSummary.reviewsList.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Star className="w-8 h-8 text-amber-400 fill-amber-100 mx-auto" />
                  <div className="text-sm font-semibold text-slate-800">No reviews yet</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Be the first verified tenant to share your feedback about this property!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const user = getCurrentUser();
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      setReviewModalOpen(true);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer shadow-xs"
                  >
                    <span>Leave First Review</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratingSummary.reviewsList.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2.5 transition-all hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {review.tenantName
                              ? review.tenantName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)
                              : 'T'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{review.tenantName}</span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                <Check className="w-2.5 h-2.5" />
                                Verified Tenant
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= review.rating ? 'fill-amber-400 text-amber-500' : 'fill-slate-200 text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-normal pl-12">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (col-span-4): Sticky Booking & Application Card or Landlord Controls */}
          <div className="lg:col-span-4">
            {isOwnerOrLandlord ? (
              <div className="sticky top-20 bg-white rounded-2xl border border-indigo-200/80 p-6 shadow-xl space-y-5">
                {/* Price display */}
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                      Landlord Preview Mode
                    </span>
                    <span className="text-3xl font-extrabold font-display text-slate-900">
                      ${property.price?.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium"> / month</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    property.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : property.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {property.status === 'APPROVED' ? 'Approved' : property.status === 'PENDING' ? 'Pending Approval' : 'Rejected'}
                  </span>
                </div>

                {/* Security deposit note */}
                <div className="flex items-center justify-between text-xs py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                  <span className="font-medium">Security Deposit</span>
                  <span className="font-bold text-slate-900">
                    ${property.securityDeposit ? property.securityDeposit.toLocaleString() : property.price?.toLocaleString()} refundable
                  </span>
                </div>

                {/* Landlord information box */}
                <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Property Owner Workspace
                  </p>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    You are previewing this property as its landlord. You can inspect all details and photos. Tenants will see the standard booking application once approved.
                  </p>
                </div>

                {/* Navigation actions */}
                <div className="space-y-2.5 pt-2">
                  <Link
                    href="/landlord/dashboard"
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Landlord Dashboard</span>
                  </Link>
                </div>

                <p className="text-[11px] text-center text-slate-400 leading-normal">
                  Manage listing availability, edit details, and review tenant inquiries from your dashboard.
                </p>
              </div>
            ) : (
              <div className="sticky top-20 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-lg space-y-5">
                {/* Price display */}
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-3xl font-extrabold font-display text-slate-900">
                      ${property.price?.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium"> / month</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                    property.isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${property.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    {property.isAvailable ? 'Immediate / Open' : 'Rented'}
                  </span>
                </div>

                {/* Security deposit note */}
                <div className="flex items-center justify-between text-xs py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                  <span className="font-medium">Security Deposit</span>
                  <span className="font-bold text-slate-900">
                    ${property.securityDeposit ? property.securityDeposit.toLocaleString() : property.price?.toLocaleString()} refundable
                  </span>
                </div>

                {/* In-Person Tour Slot Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Select Tour Visit Slot
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedSlot(index)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          selectedSlot === index
                            ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        <div className="font-semibold">{slot.day}</div>
                        <div className={`text-[10px] ${selectedSlot === index ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {slot.time}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {property.status && property.status !== 'APPROVED' ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center text-xs text-amber-800 font-medium">
                      Applications will open once this listing is approved by admin.
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenApplicationModal}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Submit Rental Application Now</span>
                        <Send className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toast.success(`Tour slot confirmed for ${slots[selectedSlot].day} at ${slots[selectedSlot].time}. The leasing manager will coordinate directions.`)}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Reserve Visit for {slots[selectedSlot].day}</span>
                      </button>
                    </>
                  )}
                </div>

                <p className="text-[11px] text-center text-slate-400 leading-normal">
                  Pre-screened verification • Direct landlord review • Zero platform application fees
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Fast-Track Rental Application Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-slate-900">Fast-Track Rental Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">Property: {property.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {applicationSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Application Submitted!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Your inquiry has been successfully transmitted to the property owner with status <strong className="text-emerald-700">SUBMITTED</strong>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-left border border-slate-100">
                  <p><strong>Applicant:</strong> {fullName}</p>
                  <p><strong>Move-in Date:</strong> {preferredMoveInDate}</p>
                  <p><strong>Monthly Rent:</strong> ${property.price?.toLocaleString()} / mo</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    router.push('/properties');
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md"
                >
                  Return to Property Discovery
                </button>
              </div>
            ) : (
              <>
                {/* Auto-fill Verified Banner */}
                {userProfile && (
                  <div className="mb-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-xs text-indigo-900">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Auto-filling verified profile info for <strong>{userProfile.email}</strong>.</span>
                  </div>
                )}

                {/* Submit Error */}
                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Application Form */}
                <form onSubmit={handleSubmitApplication} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Current Occupation
                      </label>
                      <input
                        type="text"
                        required
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Monthly Net Income ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={monthlyNetIncome}
                        onChange={(e) => setMonthlyNetIncome(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="6500"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Total Occupants
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        required
                        value={numberOfOccupants}
                        onChange={(e) => setNumberOfOccupants(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Preferred Move-in Date
                      </label>
                      <input
                        type="date"
                        required
                        value={preferredMoveInDate}
                        onChange={(e) => setPreferredMoveInDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="termsCheckbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-1 accent-indigo-600 rounded"
                    />
                    <label htmlFor="termsCheckbox" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                      I declare that the provided income and personal details are accurate and authorize the landlord to conduct rental background screening.
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Application to Owner...</span>
                        </>
                      ) : (
                        <>
                          <span>Transmit Application</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Verified Tenant Feedback</span>
              </div>
              <h2 className="text-xl font-bold font-display text-slate-900">
                Write a Property Review
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Share your authentic rating and feedback for <span className="font-semibold text-slate-700">{property.name}</span>.
              </p>
            </div>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-emerald-900">{reviewSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {reviewError && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 font-medium">
                    {reviewError}
                  </div>
                )}

                {/* Star Rating Picker */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Your Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || reviewRating)
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-slate-100 text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2">
                      {hoverRating || reviewRating} / 5
                    </span>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Your Experience & Comments
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell other tenants about living condition, acoustics, natural lighting, landlord responsiveness, neighborhood amenities..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 resize-none"
                  ></textarea>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing Review...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Review</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Loading property details...</p>
          </div>
        </div>
      }
    >
      <PropertyDetailInner params={params} />
    </Suspense>
  );
}
