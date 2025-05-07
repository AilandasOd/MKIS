import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApiClient } from '../../../../../utils/api';
import { Toast } from 'primereact/toast';

const DrivenHuntDetailsPage = () => {
  const { huntId } = useParams();
  const { fetchWithClub, selectedClub } = useApiClient();
  const [hunt, setHunt] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useRef(null);
  
  useEffect(() => {
    const fetchHuntDetails = async () => {
      if (!selectedClub) return;
      
      try {
        setLoading(true);
        const data = await fetchWithClub(`DrivenHunts/${huntId}`);
        setHunt(data);
      } catch (error) {
        console.error('Error fetching hunt details:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load hunt details',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchHuntDetails();
  }, [huntId, selectedClub, fetchWithClub]);
  
  if (loading) {
    return <div>Loading hunt details...</div>;
  }
  
  if (!hunt) {
    return <div>Hunt not found</div>;
  }
  
  return (
    <div>
      <Toast ref={toast} />
      <h2>{hunt.name}</h2>
      {/* Render hunt details */}
    </div>
  );
};

export default DrivenHuntDetailsPage;