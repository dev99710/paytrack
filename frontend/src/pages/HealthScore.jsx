import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/axios'

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
}

function ScoreGauge({ score }) {
  const radius = 90
  const stroke = 14
  const normalizedRadius = radius - stroke / 2
  const circumference = Math.PI * normalizedRadius // semicircle
  const pct = Math.min(Math.max(score ?? 0, 0), 100) / 100
  const offset = circumference - pct * circumference

  const scoreToColor = (s) => {
    if (s >= 80) return '#14B8A6'
    if (s >= 60) return '#F59E0B'
    if (s >= 40) return '#FB923C'
    return '#EF4444'
  }

  const color = scoreToColor(score)

  return (
    <div style={{ position: 'relative', width: '200px', height: '110px', margin: '0 auto' }}>
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Track */}
        <path
          d={`M ${stroke / 2} 100 A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${200 - stroke / 2} 100`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${stroke / 2} 100 A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${200 - stroke / 2} 100`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease, stroke 400ms ease' }}
        />
      </svg>
      {/* Score number in center */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
      }}>
        <span
          className="font-mono"
          style={{ fontSize: '2.25rem', fontWeight: '700', color, lineHeight: 1 }}
        >
          {score ?? '—'}
        </span>
        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>/ 100</span>
      </div>
    </div>
  )
}

function SignalBar({ label, value, max = 100 }) {
  const pct = Math.min(Math.max((value ?? 0), 0), max) / max * 100
  const color = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--accent-teal)' : pct >= 30 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: '600', color }}>{value ?? 0}</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 600ms ease',
        }} />
      </div>
    </div>
  )
}

function HistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.9rem', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</p>
      <p className="font-mono" style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>{payload[0].value}</p>
    </div>
  )
}

export default function HealthScore() {
  const [score, setScore] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/score'),
      api.get('/score/history'),
    ])
      .then(([sRes, hRes]) => {
        setScore(sRes.data)
        setHistory(hRes.data?.history ?? hRes.data ?? [])
      })
      .catch(() => setError('Failed to load health score.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="2rem" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="card" style={{ textAlign: 'center' }}><Skeleton h="200px" /></div>
          <div className="card"><Skeleton h="200px" /></div>
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

  const mainScore = score?.score ?? null
  const grade = score?.grade ?? '—'
  const signals = score?.signals ?? score?.breakdown ?? {}
  const insights = score?.insights ?? score?.recommendations ?? []

  const gradeColor = (g) => {
    if (!g || g === '—') return 'var(--text-secondary)'
    if (['A+', 'A', 'A-'].includes(g)) return 'var(--success)'
    if (['B+', 'B', 'B-'].includes(g)) return 'var(--accent-teal)'
    if (['C+', 'C', 'C-'].includes(g)) return 'var(--accent-gold)'
    return 'var(--danger)'
  }

  const SIGNAL_LABELS = {
    savings_rate: 'Savings Rate',
    expense_consistency: 'Expense Consistency',
    income_stability: 'Income Stability',
    debt_ratio: 'Debt Ratio',
    emergency_fund: 'Emergency Fund',
    spending_efficiency: 'Spending Efficiency',
    credit_utilization: 'Credit Utilization',
  }

  const signalEntries = Object.entries(signals)
  const historyChartData = history.map((h) => ({
    period: h.period ?? h.month ?? h.date,
    score: h.score,
  }))

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Financial Health Score
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          A composite measure of your overall financial wellness
        </p>
      </div>

      {mainScore == null ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📈</p>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No score calculated yet</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Upload a bank statement to compute your financial health score.</p>
        </div>
      ) : (
        <>
          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Score gauge */}
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1.5rem' }}>
                Overall Score
              </p>
              <ScoreGauge score={mainScore} />
              <div style={{ marginTop: '1.25rem' }}>
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '3.5rem',
                  color: gradeColor(grade),
                  lineHeight: 1,
                }}>
                  {grade}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Grade</p>
              </div>
            </div>

            {/* Signals */}
            <div className="card">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                Signal Breakdown
              </h2>
              {signalEntries.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>No signal data available.</p>
              ) : (
                signalEntries.map(([key, val]) => (
                  <SignalBar
                    key={key}
                    label={SIGNAL_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    value={typeof val === 'number' ? Math.round(val) : val?.score ?? 0}
                  />
                ))
              )}
            </div>
          </div>

          {/* Bottom row: insights + history */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Insights */}
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', marginBottom: '1rem' }}>
                Insights
              </h2>
              {insights.length === 0 ? (
                <div className="card" style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  No insights available yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(Array.isArray(insights) ? insights : [insights]).map((ins, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderLeft: '3px solid var(--accent-teal)',
                        borderRadius: '10px',
                        padding: '1rem 1.25rem',
                      }}
                    >
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {typeof ins === 'string' ? ins : ins.message ?? ins.text ?? JSON.stringify(ins)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score history */}
            <div className="card">
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', marginBottom: '1.25rem' }}>
                Score History
              </h2>
              {historyChartData.length === 0 ? (
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  No history data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={historyChartData}>
                    <XAxis dataKey="period" stroke="var(--text-dim)" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="var(--text-dim)" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
                    <Tooltip content={<HistoryTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--accent-teal)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--accent-teal)', r: 3, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
