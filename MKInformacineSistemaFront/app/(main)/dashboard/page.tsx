/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Menu } from 'primereact/menu';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Image } from 'primereact/image';
import { Avatar } from 'primereact/avatar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import Link from 'next/link';
import { ProductService } from '../../../demo/service/ProductService';
import { LayoutContext } from '../../../layout/context/layoutcontext';
import { Demo, CustomEvent } from '@/types';
import { ChartData, ChartOptions } from 'chart.js';
import { useRouter } from 'next/navigation';
import { useClub } from '../../../context/ClubContext';
import ClubGuard from '../../../context/ClubGuard';

const animalsList = ['Elnias', 'Lapė', 'Vilkas', 'Briedis', 'Šernas', 'Stirna'];

const huntingPosts: CustomEvent[] = [
    { status: 'Elk Hunt', date: '2025-04-12T07:30', icon: 'pi pi-image', color: '#3F51B5', image: 'elk.jpg', name: 'Tomas Tomauskas', avatar: 'ivanmagalhaes.png', type: 'Sumedžiotas žvėris', animalType: 'Elnias' },
    { status: 'Duck Season', date: '2025-03-05T06:15', icon: 'pi pi-image', color: '#009688', image: 'gerves.jpg', name: 'Kotryna Kotrynaitė', avatar: 'asiyajavayant.png', type: 'Įrašas' },
    { status: 'Bear Encounter', date: '2025-02-21T17:00', icon: 'pi pi-image', color: '#795548', image: 'fox.jpg', name: 'Jonas Jonauskas', avatar: 'onyamalimba.png', type: 'Sumedžiotas žvėris', animalType: 'Lapė' }
];

