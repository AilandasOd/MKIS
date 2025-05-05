'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Avatar } from 'primereact/avatar';

interface UserProfile {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: Date | null;
    age: number;
    avatarPhoto: string;
    huntingTicketIssueDate: Date | null;
}

const UserProfilePage = () => {
    const { userId } = useAuth();
    const [profile, setProfile] = useState<UserProfile>({
        userName: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: null,
        age: 0,
        avatarPhoto: '',
        huntingTicketIssueDate: null
    });
    const [loading, setLoading] = useState(true);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('https://localhost:7091/api/UserProfile', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile({
                    ...data,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                    huntingTicketIssueDate: data.huntingTicketIssueDate ? new Date(data.huntingTicketIssueDate) : null
                });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load profile data', life: 3000 });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect to server', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setProfile({
            ...profile,
            [field]: e.target.value
        });
    };

    const handleDateChange = (date: Date | null, field: string) => {
        setProfile({
            ...profile,
            [field]: date
        });
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch('https://localhost:7091/api/UserProfile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    email: profile.email,
                    phoneNumber: profile.phoneNumber,
                    dateOfBirth: profile.dateOfBirth,
                    huntingTicketIssueDate: profile.huntingTicketIssueDate
                })
            });

            if (response.ok) {
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 3000 });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect to server', life: 3000 });
        }
    };

    const onUploadAvatar = async (event: { files: File[] }) => {
        const file = event.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('https://localhost:7091/api/UserProfile/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setProfile({
                    ...profile,
                    avatarPhoto: data.avatarUrl
                });
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Avatar uploaded successfully', life: 3000 });
            } else {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to upload avatar', life: 3000 });
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to connect to server', life: 3000 });
        }
    };

    if (loading) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h2 className="text-2xl font-bold mb-4">User Profile</h2>

            <div className="grid">
                <div className="col-12 md:col-4">
                    <Card className="flex flex-column align-items-center text-center p-4">
                        {profile.avatarPhoto ? (
                            <img 
                                src={`https://localhost:7091${profile.avatarPhoto}`} 
                                alt="User avatar" 
                                className="w-12 h-12 rounded-full mb-3"
                            />
                        ) : (
                            <Avatar 
                                icon="pi pi-user" 
                                size="xlarge" 
                                shape="circle" 
                                className="mb-3"
                            />
                        )}
                        <h3 className="text-xl font-semibold mb-1">{profile.userName}</h3>
                        <p className="text-gray-500 mb-3">{profile.email}</p>
                        <p className="mb-2"><strong>Age:</strong> {profile.age}</p>
                        <p className="mb-4"><strong>Hunter ID Since:</strong> {profile.huntingTicketIssueDate?.toLocaleDateString()}</p>
                        
                        <FileUpload 
                            mode="basic" 
                            name="avatar" 
                            accept="image/*" 
                            maxFileSize={1000000} 
                            customUpload={true}
                            uploadHandler={onUploadAvatar}
                            chooseLabel="Change Avatar"
                            className="w-full"
                        />
                    </Card>
                </div>

                <div className="col-12 md:col-8">
                    <Card className="p-4">
                        <h3 className="text-xl font-semibold mb-4">Edit Profile Information</h3>
                        
                        <div className="formgrid grid">
                            <div className="field col-12 md:col-6">
                                <label htmlFor="firstName" className="block text-sm font-medium mb-2">First Name</label>
                                <InputText 
                                    id="firstName" 
                                    value={profile.firstName} 
                                    onChange={(e) => handleInputChange(e, 'firstName')} 
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="field col-12 md:col-6">
                                <label htmlFor="lastName" className="block text-sm font-medium mb-2">Last Name</label>
                                <InputText 
                                    id="lastName" 
                                    value={profile.lastName} 
                                    onChange={(e) => handleInputChange(e, 'lastName')} 
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="field col-12 md:col-6">
                                <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                                <InputText 
                                    id="email" 
                                    value={profile.email} 
                                    onChange={(e) => handleInputChange(e, 'email')} 
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="field col-12 md:col-6">
                                <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2">Phone Number</label>
                                <InputText 
                                    id="phoneNumber" 
                                    value={profile.phoneNumber} 
                                    onChange={(e) => handleInputChange(e, 'phoneNumber')} 
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="field col-12 md:col-6">
                                <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">Date of Birth</label>
                                <Calendar 
                                    id="dateOfBirth" 
                                    value={profile.dateOfBirth} 
                                    onChange={(e) => handleDateChange(e.value as Date, 'dateOfBirth')} 
                                    showIcon
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="field col-12 md:col-6">
                                <label htmlFor="huntingTicketIssueDate" className="block text-sm font-medium mb-2">Hunting Ticket Issue Date</label>
                                <Calendar 
                                    id="huntingTicketIssueDate" 
                                    value={profile.huntingTicketIssueDate} 
                                    onChange={(e) => handleDateChange(e.value as Date, 'huntingTicketIssueDate')} 
                                    showIcon
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="col-12 mt-4">
                                <Button 
                                    label="Save Changes" 
                                    icon="pi pi-save" 
                                    onClick={handleSubmit} 
                                    className="w-full md:w-auto"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;