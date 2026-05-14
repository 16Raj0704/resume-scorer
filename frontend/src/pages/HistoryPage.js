import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { historyAPI } from '../services/api';

const badge = (score) => ({
  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  background: score >= 75 ? '#14532d' : score >= 50 ? '#78350f' : '#450a0a',
  color: score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171',
});

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await historyAPI.list(p);
      setScans(res.data.scans);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const deleteScan = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this scan?')) return;
    try {
      await historyAPI.delete(id);
      setScans(s => s.filter(x => x.id !== id));
      toast.success('Scan deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div style={{ color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f0ff', marginBottom: 4, letterSpacing: '-0.5px' }}>Scan history</h1>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 28 }}>{total} total scans</p>

      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading...</div>
      ) : scans.length === 0 ? (
        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◷</div>
          <div style={{ color: '#6b7280' }}>No scans yet.</div>
          <Link to="/scan" style={{ display: 'inline-block', marginTop: 16, color: '#a78bfa', textDecoration: 'none' }}>Run your first scan →</Link>
        </div>
      ) : (
        <div style={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 12, overflow: 'hidden' }}>
          {scans.map((scan, i) => (
            <Link key={scan.id} to={`/results/${scan.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderBottom: i < scans.length - 1 ? '1px solid #1e1e2e' : 'none',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#0a0a0f'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#d1d5db', marginBottom: 3 }}>
                    {scan.jd_title || 'Untitled role'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {scan.company_name || 'Unknown company'} · {new Date(scan.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={badge(scan.match_score)}>{scan.match_score}%</span>
                  <button
                    onClick={(e) => deleteScan(scan.id, e)}
                    style={{ background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
                    title="Delete"
                  >✕</button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid #1e1e2e',
              background: p === page ? '#1e1e35' : 'transparent',
              color: p === page ? '#a78bfa' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit'
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
