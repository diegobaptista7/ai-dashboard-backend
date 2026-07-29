import { useState } from 'react';

export default function PasswordGate({ onAuthenticated, correctPassword }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      onAuthenticated();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="password-gate">
      <div className="gate-card">
        <img src="/tutator-logo.png" alt="Tutator Logo" className="gate-logo" />
        <h2 className="gate-title">Protected Dashboard</h2>
        <p className="gate-desc">Please enter the password to access the project insights.</p>
        
        <form onSubmit={handleSubmit} className="gate-input-group">
          <input
            type="password"
            className="gate-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" className="gate-btn">Access Dashboard</button>
        </form>
        
        {error && <p className="gate-error">{error}</p>}
      </div>
    </div>
  );
}
