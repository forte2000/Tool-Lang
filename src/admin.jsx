import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="app-container" style={{ padding: 0 }}>
      {/* Re-using blobs for consistent "Deep Space" aesthetic */}
      <div className="bg-blob" style={{ top: '-100px', left: '-100px', background: 'var(--primary)', opacity: 0.2 }}></div>
      <div className="bg-blob" style={{ bottom: '-100px', right: '-100px', background: 'var(--accent)', opacity: 0.2 }}></div>
      
      <main className="main-stage" style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <AdminDashboard />
      </main>
    </div>
  </React.StrictMode>
);
