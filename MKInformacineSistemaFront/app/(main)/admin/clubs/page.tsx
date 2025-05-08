'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { classNames } from 'primereact/utils';
import RoleGuard from '../../../../context/RoleGuard';
import { useClub } from '../../../../context/ClubContext';

interface Club {
  id: number;
  name: string;
  description: string;
  residenceAddress: string;
  huntingAreaLocation: number[];
  useResidenceAsCenter: boolean;
  foundedDate: Date;
  contactEmail: string;
  contactPhone: string;
  logoUrl?: string;
}

// Define a type for the Google Maps window object
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const EditClubPage = () => {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const toast = useRef<Toast>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const router = useRouter();
  const { selectedClub } = useClub();

  // Initialize Google Maps API with callback
  const loadGoogleMapsScript = () => {
    console.log("Attempting to load Google Maps script...");
    
    return new Promise<void>((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log("Google Maps already loaded");
        setMapLoaded(true);
        return resolve();
      }
      
      // Create global callback function
      const callbackName = 'initGoogleMap' + new Date().getTime();
      window[callbackName] = () => {
        console.log("Google Maps loaded via callback");
        setMapLoaded(true);
        resolve();
        // Clean up
        delete window[callbackName];
      };
      
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = (e) => {
        console.error("Google Maps script failed to load", e);
        setMapError("Nepavyko užkrauti Google Maps. Patikrinkite interneto ryšį.");
        reject(new Error('Nepavyko užkrauti Google Maps API'));
      };
      
      // Add to document
      document.head.appendChild(script);
      console.log("Google Maps script added to document head");
    });
  };

  // Initialize map with marker
  const initMap = (coordinates: number[]) => {
    console.log("Initializing map with coordinates:", coordinates);
    
    if (!mapRef.current) {
      console.error("Map container ref is null");
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error("Google Maps is not loaded yet");
      return;
    }
    
    if (!coordinates || coordinates.length < 2) {
      console.error("Invalid coordinates:", coordinates);
      return;
    }
    
    try {
      // Get coordinates [lng, lat]
      const center = { lat: coordinates[1], lng: coordinates[0] };
      console.log("Map center:", center);
      
      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 10,
        mapTypeId: window.google.maps.MapTypeId.HYBRID
      });
      mapInstance.current = map;
      console.log("Map created successfully");
      
      // Create marker
      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
        title: 'Klubo vieta'
      });
      markerRef.current = marker;
      console.log("Marker created successfully");
      
      // Update coordinates when marker is dragged
      window.google.maps.event.addListener(marker, 'dragend', function() {
        if (club && marker.getPosition()) {
          const position = marker.getPosition();
          setClub({
            ...club,
            huntingAreaLocation: [position.lng(), position.lat()]
          });
        }
      });
      
      // Add click listener to place marker
      window.google.maps.event.addListener(map, 'click', function(event) {
        marker.setPosition(event.latLng);
        if (club) {
          setClub({
            ...club,
            huntingAreaLocation: [event.latLng.lng(), event.latLng.lat()]
          });
        }
      });
      
      console.log("Map event listeners added successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Klaida inicializuojant žemėlapį. Bandykite atnaujinti puslapį.");
    }
  };

  // Load club data and map
  useEffect(() => {
    const fetchClubAndInitMap = async () => {
      if (!selectedClub) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Įspėjimas',
          detail: 'Nepasirinktas klubas. Prašome pasirinkti klubą.',
          life: 5000
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log("Fetching club data for ID:", selectedClub.id);
        
        const response = await fetch(`https://localhost:7091/api/Clubs/${selectedClub.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Nepavyko gauti klubo duomenų: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Club data received:", data);
        
        // Convert foundedDate string to Date
        const clubData = {
          ...data,
          foundedDate: new Date(data.foundedDate)
        };
        
        setClub(clubData);
        
        // Load Google Maps API
        try {
          console.log("Loading Google Maps...");
          await loadGoogleMapsScript();
          
          // Short timeout to ensure DOM is ready
          setTimeout(() => {
            if (clubData.huntingAreaLocation) {
              console.log("Initializing map after timeout");
              initMap(clubData.huntingAreaLocation);
            } else {
              console.error("No hunting area location in club data");
              setMapError("Klubo medžioklės vietos koordinatės nerastos");
            }
          }, 500);
        } catch (error) {
          console.error('Nepavyko užkrauti žemėlapio:', error);
          setMapError("Nepavyko užkrauti žemėlapio komponentų");
          toast.current?.show({
            severity: 'warn',
            summary: 'Įspėjimas',
            detail: 'Nepavyko užkrauti žemėlapio. Galite redaguoti kitą informaciją.',
            life: 5000
          });
        }
        
        // Load logo preview if exists
        if (clubData.logoUrl) {
          setLogoPreview(`https://localhost:7091${clubData.logoUrl}`);
        }
        
      } catch (error) {
        console.error('Klaida gaunant klubo duomenis:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Klaida',
          detail: 'Nepavyko užkrauti klubo duomenų. Bandykite vėliau.',
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchClubAndInitMap();
    
    // Cleanup function
    return () => {
      // Clean up map resources
      if (mapInstance.current) {
        // No need to explicitly destroy the map, it will be garbage collected
        mapInstance.current = null;
      }
      if (markerRef.current) {
        // No need to explicitly remove the marker, it will be garbage collected with the map
        markerRef.current = null;
      }
    };
  }, [selectedClub]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof Club) => {
    if (!club) return;
    
    setClub({
      ...club,
      [field]: e.target.value
    });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: ''
      });
    }
  };

  // Handle date changes
  const handleDateChange = (value: Date | null, field: keyof Club) => {
    if (!club) return;
    
    setClub({
      ...club,
      [field]: value || new Date()
    });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: ''
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: { checked: boolean }, field: keyof Club) => {
    if (!club) return;
    
    setClub({
      ...club,
      [field]: e.checked
    });
  };

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    setValidated(true);
    const errors: Record<string, string> = {};
    
    if (!club) return false;
    
    if (!club.name.trim()) {
      errors.name = 'Klubo pavadinimas yra privalomas';
    }
    
    if (!club.residenceAddress.trim()) {
      errors.residenceAddress = 'Klubo adresas yra privalomas';
    }
    
    if (!club.foundedDate) {
      errors.foundedDate = 'Įkūrimo data yra privaloma';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!club || !validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Prepare update payload
      const payload = {
        id: club.id,
        name: club.name,
        description: club.description,
        residenceAddress: club.residenceAddress,
        useResidenceAsCenter: club.useResidenceAsCenter,
        huntingAreaLocation: club.huntingAreaLocation,
        foundedDate: club.foundedDate,
        contactEmail: club.contactEmail,
        contactPhone: club.contactPhone
      };
      
      console.log("Submitting club update:", payload);
      
      // Update club
      const response = await fetch(`https://localhost:7091/api/Clubs/${club.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Nepavyko atnaujinti klubo: ${response.status}`);
      }
      
      // Upload logo if changed
      if (logoFile) {
        console.log("Uploading new logo");
        const formData = new FormData();
        formData.append('file', logoFile);
        
        const logoResponse = await fetch(`https://localhost:7091/api/Clubs/${club.id}/logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          },
          body: formData
        });
        
        if (!logoResponse.ok) {
          console.warn('Nepavyko įkelti logotipo:', logoResponse.status);
          toast.current?.show({
            severity: 'warn',
            summary: 'Įspėjimas',
            detail: 'Klubo informacija atnaujinta, bet nepavyko įkelti naujo logotipo',
            life: 3000
          });
        }
      }
      
      toast.current?.show({
        severity: 'success',
        summary: 'Sėkmė',
        detail: 'Klubo informacija sėkmingai atnaujinta',
        life: 3000
      });
      
      // Navigate back to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Klaida atnaujinant klubą:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko atnaujinti klubo informacijos. Bandykite vėliau.',
        life: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    router.push('/dashboard');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  // Error state - club not found
  if (!club) {
    return (
      <Card className="p-5 text-center">
        <Toast ref={toast} />
        <i className="pi pi-exclamation-triangle text-5xl text-yellow-500 mb-3"></i>
        <h2 className="text-2xl font-bold mb-3">Klubas nerastas</h2>
        <p className="mb-5">Klubas, kurį bandote redaguoti, nerastas.</p>
        <Button label="Grįžti į skydelį" icon="pi pi-arrow-left" onClick={handleCancel} />
      </Card>
    );
  }

  // Map error component
  const MapErrorComponent = () => (
    <div className="flex flex-column align-items-center justify-content-center bg-gray-100 border-round p-4" style={{ height: '300px' }}>
      <i className="pi pi-map-marker text-4xl text-red-500 mb-3"></i>
      <h3 className="text-xl mb-2">Nepavyko užkrauti žemėlapio</h3>
      <p className="text-center mb-3">{mapError || 'Patikrinkite interneto ryšį ir bandykite atnaujinti puslapį'}</p>
      <Button 
        label="Bandyti dar kartą" 
        icon="pi pi-refresh" 
        onClick={() => {
          setMapError(null);
          loadGoogleMapsScript().then(() => {
            if (club.huntingAreaLocation) {
              initMap(club.huntingAreaLocation);
            }
          }).catch(err => {
            console.error("Error reloading map:", err);
            setMapError("Nepavyko užkrauti žemėlapio. Bandykite vėliau.");
          });
        }}
      />
    </div>
  );

  return (
    <RoleGuard requiredRoles={['Admin']}>
      <div className="p-4">
        <Toast ref={toast} />
        
        <div className="flex justify-content-between align-items-center mb-4">
          <h2 className="text-2xl font-bold m-0">Redaguoti klubą</h2>
          <div className="flex gap-2">
            <Button 
              label="Atšaukti" 
              icon="pi pi-times" 
              className="p-button-outlined" 
              onClick={handleCancel} 
              disabled={submitting}
            />
            <Button 
              label="Išsaugoti pakeitimus" 
              icon="pi pi-save" 
              onClick={handleSubmit} 
              loading={submitting}
            />
          </div>
        </div>
        
        <div className="grid">
          <div className="col-12 md:col-8">
            <Card className="p-4">
              <h3 className="text-xl font-semibold mb-4">Klubo informacija</h3>
              
              <div className="formgrid grid">
                <div className="field col-12">
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Klubo pavadinimas*</label>
                  <InputText 
                    id="name" 
                    value={club.name} 
                    onChange={(e) => handleInputChange(e, 'name')} 
                    className={classNames('w-full', { 'p-invalid': validated && validationErrors.name })}
                  />
                  {validated && validationErrors.name && <small className="p-error">{validationErrors.name}</small>}
                </div>
                
                <div className="field col-12">
                  <label htmlFor="description" className="block text-sm font-medium mb-2">Aprašymas</label>
                  <InputTextarea 
                    id="description" 
                    value={club.description} 
                    onChange={(e) => handleInputChange(e, 'description')} 
                    className="w-full" 
                    rows={5} 
                  />
                </div>
                
                <div className="field col-12">
                  <label htmlFor="residenceAddress" className="block text-sm font-medium mb-2">Klubo adresas*</label>
                  <InputText 
                    id="residenceAddress" 
                    value={club.residenceAddress} 
                    onChange={(e) => handleInputChange(e, 'residenceAddress')} 
                    className={classNames('w-full', { 'p-invalid': validated && validationErrors.residenceAddress })}
                  />
                  {validated && validationErrors.residenceAddress && <small className="p-error">{validationErrors.residenceAddress}</small>}
                </div>
                
                <div className="field col-12 md:col-6">
                  <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">Kontaktinis el. paštas</label>
                  <InputText 
                    id="contactEmail" 
                    value={club.contactEmail} 
                    onChange={(e) => handleInputChange(e, 'contactEmail')} 
                    className="w-full" 
                  />
                </div>
                
                <div className="field col-12 md:col-6">
                  <label htmlFor="contactPhone" className="block text-sm font-medium mb-2">Kontaktinis telefonas</label>
                  <InputText 
                    id="contactPhone" 
                    value={club.contactPhone} 
                    onChange={(e) => handleInputChange(e, 'contactPhone')} 
                    className="w-full" 
                  />
                </div>
                
                <div className="field col-12 md:col-6">
                  <label htmlFor="foundedDate" className="block text-sm font-medium mb-2">Įkūrimo data*</label>
                  <Calendar 
                    id="foundedDate" 
                    value={club.foundedDate} 
                    onChange={(e) => handleDateChange(e.value as Date, 'foundedDate')} 
                    showIcon
                    className={classNames('w-full', { 'p-invalid': validated && validationErrors.foundedDate })}
                  />
                  {validated && validationErrors.foundedDate && <small className="p-error">{validationErrors.foundedDate}</small>}
                </div>
                
                <div className="field-checkbox col-12">
                  <Checkbox 
                    inputId="useResidenceAsCenter" 
                    checked={club.useResidenceAsCenter} 
                    onChange={(e) => handleCheckboxChange(e, 'useResidenceAsCenter')} 
                  />
                  <label htmlFor="useResidenceAsCenter" className="ml-2">Naudoti adresą kaip medžioklės teritorijos centrą</label>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="col-12 md:col-4">
            <Card className="p-4 mb-4">
              <h3 className="text-xl font-semibold mb-4">Klubo logotipas</h3>
              
              <div className="flex flex-column align-items-center">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logotipo peržiūra" 
                    className="mb-3 border-circle" 
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }} 
                  />
                ) : (
                  <div className="flex align-items-center justify-content-center bg-primary border-circle mb-3" style={{ width: '150px', height: '150px' }}>
                    <i className="pi pi-users text-4xl text-white" />
                  </div>
                )}
                
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoSelect} 
                  className="mb-2"
                />
                <small className="text-xs text-gray-500">Maksimalus failo dydis: 1MB</small>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-xl font-semibold mb-4">Medžioklės teritorijos vieta</h3>
              <p className="text-sm mb-3">Paspauskite žemėlapyje, kad nustatytumėte klubo pagrindinę medžioklės teritorijos vietą.</p>
              
              {mapError ? (
                <MapErrorComponent />
              ) : (
                <div 
                  ref={mapRef} 
                  style={{ width: '100%', height: '300px', borderRadius: '8px' }} 
                  className="mb-3"
                />
              )}
              
              <div className="text-sm text-gray-400 mt-3">
                <p className="m-0">Ilguma: {club.huntingAreaLocation[0]?.toFixed(6) || 'N/A'}</p>
                <p className="m-0">Platuma: {club.huntingAreaLocation[1]?.toFixed(6) || 'N/A'}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default EditClubPage;