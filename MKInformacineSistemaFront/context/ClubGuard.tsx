// context/ClubGuard.tsx - optimized
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClub } from './ClubContext';

interface ClubGuardProps {
  children: React.ReactNode;
}

const ClubGuard: React.FC<ClubGuardProps> = ({ children }) => {
  const { clubs, loading } = useClub();
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // Only redirect once to avoid loops
    if (!loading && clubs.length === 0 && !redirected) {
      console.log("No clubs found, redirecting to club browse page");
      setRedirected(true);
      router.push('/clubs/browse');
    }
  }, [clubs, loading, router, redirected]);

  // If already redirected or has clubs, render children
  return loading || redirected || clubs.length > 0 ? <>{children}</> : null;
};

export default ClubGuard;