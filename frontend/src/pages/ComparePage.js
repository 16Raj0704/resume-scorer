import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import axios from 'axios';
import { compareAPI } from '../services/api';

const S = {
  page: { color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" },
  card: { background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24, marginBottom: 20 },
  label: { fontSize: 13, color: '#9ca3af', marginBottom: 8, display: 'block', fontWeight: 500 },
  textarea: { width: '100%', padding: '12px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, color: '#e5e7eb', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 },
  input: { width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 8, color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { padding: '11px 24px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '9px 18px', background: '#1e1e35', border: '1px solid #2d2d4f', borderRadius: 8, color: '#a78bfa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  btnSmall: { padding: '6px 14px', background: '#1e1e35', border: '1px solid #2d2d4f', borderRadius: 6, color: '#a78bfa', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
};

const emptyJob = () => ({ jdText: '', jdTitle: '', companyName: '' });

function KeywordList({ keywords = [], color, label, previewCount = 5 }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? keywords : keywords.slice(0, previewCount);
  const remaining = keywords.length - previewCount;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label} ({keywords.length})</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {shown.map((kw, i) => (
          <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: color === 'green' ? '#14532d' : '#450a0a', color: color === 'green' ? '#4ade80' : '#f87171' }}>{kw}</span>
        ))}
        {!expanded && remaining > 0 && (
          <button onClick={() => setExpanded(true)} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500, background: '#1e1e35', border: '1px solid #2d2d4f', color: '#a78bfa', cursor: 'pointer', fontFamily: 'inherit' }}>+{remaining} more</button>
        )}
        {expanded && keywords.length > previewCount && (
          <button onClick={() => setExpanded(false)} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#1e1e35', border: '1px solid #2d2d4f', color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>Show less</button>
        )}
      </div>
    </div>
  );
}

