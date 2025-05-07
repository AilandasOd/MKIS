'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useApiClient } from '../../../../utils/apiClient';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import ClubGuard from '../../../../context/ClubGuard';

interface StatisticsData {
  year: number;
  totalDrivenHunts: number;
  completedDrivenHunts: number;
  animalsHunted: Record<string, number>;
  totalShotsTaken: number;
  totalShotsHit: number;
  activeMembersCount: number;
  topHunters: Array<{
    userId: string;
    name: string;
    count: number;
  }>;
  accuracyPercentage: number;
}

const ClubStatisticsPage = () => {
  const { fetchWithClub, selectedClub } = useApiClient();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>({});
  const [chartOptions, setChartOptions] = useState<any>({});
  const toast = useRef<Toast>(null);
  
  // Track if we've attempted the fetch
  const hasFetchedRef = useRef(false);
  
  useEffect(() => {
    // Only fetch if we haven't already and have a selected club
    if (hasFetchedRef.current || !selectedClub) return;
    
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        // Mark that we've tried to fetch data
        hasFetchedRef.current = true;
        
        console.log("Fetching club statistics for club ID:", selectedClub.id);
        
        // Try using both endpoint formats
        let data;
        
        try {
          // Try query parameter approach first
          data = await fetchWithClub(`Statistics/club?clubId=${selectedClub.id}`);
          console.log("Query parameter approach worked");
        } catch (error) {
          console.warn("Query parameter approach failed, trying route parameter:", error);
          // Fall back to route parameter approach
          data = await fetchWithClub(`Statistics/club/${selectedClub.id}`);
          console.log("Route parameter approach worked");
        }
        
        console.log("Statistics data received:", data);
        setStatistics(data);
        
        // Prepare chart data if we have animal statistics
        if (data && data.animalsHunted && Object.keys(data.animalsHunted).length > 0) {
          prepareChartData(data.animalsHunted);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load club statistics: ' + (error instanceof Error ? error.message : 'Unknown error'),
          life: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatistics();
  }, [fetchWithClub, selectedClub]);
  
  const prepareChartData = (animalsData: Record<string, number>) => {
    const documentStyle = getComputedStyle(document.documentElement);
    
    // Color palette for the chart
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
      '#FF9F40', '#8BC34A', '#9C27B0', '#607D8B', '#E91E63'
    ];
    
    // Generate backgroundColor array based on the number of animals
    const backgroundColor = Object.keys(animalsData).map((_, index) => 
      colors[index % colors.length]
    );
    
    setChartData({
      labels: Object.keys(animalsData),
      datasets: [
        {
          data: Object.values(animalsData),
          backgroundColor,
          hoverBackgroundColor: backgroundColor.map(color => 
            color.replace(')', ', 0.8)').replace('rgb', 'rgba')
          )
        }
      ]
    });
    
    setChartOptions({
      plugins: {
        legend: {
          labels: {
            color: documentStyle.getPropertyValue('--text-color')
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `${context.label}: ${context.raw} animals`;
            }
          }
        }
      }
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <i className="pi pi-spin pi-spinner text-4xl"></i>
      </div>
    );
  }
  
  if (!statistics) {
    return (
      <Card className="text-center p-5">
        <Toast ref={toast} />
        <i className="pi pi-chart-bar text-6xl text-primary mb-3"></i>
        <h2 className="text-2xl font-semibold">No Statistics Available</h2>
        <p className="text-lg">No hunting statistics are available for this club yet.</p>
        <p>Statistics will appear here after completing driven hunts and recording hunted animals.</p>
      </Card>
    );
  }
  
  return (
    <ClubGuard>
      <div className="p-4">
        <Toast ref={toast} />
        
        <h2 className="text-2xl font-bold mb-4">Club Statistics</h2>
        
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Driven Hunts</h3>
                <div className="text-4xl font-bold mb-2">{statistics.completedDrivenHunts} / {statistics.totalDrivenHunts}</div>
                <p className="text-sm text-500">Completed hunts</p>
              </div>
            </Card>
          </div>
          
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Shooting Accuracy</h3>
                <div className="flex flex-column align-items-center">
                  <div className="text-4xl font-bold mb-2">{statistics.accuracyPercentage.toFixed(2)}%</div>
                  <ProgressBar value={statistics.accuracyPercentage.toFixed(2)} className="w-full h-2rem" />
                </div>
                <p className="text-sm text-500 mt-2">{statistics.totalShotsHit} hits from {statistics.totalShotsTaken} shots</p>
              </div>
            </Card>
          </div>
          
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Total Animals</h3>
                <div className="text-4xl font-bold mb-2">
                  {Object.values(statistics.animalsHunted).reduce((a, b) => a + b, 0)}
                </div>
                <p className="text-sm text-500">Animals hunted</p>
              </div>
            </Card>
          </div>
          
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="mb-4">
              <div className="text-center">
                <h3 className="text-xl mb-3">Active Members</h3>
                <div className="text-4xl font-bold mb-2">{statistics.activeMembersCount}</div>
                <p className="text-sm text-500">Club members</p>
              </div>
            </Card>
          </div>
          
          <div className="col-12 md:col-7">
            <Card className="mb-4">
              <h3 className="text-xl font-semibold mb-3">Animals Hunted</h3>
              {Object.keys(statistics.animalsHunted).length > 0 ? (
                <div className="flex justify-content-center">
                  <Chart type="pie" data={chartData} options={chartOptions} style={{ maxHeight: '400px', maxWidth: '100%' }} />
                </div>
              ) : (
                <div className="text-center p-5">
                  <i className="pi pi-info-circle text-3xl text-primary mb-3"></i>
                  <p>No animals have been recorded yet.</p>
                </div>
              )}
            </Card>
          </div>
          
          <div className="col-12 md:col-5">
            <Card className="mb-4">
              <h3 className="text-xl font-semibold mb-3">Top Hunters</h3>
              {statistics.topHunters && statistics.topHunters.length > 0 ? (
                <DataTable value={statistics.topHunters} stripedRows showGridlines>
                  <Column field="name" header="Hunter Name"></Column>
                  <Column field="count" header="Animals Hunted" style={{ width: '120px' }}></Column>
                </DataTable>
              ) : (
                <div className="text-center p-5">
                  <i className="pi pi-users text-3xl text-primary mb-3"></i>
                  <p>No top hunters data available yet.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ClubGuard>
  );
};

export default ClubStatisticsPage;