// MKInformacineSistemaFront/utils/apiClient.ts
import { useClub } from '../context/ClubContext';

export const useApiClient = () => {
  const { selectedClub } = useClub();
  const baseUrl = 'https://localhost:7091/api';
  
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    };
  };
  
  const fetchWithClub = async (endpoint: string, options: RequestInit = {}) => {
    const url = new URL(`${baseUrl}/${endpoint}`);
    
    // Add clubId parameter if we have a selected club
    if (selectedClub) {
      url.searchParams.append('clubId', selectedClub.id.toString());
    }
    
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Error: ${response.status}`);
    }
    
    return response.json();
  };
  
  return {
    fetchWithClub,
    selectedClub
  };
};