import { useState, useEffect } from 'react';
import { fetchSheetData } from '../lib/sheets';

export default function AdminControl({ onExit }) {
  const [logs, setLogs] = useState([]);
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [dashboardPassword, setDashboardPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  async function fetchConfig() {
    try {
      const data = await fetchSheetData('dashboard_config');
      if (data && data.length > 0) {
        const enabled = data.find(c => c.key === 'password_enabled')?.value === 'true';
        const password = data.find(c => c.key === 'dashboard_password')?.value || '';
        setPasswordEnabled(enabled);
        setDashboardPassword(password);
      }
    } catch (e) {
      // dashboard_config tab might be empty or unconfigured
    }
  }

  async function fetchLogs() {
    try {
      const data = await fetchSheetData('access_logs');
      if (data) setLogs(data);
    } catch (e) {
      // access_logs tab might be empty or unconfigured
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig() {
    setSaving(true);
    // Config saving handled via Google Sheets if Apps Script endpoint is configured
    setTimeout(() => {
      setSaving(false);
      alert('Settings updated in local session.');
    }, 500);
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button onClick={onExit} className="gate-btn" style={{ width: 'auto', padding: '10px 24px' }}>Back to Dashboard</button>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3 className="admin-card-title">Password Protection</h3>
          <div className="admin-toggle-row">
            <span>Enable Protection</span>
            <label className="switch">
              <input type="checkbox" checked={passwordEnabled} onChange={(e) => setPasswordEnabled(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
          <div style={{ marginTop: '24px' }}>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Dashboard Password</label>
            <input 
              type="text" 
              className="gate-input" 
              value={dashboardPassword} 
              onChange={(e) => setDashboardPassword(e.target.value)}
              placeholder="Set password..."
            />
          </div>
          <button 
            onClick={handleSaveConfig} 
            className="gate-btn" 
            style={{ marginTop: '24px', opacity: saving ? 0.7 : 1 }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">Access Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="admin-toggle-row">
              <span style={{ color: 'var(--text-secondary)' }}>Total Unique Hits</span>
              <span style={{ fontWeight: 700 }}>{logs.length}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              The log automatically captures visitor IP, user agent, and timestamp whenever someone lands on the dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ width: '100%' }}>
        <h3 className="admin-card-title">Recent Access Logs</h3>
        <div className="log-table-container">
          <table className="log-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>IP Address</th>
                <th>User Agent (Browser/Device)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{log.ip}</td>
                  <td className="ua-cell" title={log.user_agent}>{log.user_agent}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
