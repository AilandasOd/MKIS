'use client';
import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { useParams } from 'next/navigation';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';

interface Member {
    id: string;
    name: string;
    birthDate: string;
    photo: string;
    activity: number;
    huntingSince: string;
    status: string;
    email: string;
    phoneNumber: string;
    age: number;
}

const MemberDetailPage = () => {
    const { id } = useParams();
    const [member, setMember] = useState<Member | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        
        const fetchMember = async () => {
            try {
                const res = await fetch(`https://localhost:7091/api/Members/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });
                
                if (!res.ok) {
                    throw new Error('Failed to fetch member details');
                }
                
                const data = await res.json();
                setMember(data);
            } catch (err) {
                setError('An error occurred while fetching member details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchMember();
    }, [id]);

    if (loading) {
        return <div className="flex justify-content-center my-5">Loading member details...</div>;
    }

    if (error || !member) {
        return (
            <Card className="p-4 my-3">
                <div className="text-center text-xl text-red-500">{error || 'Member not found'}</div>
            </Card>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('lt-LT');
    };

    return (
        <div className="p-3">
            <Card className="p-4">
                <div className="grid">
                    <div className="col-12 md:col-4 flex flex-column align-items-center">
                        {member.photo ? (
                            <img 
                                src={`https://localhost:7091${member.photo}`} 
                                alt={member.name} 
                                className="w-12 h-12 rounded-full mb-3"
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <Avatar 
                                icon="pi pi-user" 
                                size="xlarge" 
                                shape="circle" 
                                className="mb-3"
                            />
                        )}
                        <h2 className="text-2xl font-bold mb-2">{member.name}</h2>
                        <Tag 
                            value={member.status} 
                            severity={member.status === 'Administratorius' ? 'danger' : 'success'} 
                            className="mb-3"
                        />
                        
                        <div className="w-full mt-3">
                            <div className="mb-2">
                                <span className="font-semibold">Activity in Driven Hunts</span>
                            </div>
                            <ProgressBar 
                                value={member.activity} 
                                showValue={true}
                                className="h-2rem"
                            />
                        </div>
                    </div>
                    
                    <div className="col-12 md:col-8">
                        <h3 className="text-xl font-semibold mb-3">Member Information</h3>
                        <Divider />
                        
                        <div className="grid">
                            <div className="col-12 md:col-6">
                                <div className="mb-3">
                                    <div className="text-sm text-gray-600">Email</div>
                                    <div className="font-medium">{member.email}</div>
                                </div>
                            </div>
                            
                            <div className="col-12 md:col-6">
                                <div className="mb-3">
                                    <div className="text-sm text-gray-600">Phone Number</div>
                                    <div className="font-medium">{member.phoneNumber || 'Not provided'}</div>
                                </div>
                            </div>
                            
                            <div className="col-12 md:col-6">
                                <div className="mb-3">
                                    <div className="text-sm text-gray-600">Age</div>
                                    <div className="font-medium">{member.age} years old</div>
                                </div>
                            </div>
                            
                            <div className="col-12 md:col-6">
                                <div className="mb-3">
                                    <div className="text-sm text-gray-600">Date of Birth</div>
                                    <div className="font-medium">{formatDate(member.birthDate)}</div>
                                </div>
                            </div>
                            
                            <div className="col-12 md:col-6">
                                <div className="mb-3">
                                    <div className="text-sm text-gray-600">Hunting Since</div>
                                    <div className="font-medium">{formatDate(member.huntingSince)}</div>
                                </div>
                            </div>
                            
                            <div className="col-12 md:col-6">
                                <div className="mb-3">
                                    <div className="text-sm text-gray-600">Years of Experience</div>
                                    <div className="font-medium">
                                        {new Date().getFullYear() - new Date(member.huntingSince).getFullYear()} years
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MemberDetailPage;