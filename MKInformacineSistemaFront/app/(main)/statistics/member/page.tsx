'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { useApiClient } from '../../../../utils/apiClient';
import ClubGuard from '../../../../context/ClubGuard';
import { LayoutContext } from '../../../../layout/context/layoutcontext';

const HunterStatistics = () => {
    const [chartOptions, setChartOptions] = useState({});
    const [chartData, setChartData] = useState({});
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const { layoutConfig } = React.useContext(LayoutContext);
    const { fetchWithClub, selectedClub } = useApiClient();
    const toast = useRef(null);
    
    // Track if we've fetched
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        // Fetch statistics from the backend
        const fetchStatistics = async () => {
            if (!selectedClub || hasFetchedRef.current) return;
            
            try {
                setLoading(true);
                console.log("Fetching statistics for club:", selectedClub.id);
                
                // Based on your StatisticsController.cs, the endpoint should be:
                // GET /api/Statistics/user/{clubId}
                // or with query parameter: GET /api/Statistics/user?clubId={clubId}
                
                // Try using the correct endpoint format:
                const data = await fetchWithClub(`Statistics/user/${selectedClub.id}`);
                console.log("Statistics data received:", data);
                
                setStatistics(data);
                
                if (data && data.animalsHunted && Object.keys(data.animalsHunted).length > 0) {
                    // Create chart data from backend response
                    prepareChartData(data.animalsHunted);
                }
                
                hasFetchedRef.current = true;
            } catch (error) {
                console.error('Error fetching statistics:', error);
                
                // Try the alternative endpoint format if the first one fails
                try {
                    console.log("Trying alternative endpoint format");
                    const data = await fetchWithClub(`Statistics/user?clubId=${selectedClub.id}`);
                    console.log("Statistics data received from alternative endpoint:", data);
                    
                    setStatistics(data);
                    
                    if (data && data.animalsHunted && Object.keys(data.animalsHunted).length > 0) {
                        prepareChartData(data.animalsHunted);
                    }
                    
                    hasFetchedRef.current = true;
                } catch (secondError) {
                    console.error('Error fetching statistics from alternative endpoint:', secondError);
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load statistics. Please check your network connection.',
                        life: 3000
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchStatistics();
    }, [selectedClub, fetchWithClub]);

    // Prepare chart data and styling
    const prepareChartData = (animalsHunted) => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dfe7ef';

        // For the bar chart
        const barData = {
            labels: Object.keys(animalsHunted),
            datasets: [{
                label: 'Sumedžioti žvėrys',
                backgroundColor: documentStyle.getPropertyValue('--primary-500') || '#6366f1',
                borderColor: documentStyle.getPropertyValue('--primary-500') || '#6366f1',
                data: Object.values(animalsHunted)
            }]
        };

        // For the pie chart
        const pieData = {
            labels: Object.keys(animalsHunted),
            datasets: [{
                data: Object.values(animalsHunted),
                backgroundColor: [
                    documentStyle.getPropertyValue('--indigo-500') || '#6366f1',
                    documentStyle.getPropertyValue('--purple-500') || '#a855f7',
                    documentStyle.getPropertyValue('--teal-500') || '#14b8a6',
                    documentStyle.getPropertyValue('--orange-500') || '#f97316',
                    documentStyle.getPropertyValue('--cyan-500') || '#06b6d4'
                ],
                hoverBackgroundColor: [
                    documentStyle.getPropertyValue('--indigo-400') || '#8183f4',
                    documentStyle.getPropertyValue('--purple-400') || '#b975f9',
                    documentStyle.getPropertyValue('--teal-400') || '#41c5b7',
                    documentStyle.getPropertyValue('--orange-400') || '#fb923c',
                    documentStyle.getPropertyValue('--cyan-400') || '#22d3ee'
                ]
            }]
        };

        // Chart options
        const options = {
            barOptions: { 
                plugins: { 
                    legend: { 
                        labels: { color: textColor } 
                    } 
                }, 
                scales: { 
                    x: { 
                        ticks: { color: textColorSecondary, font: { weight: '500' } }, 
                        grid: { display: false }, 
                        border: { display: false } 
                    }, 
                    y: { 
                        ticks: { color: textColorSecondary }, 
                        grid: { color: surfaceBorder }, 
                        border: { display: false } 
                    } 
                }, 
                maintainAspectRatio: false 
            },
            pieOptions: { 
                plugins: { 
                    legend: { 
                        labels: { usePointStyle: true, color: textColor } 
                    } 
                }, 
                maintainAspectRatio: false 
            }
        };

        setChartData({ barData, pieData });
        setChartOptions(options);
    };

    // Prepare the list of all possible animals
    const getHuntedAnimalsList = () => {
        if (!statistics || !statistics.animalsHunted) {
            return [];
        }

        // The full list of animal types from the backend
        const allAnimals = [
            'Briedis', 'Taurusis elnias', 'Danielius', 'Stirna', 'Šernas', 'Vilkas',
            'Paprastasis šakalas', 'Miškinė kiaunė', 'Akmeninė kiaunė', 'Juodasis šeškas',
            'Barsukas', 'Pilkasis kiškis', 'Bebras', 'Želmeninė žąsis', 'Baltakaktė žąsis',
            'Didžioji antis', 'Rudagalvė kryklė', 'Klykuolė', 'Kanadinė berniklė',
            'Kuoduotoji antis', 'Laukys', 'Perkūno oželis', 'Slanka', 'Fazanas',
            'Keršulys', 'Uolinis karvelis', 'Kovas', 'Pilkoji varna', 'Lapė',
            'Mangutas', 'Paprastasis meškėnas', 'Kanadinė audinė', 'Nutrija',
            'Ondatra', 'Dėmėtasis elnias', 'Dovydo elnias'
        ];

        // Map the full list with counts from statistics where available
        return allAnimals.map(animal => ({
            name: animal,
            hunted: statistics.animalsHunted[animal] || 0
        }));
    };

    if (loading) {
        return <div className="flex justify-content-center align-items-center" style={{ height: '70vh' }}>
            <i className="pi pi-spin pi-spinner text-3xl"></i>
        </div>;
    }

    return (
        <ClubGuard>
            <div className="grid p-fluid">
                <Toast ref={toast} />
                
                {statistics ? (
                    <>
                        <div className="col-12">
                            <Card className="mb-4">
                                <h5>Medžiotojo statistika: {statistics.userName}</h5>
                                <div className="grid">
                                    <div className="col-12 md:col-6">
                                        <div className="font-medium mb-1">Medžiojimo metai: {statistics.year}</div>
                                        <div className="text-sm text-500">Aktyviai medžioja nuo {new Date(statistics.huntingSince || '2010-01-01').getFullYear()} metų</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                        
                        <div className="col-12">
                            <Card>
                                <h5>Šūvių taiklumas</h5>
                                <div className="relative">
                                    <ProgressBar value={statistics.accuracyPercentage} showValue></ProgressBar>
                                    <div className="text-center font-bold mt-2">
                                        {statistics.shotsHit} / {statistics.shotsTaken} Šūvių
                                    </div>
                                </div>
                            </Card>
                        </div>
                        
                        <div className="col-12">
                            <Card>
                                <h5>Varyminių medžioklių aktyvumas</h5>
                                <div className="relative">
                                    <ProgressBar value={statistics.activityPercentage} showValue></ProgressBar>
                                    <div className="text-center font-bold mt-2">
                                        {statistics.drivenHuntsParticipated} medžioklių iš {statistics.drivenHuntsParticipated > 0 ? 
                                            Math.round(statistics.drivenHuntsParticipated * 100 / statistics.activityPercentage) : 0}
                                    </div>
                                    {statistics.drivenHuntsLed > 0 && (
                                        <div className="text-center text-sm text-500 mt-1">
                                            Vadovavo {statistics.drivenHuntsLed} medžioklėms
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                        
                        {chartData.barData && (
                            <div className="col-12 xl:col-6">
                                <Card className="flex flex-column align-items-center" style={{ height: '400px' }}>
                                    <h5 className="text-left w-full">Sumedžioti žvėrys</h5>
                                    <Chart type="bar" data={chartData.barData} options={chartOptions.barOptions} style={{ width: '100%', height: '300px' }}></Chart>
                                </Card>
                            </div>
                        )}
                        
                        {chartData.pieData && (
                            <div className="col-12 xl:col-6">
                                <Card className="flex flex-column align-items-center" style={{ height: '400px' }}>
                                    <h5 className="text-left w-full">Sumedžioti žvėrys pagal rūšį</h5>
                                    <Chart type="pie" data={chartData.pieData} options={chartOptions.pieOptions} style={{ width: '100%', height: '300px' }}></Chart>
                                </Card>
                            </div>
                        )}
                        
                        <div className="col-12">
                            <Card>
                                <h5>Sumedžiotų žvėrių sąrašas</h5>
                                <DataTable value={getHuntedAnimalsList()} stripedRows showGridlines>
                                    <Column field="name" header="Žvėris"></Column>
                                    <Column field="hunted" header="Sumedžiota"></Column>
                                </DataTable>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div className="col-12">
                        <Card className="text-center p-5">
                            <i className="pi pi-chart-bar text-5xl text-gray-300 mb-3"></i>
                            <h3 className="text-xl font-semibold">Nėra statistikos duomenų</h3>
                            <p className="text-gray-500 mt-2">
                                Dalyvaukite medžioklėse ir fiksuokite sumedžiotus žvėris, kad matytumėte savo statistiką.
                            </p>
                        </Card>
                    </div>
                )}
            </div>
        </ClubGuard>
    );
};

export default HunterStatistics;