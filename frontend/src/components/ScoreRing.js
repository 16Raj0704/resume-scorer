import React from 'react';

export default function ScoreRing({ score, size = 140 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';
  const label = score >= 75 ? 'Strong match' : score >= 50 ? 'Moderate match' : 'Weak match';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e1e2e" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', marginTop: -size / 2 - 8, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: size * 0.25, fontWeight: 700, color, lineHeight: 1 }}>{score}%</div>
      </div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: size / 2 - 16 }}>{label}</div>
    </div>
  );
}
