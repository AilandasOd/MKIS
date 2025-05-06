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
  userRole?: string; // Add the user's role in this club
}

interface ClubContextType {
  clubs: Club[];
  selectedClub: Club | null;
  setSelectedClub: (club: Club) => void;
  loading: boolean;
  refreshClubs: () => Promise<void>;
  isUserAdminInSelectedClub: () => boolean; // New function to check if user is admin
}

const ClubContext = createContext<ClubContextType>({
  clubs: [],
  selectedClub: null,
  setSelectedClub: () => {},
  loading: true,
  refreshClubs: async () => {},
  isUserAdminInSelectedClub: () => false,
});

export const ClubProvider = ({ children }: { children: React.ReactNode }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const fetchingRef = useRef(false);
  
  // Track previous selected club ID for comparison
  const previousClubIdRef = useRef<number | null>(null);

  // Function to check if user is admin or owner in the selected club
  const isUserAdminInSelectedClub = useCallback(() => {
    if (!selectedClub) return false;
    return selectedClub.userRole === 'Admin' || selectedClub.userRole === 'Owner';
  }, [selectedClub]);

  // Fetch clubs from API
  const fetchClubs = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      console.log("Fetching clubs...");
      
      // First get the list of user's clubs
      const response = await fetch('https://localhost:7091/api/Clubs/MyClubs', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Clubs fetched:", data.length);
        
        // For each club, get the user's role
        const clubsWithRoles = await Promise.all(data.map(async (club: Club) => {
          try {
            // Get club details to find the user's role
            const detailsResponse = await fetch(`https://localhost:7091/api/Clubs/${club.id}`, {
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
              }
            });
            
            if (detailsResponse.ok) {
              const clubDetails = await detailsResponse.json();
              
              // Find the current user's membership
              const currentUserMembership = clubDetails.members.find((m: any) => 
                m.role === 'Owner' || m.role === 'Admin' || m.role === 'Member'
              );
              
              // Add the user's role to the club object
              return {
                ...club,
                userRole: currentUserMembership ? currentUserMembership.role : 'Member'
              };
            }
            return club;
          } catch (error) {
            console.error(`Error fetching details for club ${club.id}:`, error);
            return club;
          }
        }));
        
        setClubs(clubsWithRoles);
        
        // If there's a stored club ID, select that club
        const storedClubId = localStorage.getItem('selectedClubId');
        if (storedClubId) {
          const club = clubsWithRoles.find((c: Club) => c.id.toString() === storedClubId);
          if (club) {
            console.log("Found stored club:", club.id, "with role:", club.userRole);
            setSelectedClub(club);
            previousClubIdRef.current = club.id;
          } else if (clubsWithRoles.length > 0) {
            // If stored club not found, select first available club
            console.log("Stored club not found, selecting first club:", clubsWithRoles[0].id);
            setSelectedClub(clubsWithRoles[0]);
            previousClubIdRef.current = clubsWithRoles[0].id;
            localStorage.setItem('selectedClubId', clubsWithRoles[0].id.toString());
          }
        } else if (clubsWithRoles.length > 0) {
          // If no stored club, select first available
          console.log("No stored club, selecting first club:", clubsWithRoles[0].id);
          setSelectedClub(clubsWithRoles[0]);
          previousClubIdRef.current = clubsWithRoles[0].id;
          localStorage.setItem('selectedClubId', clubsWithRoles[0].id.toString());
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

  // Handle club selection with redirect to dashboard
  const handleSelectClub = useCallback((club: Club) => {
    console.log("Selecting club:", club.id, "with role:", club.userRole);
    
    // Track previous club ID
    const isDifferentClub = selectedClub?.id !== club.id;
    
    // Update selected club
    setSelectedClub(club);
    localStorage.setItem('selectedClubId', club.id.toString());
    
    // Only redirect if changing to a different club (not on initial selection)
    if (isDifferentClub && previousClubIdRef.current !== null) {
      console.log("Club changed, redirecting to dashboard");
      router.push('/dashboard');
    }
    
    // Update previous club ID reference
    previousClubIdRef.current = club.id;
  }, [selectedClub, router]);

  // Provide memoized context value to reduce unnecessary renders
  const contextValue = React.useMemo(() => ({
    clubs,
    selectedClub,
    setSelectedClub: handleSelectClub,
    loading,
    refreshClubs,
    isUserAdminInSelectedClub
  }), [clubs, selectedClub, handleSelectClub, loading, refreshClubs, isUserAdminInSelectedClub]);

  return (
    <ClubContext.Provider value={contextValue}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => useContext(ClubContext);