import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  KeyRound,
  RefreshCw,
  Zap,
  Server,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Code2,
  Sparkles,
} from 'lucide-react';

const Dashboard = () => {
  const {
    user,
    accessToken,
    refreshToken,
    refreshAccessToken,
    corruptAccessTokenForTesting,
  } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  // Helper to add timestamped event logs
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ id: Date.now(), timestamp, message, type }, ...prev.slice(0, 15)]);
  };

  // Initial fetch of protected dashboard data
  const fetchDashboard = async () => {
    setLoadingData(true);
    setError('');
    addLog('Initiating GET /api/dashboard request with current Access Token...', 'info');

    try {
      const res = await api.get('/dashboard');
      setDashboardData(res.data);
      addLog('GET /api/dashboard succeeded! 200 OK received.', 'success');
    } catch (err) {
      console.error('[Dashboard Error]:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to load dashboard data.';
      setError(errMsg);
      addLog(`GET /api/dashboard failed: ${errMsg}`, 'error');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Test Handler 1: Simulate Expired Token & Interceptor Auto-Refresh
  const handleTestExpiredToken = async () => {
    addLog('🧪 TEST: Corrupting in-memory Access Token to simulate expiration...', 'warning');
    corruptAccessTokenForTesting();

    addLog('🚀 Triggering GET /api/dashboard. Expecting 401 error & automatic Axios Interceptor intercept...', 'warning');

    setLoadingData(true);
    setError('');

    try {
      const res = await api.get('/dashboard');
      setDashboardData(res.data);
      addLog('🎉 SUCCESS! Axios Interceptor caught 401, called /api/refresh silently, updated Access Token, and retried GET /api/dashboard seamlessly!', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Auto-refresh test failed.';
      setError(errMsg);
      addLog(`❌ Auto-refresh test failed: ${errMsg}`, 'error');
    } finally {
      setLoadingData(false);
    }
  };

  // Test Handler 2: Manual Refresh Token Call
  const handleManualRefresh = async () => {
    addLog('🔄 Manually requesting new Access Token via POST /api/refresh...', 'info');
    try {
      const newAccess = await refreshAccessToken();
      addLog(`✅ Manual token refresh successful! New Access Token acquired (${newAccess.substring(0, 20)}...)`, 'success');
    } catch (err) {
      addLog(`❌ Manual refresh failed: ${err.message}`, 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }} className="animate-fade-in">
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="badge badge-indigo">
                <Sparkles size={14} /> Protected Route
              </span>
              <span className="badge badge-emerald">
                <span className="status-dot"></span> Active Session
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>
              Dual-Token Protected Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
              Authenticated user: <strong style={{ color: '#ffffff' }}>{user?.email}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={fetchDashboard} className="btn btn-secondary" disabled={loadingData}>
              <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
              Reload Dashboard Data
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Card 1: Token Assessment Controls */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Zap size={22} color="var(--amber)" />
            <h2 style={{ fontSize: '1.25rem' }}>Interceptor Assessment Suite</h2>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
            Test the automated Axios interceptor mechanism that handles expired access tokens seamlessly without logging out the user.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={handleTestExpiredToken}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
              disabled={loadingData}
            >
              <ShieldAlert size={18} />
              Simulate Expired Access Token & Auto-Refresh
            </button>

            <button
              onClick={handleManualRefresh}
              className="btn btn-outline-cyan"
              style={{ width: '100%', padding: '12px' }}
            >
              <RefreshCw size={18} />
              Execute Manual POST /api/refresh
            </button>
          </div>

          {/* Quick Explanation */}
          <div style={{
            marginTop: '20px',
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            fontSize: '0.8rem',
            color: 'var(--text-dim)'
          }}>
            <p><strong>How the Interceptor works:</strong></p>
            <ol style={{ paddingLeft: '18px', marginTop: '6px', lineHeight: '1.6' }}>
              <li>Access Token is sent in <code style={{ color: 'var(--cyan-glow)' }}>Authorization: Bearer</code> header.</li>
              <li>When Access Token expires (or is corrupted), server returns <code style={{ color: 'var(--rose)' }}>401 Unauthorized</code>.</li>
              <li>Axios interceptor catches 401, pauses failed requests, calls <code style={{ color: '#a7f3d0' }}>/api/refresh</code> with Refresh Token.</li>
              <li>New Access Token is saved in memory, and the original request is retried seamlessly!</li>
            </ol>
          </div>
        </div>

        {/* Card 2: Server Payload Data */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Server size={22} color="var(--cyan-glow)" />
            <h2 style={{ fontSize: '1.25rem' }}>GET /api/dashboard Response</h2>
          </div>

          {error && (
            <div className="alert alert-error">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          {dashboardData ? (
            <div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span className="badge badge-emerald">
                  <CheckCircle2 size={12} /> {dashboardData.systemMetrics?.serverStatus}
                </span>
                <span className="badge badge-indigo">
                  <Clock size={12} /> Uptime: {dashboardData.systemMetrics?.uptimeSeconds}s
                </span>
              </div>

              <div className="code-block" style={{ maxHeight: '240px' }}>
                <pre>{JSON.stringify(dashboardData, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <Clock size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>Click "Reload Dashboard Data" or run the test to retrieve server payload.</p>
            </div>
          )}
        </div>

      </div>

      {/* Token Details & Live Event Log Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginTop: '24px' }}>
        
        {/* Token Inspector */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <KeyRound size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem' }}>Active Tokens Inspector</h2>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                JWT Access Token (15m expiration, In-Memory)
              </span>
              <span className="badge badge-purple">Short-Lived</span>
            </div>
            <div className="code-block" style={{ fontSize: '0.75rem', color: 'var(--cyan-glow)' }}>
              {accessToken ? `${accessToken.substring(0, 45)}...${accessToken.substring(accessToken.length - 20)}` : 'No Access Token'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                JWT Refresh Token (7d expiration, localStorage + DB)
              </span>
              <span className="badge badge-emerald">Long-Lived</span>
            </div>
            <div className="code-block" style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
              {refreshToken ? `${refreshToken.substring(0, 45)}...${refreshToken.substring(refreshToken.length - 20)}` : 'No Refresh Token'}
            </div>
          </div>
        </div>

        {/* Live Interceptor Console Log */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Code2 size={22} color="#c084fc" />
            <h2 style={{ fontSize: '1.25rem' }}>Live Assessment Activity Console</h2>
          </div>

          <div className="code-block" style={{ height: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} style={{
                  color: log.type === 'error' ? 'var(--rose)' : log.type === 'success' ? '#34d399' : log.type === 'warning' ? '#fbbf24' : '#cbd5e1',
                  fontSize: '0.8rem',
                  lineHeight: '1.4'
                }}>
                  <span style={{ color: 'var(--text-dim)', marginRight: '8px' }}>[{log.timestamp}]</span>
                  {log.message}
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--text-dim)' }}>Activity logs will appear here when API requests and refresh tokens execute.</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
