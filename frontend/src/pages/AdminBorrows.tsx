import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { borrowApi } from '../api/borrow';
import type { BorrowRecord } from '../types';
import './AdminBorrows.css';

const AdminBorrows: React.FC = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const fetchRecords = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await borrowApi.getAllBorrows({
        status: statusFilter,
        page: page,
        per_page: perPage,
      });
      setRecords(response.borrow_records || []);
      setTotal(response.total || 0);
      setTotalPages(response.pages || 1);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleReturn = async (recordId: number) => {
    if (!confirm('Are you sure you want to mark this book as returned?')) return;

    try {
      await borrowApi.returnBook(recordId);
      alert('Book returned successfully!');
      fetchRecords();
    } catch (err) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error 
        : 'Failed to return book';
      alert(errorMessage || 'Failed to return book');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <Layout>
      <div className="admin-borrows-page">
        <div className="page-header">
          <h1>All Borrow Records</h1>
          <p>Manage and track all book borrowings across the system</p>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1); // Reset to first page when filtering
              }}
              className="status-filter"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="borrowed">Borrowed</option>
              <option value="pending_return">Pending Return</option>
              <option value="returned">Returned</option>
              <option value="overdue">Overdue</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="record-count">
            <span>Total Records: {total}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : records.length === 0 ? (
          <div className="no-results">
            <p>No borrow records found</p>
          </div>
        ) : (
          <>
            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Book</th>
                    <th>Author</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>
                        <div className="user-info">
                          <div className="username">{record.user?.username}</div>
                          <div className="email">{record.user?.email}</div>
                        </div>
                      </td>
                      <td>{record.book?.title}</td>
                      <td>{record.book?.author}</td>
                      <td>{new Date(record.borrow_date).toLocaleDateString()}</td>
                      <td>{new Date(record.due_date).toLocaleDateString()}</td>
                      <td>
                        {record.return_date
                          ? new Date(record.return_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>
                        {record.status === 'borrowed' || record.status === 'overdue' ? (
                          <button
                            onClick={() => handleReturn(record.id)}
                            className="return-btn"
                          >
                            Return
                          </button>
                        ) : (
                          <span className="no-action">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminBorrows;
