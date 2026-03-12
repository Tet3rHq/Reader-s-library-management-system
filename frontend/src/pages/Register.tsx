import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one digit');
      return;
    }

    setIsLoading(true);

    try {
      await register({ username, email, password, role: 'user' });
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-visual">
          <div className="visual-content">
            <div className="brand-section">
              <div className="brand-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
                  <defs>
                    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: '#f0f0f0', stopOpacity: 1}} />
                    </linearGradient>
                  </defs>
                  <g transform="translate(50, 50)">
                    <path d="M -20 -10 Q -20 -15, -15 -15 L -2 -15 L -2 15 L -15 15 Q -20 15, -20 10 Z" 
                          fill="url(#iconGradient)" opacity="0.95"/>
                    <path d="M 2 -15 L 15 -15 Q 20 -15, 20 -10 L 20 10 Q 20 15, 15 15 L 2 15 Z" 
                          fill="url(#iconGradient)" opacity="0.95"/>
                    <rect x="-1" y="-15" width="2" height="30" fill="#ffffff" opacity="0.3"/>
                  </g>
                </svg>
              </div>
              <h1 className="brand-title">Reader's Library Management System</h1>
              <p className="brand-tagline">Your Gateway to Knowledge</p>
            </div>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>Vast Digital Library</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Smart Search</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Instant Access</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Personalized Experience</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p>Join Reader's Library Management System and start exploring</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Choose a strong password"
                  disabled={isLoading}
                />
                <small>
                  Must be at least 8 characters with uppercase, lowercase, and number
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
