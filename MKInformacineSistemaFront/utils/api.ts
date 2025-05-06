// utils/api.ts - improved error handling and stability
import { useCallback } from 'react';
import { useClub } from '../context/ClubContext';

export const useApiClient = () => {
  const { selectedClub } = useClub();
  const baseUrl = 'https://localhost:7091/api';
  
  const getAuthHeaders = useCallback(() => {
    return {
      'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    };
  }, []);
  
  const fetchWithClub = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!selectedClub) {
      throw new Error('No club selected');
    }
    
    // Handle both query param and route param styles
    let url: string;
    
    // If endpoint already contains a placeholder for clubId
    if (endpoint.includes('{clubId}')) {
      url = `${baseUrl}/${endpoint.replace('{clubId}', selectedClub.id.toString())}`;
    } 
    // If endpoint already has the clubId as part of the path
    else if (endpoint.includes(`/${selectedClub.id}`)) {
      url = `${baseUrl}/${endpoint}`;
    } 
    // Otherwise, add as query parameter
    else {
      const urlObj = new URL(`${baseUrl}/${endpoint}`);
      urlObj.searchParams.append('clubId', selectedClub.id.toString());
      url = urlObj.toString();
    }
    
    console.log(`API Request: ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {})
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`API error ${response.status}: ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Request Failed: ${url}`, error);
      throw error;
    }
  }, [selectedClub, getAuthHeaders]);
  
  return {
    fetchWithClub,
    selectedClub
  };
};