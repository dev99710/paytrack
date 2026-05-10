import { useEffect, useState } from 'react'
import api from '../api/axios'

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
}

const ACTION_STYLES = {
  CREATE: 'badge-green',
  UPDATE: 'badge-teal',
  DELETE: 'badge-red',
  LOGIN: 'badge-blue',
  UPLOAD: 'badge-gold',
  PROCESS: 'badge-gray',
  EXPORT: 'badge-gray',
}

const SOURCE_STYLES = {
  user: 'badge-teal',
  system: 'badge-gray',
  api: 'badge-blue',
  pipeline: 'badge-gold',
}

function ActionBadge({ action }) {
  const key = (action || '').toUpperCase()
  const cls = ACTION_STYLES[key] || 'badge-gray'
  return <span className={`badge ${cls}`}>{action || '—'}</span>
}

function SourceBadge({ source }) {
  const key = (source || '').toLowerCase()
  const cls = SOURCE_STYLES[key] || 'badge-gray'
  return <span className={`badge ${cls}`}>{source || '—'}</span>
}

function DetailsJSON({ details }) {
  const [open, setOpen] = useState(false)
  if (!details) return <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
  const str = typeof details === 'string' ? details : JSON.stringify(details, null, 2)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '5px', padding: '0.2rem 0.5rem', fontSize: '0.75rem',
          color: 'var(--accent-teal)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          transition: 'all 150ms ease',
        }}
      >
        {open ? '▲ Hide' : '▶ View JSON'}
      </button>
      {open && (
        <pre
          className="font-mono"
          style={{
            marginTop: '0.5rem',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0.75rem',
            overflow: 'auto',
            maxHeight: '200px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {str}
        </pre>
      )}
    </div>
  )
}

const ALL_ACTIONS = ['All', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'UPLOAD', 'PROCESS', 'EXPORT']

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState('All')

  useEffect(() => {
    api.get('/audit')
      .then((res) => setLogs(res.data?.logs ?? res.data ?? []))
      .catch(() => setError('Failed to load audit log.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = actionFilter === 'All'
    ? logs
    : logs.filter((l) => (l.action || '').toUpperCase() === actionFilter)

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="2rem" />
        <div className="card">
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
              <Skeleton h="1rem" w="120px" />
              <Skeleton h="1rem" w="80px" />
              <Skeleton h="1rem" w="100px" />
              <Skeleton h="1rem" w="150px" />
            </div>
          ))}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Audit Log
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Complete history of all actions and events
          </p>
        </div>
        <select
          id="action-filter"
          className="select"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          {ALL_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</p>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No audit entries</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            {logs.length === 0 ? 'Audit events will appear here as you use PayTrack.' : `No "${actionFilter}" actions found.`}
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Source</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id ?? i}>
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: '2-digit',
                              hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <ActionBadge action={log.action} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {log.entity_type ?? log.entity ?? '—'}
                      </span>
                    </td>
                    <td>
                      <SourceBadge source={log.source} />
                    </td>
                    <td style={{ minWidth: '200px' }}>
                      <DetailsJSON details={log.details ?? log.metadata} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
