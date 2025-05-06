// MKInformacineSistemaFront/context/ClubContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

interface Club {
  id: number;
  name: string;
  logoUrl: string;
  description: string;
  membersCount: number;
  foundedDate: string;
  isUserMember: boolean;
}

interface ClubContextType {
  clubs: Club[];
  selectedClub: Club | null;
  setSelectedClub: (club: Club) => void;
  loading: boolean;
  refreshClubs: () => Promise<void>;
}

const ClubContext = createContext<ClubContextType>({
  clubs: [],
  selectedClub: null,
  setSelectedClub: () => {},
  loading: true,
  refreshClubs: async () => {},
});

export const ClubProvider = ({ children }: { children: React.ReactNode }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const fetchingRef = useRef(false);

  // Fetch clubs from API
  const fetchClubs = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      console.log("Fetching clubs...");
      const response = await fetch('https://localhost:7091/api/Clubs/MyClubs', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Clubs fetched:", data.length);
        setClubs(data);
        
        // If there's a stored club ID, select that club
        const storedClubId = localStorage.getItem('selectedClubId');
        if (storedClubId) {
          const club = data.find((c: Club) => c.id.toString() === storedClubId);
          if (club) {
            console.log("Found stored club:", club.id);
            setSelectedClub(club);
          } else if (data.length > 0) {
            // If stored club not found, select first available club
            console.log("Stored club not found, selecting first club:", data[0].id);
            setSelectedClub(data[0]);
            localStorage.setItem('selectedClubId', data[0].id.toString());
          }
        } else if (data.length > 0) {
          // If no stored club, select first available
          console.log("No stored club, selecting first club:", data[0].id);
          setSelectedClub(data[0]);
          localStorage.setItem('selectedClubId', data[0].id.toString());
        }
      } else {
        console.error("Failed to fetch clubs:", response.status);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Public method to refresh clubs
  const refreshClubs = useCallback(async () => {
    setLoading(true);
    await fetchClubs();
  }, [fetchClubs]);

  // Fetch clubs on initial load if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchClubs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchClubs]);

  // Handle club selection
  const handleSelectClub = useCallback((club: Club) => {
    console.log("Selecting club:", club.id);
    setSelectedClub(club);
    localStorage.setItem('selectedClubId', club.id.toString());
  }, []);

  // Provide memoized context value to reduce unnecessary renders
  const contextValue = React.useMemo(() => ({
    clubs,
    selectedClub,
    setSelectedClub: handleSelectClub,
    loading,
    refreshClubs
  }), [clubs, selectedClub, handleSelectClub, loading, refreshClubs]);

  return (
    <ClubContext.Provider value={contextValue}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => useContext(ClubContext);