const Dashboard = () => {
    const [products, setProducts] = useState<Demo.Product[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [postFilter, setPostFilter] = useState<'All' | 'Įrašas' | 'Sumedžiotas Žvėris'>('All');
    const [animalFilter, setAnimalFilter] = useState<string>('All');
    const [dateSort, setDateSort] = useState<'Newest' | 'Oldest'>('Newest');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const { selectedClub } = useClub();
    const menu1 = useRef<Menu>(null);
    const menu2 = useRef<Menu>(null);
    const [lineOptions, setLineOptions] = useState<ChartOptions>({});

    const applyLightTheme = () => {
        setLineOptions({
            plugins: { legend: { labels: { color: '#495057' } } },
            scales: { x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } }, y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } } }
        });
    };

    const applyDarkTheme = () => {
        setLineOptions({
            plugins: { legend: { labels: { color: '#ebedef' } } },
            scales: { x: { ticks: { color: '#ebedef' }, grid: { color: 'rgba(160, 167, 181, .3)' } }, y: { ticks: { color: '#ebedef' }, grid: { color: 'rgba(160, 167, 181, .3)' } } }
        });
    };

    useEffect(() => {
        if (selectedClub) {
          // Fetch data specific to the selected club
          // Example: Fetch posts for this club
          const fetchClubPosts = async () => {
            try {
              const response = await fetch(`https://localhost:7091/api/posts?clubId=${selectedClub.id}`, {
                headers: {
                  'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                // Update your state with the club-specific data
                // setHuntingPosts(data);
              }
            } catch (error) {
              console.error('Error fetching club posts:', error);
            }
          };
          fetchClubPosts();
      
      // Fetch other club-specific data similarly
    }
  }, [selectedClub]);

    useEffect(() => {
        ProductService.getProductsSmall().then((data) => setProducts(data));
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (layoutConfig.colorScheme === 'light') applyLightTheme();
        else applyDarkTheme();
    }, [layoutConfig.colorScheme]);

    const customizedContent = (item: CustomEvent) => (
        <Card className="mb-4 p-3">
            <div className="flex align-items-center mb-3 justify-content-between">
                <div className="flex align-items-center">
                    <Avatar image={`/demo/images/avatar/${item.avatar}`} shape="circle" size="large" className="mr-2" />
                    <div>
                        <div className="font-medium text-900">{item.name}</div>
                        {isMounted && <small className="text-600">{new Date(item.date).toLocaleString('lt-LT', { hour12: false })}</small>}
                        {item.type === 'Sumedžiotas žvėris' && item.animalType && (
                            <small className="text-600 block">Žvėris: <strong>{item.animalType}</strong></small>
                        )}
                    </div>
                </div>
                <Tag value={item.type} severity={item.type === 'Sumedžiotas žvėris' ? 'success' : 'info'} />
            </div>

            <Image
                src={`/layout/images/${item.image}`}
                alt={item.status}
                width="100%"
                height="300px"
                preview
                style={{ objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem' }}
/>

            <p style={{ minHeight: '80px' }}>
                A brief description of the hunting experience shared by <strong>{item.name}</strong>.
            </p>
        </Card>
    );

    const resetFilters = () => {
        setPostFilter('All');
        setAnimalFilter('All');
        setDateSort('Newest');
        setStartDate(null);
        setEndDate(null);
    };

    const filteredAndSortedPosts = huntingPosts
        .filter((item) => postFilter === 'All' || item.type === postFilter)
        .filter((item) => animalFilter === 'All' || item.animalType === animalFilter)
        .filter((item) => {
            const postDate = new Date(item.date).getTime();
            const start = startDate ? startDate.getTime() : null;
            const end = endDate ? endDate.getTime() : null;
            if (start && postDate < start) return false;
            if (end && postDate > end) return false;
            return true;
        })
        .sort((a, b) => {
            if (dateSort === 'Newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
            else return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

    // Compute Top 5 Members (only considering hunted posts)
    const topMembers = useMemo(() => {
        const memberMap: Record<string, { count: number; animals: Set<string> }> = {};
        huntingPosts.forEach((post) => {
            if (post.type === 'Sumedžiotas žvėris') {
                if (!memberMap[post.name]) {
                    memberMap[post.name] = { count: 0, animals: new Set() };
                }
                memberMap[post.name].count += 1;
                if (post.animalType) memberMap[post.name].animals.add(post.animalType);
            }
        });
        const membersArray = Object.entries(memberMap).map(([name, data]) => ({
            name,
            count: data.count,
            animals: Array.from(data.animals)
        }));
        return membersArray.sort((a, b) => b.count - a.count).slice(0, 5);
    }, []);

    // Prepare Pie Chart Data for This Month's hunted animals
    const pieData = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const counts: Record<string, number> = {};
    
        huntingPosts.forEach((post) => {
            const postDate = new Date(post.date);
    
            // OLD LOGIC (month-based):
            // if (postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear)
    
            // NEW LOGIC (season-based):
            // Let's define season: March 1st - October 31st for example
    
            const seasonStart = new Date(now.getFullYear(), 1, 1); // March 1st
            const seasonEnd = new Date(now.getFullYear(), 12, 31);  // October 31st
    
            if (
                post.type === 'Sumedžiotas žvėris' &&
                post.animalType &&
                postDate >= seasonStart &&
                postDate <= seasonEnd
            ) {
                counts[post.animalType] = (counts[post.animalType] || 0) + 1;
            }
        });
    
        return {
            labels: Object.keys(counts),
            datasets: [
                {
                    data: Object.values(counts),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }
            ]
        } as ChartData;
    }, []);

    const pieOptions: ChartOptions = {
        plugins: { legend: { labels: { color: layoutConfig.colorScheme === 'light' ? '#495057' : '#ebedef' } } }
    };

    return (
        <ClubGuard>
            <div className="grid">
        {/* Add club header */}
        {selectedClub && (
          <div className="col-12">
            <Card className="mb-4">
              <div className="flex align-items-center">
                {selectedClub.logoUrl ? (
                  <img 
                    src={`https://localhost:7091${selectedClub.logoUrl}`} 
                    alt={selectedClub.name} 
                    className="mr-4" 
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div className="flex align-items-center justify-content-center bg-primary border-circle mr-4" style={{ width: '64px', height: '64px' }}>
                    <i className="pi pi-users text-2xl text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold m-0">{selectedClub.name}</h2>
                  <p className="text-sm text-gray-400 m-0">{selectedClub.membersCount} members</p>
                </div>
                <Button 
                  label="Club Details" 
                  icon="pi pi-info-circle" 
                  className="ml-auto p-button-outlined" 
                  onClick={() => router.push(`/clubs/${selectedClub.id}`)} 
                />
              </div>
            </Card>
          </div>
        )}
        </div>
        <div className="grid">
            {/* Left Side: Posts List */}
            <div className="col-12 xl:col-6">
        <div className="card">
            {/* Title full width */}
            <div className="mb-3">
                <h5 className="m-0">Klubo narių įrašai</h5>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
                <Dropdown value={postFilter} options={[{ label: 'Visi įrašai', value: 'All' }, { label: 'Įšai', value: 'Įšas' }, { label: 'Sumedžioti žvėrys', value: 'Sumedžiotas Žvėris' }]} onChange={(e) => setPostFilter(e.value)} className="w-12rem" placeholder="Tipas" />
                <Dropdown value={animalFilter} options={[{ label: 'Visi žvėrys', value: 'All' }, ...animalsList.map((a) => ({ label: a, value: a }))]} onChange={(e) => setAnimalFilter(e.value)} className="w-12rem" placeholder="Žvėris" />
                <Dropdown value={dateSort} options={[{ label: 'Naujausi pirmiau', value: 'Newest' }, { label: 'Seniausi pirmiau', value: 'Oldest' }]} onChange={(e) => setDateSort(e.value)} className="w-12rem" placeholder="Rikiuoti pagal datą" />
                <Calendar value={startDate} onChange={(e) => setStartDate(e.value as Date)} placeholder="Nuo datos" className="w-10rem" />
                <Calendar value={endDate} onChange={(e) => setEndDate(e.value as Date)} placeholder="Iki datos" className="w-10rem" />

                {/* Buttons same size */}
                <div className="flex gap-2">
                    <Button label="Išvalyti filtrus" icon="pi pi-filter-slash" className="p-button-sm p-button-secondary" onClick={resetFilters} />
                    <Link href="/post" className="w-12rem">
                        <Button label="Naujas įrašas" icon="pi pi-plus" className="p-button-sm p-button-success w-full" />
                    </Link>
                </div>
            </div>

            {/* Posts List */}
            <div className="flex flex-column" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {filteredAndSortedPosts.map((item, idx) => (
                    <div key={idx}>{customizedContent(item)}</div>
                ))}
            </div>
        </div>
    </div>

            {/* Right Side: Top 5 Hunters and Pie Chart */}
            <div className="col-12 xl:col-6">
    {/* Top 5 Hunters */}
    <div className="card mb-4">
        <h5>Daugiausiai sezono metu sumedžioję medžiotojai</h5>
        {topMembers.length > 0 ? (
            <div className="flex flex-column gap-3">
                {topMembers.map((member, idx) => (
                    <Card key={idx} className="p-3">
                        <div className="flex align-items-center gap-3">
                            <Avatar
                                image={`/demo/images/avatar/${huntingPosts.find((p) => p.name === member.name)?.avatar || 'default.png'}`}
                                shape="circle"
                                size="large"
                            />
                            <div className="flex flex-column">
                                <span className="font-bold">{member.name}</span>
                                <small className="text-600">Sumedžiotų žvėrių skaičius: {member.count}</small>
                                {member.animals.length > 0 && (
                                    <small className="text-600">Žvėrys: {member.animals.join(', ')}</small>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        ) : (
            <p>Nėra duomenų apie medžiotojus.</p>
        )}
    </div>

    {/* Pie Chart */}
    <div className="card">
    <h5>Šį sezoną sumedžioti žvėrys</h5>
    {pieData.labels && pieData.labels.length > 0 ? (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <Chart type="pie" data={pieData} options={{ ...pieOptions, maintainAspectRatio: false }} style={{ height: '300px' }} />
        </div>
    ) : (
        <p>Nėra duomenų apie šio mėnesio medžiokles.</p>
    )}
</div>
</div>

            <Dialog header="Image Preview" visible={!!selectedImage} style={{ width: '80vw' }} modal dismissableMask onHide={() => setSelectedImage(null)}>
                {selectedImage && <img src={selectedImage} alt="Preview" style={{ width: '100%', borderRadius: '8px' }} />}
            </Dialog>
        </div>
        </ClubGuard>
    );
};

export default Dashboard;
