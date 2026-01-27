import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { borrowApi } from '../api/borrow';
import type { BorrowRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const UserDashboard: React.FC = () => {
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBorrowRecords();
  }, []);

  const fetchBorrowRecords = async () => {
    try {
      const response = await borrowApi.getMyBorrows({ per_page: 5 });
      setBorrowRecords(response.borrow_records || []);
    } catch (err) {
      console.error('Failed to fetch borrow records', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome, {user?.username}!</h1>
          <p>Manage your borrowed books and explore our collection</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Borrows</h3>
            <p className="stat-value">{borrowRecords.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Borrows</h3>
            <p className="stat-value">
              {borrowRecords.filter(r => r.status === 'borrowed').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Overdue</h3>
            <p className="stat-value">
              {borrowRecords.filter(r => r.status === 'overdue').length}
            </p>
          </div>
        </div>

        <div className="dashboard-actions">
          <button onClick={() => navigate('/books')} className="action-btn">
            Browse Books
          </button>
          <button onClick={() => navigate('/my-borrows')} className="action-btn">
            View All Borrows
          </button>
        </div>

        <div className="recent-borrows">
          <h2>Recent Borrows</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : borrowRecords.length === 0 ? (
            <p>No borrow records yet. Start browsing books!</p>
          ) : (
            <div className="borrow-list">
              {borrowRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="borrow-item">
                  <div>
                    <h4>{record.book?.title}</h4>
                    <p>by {record.book?.author}</p>
                    <p className="borrow-date">
                      Borrowed: {new Date(record.borrow_date).toLocaleDateString()}
                    </p>
                    <p className="due-date">
                      Due: {new Date(record.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`status-badge ${record.status}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
