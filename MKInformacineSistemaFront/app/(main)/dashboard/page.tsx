'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
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

  useEffect(() => {
    if (selectedClub) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Fetch posts
          const postsData = await fetchWithClub('posts');
          setPosts(postsData);
          
          // Fetch statistics
          const statsData = await fetchWithClub('statistics/club');
          setStatistics(statsData);
          
          if (statsData) {
            // Set chart data
            setChartData({
              labels: Object.keys(statsData.animalsHunted),
              datasets: [{
                data: Object.values(statsData.animalsHunted),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
              }]
            });
            
            // Set top hunters
            setTopHunters(statsData.topHunters);
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load dashboard data',
            life: 3000
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [selectedClub, fetchWithClub]);

  const renderPostItem = (post) => (
    <Card className="mb-4 p-3">
      <div className="flex align-items-center mb-3 justify-content-between">
        <div className="flex align-items-center">
          <Avatar image={post.authorAvatarUrl} shape="circle" size="large" className="mr-2" />
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
          height="300px"
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
        <div className="col-12 xl:col-6">
          <div className="card">
            <h5>Club Posts</h5>
            {posts.length > 0 ? (
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
            {topHunters.length > 0 ? (
              <DataTable value={topHunters}>
                <Column field="name" header="Hunter" />
                <Column field="count" header="Animals Hunted" />
              </DataTable>
            ) : (
              <p>No hunter data available yet.</p>
            )}
          </div>

          <div className="card">
            <h5>Hunted Animals</h5>
            {statistics && Object.keys(statistics.animalsHunted).length > 0 ? (
              <Chart type="pie" data={chartData} />
            ) : (
              <p>No animal data available yet.</p>
            )}
          </div>
        </div>
      </div>
    </ClubGuard>
  );
};

export default Dashboard;