import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { borrowApi } from '../api/borrow';
import type { BorrowRecord } from '../types';
import './MyBorrows.css';

const MyBorrows: React.FC = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const response = await borrowApi.getMyBorrows({
        status: statusFilter,
        per_page: 50,
      });
      setRecords(response.borrow_records || []);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async (recordId: number) => {
    if (!confirm('Are you sure you want to return this book?')) return;

    try {
      await borrowApi.returnBook(recordId);
      alert('Book returned successfully!');
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to return book');
    }
  };

  return (
    <Layout>
      <div className="my-borrows-page">
        <div className="page-header">
          <h1>My Borrows</h1>
          <p>View and manage your borrowed books</p>
        </div>

        <div className="filter-section">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="">All Status</option>
            <option value="borrowed">Borrowed</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : records.length === 0 ? (
          <div className="no-results">
            <p>No borrow records found</p>
          </div>
        ) : (
          <div className="records-table">
            <table>
              <thead>
                <tr>
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
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyBorrows;
