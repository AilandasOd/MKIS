// Create a new file: utils/api.ts
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
    if (!selectedClub) {
      throw new Error('No club selected');
    }
    
    const url = new URL(`${baseUrl}/${endpoint}`);
    url.searchParams.append('clubId', selectedClub.id.toString());
    
    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  };
  
  return {
    fetchWithClub,
    selectedClub
  };
};