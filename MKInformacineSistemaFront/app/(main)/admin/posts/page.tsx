'use client';
import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Image } from 'primereact/image';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useRouter } from 'next/navigation';
import { useClub } from '../../../../context/ClubContext';
import RoleGuard from '../../../../context/RoleGuard';
import ClubGuard from '../../../../context/ClubGuard';

const AdminPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const { selectedClub } = useClub();
  const toast = useRef(null);
  const router = useRouter();
  
  // Fetch posts when the component mounts or club changes
  useEffect(() => {
    fetchPosts();
  }, [selectedClub]);
  
  const fetchPosts = async () => {
    if (!selectedClub) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`https://localhost:7091/api/Posts?clubId=${selectedClub.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load posts: ' + error.message,
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  
  const confirmDelete = (post) => {
    confirmDialog({
      message: `Are you sure you want to delete the post "${post.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => handleDeletePost(post.id),
    });
  };
  
  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`https://localhost:7091/api/Posts/${postId}?clubId=${selectedClub.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Remove the deleted post from the state
      setPosts(posts.filter(post => post.id !== postId));
      
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Post deleted successfully',
        life: 3000
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete post: ' + error.message,
        life: 3000
      });
    }
  };
  
  // Formatting functions for table display
  const formatDate = (rowData) => {
    return new Date(rowData.createdAt).toLocaleString();
  };
  
  const typeTemplate = (rowData) => {
    return (
      <Tag 
        value={rowData.type} 
        severity={rowData.type === 'Sumedžiotas žvėris' ? 'success' : 'info'} 
      />
    );
  };
  
  const imageTemplate = (rowData) => {
    if (rowData.imageUrl) {
      return (
        <Image 
          src={`https://localhost:7091${rowData.imageUrl}`} 
          alt={rowData.title} 
          width="50" 
          height="50" 
          preview 
          className="shadow-2" 
          style={{ objectFit: 'cover' }} 
        />
      );
    }
    return <span>No image</span>;
  };
  
  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-2 justify-content-center">
        <Button 
          icon="pi pi-trash" 
          className="p-button-rounded p-button-danger p-button-text" 
          onClick={() => confirmDelete(rowData)} 
          tooltip="Delete Post" 
        />
      </div>
    );
  };
  
  
  return (
    <RoleGuard requiredRoles={['Admin', 'Owner']}>
      <ClubGuard>
        <div className="card">
          <Toast ref={toast} />
          <ConfirmDialog />
          
          <DataTable 
            value={posts} 
            responsiveLayout="scroll" 
            paginator 
            rows={10} 
            globalFilter={globalFilter}
            emptyMessage="No posts found" 
            loading={loading}
            rowHover
            stripedRows
            dataKey="id"
          >
            <Column header="Image" body={imageTemplate} style={{ width: '10%' }} />
            <Column field="title" header="Title" sortable style={{ width: '20%' }} />
            <Column field="type" header="Type" body={typeTemplate} sortable style={{ width: '10%' }} />
            <Column field="authorName" header="Author" sortable style={{ width: '15%' }} />
            <Column field="createdAt" header="Created At" body={formatDate} sortable style={{ width: '15%' }} />
            <Column field="description" header="Description" style={{ width: '20%' }} />
            <Column body={actionTemplate} header="Actions" style={{ width: '5%' }} />
          </DataTable>
          
        </div>
      </ClubGuard>
    </RoleGuard>
  );
};

export default AdminPostsPage;