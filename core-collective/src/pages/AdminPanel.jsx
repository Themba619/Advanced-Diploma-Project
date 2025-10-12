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
  const [activeTab, setActiveTab] = useState('posts'); // posts, reports
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportAction, setReportAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
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

  // Send warning notification
  const sendWarningNotification = async (data) => {
    const response = await fetch('/api/notifications/admin/warning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send warning notification');
    }
    
    return response.json();
  };

  const warningMutation = useMutation({
    mutationFn: sendWarningNotification,
    onSuccess: () => {
      toast({
        title: "Warning Sent",
        description: "Warning notification has been sent to the user",
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

  // Fetch admin reports
  const fetchAdminReports = async () => {
    const response = await fetch('/api/notifications/admin/reports');
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    return response.json();
  };

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: fetchAdminReports,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update report status
  const updateReportStatus = async ({ reportId, status, adminNotes }) => {
    const response = await fetch(`/api/notifications/admin/report/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update report status');
    }
    
    return response.json();
  };

  const updateReportMutation = useMutation({
    mutationFn: updateReportStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reports']);
      setSelectedReport(null);
      setReportAction('');
      setAdminNotes('');
      toast({
        title: "Success",
        description: "Report status updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
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
      warningTitle: "⚠️ Post Warning",
      warningMessage: `You have received a warning regarding your post "${selectedPost.title}". Reason: ${warningReason}`,
      postTitle: selectedPost.title,
      reason: warningReason,
      adminName: "Administrator"
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

  const handleReportAction = (report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
  };

  const handleUpdateReport = (e) => {
    e.preventDefault();
    if (!reportAction) {
      toast({
        title: "Action Required",
        description: "Please select an action for this report.",
        variant: "destructive",
      });
      return;
    }

    updateReportMutation.mutate({
      reportId: selectedReport.id,
      status: reportAction,
      adminNotes
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#fbbf24';
      case 'investigating': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'dismissed': return '#6b7280';
      default: return '#fbbf24';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'investigating': return '🔍';
      case 'resolved': return '✅';
      case 'dismissed': return '❌';
      default: return '⏳';
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
        <p>Manage forum posts, user accounts, and reports</p>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="logout-button"
        >
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 Posts & Users
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          🚨 Reports {reportsData?.reports?.filter(r => r.status === 'pending').length > 0 && 
            <span className="notification-badge">{reportsData.reports.filter(r => r.status === 'pending').length}</span>
          }
        </button>
      </div>

      {activeTab === 'posts' && (
        <>
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
        </>
      )}

      {activeTab === 'reports' && (
        <div className="reports-section">
          <h2>🚨 Post Reports</h2>
          
          {reportsLoading ? (
            <div className="loading">Loading reports...</div>
          ) : reportsData?.reports?.length === 0 ? (
            <div className="no-reports">
              <p>✅ No reports found. All good!</p>
            </div>
          ) : (
            <div className="reports-grid">
              {reportsData?.reports?.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <div className="report-status">
                      <span 
                        className="status-indicator"
                        style={{ backgroundColor: getStatusColor(report.status) }}
                      >
                        {getStatusIcon(report.status)}
                      </span>
                      <span className="status-text">{report.status}</span>
                    </div>
                    <div className="report-date">
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="report-content">
                    <h3 className="reported-post-title">"{report.post_title}"</h3>
                    <div className="report-details">
                      <p><strong>Post ID:</strong> {report.post_id}</p>
                      <p><strong>Post Author:</strong> {report.post_user}</p>
                      <p><strong>Reported By:</strong> {report.reported_by}</p>
                      <p><strong>Reason:</strong> <span className="reason-tag">{report.reason}</span></p>
                      {report.description && (
                        <p><strong>Description:</strong> {report.description}</p>
                      )}
                    </div>
                    
                    {report.admin_notes && (
                      <div className="admin-notes">
                        <strong>Admin Notes:</strong> {report.admin_notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="report-actions">
                    <button 
                      className="action-btn investigate"
                      onClick={() => handleReportAction(report)}
                      disabled={report.status === 'resolved'}
                    >
                      {report.status === 'resolved' ? '✅ Resolved' : '🔍 Take Action'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report Action Modal */}
          {selectedReport && (
            <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Take Action on Report</h3>
                  <button 
                    className="close-btn" 
                    onClick={() => setSelectedReport(null)}
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-body">
                  <div className="report-summary">
                    <h4>Reported Post: "{selectedReport.post_title}"</h4>
                    <p><strong>Post ID:</strong> {selectedReport.post_id}</p>
                    <p><strong>Reported for:</strong> {selectedReport.reason}</p>
                    {selectedReport.description && (
                      <p><strong>Details:</strong> {selectedReport.description}</p>
                    )}
                  </div>
                  
                  <form onSubmit={handleUpdateReport}>
                    <div className="form-group">
                      <label>Action:</label>
                      <select 
                        value={reportAction} 
                        onChange={(e) => setReportAction(e.target.value)}
                      >
                        <option value="">Select Action</option>
                        <option value="investigating">Mark as Investigating</option>
                        <option value="resolved">Mark as Resolved</option>
                        <option value="dismissed">Dismiss Report</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Admin Notes:</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add your investigation notes or actions taken..."
                        rows="4"
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setSelectedReport(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={updateReportMutation.isPending}
                      >
                        {updateReportMutation.isPending ? 'Updating...' : 'Update Report'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;