/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { useRouter } from 'next/navigation';

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

const HuntedAnimalForm = () => {
    const [entryType, setEntryType] = useState('Sumedžiotas žvėris');
    const [name, setName] = useState('');
    const [dateTime, setDateTime] = useState(null);
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState('');
    const router = useRouter();

    const handleSubmit = () => {
        console.log('Submitted:', { entryType, name, dateTime, image, description });
        alert('Form submitted!');
        router.push('/dashboard');
    };

    const handleImageUpload = (e) => {
        if (e.files.length > 0) {
            setImage(e.files[0]);
        }
    };

    const entryOptions = [
        { label: 'Sumedžiotas žvėris', value: 'Sumedžiotas žvėris' },
        { label: 'Naujas įrašas', value: 'Naujas įrašas' }
    ];

    return (
        <div className="flex justify-content-center">
            <Card title="Naujas įrašas" className="w-full md:w-6">
                <div className="field mb-4">
                    <label htmlFor="entryType" className="block mb-2 font-medium">Įrašo tipas</label>
                    <Dropdown id="entryType" value={entryType} options={entryOptions} onChange={(e) => setEntryType(e.value)} className="w-full" />
                </div>

                <div className="field mb-4">
                    <label htmlFor="name" className="block mb-2 font-medium">{entryType === 'Sumedžiotas žvėris' ? 'Žvėries tipas' : 'Įrašo pavadinimas'}</label>
                    {entryType === 'Sumedžiotas žvėris' ? (
                        <Dropdown id="name" value={name} options={huntedAnimalsList} onChange={(e) => setName(e.value)} optionLabel="name" filter className="w-full" placeholder="Pasirinkite žvėrį" />
                    ) : (
                        <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
                    )}
                </div>

                {entryType === 'Sumedžiotas žvėris' && (
                    <div className="field mb-4">
                        <label htmlFor="datetime" className="block mb-2 font-medium">Laikas</label>
                        <Calendar id="datetime" value={dateTime} onChange={(e) => setDateTime(e.value)} showIcon showTime className="w-full" />
                    </div>
                )}

                <div className="field mb-4">
                    <label htmlFor="image" className="block mb-2 font-medium">Nuotrauka</label>
                    <FileUpload name="image" mode="basic" accept="image/*" maxFileSize={2000000} customUpload uploadHandler={handleImageUpload} chooseLabel="Pasirinkti" className="w-full" auto />
                </div>

                <div className="field mb-4">
                    <label htmlFor="description" className="block mb-2 font-medium">Aprašymas</label>
                    <InputTextarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" rows={5} />
                </div>

                <Button label="Saugoti" icon="pi pi-check" onClick={handleSubmit} className="w-full" />
            </Card>
        </div>
    );
};

export default HuntedAnimalForm;
