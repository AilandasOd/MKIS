'use client';
import React, { useState, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { useRouter } from 'next/navigation';
import { useClub } from '../../../context/ClubContext';

const huntedAnimalsList = [
    { name: 'Briedis' },
    { name: 'Taurusis elnias' },
    { name: 'Danielius' },
    { name: 'Stirna' },
    { name: 'Šernas' },
    { name: 'Vilkas' },
    { name: 'Paprastasis šakalas' },
    { name: 'Miškinė kiaunė' },
    { name: 'Akmeninė kiaunė' },
    { name: 'Juodasis šeškas' },
    { name: 'Barsukas' },
    { name: 'Pilkasis kiškis' },
    { name: 'Bebras' },
    { name: 'Želmeninė žąsis' },
    { name: 'Baltakaktė žąsis' },
    { name: 'Didžioji antis' },
    { name: 'Rudagalvė kryklė' },
    { name: 'Klykuolė' },
    { name: 'Kanadinė berniklė' },
    { name: 'Kuoduotoji antis' },
    { name: 'Laukys' },
    { name: 'Perkūno oželis' },
    { name: 'Slanka' },
    { name: 'Fazanas' },
    { name: 'Keršulys' },
    { name: 'Uolinis karvelis' },
    { name: 'Kovas' },
    { name: 'Pilkoji varna' },
    { name: 'Lapė' },
    { name: 'Mangutas' },
    { name: 'Paprastasis meškėnas' },
    { name: 'Kanadinė audinė' },
    { name: 'Nutrija' },
    { name: 'Ondatra' },
    { name: 'Dėmėtasis elnias' },
    { name: 'Dovydo elnias' }
];

const CreatePostForm = () => {
    const [entryType, setEntryType] = useState('Sumedžiotas žvėris');
    const [name, setName] = useState('');
    const [dateTime, setDateTime] = useState(null);
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { selectedClub } = useClub();
    const router = useRouter();
    const toast = useRef(null);
    const fileUploadRef = useRef(null);

    const entryOptions = [
        { label: 'Sumedžiotas žvėris', value: 'Sumedžiotas žvėris' },
        { label: 'Naujas įrašas', value: 'Įrašas' }
    ];

    const handleSubmit = async () => {
        if (!selectedClub) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Nepasirinkote klubo', 
                life: 3000 
            });
            return;
        }

        // Validate fields
        if (entryType === 'Sumedžiotas žvėris' && (!name || !dateTime)) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Prašome užpildyti visus laukus', 
                life: 3000 
            });
            return;
        }
        
        if (entryType === 'Įrašas' && !name) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Prašaume užpildyti visus laukus', 
                life: 3000 
            });
            return;
        }

        try {
            setSubmitting(true);
            
            // Extract animal name from object if needed
            let animalType = null;
            if (entryType === 'Sumedžiotas žvėris') {
                animalType = typeof name === 'object' ? name.name : name;
            }
            
            // Create form data
            const formData = new FormData();
            
            // Add post data fields manually
            formData.append('Type', entryType);
            formData.append('Title', typeof name === 'object' ? name.name : name);
            formData.append('Description', description);
            
            // Add animal specific fields
            if (entryType === 'Sumedžiotas žvėris') {
                formData.append('AnimalType', animalType);
                if (dateTime) {
                    formData.append('HuntedDate', dateTime.toISOString());
                }
            }
            
            // Add image if it exists
            if (image) {
                formData.append('image', image);
            }
            
            // Make the API call
            const response = await fetch(`https://localhost:7091/api/Posts?clubId=${selectedClub.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    // Don't set Content-Type header, let browser set it with boundary for multipart/form-data
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Server returned ${response.status}`);
            }
            
            toast.current.show({ 
                severity: 'success', 
                summary: 'Success', 
                detail: 'Įrašas sukurtas sėkmingai', 
                life: 3000 
            });
            
            // Redirect back to dashboard after short delay
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
            
        } catch (error) {
            console.error('Error creating post:', error);
            toast.current.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Nepavykos sukurti įrašo: ' + error.message, 
                life: 3000 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = (e) => {
        if (e.files && e.files.length > 0) {
            setImage(e.files[0]);
        }
    };

    const clearForm = () => {
        setName('');
        setDateTime(null);
        setImage(null);
        setDescription('');
        if (fileUploadRef.current) {
            fileUploadRef.current.clear();
        }
    };

    return (
        <div className="flex justify-content-center">
            <Toast ref={toast} />
            <Card title="Naujas įrašas" className="w-full md:w-6">
                <div className="field mb-4">
                    <label htmlFor="entryType" className="block mb-2 font-medium">Įrašo tipas</label>
                    <Dropdown 
                        id="entryType" 
                        value={entryType} 
                        options={entryOptions} 
                        onChange={(e) => {
                            setEntryType(e.value);
                            clearForm();
                        }} 
                        className="w-full" 
                    />
                </div>

                <div className="field mb-4">
                    <label htmlFor="name" className="block mb-2 font-medium">
                        {entryType === 'Sumedžiotas žvėris' ? 'Žvėries tipas' : 'Įrašo pavadinimas'}
                    </label>
                    {entryType === 'Sumedžiotas žvėris' ? (
                        <Dropdown 
                            id="name" 
                            value={name} 
                            options={huntedAnimalsList} 
                            onChange={(e) => setName(e.value)} 
                            optionLabel="name" 
                            filter 
                            className="w-full" 
                            placeholder="Pasirinkite žvėrį" 
                        />
                    ) : (
                        <InputText 
                            id="name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="w-full" 
                        />
                    )}
                </div>

                {entryType === 'Sumedžiotas žvėris' && (
                    <div className="field mb-4">
                        <label htmlFor="datetime" className="block mb-2 font-medium">Laikas</label>
                        <Calendar 
                            id="datetime" 
                            value={dateTime} 
                            onChange={(e) => setDateTime(e.value)} 
                            showIcon 
                            showTime 
                            className="w-full" 
                        />
                    </div>
                )}

                <div className="field mb-4">
                    <label htmlFor="image" className="block mb-2 font-medium">Nuotrauka</label>
                    <FileUpload 
                        ref={fileUploadRef}
                        name="image" 
                        mode="basic" 
                        accept="image/*" 
                        maxFileSize={2000000} 
                        customUpload 
                        uploadHandler={handleImageUpload} 
                        chooseLabel="Pasirinkti" 
                        className="w-full" 
                        auto 
                    />
                </div>

                <div className="field mb-4">
                    <label htmlFor="description" className="block mb-2 font-medium">Aprašymas</label>
                    <InputTextarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        className="w-full" 
                        rows={5} 
                    />
                </div>

                <div className="flex gap-2">
                    <Button 
                        label="Atšaukti" 
                        icon="pi pi-times" 
                        className="p-button-outlined pd-3" 
                        onClick={() => router.push('/dashboard')} 
                        disabled={submitting}
                    />
                    <Button 
                        label="Saugoti" 
                        icon="pi pi-check" 
                        onClick={handleSubmit} 
                        className="w-full" 
                        loading={submitting}
                    />
                </div>
            </Card>
        </div>
    );
};

export default CreatePostForm;