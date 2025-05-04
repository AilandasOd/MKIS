// MKInformacineSistemaFront/app/page.tsx
'use client';
import React from 'react';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div className="surface-0 flex justify-content-center">
      <div className="landing-wrapper overflow-hidden">
        <div className="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 flex align-items-center justify-content-between relative lg:static">
          <h1 className="text-6xl font-bold text-gray-900 line-height-2">
            Medžioklės klubų informacinė sistema
          </h1>

          <div className="flex justify-content-between">
            {isAuthenticated ? (
              <Button label="Go to Dashboard" className="m-2" onClick={() => router.push('/dashboard')} />
            ) : (
              <Button label="Login" className="m-2" onClick={() => router.push('/auth/login')} />
            )}
          </div>
        </div>

        <div className="py-4 px-4 lg:px-8 mt-5">
          <div className="text-center">
            <h2 className="text-900 font-normal mb-2">Welcome to Hunting Club Information System</h2>
            <p className="text-600 text-2xl">
              Manage your hunting club information, members, and activities in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}