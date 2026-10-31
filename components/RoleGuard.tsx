'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/authApi';
import { getAuthToken } from '@/lib/apiClient';
import { toast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: ('TENANT' | 'LANDLORD' | 'ADMIN')[];
  redirectPath?: string;
  errorMessage?: string;
  children: React.ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  redirectPath = '/properties',
  errorMessage,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const user = getCurrentUser();

    if (!token || !user) {
      toast.error('Please sign in to access this page.');
      router.replace('/login');
      return;
    }

    const userRole = user.userType;
    if (!allowedRoles.includes(userRole)) {
      const msg = errorMessage || `Access Denied: ${userRole} account is not permitted on this page.`;
      toast.error(msg);
      router.replace(redirectPath);
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [router, allowedRoles, redirectPath, errorMessage]);

  if (checking || !authorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100">Verifying Security Permissions</h3>
            <p className="text-xs text-slate-400 mt-1">Validating role access credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
