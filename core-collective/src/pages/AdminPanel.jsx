import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../hooks/use-toast';
import '../styles/AdminStyles/AdminPanel.css';

const AdminPanel = () => {
  const [searchPostId, setSearchPostId] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [userToDelete, setUserToDelete] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const queryClient = useQueryClient();

  // Admin authentication
  const authenticateAdmin = async (password) => {
    const response = await fetch('/api/admin/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    
    if (!response.ok) {
      throw new Error('Invalid admin password');
    }
    
    return response.json();
  };

  const authMutation = useMutation({
    mutationFn: authenticateAdmin,
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "Success",
        description: "Admin access granted",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Search for post by ID
  const searchPost = async (postId) => {
    const response = await fetch(`/api/admin/search-post/${postId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    return response.json();
  };

  const searchMutation = useMutation({
    mutationFn: searchPost,
    onSuccess: (data) => {
      setSelectedPost(data);
      toast({
        title: "Post Found",
        description: `Found post: "${data.title}"`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
      setSelectedPost(null);
    },
  });

  // Delete post
  const deletePost = async (postId) => {
    const response = await fetch(`/api/admin/delete-post/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete post');
    }
    
    return response.json();
  };

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast({
        title: "Post Deleted",
        description: "The post has been successfully deleted",
        variant: "default",
      });
      setSelectedPost(null);
      setSearchPostId('');
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send warning email
  const sendWarningEmail = async (data) => {
    const response = await fetch('/api/admin/send-warning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send warning email');
    }
    
    return response.json();
  };

  const warningMutation = useMutation({
    mutationFn: sendWarningEmail,
    onSuccess: () => {
      toast({
        title: "Warning Sent",
        description: "Warning email has been sent to the user",
        variant: "default",
      });
      setWarningReason('');
    },
    onError: (error) => {
      toast({
        title: "Warning Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user account
  const deleteUserAccount = async (userData) => {
    const response = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user account');
    }
    
    return response.json();
  };

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: (response) => {
      toast({
        title: "✅ Account Deleted Successfully",
        description: `User account (${response.deletedUser}) has been permanently deleted. All posts, chat history, and user data have been removed.`,
        variant: "default",
      });
      setUserToDelete('');
      
      // Show additional confirmation
      setTimeout(() => {
        alert(`🗑️ DELETION COMPLETE\n\n✅ User account deleted: ${response.deletedUser}\n✅ All forum posts removed\n✅ All chat history deleted\n✅ All user data purged\n\nThe user can no longer access the system.`);
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAuth = (e) => {
    e.preventDefault();
    authMutation.mutate(adminPassword);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchPostId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a post ID",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchPostId);
  };

  const handleDeletePost = () => {
    if (selectedPost) {
      deletePostMutation.mutate(selectedPost.id);
    }
  };

  const handleSendWarning = () => {
    if (!selectedPost || !warningReason.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please select a post and provide a warning reason",
        variant: "destructive",
      });
      return;
    }

    warningMutation.mutate({
      userEmail: selectedPost.userEmail,
      userName: selectedPost.user,
      postTitle: selectedPost.title,
      reason: warningReason,
    });
  };

  const handleDeleteUser = () => {
    if (!userToDelete.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a user email to delete",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `⚠️ PERMANENT ACTION WARNING ⚠️\n\nAre you sure you want to DELETE the account for:\n\n📧 Email: ${userToDelete}\n\nThis will permanently:\n• Delete the user account\n• Remove all their forum posts\n• Delete all their chat history\n• Remove all their data\n\nThis action CANNOT be undone!\n\nClick OK to proceed with deletion.`
    );

    if (confirmed) {
      deleteUserMutation.mutate({ userEmail: userToDelete });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-auth-container">
        <div className="admin-auth-card">
          <h1>🔐 Admin Access Required</h1>
          <p>Enter the admin password to access the admin panel</p>
          <form onSubmit={handleAuth} className="admin-auth-form">
            <input
              type="password"
              placeholder="Admin Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="admin-password-input"
              required
            />
            <button 
              type="submit" 
              className="admin-auth-button"
              disabled={authMutation.isPending}
            >
              {authMutation.isPending ? 'Authenticating...' : 'Access Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h1>🛡️ Admin Control Panel</h1>
        <p>Manage forum posts and user accounts</p>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="logout-button"
        >
          Logout
        </button>
      </div>

      {/* Post Search Section */}
      <div className="admin-section">
        <h2>🔍 Search Post by ID</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="number"
            placeholder="Enter Post ID from report email"
            value={searchPostId}
            onChange={(e) => setSearchPostId(e.target.value)}
            className="search-input"
            required
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={searchMutation.isPending}
          >
            {searchMutation.isPending ? 'Searching...' : 'Search Post'}
          </button>
        </form>
      </div>

      {/* Post Details Section */}
      {selectedPost && (
        <div className="admin-section post-details">
          <h2>📋 Post Details</h2>
          <div className="post-info">
            <div className="post-field">
              <strong>ID</strong>
              <div className="post-field-content">{selectedPost.id}</div>
            </div>
            <div className="post-field">
              <strong>Title</strong>
              <div className="post-field-content">{selectedPost.title}</div>
            </div>
            <div className="post-field">
              <strong>Author</strong>
              <div className="post-field-content">{selectedPost.user}</div>
            </div>
            <div className="post-field">
              <strong>Author Email</strong>
              <div className="post-field-content">{selectedPost.userEmail || 'Not available'}</div>
            </div>
            <div className="post-field">
              <strong>Posted</strong>
              <div className="post-field-content">{new Date(selectedPost.timeAgo).toLocaleString()}</div>
            </div>
            <div className="post-field">
              <strong>Tags</strong>
              <div className="post-field-content">{selectedPost.tags?.join(', ') || 'None'}</div>
            </div>
            <div className="post-field">
              <strong>Description</strong>
              <div className="post-description">{selectedPost.description}</div>
            </div>
          </div>

          {/* Post Actions */}
          <div className="post-actions">
            <button 
              onClick={handleDeletePost}
              className="delete-post-button"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? 'Deleting...' : '🗑️ Delete Post'}
            </button>
          </div>
        </div>
      )}

      {/* Warning Section */}
      {selectedPost && (
        <div className="admin-section warning-section">
          <h2>⚠️ Send Warning to User</h2>
          <div className="warning-form">
            <textarea
              placeholder="Enter reason for warning (e.g., inappropriate content, spam, harassment)"
              value={warningReason}
              onChange={(e) => setWarningReason(e.target.value)}
              className="warning-textarea"
              rows={4}
            />
            <button 
              onClick={handleSendWarning}
              className="warning-button"
              disabled={warningMutation.isPending}
            >
              {warningMutation.isPending ? 'Sending...' : '📧 Send Warning Email'}
            </button>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div className="admin-section user-management">
        <h2>👤 User Account Management</h2>
        <div className="user-delete-form">
          <input
            type="email"
            placeholder="Enter user email to delete account"
            value={userToDelete}
            onChange={(e) => setUserToDelete(e.target.value)}
            className="user-email-input"
          />
          <button 
            onClick={handleDeleteUser}
            className="delete-user-button"
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? 'Deleting...' : '🚫 Delete User Account'}
          </button>
        </div>
        <p className="warning-text">
          ⚠️ Warning: Deleting a user account is permanent and cannot be undone!
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;