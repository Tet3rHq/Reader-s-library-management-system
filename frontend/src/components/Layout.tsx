import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            📚 Library Management System
          </Link>
          
          {isAuthenticated && (
            <nav className="nav">
              <Link to="/books" className="nav-link">Books</Link>
              
              {isAdmin ? (
                <>
                  <Link to="/admin/dashboard" className="nav-link">Admin Dashboard</Link>
                  <Link to="/admin/books" className="nav-link">Manage Books</Link>
                  <Link to="/admin/borrows" className="nav-link">All Borrows</Link>
                  <Link to="/admin/pending-approvals" className="nav-link">Pending Approvals</Link>
                  <Link to="/admin/reports" className="nav-link">Reports</Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="nav-link">My Dashboard</Link>
                  <Link to="/my-borrows" className="nav-link">My Borrows</Link>
                </>
              )}
              
              <div className="user-info">
                <span className="username">{user?.username}</span>
                <span className="role-badge">{user?.role}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="footer">
        <p>&copy; 2024 Library Management System. Final Year Project.</p>
      </footer>
    </div>
  );
};

export default Layout;
