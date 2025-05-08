'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { useClub } from '../../../../context/ClubContext';

interface ClubDetails {
  id: number;
  name: string;
  description: string;
  residenceAddress: string;
  foundedDate: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  membersCount: number;
  isUserMember: boolean;
  members: Member[];
  huntingAreaLocation: number[];
}

interface Member {
  id: string;
  name: string;
  role: string;
  avatarPhoto: string;
}

const ClubDetailsPage = () => {
  const { id } = useParams();
  const [club, setClub] = useState<ClubDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [removing, setRemoving] = useState(false);

  const toast = useRef<Toast>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const router = useRouter();
  const { refreshClubs, selectedClub } = useClub();

  useEffect(() => {
    if (id) fetchClubDetails();
  }, [id, selectedClub?.id]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://localhost:7091/api/Clubs/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClub(data);
      } else if (response.status === 403) {
        toast.current?.show({
          severity: 'error',
          summary: 'Prieiga neleidžiama',
          detail: 'Jūs nesate šio klubo narys',
          life: 3000
        });
        router.push('/clubs/browse');
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Klaida',
          detail: 'Nepavyko įkelti klubo informacijos',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Klaida gaunant informaciją apie klubą:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko prisijungti prie serverio',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!club?.huntingAreaLocation) return;

    const loadGoogleMapsAndInitMap = async () => {
      try {
        if (!window.google) {
          await loadGoogleMapsScript();
        }
        initMap(club.huntingAreaLocation);
      } catch (error) {
        console.error('Klaida inicijuojant žemėlapį:', error);
      }
    };

    loadGoogleMapsAndInitMap();

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [club?.huntingAreaLocation]);

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initMap = (location: number[]) => {
    if (!mapRef.current || !window.google || location.length < 2) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    const mapOptions = {
      center: { lat: location[1], lng: location[0] },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.HYBRID
    };

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);
    } else {
      mapInstanceRef.current.setCenter(mapOptions.center);
      mapInstanceRef.current.setZoom(mapOptions.zoom);
    }

    markerRef.current = new google.maps.Marker({
      position: { lat: location[1], lng: location[0] },
      map: mapInstanceRef.current,
      title: club?.name,
      animation: google.maps.Animation.DROP
    });
  };

  const handleLeaveClub = async () => {
    try {
      setRemoving(true);
      const currentMember = club?.members.find(m => m.role === 'Owner' || m.role === 'Admin' || m.role === 'Member');

      if (!currentMember) throw new Error('Nepavyko rasti jūsų narystės įrašo');

      const response = await fetch(`https://localhost:7091/api/Clubs/members/${currentMember.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        toast.current?.show({ severity: 'success', summary: 'Išėjote', detail: 'Sėkmingai palikote klubą', life: 3000 });
        await refreshClubs();
        if (markerRef.current) markerRef.current.setMap(null);
        mapInstanceRef.current = null;
        router.push('/clubs/browse');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Nepavyko palikti klubo');
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: error instanceof Error ? error.message : 'Nepavyko palikti klubo',
        life: 3000
      });
    } finally {
      setRemoving(false);
      setLeaveDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex flex-column align-items-center justify-content-center mt-5">
          <i className="pi pi-spin pi-spinner text-4xl mb-3"></i>
          <p>Įkeliama klubo informacija...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <div className="text-center p-5">
          <i className="pi pi-exclamation-triangle text-5xl text-gray-400 mb-3"></i>
          <p className="text-xl">Klubas nerastas arba jūs neturite prieigos.</p>
          <div className="flex justify-content-center mt-4">
            <Button label="Grįžti į klubus" icon="pi pi-arrow-left" onClick={() => router.push('/clubs/browse')} className="mr-2" />
            <Button label="Pagrindinis" icon="pi pi-home" onClick={() => router.push('/dashboard')} severity="secondary" />
          </div>
        </div>
      </div>
    );
  }

  const hasLocationData = club.huntingAreaLocation && club.huntingAreaLocation.length >= 2;

  return (
    <div className="p-4">
      <Toast ref={toast} />

      <div className="flex flex-column md:flex-row align-items-center md:align-items-start gap-4 mb-4">
        {club.logoUrl ? (
          <img src={`https://localhost:7091${club.logoUrl}`} alt={club.name} className="border-circle" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
        ) : (
          <div className="flex align-items-center justify-content-center bg-primary border-circle" style={{ width: '100px', height: '100px' }}>
            <i className="pi pi-users text-3xl text-white" />
          </div>
        )}

        <div className="flex-grow-1">
          <h2 className="text-3xl font-bold mb-2 text-center md:text-left">{club.name}</h2>
          <div className="flex flex-column md:flex-row gap-3 justify-content-center md:justify-content-start">
            <div className="flex align-items-center">
              <i className="pi pi-calendar mr-2" />
              <span>Įkurtas: {new Date(club.foundedDate).toLocaleDateString('lt-LT')}</span>
            </div>
            <div className="flex align-items-center">
              <i className="pi pi-users mr-2" />
              <span>{club.membersCount} narių</span>
            </div>
            {club.contactEmail && (
              <div className="flex align-items-center">
                <i className="pi pi-envelope mr-2" />
                <span>{club.contactEmail}</span>
              </div>
            )}
          </div>
        </div>

        <Button label="Palikti klubą" icon="pi pi-sign-out" severity="danger" outlined onClick={() => setLeaveDialog(true)} />
      </div>

      <div className="grid">
        <div className="col-12 md:col-8">
          <Card className="h-full">
            <h3 className="text-xl font-semibold mb-3">Aprašymas</h3>
            <p className="whitespace-pre-line">{club.description || 'Aprašymo nėra.'}</p>

            <h3 className="text-xl font-semibold mt-4 mb-3">Kontaktinė informacija</h3>
            <p><strong>Adresas:</strong> {club.residenceAddress}</p>
            {club.contactEmail && <p><strong>El. paštas:</strong> {club.contactEmail}</p>}
            {club.contactPhone && <p><strong>Telefonas:</strong> {club.contactPhone}</p>}
          </Card>
        </div>

        <div className="col-12 md:col-4">
          <Card className="h-full">
            <h3 className="text-xl font-semibold mb-3">Vieta</h3>
            {hasLocationData ? (
              <div ref={mapRef} style={{ width: '100%', height: '300px', borderRadius: '8px' }} />
            ) : (
              <p className="text-gray-500 italic">Šis klubas neturi vietos duomenų.</p>
            )}
          </Card>
        </div>
      </div>

      <Dialog
        visible={leaveDialog}
        onHide={() => setLeaveDialog(false)}
        header="Patvirtinti išėjimą"
        footer={
          <div>
            <Button label="Atšaukti" icon="pi pi-times" onClick={() => setLeaveDialog(false)} className="p-button-text" />
            <Button label="Išeiti" icon="pi pi-sign-out" onClick={handleLeaveClub} severity="danger" loading={removing} />
          </div>
        }
      >
        <div className="flex align-items-center gap-3">
          <i className="pi pi-exclamation-triangle text-3xl text-yellow-500" />
          <p>Ar tikrai norite palikti klubą <strong>{club.name}</strong>? Norėdami grįžti, turėsite gauti pakvietimą.</p>
        </div>
      </Dialog>
    </div>
  );
};

export default ClubDetailsPage;
