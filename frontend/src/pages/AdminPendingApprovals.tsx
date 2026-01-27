import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { borrowApi } from '../api/borrow';
import type { BorrowRecord } from '../types';
import './AdminBorrows.css';

const AdminPendingApprovals: React.FC = () => {
  const [pendingBorrows, setPendingBorrows] = useState<BorrowRecord[]>([]);
  const [pendingReturns, setPendingReturns] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'borrows' | 'returns'>('borrows');

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const response = await borrowApi.getPendingRequests();
      setPendingBorrows(response.pending_borrows || []);
      setPendingReturns(response.pending_returns || []);
    } catch (err) {
      console.error('Failed to fetch pending requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleApproveBorrow = async (recordId: number) => {
    if (!confirm('Are you sure you want to approve this borrow request?')) return;

    try {
      await borrowApi.approveBorrow(recordId);
      alert('Borrow request approved successfully!');
      fetchPendingRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve borrow request');
    }
  };

  const handleRejectBorrow = async (recordId: number) => {
    if (!confirm('Are you sure you want to reject this borrow request?')) return;

    try {
      await borrowApi.rejectBorrow(recordId);
      alert('Borrow request rejected successfully!');
      fetchPendingRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject borrow request');
    }
  };

  const handleVerifyReturn = async (recordId: number) => {
    if (!confirm('Are you sure you want to verify this return?')) return;

    try {
      await borrowApi.verifyReturn(recordId);
      alert('Return verified successfully!');
      fetchPendingRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify return');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Layout>
      <div className="admin-borrows-page">
        <div className="page-header">
          <h1>Pending Approvals</h1>
          <p>Review and approve pending borrow requests and returns</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'borrows' ? 'active' : ''}`}
            onClick={() => setActiveTab('borrows')}
          >
            Pending Borrows ({pendingBorrows.length})
          </button>
          <button
            className={`tab ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            Pending Returns ({pendingReturns.length})
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : activeTab === 'borrows' ? (
          pendingBorrows.length === 0 ? (
            <div className="no-results">
              <p>No pending borrow requests</p>
            </div>
          ) : (
            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Book</th>
                    <th>Requested On</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBorrows.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>
                        <div>
                          <strong>{record.user?.username}</strong>
                          <br />
                          <small>{record.user?.email}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{record.book?.title}</strong>
                          <br />
                          <small>by {record.book?.author}</small>
                        </div>
                      </td>
                      <td>{formatDate(record.created_at)}</td>
                      <td>{formatDate(record.due_date)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-approve"
                            onClick={() => handleApproveBorrow(record.id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn-reject"
                            onClick={() => handleRejectBorrow(record.id)}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          pendingReturns.length === 0 ? (
            <div className="no-results">
              <p>No pending returns</p>
            </div>
          ) : (
            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Book</th>
                    <th>Borrowed On</th>
                    <th>Returned On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReturns.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>
                        <div>
                          <strong>{record.user?.username}</strong>
                          <br />
                          <small>{record.user?.email}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{record.book?.title}</strong>
                          <br />
                          <small>by {record.book?.author}</small>
                        </div>
                      </td>
                      <td>{formatDate(record.borrow_date)}</td>
                      <td>{formatDate(record.return_date)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-approve"
                            onClick={() => handleVerifyReturn(record.id)}
                          >
                            ✓ Verify Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </Layout>
  );
};

export default AdminPendingApprovals;
