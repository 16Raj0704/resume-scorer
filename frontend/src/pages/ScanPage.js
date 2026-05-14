import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { scoreAPI } from '../services/api';
import axios from 'axios';

const S = {
  page: { color: '#e5e7eb', fontFamily: "'DM Sans', sans-serif" },
  heading: { fontSize: 26, fontWeight: 700, color: '#f1f0ff', letterSpacing: '-0.5px', marginBottom: 4 },
  sub: { fontSize: 15, color: '#6b7280', marginBottom: 32 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  card: { background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 12, padding: 24 },
  label: { fontSize: 13, color: '#9ca3af', marginBottom: 8, display: 'block', fontWeight: 500 },
  textarea: {
    width: '100%', minHeight: 260, padding: '14px', background: '#0a0a0f',
    border: '1px solid #1e1e2e', borderRadius: 8, color: '#e5e7eb',
    fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
    lineHeight: 1.6, fontFamily: 'inherit'
  },
  input: {
    width: '100%', padding: '11px 14px', background: '#0a0a0f',
    border: '1px solid #1e1e2e', borderRadius: 8, color: '#e5e7eb',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  btnPrimary: {
    padding: '13px 32px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer',
  },
};

export default function ScanPage() {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const navigate = useNavigate();

  const PARSER_URL = process.env.REACT_APP_PARSER_URL || 'http://localhost:8080';

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setPdfLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${PARSER_URL}/api/parse/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumeText(res.data.cleanedText || res.data.rawText);
      toast.success('PDF parsed successfully!');
    } catch {
      toast.error('PDF parsing failed. Please paste resume text instead.');
    } finally {
      setPdfLoading(false);
    }
  }, [PARSER_URL]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeText.trim() || !jdText.trim()) {
      toast.error('Please provide both resume and job description');
      return;
    }
    setLoading(true);
    try {
      const res = await scoreAPI.score({ resumeText, jdText, jdTitle, companyName });
      navigate(`/results/${res.data.scanId}`, { state: { result: res.data, resumeText, jdText, jdTitle, companyName } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Scoring failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <h1 style={S.heading}>New scan</h1>
      <p style={S.sub}>Paste your resume and job description to get your match score.</p>

      <form onSubmit={handleSubmit}>
        {/* Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={S.label}>Job title (optional)</label>
            <input style={S.input} value={jdTitle} onChange={e => setJdTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div>
            <label style={S.label}>Company (optional)</label>
            <input style={S.input} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Google" />
          </div>
        </div>

        <div style={S.grid}>
          {/* Resume */}
          <div style={S.card}>
            <label style={{ ...S.label, fontSize: 14, color: '#d1d5db', fontWeight: 600 }}>Your resume</label>

            {/* PDF drop zone */}
            <div {...getRootProps()} style={{
              border: `1.5px dashed ${isDragActive ? '#7c3aed' : '#2d2d3f'}`,
              borderRadius: 8, padding: '14px', textAlign: 'center',
              cursor: 'pointer', marginBottom: 14, background: isDragActive ? '#1a1a2e' : 'transparent',
              transition: 'all 0.15s'
            }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {pdfLoading ? '⏳ Parsing PDF...' : isDragActive ? 'Drop PDF here' : '⬆ Drop PDF or click to upload'}
              </div>
            </div>

            <label style={S.label}>Or paste resume text</label>
            <textarea
              style={S.textarea}
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your full resume text here..."
            />
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
              {resumeText.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          {/* JD */}
          <div style={S.card}>
            <label style={{ ...S.label, fontSize: 14, color: '#d1d5db', fontWeight: 600 }}>Job description</label>
            <textarea
              style={{ ...S.textarea, minHeight: 346 }}
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
            />
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>
              {jdText.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          ...S.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {loading ? (
            <><span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Analysing...</>
          ) : (
            <><span>⚡</span> Run match analysis</>
          )}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
