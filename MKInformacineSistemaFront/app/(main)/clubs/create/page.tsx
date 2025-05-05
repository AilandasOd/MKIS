// MKInformacineSistemaFront/app/(main)/clubs/create/page.tsx
'use client';
import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { useRouter } from 'next/navigation';
import { useClub } from '../../../../context/ClubContext';

const CreateClubPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    residenceAddress: '',
    contactEmail: '',
    contactPhone: '',
    foundedDate: null as Date | null,
    useResidenceAsCenter: true
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<[number, number]>([23.349903007765427, 56.10857764750518]); // Default coordinates
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const toast = useRef<Toast>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { refreshClubs } = useClub();

  // Initialize Google Map when the component mounts
  React.useEffect(() => {
    const loadGoogleMap = async () => {
      // Load Google Maps script if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    loadGoogleMap();
  }, []);

  const initMap = () => {
    if (!mapRef.current || !window.google) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: locationCoords[1], lng: locationCoords[0] },
      zoom: 7,
      mapTypeId: google.maps.MapTypeId.HYBRID
    });

    let marker = new google.maps.Marker({
      position: { lat: locationCoords[1], lng: locationCoords[0] },
      map: map,
      draggable: true
    });

    // Update coordinates when marker is dragged
    google.maps.event.addListener(marker, 'dragend', function() {
      const position = marker.getPosition();
      if (position) {
        setLocationCoords([position.lng(), position.lat()]);
      }
    });

    // Add click listener to place marker
    google.maps.event.addListener(map, 'click', function(event) {
      marker.setPosition(event.latLng);
      setLocationCoords([event.latLng.lng(), event.latLng.lat()]);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setFormData({
      ...formData,
      [field]: e.target.value
    });
  };

  const onLogoSelect = (e: { files: File[] }) => {
    if (e.files && e.files.length > 0) {
      const file = e.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    
    // Validate required fields
    if (!formData.name || !formData.residenceAddress || !formData.foundedDate) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields', life: 3000 });
      return;
    }
    
    setLoading(true);
    
    try {
      // First create the club
      const clubResponse = await fetch('https://localhost:7091/api/Clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          residenceAddress: formData.residenceAddress,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          foundedDate: formData.foundedDate,
          useResidenceAsCenter: formData.useResidenceAsCenter,
          huntingAreaLocation: locationCoords // [lng, lat]
        })
      });
      
      if (!clubResponse.ok) {
        throw new Error('Failed to create club');
      }
      
      const clubData = await clubResponse.json();
      
      // If we have a logo, upload it
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('clubId', clubData.id);
        
        const logoResponse = await fetch(`https://localhost:7091/api/Clubs/${clubData.id}/logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
          },
          body: formData
        });
        
        if (!logoResponse.ok) {
          console.error('Failed to upload club logo');
        }
      }
      
      toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Club created successfully', life: 3000 });
      
      // Refresh the clubs list in the global context
      await refreshClubs();
      
      // Navigate to the new club's page
      setTimeout(() => {
        router.push(`/clubs/${clubData.id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating club:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to create club', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      
      <h2 className="text-2xl font-bold mb-4">Create New Hunting Club</h2>
      
      <div className="grid">
        <div className="col-12 md:col-8">
          <Card className="p-4">
            <h3 className="text-xl font-semibold mb-4">Club Information</h3>
            
            <div className="formgrid grid">
              <div className="field col-12">
                <label htmlFor="name" className="block text-sm font-medium mb-2">Club Name*</label>
                <InputText 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => handleInputChange(e, 'name')} 
                  className={submitted && !formData.name ? 'p-invalid w-full' : 'w-full'}
                />
                {submitted && !formData.name && <small className="p-error">Club name is required.</small>}
              </div>
              
              <div className="field col-12">
                <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
                <InputTextarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => handleInputChange(e, 'description')} 
                  className="w-full" 
                  rows={5} 
                />
              </div>
              
              <div className="field col-12">
                <label htmlFor="residenceAddress" className="block text-sm font-medium mb-2">Club Address*</label>
                <InputText 
                  id="residenceAddress" 
                  value={formData.residenceAddress} 
                  onChange={(e) => handleInputChange(e, 'residenceAddress')} 
                  className={submitted && !formData.residenceAddress ? 'p-invalid w-full' : 'w-full'}
                />
                {submitted && !formData.residenceAddress && <small className="p-error">Club address is required.</small>}
              </div>
              
              <div className="field col-12 md:col-6">
                <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">Contact Email</label>
                <InputText 
                  id="contactEmail" 
                  value={formData.contactEmail} 
                  onChange={(e) => handleInputChange(e, 'contactEmail')} 
                  className="w-full" 
                />
              </div>
              
              <div className="field col-12 md:col-6">
                <label htmlFor="contactPhone" className="block text-sm font-medium mb-2">Contact Phone</label>
                <InputText 
                  id="contactPhone" 
                  value={formData.contactPhone} 
                  onChange={(e) => handleInputChange(e, 'contactPhone')} 
                  className="w-full" 
                />
              </div>
              
              <div className="field col-12 md:col-6">
                <label htmlFor="foundedDate" className="block text-sm font-medium mb-2">Founded Date*</label>
                <Calendar 
                  id="foundedDate" 
                  value={formData.foundedDate} 
                  onChange={(e) => setFormData({ ...formData, foundedDate: e.value as Date })} 
                  showIcon
                  className={submitted && !formData.foundedDate ? 'p-invalid w-full' : 'w-full'}
                />
                {submitted && !formData.foundedDate && <small className="p-error">Founded date is required.</small>}
              </div>
            </div>
          </Card>
        </div>
        
        <div className="col-12 md:col-4">
          <Card className="p-4 mb-4">
            <h3 className="text-xl font-semibold mb-4">Club Logo</h3>
            
            <div className="flex flex-column align-items-center">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo Preview" 
                  className="mb-3 border-circle" 
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }} 
                />
              ) : (
                <div className="flex align-items-center justify-content-center bg-primary border-circle mb-3" style={{ width: '150px', height: '150px' }}>
                  <i className="pi pi-users text-4xl text-white" />
                </div>
              )}
              
              <FileUpload 
                mode="basic" 
                name="logo" 
                accept="image/*" 
                maxFileSize={1000000} 
                customUpload={true}
                uploadHandler={onLogoSelect}
                chooseLabel="Select Logo" 
                className="w-full"
              />
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-xl font-semibold mb-4">Hunting Area Location</h3>
            <p className="text-sm mb-3">Click on the map to set your club's main hunting area location.</p>
            
            <div ref={mapRef} style={{ width: '100%', height: '300px', borderRadius: '8px' }} className="mb-3" />
            
            <div className="text-sm text-gray-400">
              <p className="m-0">Longitude: {locationCoords[0].toFixed(6)}</p>
              <p className="m-0">Latitude: {locationCoords[1].toFixed(6)}</p>
            </div>
          </Card>
        </div>
        
        <div className="col-12 flex justify-content-end mt-4">
          <Button label="Cancel" icon="pi pi-times" className="p-button-outlined mr-2" onClick={() => router.push('/clubs/browse')} />
          <Button label="Create Club" icon="pi pi-check" loading={loading} onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
};

export default CreateClubPage;