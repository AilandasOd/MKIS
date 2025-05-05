// MKInformacineSistemaFront/context/ClubContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const fetchClubs = async () => {
    try {
      const response = await fetch('https://localhost:7091/api/Clubs/MyClubs', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClubs(data);
        
        // If there's a stored club ID, select that club
        const storedClubId = localStorage.getItem('selectedClubId');
        if (storedClubId) {
          const club = data.find((c: Club) => c.id.toString() === storedClubId);
          if (club) {
            setSelectedClub(club);
          } else if (data.length > 0) {
            // If stored club not found, select first available club
            setSelectedClub(data[0]);
            localStorage.setItem('selectedClubId', data[0].id.toString());
          }
        } else if (data.length > 0) {
          // If no stored club, select first available
          setSelectedClub(data[0]);
          localStorage.setItem('selectedClubId', data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshClubs = async () => {
    setLoading(true);
    await fetchClubs();
  };

  // Fetch clubs on initial load if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchClubs();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle club selection
  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    localStorage.setItem('selectedClubId', club.id.toString());
    // Refresh the current page to update club-specific data
    router.refresh();
  };

  return (
    <ClubContext.Provider 
      value={{ 
        clubs, 
        selectedClub, 
        setSelectedClub: handleSelectClub, 
        loading, 
        refreshClubs 
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => useContext(ClubContext);