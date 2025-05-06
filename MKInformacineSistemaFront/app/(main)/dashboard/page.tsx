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
  
  // Add key to track club changes
  const clubIdRef = useRef(null);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    if (!selectedClub) return;
    
    try {
      setLoading(true);
      console.log("Fetching dashboard data for club:", selectedClub.id);
      
      // Fetch posts
      const postsData = await fetchWithClub('Posts');
      setPosts(postsData);
      
      try {
        // Try using both endpoint formats
        let statsData;
        
        try {
          // Try query parameter approach first (more likely to work based on error)
          statsData = await fetchWithClub(`Statistics/club?clubId=${selectedClub.id}`);
        } catch (error) {
          console.warn("Query parameter approach failed, trying route parameter:", error);
          // Fall back to route parameter approach
          statsData = await fetchWithClub(`Statistics/club/${selectedClub.id}`);
        }
        
        console.log("Statistics data received:", statsData);
        setStatistics(statsData);
        
        // Check for animals hunted data and create chart if available
        if (statsData && statsData.animalsHunted && Object.keys(statsData.animalsHunted).length > 0) {
          console.log("Creating chart with animal data:", statsData.animalsHunted);
          setChartData({
            labels: Object.keys(statsData.animalsHunted),
            datasets: [{
              data: Object.values(statsData.animalsHunted),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
                              '#FF9F40', '#8BC34A', '#9C27B0', '#607D8B', '#E91E63']
            }]
          });
        } else {
          console.log("No animals hunted data available");
        }
        
        // Check for top hunters data and set if available
        if (statsData && statsData.topHunters && statsData.topHunters.length > 0) {
          console.log("Setting top hunters data:", statsData.topHunters);
          setTopHunters(statsData.topHunters);
        } else {
          console.log("No top hunters data available");
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load statistics: ' + error.message,
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load dashboard data: ' + error.message,
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Effect that runs when selectedClub changes
  useEffect(() => {
    // Only fetch if club has changed or is newly selected
    if (selectedClub && selectedClub.id !== clubIdRef.current) {
      console.log("Club changed from", clubIdRef.current, "to", selectedClub.id);
      clubIdRef.current = selectedClub.id;
      fetchDashboardData();
    }
  }, [selectedClub]); // Only depend on selectedClub

  const renderPostItem = (post) => (
    <Card className="mb-4 p-3" key={post.id}>
      <div className="flex align-items-center mb-3 justify-content-between">
        <div className="flex align-items-center">
          <Avatar 
            image={post.authorAvatarUrl ? `https://localhost:7091${post.authorAvatarUrl}` : null}
            icon={!post.authorAvatarUrl ? "pi pi-user" : null}
            shape="circle" 
            size="large" 
            className="mr-2" 
          />
          <div>
            <div className="font-medium text-900">{post.authorName}</div>
            <small className="text-600">{new Date(post.createdAt).toLocaleString()}</small>
            {post.type === 'Sumedžiotas žvėris' && post.animalType && (
              <small className="text-600 block">Žvėris: <strong>{post.animalType}</strong></small>
            )}
          </div>
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

  if (loading) {
    return <div className="flex justify-content-center">Loading dashboard data...</div>;
  }

  return (
    <ClubGuard>
      <div className="grid">
        <Toast ref={toast} />
        
        <div className="col-12 xl:col-6">
          <div className="card">
            <h5>Club Posts</h5>
            {posts && posts.length > 0 ? (
              <div className="flex flex-column" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {posts.map((post) => renderPostItem(post))}
              </div>
            ) : (
              <p>No posts available. Create a new post to get started!</p>
            )}
          </div>
        </div>

        <div className="col-12 xl:col-6">
          <div className="card mb-4">
            <h5>Top Hunters</h5>
            {topHunters && topHunters.length > 0 ? (
              <DataTable value={topHunters}>
                <Column field="name" header="Hunter" />
                <Column field="count" header="Animals Hunted" />
              </DataTable>
            ) : (
              <div className="p-4 text-center">
                <i className="pi pi-users text-3xl text-gray-300 mb-3"></i>
                <p>No top hunters data available yet.</p>
                <small className="text-gray-500">
                  Complete some hunts to see top hunter statistics.
                </small>
              </div>
            )}
          </div>

          <div className="card">
            <h5>Hunted Animals</h5>
            {statistics && statistics.animalsHunted && Object.keys(statistics.animalsHunted).length > 0 ? (
              <Chart type="pie" data={chartData} />
            ) : (
              <div className="p-4 text-center">
                <i className="pi pi-chart-pie text-3xl text-gray-300 mb-3"></i>
                <p>No animal hunting data available yet.</p>
                <small className="text-gray-500">
                  Log some successful hunts to see animal statistics.
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