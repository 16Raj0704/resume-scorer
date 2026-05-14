import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { historyAPI, rewriteAPI, coverLetterAPI, scoreAPI } from '../services/api';
import ScoreRing from '../components/ScoreRing';

const S = {
  page: { color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" },
  card: { background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24, marginBottom: 20 },
  heading: { fontSize: 26, fontWeight: 700, color: '#f1f0ff', letterSpacing: '-0.5px', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#d1d5db', marginBottom: 16 },
  tag: (type) => ({
    display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, margin: '3px',
    background: type === 'match' ? '#14532d' : type === 'miss' ? '#450a0a' : '#1e1b4b',
    color: type === 'match' ? '#4ade80' : type === 'miss' ? '#f87171' : '#a78bfa',
  }),
  bullet: { padding: '12px 16px', background: '#0a0a0f', borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: '#d1d5db', marginBottom: 8, border: '1px solid #1e1e2e' },
  btnSmall: { padding: '6px 14px', background: '#1e1e35', border: '1px solid #2d2d4f', borderRadius: 6, color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { padding: '11px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  priorityBadge: (p) => ({
    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: p === 'high' ? '#450a0a' : p === 'medium' ? '#78350f' : '#1e1e2e',
    color: p === 'high' ? '#f87171' : p === 'medium' ? '#fbbf24' : '#9ca3af',
  }),
};

function BulletRewriter({ bullet, jdText, jdTitle, scanId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const rewrite = async () => {
    setLoading(true);
    try {
      const res = await rewriteAPI.rewrite({ bullet, jdText, jdTitle, scanId });
      setResult(res.data);
    } catch {
      toast.error('Rewrite failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result.rewritten_bullet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={S.bullet}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <span>• {bullet}</span>
          <button onClick={rewrite} disabled={loading} style={S.btnSmall}>
            {loading ? '⏳' : '✨ Rewrite'}
          </button>
        </div>
        {result && (
          <div style={{ marginTop: 12, borderTop: '1px solid #1e1e2e', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI rewrite</div>
            <div style={{ color: '#a78bfa', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>• {result.rewritten_bullet}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{result.improvement_notes}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {result.keywords_added?.map(k => <span key={k} style={S.tag('ats')}>+{k}</span>)}
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Impact: {result.impact_score_before}/10 → {result.impact_score_after}/10
              </span>
              <button onClick={copy} style={S.btnSmall}>{copied ? '✓ Copied' : '⎘ Copy'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { scanId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [result, setResult] = useState(location.state?.result || null);
  const [resumeText, setResumeText] = useState(location.state?.resumeText || '');
  const [jdText, setJdText] = useState(location.state?.jdText || '');
  const [jdTitle, setJdTitle] = useState(location.state?.jdTitle || '');
  const [loading, setLoading] = useState(!result);
  const [activeTab, setActiveTab] = useState('overview');
  const [coverLetter, setCoverLetter] = useState(null);
  const [clLoading, setClLoading] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [copiedCL, setCopiedCL] = useState(false);

  // Extract bullets from resume for rewriter
  const bullets = resumeText
    ? resumeText.split('\n').filter(l => /^[\s•\-\*]/.test(l) && l.trim().length > 20).map(l => l.replace(/^[\s•\-\*]+/, '').trim())
    : [];

  useEffect(() => {
    if (!result && scanId) {
      historyAPI.get(scanId)
        .then(res => {
          const scan = res.data;
          setResult({
            match_score: scan.match_score,
            matched_keywords: typeof scan.matched_keywords === 'string' ? JSON.parse(scan.matched_keywords) : scan.matched_keywords,
            missing_keywords: typeof scan.missing_keywords === 'string' ? JSON.parse(scan.missing_keywords) : scan.missing_keywords,
            suggestions: typeof scan.suggestions === 'string' ? JSON.parse(scan.suggestions) : scan.suggestions,
            detailed_analysis: scan.detailed_analysis,
          });
          setResumeText(scan.resume_text);
          setJdText(scan.jd_text);
          setJdTitle(scan.jd_title || '');
        })
        .catch(() => toast.error('Failed to load scan'))
        .finally(() => setLoading(false));
    }
  }, [scanId, result]);

  const generateCoverLetter = async () => {
    setClLoading(true);
    try {
      const res = await coverLetterAPI.generate({ resumeText, jdText, jdTitle, companyName: location.state?.companyName || '' });
      setCoverLetter(res.data);
      setActiveTab('coverletter');
    } catch {
      toast.error('Cover letter generation failed');
    } finally {
      setClLoading(false);
    }
  };

  const runATSCheck = async () => {
    setAtsLoading(true);
    try {
      const res = await scoreAPI.ats({ resumeText });
      setAtsResult(res.data);
      setActiveTab('ats');
    } catch {
      toast.error('ATS check failed');
    } finally {
      setAtsLoading(false);
    }
  };

  if (loading) return <div style={{ color: '#6b7280', padding: 40 }}>Loading results...</div>;
  if (!result) return <div style={{ color: '#f87171', padding: 40 }}>Results not found.</div>;

  const tabs = ['overview', 'keywords', 'suggestions', 'rewriter', 'ats', 'coverletter'];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={S.heading}>{jdTitle || 'Match analysis'}</h1>
          <div style={{ fontSize: 14, color: '#6b7280' }}>{location.state?.companyName || ''}</div>
        </div>
        <button onClick={() => navigate('/scan')} style={{ ...S.btnSmall, padding: '8px 16px' }}>+ New scan</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            background: activeTab === tab ? '#1e1e35' : 'transparent',
            color: activeTab === tab ? '#a78bfa' : '#6b7280',
          }}>
            {tab === 'overview' ? 'Overview' : tab === 'keywords' ? 'Keywords' : tab === 'suggestions' ? 'Suggestions' :
             tab === 'rewriter' ? '✨ Rewriter' : tab === 'ats' ? 'ATS check' : 'Cover letter'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'start' }}>
            <div style={S.card}>
              <ScoreRing score={result.match_score} size={160} />
            </div>
            <div>
              {result.score_breakdown && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Score breakdown</div>
                  {Object.entries(result.score_breakdown).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: '#9ca3af', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db' }}>{val}</span>
                      </div>
                      <div style={{ height: 4, background: '#1e1e2e', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${(val / (key === 'keyword_match' ? 40 : key === 'experience_relevance' ? 25 : key === 'skills_alignment' ? 20 : 15)) * 100}%`, background: '#7c3aed', borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {result.detailed_analysis && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Analysis</div>
              <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{result.detailed_analysis}</p>
            </div>
          )}

          {result.strengths?.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Strengths</div>
              {result.strengths.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: '#d1d5db' }}>
                  <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>{s}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={generateCoverLetter} disabled={clLoading} style={S.btnPrimary}>
              {clLoading ? 'Generating...' : '✉ Generate cover letter'}
            </button>
            <button onClick={runATSCheck} disabled={atsLoading} style={{ ...S.btnPrimary, background: '#1e1e35', border: '1px solid #2d2d4f', color: '#a78bfa' }}>
              {atsLoading ? 'Running...' : '⚙ ATS check'}
            </button>
          </div>
        </>
      )}

      {/* Keywords */}
      {activeTab === 'keywords' && (
        <div style={S.card}>
          <div style={{ marginBottom: 24 }}>
            <div style={S.sectionTitle}>Matched keywords ({result.matched_keywords?.length || 0})</div>
            <div>{result.matched_keywords?.map(k => <span key={k} style={S.tag('match')}>{k}</span>)}</div>
          </div>
          <div>
            <div style={S.sectionTitle}>Missing keywords ({result.missing_keywords?.length || 0})</div>
            <div style={{ marginBottom: 12 }}>{result.missing_keywords?.map(k => <span key={k} style={S.tag('miss')}>{k}</span>)}</div>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Try to naturally weave missing keywords into your resume where relevant.</p>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {activeTab === 'suggestions' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Improvement suggestions</div>
          {result.suggestions?.map((s, i) => (
            <div key={i} style={{ padding: '14px', background: '#0a0a0f', borderRadius: 8, marginBottom: 10, border: '1px solid #1e1e2e' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#6b7280', background: '#1e1e2e', padding: '2px 8px', borderRadius: 20 }}>{s.category}</span>
                <span style={S.priorityBadge(s.priority)}>{s.priority}</span>
              </div>
              <div style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.6 }}>{s.suggestion}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bullet Rewriter */}
      {activeTab === 'rewriter' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>AI bullet rewriter</div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Click "Rewrite" on any bullet to get an AI-improved version tailored to the JD.</p>
          {bullets.length > 0 ? (
            bullets.map((b, i) => (
              <BulletRewriter key={i} bullet={b} jdText={jdText} jdTitle={jdTitle} scanId={scanId} />
            ))
          ) : (
            <div style={{ color: '#6b7280', fontSize: 14 }}>No bullet points detected. Make sure your resume uses bullet points (•, -, *).</div>
          )}
        </div>
      )}

      {/* ATS */}
      {activeTab === 'ats' && (
        <div>
          {!atsResult ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Run an ATS simulation to see how applicant tracking systems read your resume.</div>
              <button onClick={runATSCheck} disabled={atsLoading} style={S.btnPrimary}>
                {atsLoading ? 'Simulating...' : '⚙ Run ATS check'}
              </button>
            </div>
          ) : (
            <>
              <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 48, fontWeight: 700, color: atsResult.parse_score >= 75 ? '#4ade80' : '#fbbf24' }}>{atsResult.parse_score}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>ATS parse score</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>Sections detected: {atsResult.detected_sections?.join(', ')}</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>Work entries: {atsResult.work_experience_count} · Contact: {atsResult.contact_info_detected ? '✓' : '✗'}</div>
                </div>
              </div>
              {atsResult.parsing_issues?.length > 0 && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Parsing issues</div>
                  {atsResult.parsing_issues.map((issue, i) => (
                    <div key={i} style={{ fontSize: 14, color: '#f87171', marginBottom: 8, display: 'flex', gap: 8 }}><span>✗</span>{issue}</div>
                  ))}
                </div>
              )}
              {atsResult.recommendations?.length > 0 && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Recommendations</div>
                  {atsResult.recommendations.map((r, i) => (
                    <div key={i} style={{ fontSize: 14, color: '#d1d5db', marginBottom: 8, display: 'flex', gap: 8 }}><span style={{ color: '#7c3aed' }}>→</span>{r}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Cover Letter */}
      {activeTab === 'coverletter' && (
        <div>
          {!coverLetter ? (
            <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Generate a personalised cover letter tailored to this job.</div>
              <button onClick={generateCoverLetter} disabled={clLoading} style={S.btnPrimary}>
                {clLoading ? 'Generating...' : '✉ Generate cover letter'}
              </button>
            </div>
          ) : (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={S.sectionTitle}>Cover letter</div>
                <button onClick={() => { navigator.clipboard.writeText(coverLetter.cover_letter); setCopiedCL(true); toast.success('Copied!'); setTimeout(() => setCopiedCL(false), 2000); }} style={S.btnSmall}>
                  {copiedCL ? '✓ Copied' : '⎘ Copy'}
                </button>
              </div>
              {coverLetter.subject_line && (
                <div style={{ padding: '8px 14px', background: '#1e1e2e', borderRadius: 6, fontSize: 13, color: '#a78bfa', marginBottom: 16 }}>
                  Subject: {coverLetter.subject_line}
                </div>
              )}
              <pre style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                {coverLetter.cover_letter}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
