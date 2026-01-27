import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { reportsApi } from '../api/reports';
import type {
  BookWithCount,
  UserWithCount,
  BorrowTrend,
  CategoryDistribution,
  BorrowRecord,
} from '../types';
import './Dashboard.css';
import './AdminReports.css';

const AdminReports: React.FC = () => {
  // State for different report sections
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState<BookWithCount[]>([]);
  const [mostActiveUsers, setMostActiveUsers] = useState<UserWithCount[]>([]);
  const [borrowingTrends, setBorrowingTrends] = useState<BorrowTrend[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [borrowingHistory, setBorrowingHistory] = useState<BorrowRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBorrowingHistory();
    }
  }, [activeTab, historyPage]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      // Fetch all reports in parallel
      const [booksRes, usersRes, trendsRes, categoryRes] = await Promise.all([
        reportsApi.getMostBorrowedBooks(10),
        reportsApi.getUserActivity(10),
        reportsApi.getBorrowingTrends(30),
        reportsApi.getCategoryDistribution(),
      ]);

      setMostBorrowedBooks(booksRes.most_borrowed_books);
      setMostActiveUsers(usersRes.most_active_users);
      setBorrowingTrends(trendsRes.trends);
      setCategoryDistribution(categoryRes.distribution);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBorrowingHistory = async () => {
    try {
      const response = await reportsApi.getBorrowingHistory({
        page: historyPage,
        per_page: 20,
      });
      setBorrowingHistory(response.history);
      setHistoryTotal(response.total);
      setHistoryPages(response.pages);
    } catch (err) {
      console.error('Failed to fetch borrowing history', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading reports...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Admin Reports</h1>
          <p>Comprehensive system analytics and reports</p>
        </div>

        {/* Tab Navigation */}
        <div className="report-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview Reports
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Borrowing History
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="reports-container">
            {/* Most Borrowed Books */}
            <div className="report-section">
              <h2>Most Borrowed Books</h2>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Times Borrowed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostBorrowedBooks.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center' }}>
                          No data available
                        </td>
                      </tr>
                    ) : (
                      mostBorrowedBooks.map((book, index) => (
                        <tr key={book.id}>
                          <td>{index + 1}</td>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td>{book.category}</td>
                          <td>
                            <span className="badge">{book.borrow_count}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Most Active Users */}
            <div className="report-section">
              <h2>Most Active Users</h2>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Books Borrowed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostActiveUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center' }}>
                          No data available
                        </td>
                      </tr>
                    ) : (
                      mostActiveUsers.map((user, index) => (
                        <tr key={user.id}>
                          <td>{index + 1}</td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className="badge">{user.borrow_count}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Borrowing Trends */}
            <div className="report-section">
              <h2>Borrowing Trends (Last 30 Days)</h2>
              {borrowingTrends.length === 0 ? (
                <p>No trend data available</p>
              ) : (
                <div className="trends-chart">
                  <div className="chart-bars">
                    {(() => {
                      const maxCount = Math.max(...borrowingTrends.map((t) => t.count));
                      return borrowingTrends.map((trend, index) => {
                        const height = maxCount > 0 ? (trend.count / maxCount) * 100 : 0;
                        return (
                          <div key={index} className="chart-bar-container">
                            <div
                              className="chart-bar"
                              style={{ height: `${height}%` }}
                              title={`${trend.date}: ${trend.count} borrows`}
                            >
                              <span className="bar-label">{trend.count}</span>
                            </div>
                            <span className="bar-date">
                              {new Date(trend.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Category Distribution */}
            <div className="report-section">
              <h2>Book Distribution by Category</h2>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Number of Books</th>
                      <th>Total Copies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryDistribution.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center' }}>
                          No data available
                        </td>
                      </tr>
                    ) : (
                      categoryDistribution.map((category) => (
                        <tr key={category.category}>
                          <td>{category.category}</td>
                          <td>{category.book_count}</td>
                          <td>{category.total_copies}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Borrowing History Tab */}
        {activeTab === 'history' && (
          <div className="reports-container">
            <div className="report-section">
              <h2>Complete Borrowing History</h2>
              <p className="report-description">
                Total Records: {historyTotal} | Page {historyPage} of {historyPages}
              </p>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Book</th>
                      <th>Borrow Date</th>
                      <th>Due Date</th>
                      <th>Return Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center' }}>
                          No borrowing history available
                        </td>
                      </tr>
                    ) : (
                      borrowingHistory.map((record) => (
                        <tr key={record.id}>
                          <td>{record.id}</td>
                          <td>{record.user?.username || 'N/A'}</td>
                          <td>{record.book?.title || 'N/A'}</td>
                          <td>{formatDate(record.borrow_date)}</td>
                          <td>{formatDate(record.due_date)}</td>
                          <td>{record.return_date ? formatDate(record.return_date) : '-'}</td>
                          <td>
                            <span className={`status-badge status-${record.status}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {historyPage} of {historyPages}
                  </span>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(historyPages, p + 1))}
                    disabled={historyPage === historyPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminReports;
