'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#09090b]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#FFE600]" />
    </div>
  );
}
