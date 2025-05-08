'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { Tag } from 'primereact/tag';
import { Image } from 'primereact/image';
import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';
import { useApiClient } from '../../../utils/api';
import ClubGuard from '../../../context/ClubGuard';

const Dashboard = () => {
  const { fetchWithClub, selectedClub } = useApiClient();
  const [posts, setPosts] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [topHunters, setTopHunters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({});
  const toast = useRef(null);
  const router = useRouter();

  // Remove clubIdRef as it's causing the issue
  // Instead, depend directly on selectedClub.id

  const fetchDashboardData = async () => {
    if (!selectedClub) return;

    try {
      setLoading(true);

      const postsData = await fetchWithClub('Posts');
      setPosts(postsData);

      let statsData;
      try {
        statsData = await fetchWithClub(`Statistics/club?clubId=${selectedClub.id}`);
      } catch (error) {
        statsData = await fetchWithClub(`Statistics/club/${selectedClub.id}`);
      }

      setStatistics(statsData);

      if (statsData && statsData.animalsHunted && Object.keys(statsData.animalsHunted).length > 0) {
        setChartData({
          labels: Object.keys(statsData.animalsHunted),
          datasets: [{
            data: Object.values(statsData.animalsHunted),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
              '#FF9F40', '#8BC34A', '#9C27B0', '#607D8B', '#E91E63']
          }]
        });
      }

      if (statsData && statsData.topHunters && statsData.topHunters.length > 0) {
        setTopHunters(statsData.topHunters);
      } else {
        // Clear top hunters when no data is available
        setTopHunters([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Klaida',
        detail: 'Nepavyko įkelti duomenų: ' + error.message,
        life: 3000
      });
      // Reset state on error
      setStatistics(null);
      setTopHunters([]);
      setChartData({});
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleCreatePost = () => {
    router.push('/post');
  };

  // Effect that runs when selectedClub changes
  useEffect(() => {
    // Only fetch when we have a selected club
    if (selectedClub) {
      console.log("Selected club changed, fetching new data for:", selectedClub.id);
      fetchDashboardData();
    }
  }, [selectedClub?.id]); // Depend directly on selectedClub.id

  const renderPostItem = (post) => (
    <Card className="mb-4 p-3" key={post.id}>
      <div className="flex align-items-center mb-3 justify-content-between">
        <div>
          <div className="font-medium text-900">{post.authorName}</div>
          <small className="text-600">{new Date(post.createdAt).toLocaleString()}</small>
          {post.type === 'Sumedžiotas žvėris' && post.animalType && (
            <small className="text-600 block">Žvėris: <strong>{post.animalType}</strong></small>
          )}
        </div>
        <Tag value={post.type} severity={post.type === 'Sumedžiotas žvėris' ? 'success' : 'info'} />
      </div>

      {post.imageUrl && (
        <Image 
          src={`https://localhost:7091${post.imageUrl}`} 
          alt={post.title} 
          width="100%" 
          preview 
          style={{ objectFit: 'cover', borderRadius: '10px', marginBottom: '1rem' }} 
        />
      )}

      <h3>{post.title}</h3>
      <p>{post.description}</p>
    </Card>
  );

  return (
    <ClubGuard>
      <div className="grid">
        <Toast ref={toast} />

        <div className="col-12 xl:col-6">
          <div className="card">
            <div className="flex justify-content-between align-items-center mb-3">
              <h5>Klubo įrašai</h5>
              <div className="flex gap-2">
                <Button
                  label="Sukurti įrašą"
                  icon="pi pi-plus"
                  onClick={handleCreatePost}
                  className="p-button-sm"
                />
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-center">
                <i className="pi pi-spin pi-spinner text-3xl text-primary mb-3"></i>
                <p>Įkeliami duomenys...</p>
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="flex flex-column" style={{ maxHeight: '650px', overflowY: 'auto' }}>
                {posts.map((post) => renderPostItem(post))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <i className="pi pi-file-edit text-3xl text-gray-300 mb-3"></i>
                <p>Įrašų nėra. Sukurkite pirmą įrašą!</p>
                <Button
                  label="Sukurti įrašą"
                  icon="pi pi-plus"
                  onClick={handleCreatePost}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-12 xl:col-6">
          <div className="card mb-4">
            <h5>Daugiausiai sumedžioję medžiotojai</h5>
            {loading ? (
              <div className="p-3 text-center">
                <i className="pi pi-spin pi-spinner text-2xl text-primary"></i>
              </div>
            ) : topHunters && topHunters.length > 0 ? (
              <DataTable value={topHunters}>
                <Column field="name" header="Medžiotojas" />
                <Column field="count" header="Sumedžiota žvėrių" />
              </DataTable>
            ) : (
              <div className="p-4 text-center">
                <i className="pi pi-users text-3xl text-gray-300 mb-3"></i>
                <p>Nėra duomenų apie geriausius medžiotojus.</p>
                <small className="text-gray-500">
                  Įrašykite medžioklės duomenis, kad matytumėte statistiką.
                </small>
              </div>
            )}
          </div>

          <div className="card">
            <h5>Sumedžioti žvėrys</h5>
            {loading ? (
              <div className="p-3 text-center">
                <i className="pi pi-spin pi-spinner text-2xl text-primary"></i>
              </div>
            ) : statistics && statistics.animalsHunted && Object.keys(statistics.animalsHunted).length > 0 ? (
              <div className="flex justify-content-center">
                <div style={{ width: '300px', height: '300px' }}>
                  <Chart type="pie" data={chartData} />
                </div>
              </div>
            ) : (
              <div className="p-4 text-center">
                <i className="pi pi-chart-pie text-3xl text-gray-300 mb-3"></i>
                <p>Nėra sumedžiotų žvėrių duomenų.</p>
                <small className="text-gray-500">
                  Įrašykite medžioklės rezultatus, kad pamatytumėte statistiką.
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClubGuard>
  );
};

export default Dashboard;