function ResumeUploader({ resumeText, setResumeText }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadMode, setUploadMode] = useState('upload');
  const PARSER_URL = process.env.REACT_APP_PARSER_URL || 'http://localhost:8080';

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPdfLoading(true);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${PARSER_URL}/api/parse/pdf`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResumeText(res.data.cleanedText || res.data.rawText);
      toast.success(`✓ ${file.name} parsed successfully!`);
    } catch {
      toast.error('PDF parsing failed. Try pasting text instead.');
      setFileName('');
    } finally {
      setPdfLoading(false);
    }
  }, [PARSER_URL, setResumeText]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, disabled: pdfLoading });
  const clearResume = () => { setResumeText(''); setFileName(''); };

  return (
    <div>
      {/* <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['upload', 'paste'].map(mode => (
          <button key={mode} onClick={() => setUploadMode(mode)} style={{ ...S.btnSmall, background: uploadMode === mode ? '#2d2d4f' : '#1e1e35', color: uploadMode === mode ? '#c4b5fd' : '#a78bfa', border: uploadMode === mode ? '1px solid #4f46e5' : '1px solid #2d2d4f' }}>
            {mode === 'upload' ? '⬆ Upload PDF' : '✎ Paste text'}
          </button>
        ))}
      </div> */}
      {uploadMode === 'upload' && (
        <div>
          <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? '#7c3aed' : resumeText ? '#4f46e5' : '#2d2d3f'}`, borderRadius: 10, padding: '32px 24px', textAlign: 'center', cursor: pdfLoading ? 'wait' : 'pointer', background: isDragActive ? '#1a1a2e' : resumeText ? '#0d0d1f' : '#0a0a0f', transition: 'all 0.2s', marginBottom: 12 }}>
            <input {...getInputProps()} />
            {pdfLoading ? (
              <div><div style={{ width: 32, height: 32, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} /><div style={{ fontSize: 14, color: '#a78bfa' }}>Parsing PDF...</div></div>
            ) : resumeText && fileName ? (
              <div><div style={{ fontSize: 28, marginBottom: 8 }}>✓</div><div style={{ fontSize: 14, color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>{fileName}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{resumeText.split(/\s+/).filter(Boolean).length} words extracted</div></div>
            ) : (
              <div><div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>⬆</div><div style={{ fontSize: 14, color: isDragActive ? '#a78bfa' : '#6b7280', marginBottom: 6 }}>{isDragActive ? 'Drop your PDF here' : 'Drag & drop your resume PDF'}</div><div style={{ fontSize: 12, color: '#4b5563' }}>or click to browse files</div></div>
            )}
          </div>
          {resumeText && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#4ade80', flex: 1 }}>✓ Resume ready</div>
              <button onClick={clearResume} style={{ ...S.btnSmall, color: '#f87171', borderColor: '#450a0a' }}>✕ Remove</button>
              <button onClick={() => setUploadMode('paste')} style={S.btnSmall}>✎ Edit</button>
            </div>
          )}
        </div>
      )}
      {uploadMode === 'paste' && (
        <div>
          <textarea style={{ ...S.textarea, minHeight: 200 }} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your full resume text here..." />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ fontSize: 12, color: '#4b5563' }}>{resumeText.split(/\s+/).filter(Boolean).length} words</div>
            {resumeText && <button onClick={clearResume} style={{ ...S.btnSmall, color: '#f87171', borderColor: '#450a0a' }}>✕ Clear</button>}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ResultCard({ r, rank }) {
  const [showDetails, setShowDetails] = useState(false);
  const scoreColor = (s) => s >= 75 ? '#4ade80' : s >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ ...S.card, borderColor: rank === 0 ? '#4f46e5' : '#1e1e2e', position: 'relative', marginBottom: 0 }}>
      <div style={{ position: 'absolute', top: -10, left: 16, background: rank === 0 ? '#4f46e5' : rank === 1 ? '#374151' : '#1f2937', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
        {rank === 0 ? '★ Best fit' : rank === 1 ? '2nd' : `${rank + 1}th`}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, marginTop: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#d1d5db' }}>{r.jdTitle || 'Untitled'}</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{r.companyName || '—'}</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: scoreColor(r.match_score), lineHeight: 1 }}>{r.match_score}%</div>
      </div>
      <div style={{ height: 4, background: '#1e1e2e', borderRadius: 2, marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${r.match_score}%`, background: scoreColor(r.match_score), borderRadius: 2 }} />
      </div>
      {r.score_breakdown && (
        <div style={{ marginBottom: 14 }}>
          {Object.entries(r.score_breakdown).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
              <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
              <span style={{ color: '#9ca3af', fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>
      )}

      <KeywordList keywords={r.matched_keywords || []} color="green" label="Matched" previewCount={4} />
      <KeywordList keywords={r.missing_keywords || []} color="red" label="Missing" previewCount={4} />

      {r.top_suggestion && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#0a0a0f', borderRadius: 8, borderLeft: '3px solid #4f46e5' }}>
          <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 4 }}>Top tip</div>
          <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{r.top_suggestion.suggestion}</div>
        </div>
      )}

      <button onClick={() => setShowDetails(!showDetails)} style={{ width: '100%', marginTop: 14, padding: '8px', background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: 6, color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {showDetails ? '▲ Hide details' : '▼ Show full details'}
      </button>

      {showDetails && (
        <div style={{ marginTop: 14, borderTop: '1px solid #1e1e2e', paddingTop: 14 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 10 }}>All matched keywords</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(r.matched_keywords || []).map((kw, i) => <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#14532d', color: '#4ade80', fontWeight: 500 }}>{kw}</span>)}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 10 }}>All missing keywords</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(r.missing_keywords || []).map((kw, i) => <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#450a0a', color: '#f87171', fontWeight: 500 }}>{kw}</span>)}
            </div>
          </div>
          {r.score_breakdown && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 10 }}>Score breakdown</div>
              {[{ key: 'keyword_match', label: 'Keyword match', max: 40 }, { key: 'experience_relevance', label: 'Experience relevance', max: 25 }, { key: 'skills_alignment', label: 'Skills alignment', max: 20 }, { key: 'education_fit', label: 'Education fit', max: 15 }].map(({ key, label, max }) => (
                <div key={key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af', marginBottom: 4 }}><span>{label}</span><span>{r.score_breakdown[key]}/{max}</span></div>
                  <div style={{ height: 4, background: '#1e1e2e', borderRadius: 2 }}><div style={{ height: '100%', width: `${(r.score_breakdown[key] / max) * 100}%`, background: '#7c3aed', borderRadius: 2 }} /></div>
                </div>
              ))}
            </div>
          )}
          {r.top_suggestion && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db', marginBottom: 10 }}>Improvement tip</div>
              <div style={{ padding: '12px', background: '#0a0a0f', borderRadius: 8, border: '1px solid #1e1e2e' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#1e1e2e', color: '#9ca3af' }}>{r.top_suggestion.category}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: r.top_suggestion.priority === 'high' ? '#450a0a' : '#78350f', color: r.top_suggestion.priority === 'high' ? '#f87171' : '#fbbf24' }}>{r.top_suggestion.priority}</span>
                </div>
                <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.6 }}>{r.top_suggestion.suggestion}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [resumeText, setResumeText] = useState('');
  const [jobs, setJobs] = useState([emptyJob(), emptyJob()]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateJob = (i, field, value) => setJobs(jobs => jobs.map((j, idx) => idx === i ? { ...j, [field]: value } : j));
  const addJob = () => { if (jobs.length >= 5) return toast.error('Maximum 5 JDs'); setJobs(j => [...j, emptyJob()]); };
  const removeJob = (i) => { if (jobs.length <= 2) return toast.error('Minimum 2 JDs'); setJobs(j => j.filter((_, idx) => idx !== i)); };

  const handleCompare = async () => {
    if (!resumeText.trim()) return toast.error('Please upload or paste your resume first');
    if (jobs.some(j => !j.jdText.trim())) return toast.error('All job descriptions must be filled');
    setLoading(true); setResults(null);
    try {
      const res = await compareAPI.compare({ resumeText, jobs });
      setResults(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Comparison failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f0ff', marginBottom: 4, letterSpacing: '-0.5px' }}>Compare JDs</h1>
      <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 28 }}>Upload your resume once, compare against multiple companies. Click "+N more" to expand keywords.</p>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, background: '#1e1e35', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>◈</div>
          <label style={{ fontSize: 15, color: '#d1d5db', fontWeight: 600, margin: 0 }}>Your resume</label>
          {resumeText && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#14532d', color: '#4ade80' }}>Ready</span>}
        </div>
        <ResumeUploader resumeText={resumeText} setResumeText={setResumeText} />
      </div>

      <div style={{ fontSize: 15, color: '#d1d5db', fontWeight: 600, marginBottom: 16 }}>Job descriptions ({jobs.length}/5)</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {jobs.map((job, i) => (
          <div key={i} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, background: '#1e1e35', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#a78bfa', fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#d1d5db' }}>Job {i + 1}</span>
              </div>
              {jobs.length > 2 && <button onClick={() => removeJob(i)} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 18, padding: 0 }}>✕</button>}
            </div>
            <div style={{ marginBottom: 10 }}><label style={S.label}>Job title</label><input style={S.input} value={job.jdTitle} onChange={e => updateJob(i, 'jdTitle', e.target.value)} placeholder="e.g. Backend Engineer" /></div>
            <div style={{ marginBottom: 10 }}><label style={S.label}>Company</label><input style={S.input} value={job.companyName} onChange={e => updateJob(i, 'companyName', e.target.value)} placeholder="e.g. Google, Flipkart" /></div>
            <div><label style={S.label}>Job description</label><textarea style={{ ...S.textarea, minHeight: 160 }} value={job.jdText} onChange={e => updateJob(i, 'jdText', e.target.value)} placeholder="Paste the full job description here..." /><div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>{job.jdText.split(/\s+/).filter(Boolean).length} words</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        {jobs.length < 5 && <button onClick={addJob} style={S.btnSecondary}>+ Add another company</button>}
        <button onClick={handleCompare} disabled={loading || !resumeText.trim()} style={{ ...S.btnPrimary, opacity: (loading || !resumeText.trim()) ? 0.6 : 1, cursor: (loading || !resumeText.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? <><span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Comparing...</> : <><span>⚡</span>Compare {jobs.length} jobs</>}
        </button>
        {!resumeText.trim() && <span style={{ fontSize: 13, color: '#6b7280' }}>← Upload your resume first</span>}
      </div>

      {results && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #0d0d1f)', border: '1px solid #4f46e5', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best match</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f0ff', marginBottom: 4 }}>{results.best_match.jdTitle || 'Untitled'} at {results.best_match.companyName || 'Unknown'}</div>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>{results.summary}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {results.results.map((r, i) => <ResultCard key={i} r={r} rank={i} />)}
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}