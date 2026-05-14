import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { historyAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const S = {
  page: { color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" },
  heading: { fontSize: 26, fontWeight: 700, color: '#f1f0ff', letterSpacing: '-0.5px', marginBottom: 4 },
  sub: { fontSize: 15, color: '#6b7280', marginBottom: 32 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 },
  card: { background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: '20px 24px' },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { fontSize: 30, fontWeight: 700, color: '#a78bfa' },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#d1d5db', marginBottom: 16 },
  historyItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #1e1e2e' },
  badge: (score) => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600,
    background: score >= 75 ? '#14532d' : score >= 50 ? '#78350f' : '#450a0a',
    color: score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171',
  }),
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([historyAPI.stats(), historyAPI.list(1)])
      .then(([statsRes, historyRes]) => {
        setStats(statsRes.data);
        setRecentScans(historyRes.data.scans.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const trendData = stats?.trend?.map(s => ({
    name: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: s.match_score,
    job: s.jd_title || 'Untitled',
  })).reverse() || [];

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0] || 'there'}</h1>
      <p style={S.sub}>Here's how your job applications are performing.</p>

      {/* CTA */}
      <Link to="/scan" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px',
        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 10,
        color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15, marginBottom: 32
      }}>
        <span>◈</span> New scan
      </Link>

      {/* Stats */}
      {loading ? (
        <div style={{ color: '#6b7280' }}>Loading stats...</div>
      ) : (
        <>
          <div style={S.grid}>
            {[
              { label: 'Total scans', value: stats?.total_scans || 0 },
              { label: 'Avg score', value: `${stats?.avg_score || 0}%` },
              { label: 'Best score', value: `${stats?.best_score || 0}%` },
              { label: 'Lowest score', value: `${stats?.lowest_score || 0}%` },
            ].map(({ label, value }) => (
              <div key={label} style={S.card}>
                <div style={S.statLabel}>{label}</div>
                <div style={S.statValue}>{value}</div>
              </div>
            ))}
          </div>

          {/* Score trend */}
          {trendData.length > 1 && (
            <div style={{ ...S.card, marginBottom: 32 }}>
              <div style={S.sectionTitle}>Score trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <XAxis dataKey="name" stroke="#374151" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} stroke="#374151" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 8, color: '#f1f0ff' }}
                    formatter={(val, _, props) => [`${val}%`, props.payload.job]}
                  />
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent scans */}
          {recentScans.length > 0 && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={S.sectionTitle}>Recent scans</div>
                <Link to="/history" style={{ color: '#7c3aed', textDecoration: 'none', fontSize: 13 }}>View all →</Link>
              </div>
              {recentScans.map(scan => (
                <Link key={scan.id} to={`/results/${scan.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ ...S.historyItem, cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#d1d5db', fontWeight: 500 }}>{scan.jd_title || 'Untitled role'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {scan.company_name || 'Unknown company'} · {new Date(scan.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={S.badge(scan.match_score)}>{scan.match_score}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {recentScans.length === 0 && !loading && (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
              <div style={{ color: '#6b7280', fontSize: 15 }}>No scans yet. Run your first scan to see results here.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
