import { useEffect, useState } from 'react'
import api from '../api/axios'

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
}

function SeverityBadge({ severity }) {
  if (severity === 'high') return <span className="badge badge-red">High</span>
  if (severity === 'medium') return <span className="badge badge-gold">Medium</span>
  return <span className="badge badge-gray">Low</span>
}

function AnomalyCard({ anomaly }) {
  const isHigh = anomaly.severity === 'high'
  const isMedium = anomaly.severity === 'medium'

  const reasons = anomaly.reasons ?? anomaly.reason_codes ?? anomaly.explanations ?? []

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isHigh ? 'var(--danger)' : isMedium ? 'var(--warning)' : 'var(--text-dim)'}`,
        borderRadius: '10px',
        padding: '1.25rem',
        transition: 'border-color 150ms ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
            {anomaly.description ?? anomaly.merchant ?? '—'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {anomaly.date ? new Date(anomaly.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <span
            className="font-mono"
            style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: 'var(--accent-gold)',
            }}
          >
            ₹{Math.abs(Number(anomaly.amount)).toLocaleString('en-IN')}
          </span>
          <SeverityBadge severity={anomaly.severity} />
        </div>
      </div>

      {reasons.length > 0 && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Reasons
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {(Array.isArray(reasons) ? reasons : [reasons]).map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: isHigh ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, marginTop: '1px' }}>•</span>
                {typeof r === 'string' ? r : r.message ?? JSON.stringify(r)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    api.get('/anomalies')
      .then((res) => setAnomalies(res.data?.anomalies ?? res.data ?? []))
      .catch(() => setError('Failed to load anomalies.'))
      .finally(() => setLoading(false))
  }, [])

  const tabs = ['All', 'High', 'Medium']
  const filtered = filter === 'All'
    ? anomalies
    : anomalies.filter((a) => a.severity?.toLowerCase() === filter.toLowerCase())

  const highCount = anomalies.filter((a) => a.severity === 'high').length
  const medCount = anomalies.filter((a) => a.severity === 'medium').length

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="2rem" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3].map(i => <Skeleton key={i} h="120px" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: 'var(--danger)' }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Anomalies
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Unusual transactions flagged by PayTrack's detection engine
        </p>
      </div>

      {/* Summary pills */}
      {anomalies.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', padding: '0.5rem 1rem',
          }}>
            <span className="font-mono" style={{ color: 'var(--danger)', fontWeight: '700' }}>{highCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>High severity</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '8px', padding: '0.5rem 1rem',
          }}>
            <span className="font-mono" style={{ color: 'var(--warning)', fontWeight: '700' }}>{medCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Medium severity</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${filter === tab ? 'var(--accent-teal)' : 'transparent'}`,
              color: filter === tab ? 'var(--accent-teal)' : 'var(--text-secondary)',
              fontWeight: filter === tab ? '600' : '400',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              marginBottom: '-1px',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {tab}
            {tab !== 'All' && (
              <span style={{
                marginLeft: '0.4rem',
                fontSize: '0.7rem',
                background: tab === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                color: tab === 'High' ? 'var(--danger)' : 'var(--warning)',
                padding: '0.1rem 0.4rem',
                borderRadius: '999px',
              }}>
                {tab === 'High' ? highCount : medCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
            {anomalies.length === 0 ? '🎉' : '🔍'}
          </p>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {anomalies.length === 0 ? 'No anomalies detected' : `No ${filter.toLowerCase()} severity anomalies`}
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            {anomalies.length === 0
              ? 'Your transactions look clean! No unusual activity was detected.'
              : `Try viewing "All" anomalies for the full picture.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map((a, i) => <AnomalyCard key={a.id ?? i} anomaly={a} />)}
        </div>
      )}
    </div>
  )
}
