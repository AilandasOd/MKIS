'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useClub } from '../../../../../context/ClubContext';
import ClubGuard from '../../../../../context/ClubGuard';

const EditBloodTestPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const toast = useRef(null);
    const { selectedClub } = useClub();
    
    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        testName: '',
        animalType: '',
        dateHunted: null,
        testStartDate: null,
        description: '',
        status: '',
        participantIds: []
    });

    const statusOptions = [
        { label: 'Patvirtinta', value: 'Patvirtinta' },
        { label: 'Laukiama', value: 'Laukiama' },
        { label: 'Netinkamas', value: 'Netinkamas' }
    ];

    // Fetch test data and members
    useEffect(() => {
        if (!selectedClub || !id) return;
        
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch blood test
                const testResponse = await fetch(`https://localhost:7091/api/BloodTests/${id}?clubId=${selectedClub.id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });
                
                if (!testResponse.ok) {
                    throw new Error(`HTTP error! Status: ${testResponse.status}`);
                }
                
                const testData = await testResponse.json();
                setTest(testData);
                
                // Transform dates into Date objects
                setFormData({
                    testName: testData.testName,
                    animalType: testData.animalType,
                    dateHunted: testData.dateHunted ? new Date(testData.dateHunted) : null,
                    testStartDate: testData.testStartDate ? new Date(testData.testStartDate) : null,
                    description: testData.description,
                    status: testData.status,
                    participantIds: testData.participants ? testData.participants.map(p => p.userId) : []
                });
                
                // Fetch members
                const membersResponse = await fetch(`https://localhost:7091/api/Members?clubId=${selectedClub.id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });
                
                if (!membersResponse.ok) {
                    throw new Error(`HTTP error! Status: ${membersResponse.status}`);
                }
                
                const membersData = await membersResponse.json();
                setMembers(membersData);
                
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load test data: ' + error.message,
                    life: 3000
                });
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [selectedClub, id]);

    const handleSubmit = async () => {
        if (!formData.testName || !formData.animalType || !formData.dateHunted || !formData.testStartDate || !formData.status) {
            toast.current?.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields',
                life: 3000
            });
            return;
        }

        try {
            setSubmitting(true);
            
            // Prepare the update payload
            const updateData = {
                ...formData,
                id: parseInt(id)
            };
            
            const response = await fetch(`https://localhost:7091/api/BloodTests/${id}?clubId=${selectedClub.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Blood test updated successfully',
                life: 3000
            });
            
            // Navigate back to list
            setTimeout(() => {
                router.push('/tests/list');
            }, 1500);
        } catch (error) {
            console.error('Error updating blood test:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to update blood test: ' + error.message,
                life: 3000
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ height: '70vh' }}>
                <ProgressSpinner />
            </div>
        );
    }

    if (!test) {
        return (
            <div className="card p-5 text-center">
                <Toast ref={toast} />
                <i className="pi pi-exclamation-triangle text-3xl text-yellow-500 mb-3"></i>
                <h3>Test Not Found</h3>
                <p>The blood test you're looking for could not be found.</p>
                <Button 
                    label="Back to List" 
                    icon="pi pi-arrow-left" 
                    onClick={() => router.push('/tests/list')} 
                    className="mt-3"
                />
            </div>
        );
    }

    return (
        <ClubGuard>
            <div className="card p-5">
                <Toast ref={toast} />
                <h5>Redaguoti tyrimą</h5>
                <div className="grid formgrid p-fluid">
                    <div className="field col-12 md:col-6">
                        <label>Pavadinimas</label>
                        <InputText 
                            value={formData.testName} 
                            onChange={(e) => setFormData({ ...formData, testName: e.target.value })} 
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Žvėries tipas</label>
                        <InputText 
                            value={formData.animalType} 
                            onChange={(e) => setFormData({ ...formData, animalType: e.target.value })} 
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Sumedžiojimo data</label>
                        <Calendar
                            value={formData.dateHunted}
                            onChange={(e) => setFormData({ ...formData, dateHunted: e.value })}
                            dateFormat="yy-mm-dd"
                            showIcon
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Tyrimų pridavimo data</label>
                        <Calendar
                            value={formData.testStartDate}
                            onChange={(e) => setFormData({ ...formData, testStartDate: e.value })}
                            dateFormat="yy-mm-dd"
                            showIcon
                        />
                    </div>

                    <div className="field col-12">
                        <label>Aprašymas</label>
                        <InputText 
                            value={formData.description} 
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Statusas</label>
                        <Dropdown
                            value={formData.status}
                            options={statusOptions}
                            onChange={(e) => setFormData({ ...formData, status: e.value })}
                            placeholder="Pasirinkite statusą"
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label>Priskirti nariai</label>
                        <MultiSelect
                            value={formData.participantIds}
                            options={members}
                            onChange={(e) => setFormData({ ...formData, participantIds: e.value })}
                            optionLabel="name"
                            optionValue="userId"
                            placeholder="Pasirinkite narius"
                            filter
                            filterPlaceholder="Ieškoti nario"
                            display="chip"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-4">
                    <Button 
                        label="Išsaugoti" 
                        icon="pi pi-save" 
                        onClick={handleSubmit} 
                        loading={submitting}
                    />
                    <Button 
                        label="Atšaukti" 
                        icon="pi pi-times" 
                        severity="secondary" 
                        onClick={() => router.push('/tests/list')} 
                        disabled={submitting}
                    />
                </div>
            </div>
        </ClubGuard>
    );
};

export default EditBloodTestPage;