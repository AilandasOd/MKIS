// Create a new file: context/ClubGuard.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClub } from './ClubContext';

interface ClubGuardProps {
  children: React.ReactNode;
}

const ClubGuard: React.FC<ClubGuardProps> = ({ children }) => {
  const { clubs, loading } = useClub();
  const router = useRouter();

  useEffect(() => {
    if (!loading && clubs.length === 0) {
      // User is not a member of any club, redirect to club browsing page
      router.push('/clubs/browse');
    }
  }, [clubs, loading, router]);

  // If still loading or user has clubs, render children
  return loading || clubs.length > 0 ? <>{children}</> : null;
};

export default ClubGuard;