import { useEffect, useState } from 'react'
import api from '../api/axios'

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
}

const BEHAVIOUR_STYLES = {
  Subscription: 'badge-teal',
  Utility: 'badge-blue',
  Regular: 'badge-green',
  Impulse: 'badge-red',
  Occasional: 'badge-gray',
}

function BehaviourBadge({ behaviour }) {
  const cls = BEHAVIOUR_STYLES[behaviour] || 'badge-gray'
  return <span className={`badge ${cls}`}>{behaviour || 'Other'}</span>
}

export default function Insights() {
  const [summary, setSummary] = useState(null)
  const [merchants, setMerchants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/insights/monthly-summary'),
      api.get('/insights/merchants'),
    ])
      .then(([sRes, mRes]) => {
        setSummary(sRes.data)
        setMerchants(mRes.data?.merchants ?? mRes.data ?? [])
      })
      .catch(() => setError('Failed to load insights.'))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

  const monthlyKPIs = summary?.monthly_breakdown ?? []

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="2rem" />
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="card" style={{ minWidth: '200px' }}><Skeleton h="4rem" /></div>)}
        </div>
        <div className="card"><Skeleton h="300px" /></div>
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
          Insights
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Spending patterns, merchant clusters, and behaviour analysis
        </p>
      </div>

      {/* Monthly KPI scroll row */}
      {monthlyKPIs.length > 0 ? (
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
          {monthlyKPIs.map((m) => (
            <div
              key={m.month}
              className="card"
              style={{ minWidth: '200px', flexShrink: 0 }}
            >
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                {m.month}
              </p>
              <p className="font-mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-teal)', marginBottom: '0.25rem' }}>
                {fmt(m.income)}
              </p>
              <p className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                -{fmt(m.expense)}
              </p>
              <div style={{ height: '1px', background: 'var(--border)', marginBottom: '0.5rem' }} />
              <p className="font-mono" style={{
                fontSize: '0.85rem', fontWeight: '600',
                color: (m.income - m.expense) >= 0 ? 'var(--success)' : 'var(--danger)',
              }}>
                Net: {fmt(m.income - m.expense)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '2rem', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            No monthly KPI data available yet. Upload a bank statement to get started.
          </p>
        </div>
      )}

      {/* Merchant clusters */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.15rem' }}>
            Merchant Clusters
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Spending by merchant with behaviour classification
          </p>
        </div>

        {merchants.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏪</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.4rem' }}>No merchant data</p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Merchant clusters will appear after processing a statement.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Total Spent</th>
                  <th>Transactions</th>
                  <th>Avg. Amount</th>
                  <th>Behaviour</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '500' }}>{m.merchant || m.name || '—'}</td>
                    <td>
                      <span className="badge badge-gray">{m.category || '—'}</span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>
                        {fmt(m.total_spent ?? m.total)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {m.transaction_count ?? m.count ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {fmt(m.avg_amount ?? m.average)}
                      </span>
                    </td>
                    <td>
                      <BehaviourBadge behaviour={m.behaviour ?? m.behavior_type} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
