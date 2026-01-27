import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { reportsApi } from '../api/reports';
import type { SystemOverview } from '../types';
import './Dashboard.css';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await reportsApi.getOverview();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>System overview and management</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Books</h3>
            <p className="stat-value">{stats?.total_books || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-value">{stats?.total_users || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Active Borrows</h3>
            <p className="stat-value">{stats?.active_borrows || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Overdue Books</h3>
            <p className="stat-value">{stats?.overdue_count || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Available Books</h3>
            <p className="stat-value">{stats?.available_books || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Copies</h3>
            <p className="stat-value">{stats?.total_copies || 0}</p>
          </div>
        </div>

        <div className="dashboard-actions">
          <button onClick={() => navigate('/admin/books')} className="action-btn">
            Manage Books
          </button>
          <button onClick={() => navigate('/admin/borrows')} className="action-btn">
            View All Borrows
          </button>
          <button onClick={() => navigate('/admin/reports')} className="action-btn">
            View Reports
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
