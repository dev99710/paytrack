import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../api/axios'

const PIPELINE_STEPS = [
  { key: 'extraction', label: 'Text Extraction', desc: 'Parsing PDF/CSV content' },
  { key: 'parsing', label: 'Transaction Parsing', desc: 'Identifying transactions' },
  { key: 'categorization', label: 'Categorization', desc: 'ML category assignment' },
  { key: 'anomaly_detection', label: 'Anomaly Detection', desc: 'Scanning for irregularities' },
  { key: 'scoring', label: 'Health Scoring', desc: 'Computing financial score' },
  { key: 'forecasting', label: 'Forecasting', desc: 'Generating predictions' },
]

function StepIcon({ status }) {
  if (status === 'done') {
    return (
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        border: '2px solid var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: 'var(--accent-teal)',
          animation: 'pulse 1.2s ease-in-out infinite',
        }} />
      </div>
    )
  }
  return (
    <div style={{
      width: '28px', height: '28px', borderRadius: '50%',
      border: '2px solid var(--border)', flexShrink: 0,
    }} />
  )
}

function getStepStatus(jobStatus, stepIndex) {
  if (!jobStatus) return 'pending'
  const statusMap = { pending: 0, processing: 1, done: 6 }
  const current = statusMap[jobStatus] ?? 0
  if (current >= 6 || stepIndex < current - 1) return 'done'
  if (stepIndex === current - 1) return 'active'
  return 'pending'
}

export default function Upload() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [jobStatus, setJobStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef()
  const pollRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['application/pdf', 'text/csv', 'application/vnd.ms-excel']
    const isAllowed = allowed.includes(f.type) || f.name.endsWith('.csv') || f.name.endsWith('.pdf')
    if (!isAllowed) {
      setError('Only PDF and CSV files are supported.')
      return
    }
    setFile(f)
    setError('')
    setResult(null)
    setJobId(null)
    setJobStatus(null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const pollJob = useCallback((id) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/statements/job/${id}`)
        const { status, result: jobResult } = res.data
        setJobStatus(status)
        if (status === 'done') {
          clearInterval(pollRef.current)
          setResult(jobResult)
        } else if (status === 'failed') {
          clearInterval(pollRef.current)
          setError('Processing failed. Please try again.')
        }
      } catch {
        clearInterval(pollRef.current)
        setError('Could not fetch job status.')
      }
    }, 3000)
  }, [])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const handleUpload = async () => {
    if (!file) return
    setError('')
    setUploading(true)
    setJobStatus('pending')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/statements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const { job_id } = res.data
      setJobId(job_id)
      setJobStatus('processing')
      pollJob(job_id)
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
      setJobStatus(null)
    } finally {
      setUploading(false)
    }
  }

  const gradeColor = (grade) => {
    if (!grade) return 'var(--text-secondary)'
    if (['A+', 'A', 'A-'].includes(grade)) return 'var(--success)'
    if (['B+', 'B', 'B-'].includes(grade)) return 'var(--accent-teal)'
    if (['C+', 'C', 'C-'].includes(grade)) return 'var(--accent-gold)'
    return 'var(--danger)'
  }

  const activeStepIndex = PIPELINE_STEPS.findIndex((_, i) => getStepStatus(jobStatus, i) === 'active')

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.5rem' }}>
        Upload Statement
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Upload your bank statement (PDF or CSV) and let PayTrack analyse it automatically.
      </p>

      {/* Drop zone */}
      {!jobId && (
        <>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent-teal)' : file ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: '14px',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(20,184,166,0.05)' : 'var(--bg-surface)',
              transition: 'all 150ms ease',
              marginBottom: '1.25rem',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.csv"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <div style={{ marginBottom: '1rem', color: dragging ? 'var(--accent-teal)' : 'var(--text-dim)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            {file ? (
              <>
                <p style={{ color: 'var(--success)', fontWeight: '600', marginBottom: '0.25rem' }}>
                  ✓ {file.name}
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {(file.size / 1024).toFixed(1)} KB — click to change
                </p>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>
                  Drop your file here or click to browse
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Supports PDF and CSV bank statements
                </p>
              </>
            )}
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '0.75rem 1rem', color: 'var(--danger)',
              fontSize: '0.875rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {uploading ? 'Uploading…' : 'Upload & Analyse'}
          </button>
        </>
      )}

      {/* Pipeline status */}
      {jobId && (
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem' }}>
              Processing Pipeline
            </h3>
            <span className={`badge ${jobStatus === 'done' ? 'badge-green' : jobStatus === 'failed' ? 'badge-red' : 'badge-teal'}`}>
              {jobStatus === 'done' ? '✓ Complete' : jobStatus === 'failed' ? '✗ Failed' : '⟳ Running'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {PIPELINE_STEPS.map((step, i) => {
              const status = jobStatus === 'done' ? 'done' : i < (activeStepIndex === -1 ? PIPELINE_STEPS.length : activeStepIndex) ? 'done' : i === activeStepIndex ? 'active' : 'pending'
              return (
                <div key={step.key} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: i < PIPELINE_STEPS.length - 1 ? '0' : '0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <StepIcon status={status} />
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div style={{
                        width: '2px', height: '2.5rem',
                        background: status === 'done' ? 'var(--success)' : 'var(--border)',
                        transition: 'background 300ms ease',
                      }} />
                    )}
                  </div>
                  <div style={{ paddingTop: '4px', paddingBottom: '1.25rem' }}>
                    <p style={{
                      fontWeight: '600', fontSize: '0.9rem',
                      color: status === 'active' ? 'var(--accent-teal)' : status === 'done' ? 'var(--text-primary)' : 'var(--text-dim)',
                      transition: 'color 300ms ease',
                    }}>
                      {step.label}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Result card */}
          {result && (
            <div style={{
              marginTop: '1.5rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--accent-teal)',
              borderRadius: '10px',
              padding: '1.25rem',
            }}>
              <h3 style={{
                fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem',
                marginBottom: '1rem', color: 'var(--accent-teal)',
              }}>
                Analysis Complete
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>TRANSACTIONS</p>
                  <p className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {result.txn_count ?? 0}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>ANOMALIES</p>
                  <p className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: result.anomaly_count > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {result.anomaly_count ?? 0}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>HEALTH SCORE</p>
                  <p className="font-mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-teal)' }}>
                    {result.score ?? '--'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>GRADE</p>
                  <p style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: gradeColor(result.grade),
                  }}>
                    {result.grade ?? '--'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setJobId(null); setFile(null); setResult(null); setJobStatus(null) }}
                className="btn-ghost"
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Upload another statement
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  )
}
