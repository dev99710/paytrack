import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart,
} from 'recharts'
import api from '../api/axios'

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
}

function MethodBadge({ method }) {
  const isArima = (method || '').toUpperCase().includes('ARIMA')
  return (
    <span className={`badge ${isArima ? 'badge-teal' : 'badge-gray'}`}>
      {method || 'Linear'}
    </span>
  )
}

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || 'var(--accent-teal)', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

export default function Forecast() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    api.get('/forecast')
      .then((res) => {
        const payload = res.data
        setData(payload)
        const cats = Object.keys(payload?.forecasts ?? payload ?? {})
        if (cats.length > 0) setSelectedCategory(cats[0])
      })
      .catch(() => setError('Failed to load forecast data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="1.5rem" />
        <Skeleton h="3rem" w="100%" mb="1.5rem" />
        <div className="card"><Skeleton h="320px" /></div>
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

  const forecasts = data?.forecasts ?? data ?? {}
  const categories = Object.keys(forecasts)

  if (categories.length === 0) {
    return (
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '1rem' }}>Forecast</h1>
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔮</p>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No forecast data available</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            Upload at least 3 months of bank statements to generate spending forecasts.
          </p>
        </div>
      </div>
    )
  }

  const categoryData = selectedCategory ? (forecasts[selectedCategory] ?? {}) : {}
  const chartData = categoryData.data ?? categoryData.predictions ?? []
  const method = categoryData.method ?? 'Linear'

  // Build chart points with confidence interval
  const points = chartData.map((p) => ({
    label: p.period ?? p.month ?? p.label,
    value: p.value ?? p.predicted ?? 0,
    upper: p.upper_ci ?? p.upper ?? (p.value ?? 0) * 1.15,
    lower: p.lower_ci ?? p.lower ?? (p.value ?? 0) * 0.85,
    isActual: p.is_actual ?? false,
  }))

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Forecast
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Predicted spending by category with confidence intervals
        </p>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              border: `1px solid ${selectedCategory === cat ? 'var(--accent-teal)' : 'var(--border)'}`,
              background: selectedCategory === cat ? 'rgba(20,184,166,0.12)' : 'transparent',
              color: selectedCategory === cat ? 'var(--accent-teal)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: selectedCategory === cat ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Chart card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.15rem', marginBottom: '0.25rem' }}>
              {selectedCategory}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              {points.length} period{points.length !== 1 ? 's' : ''} forecasted
            </p>
          </div>
          <MethodBadge method={method} />
        </div>

        {points.length === 0 ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
            No forecast points for this category
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={points}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="var(--text-dim)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-dim)" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ForecastTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
              {/* Confidence interval area */}
              <Area
                dataKey="upper"
                stroke="transparent"
                fill="rgba(20,184,166,0.1)"
                legendType="none"
                name="Upper CI"
              />
              <Area
                dataKey="lower"
                stroke="transparent"
                fill="var(--bg-surface)"
                legendType="none"
                name="Lower CI"
              />
              {/* Main forecast line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent-teal)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--accent-teal)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--accent-teal)' }}
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '24px', height: '2px', background: 'var(--accent-teal)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Forecast</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '24px', height: '10px', background: 'rgba(20,184,166,0.15)', borderRadius: '2px' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Confidence interval</span>
          </div>
        </div>
      </div>
    </div>
  )
}
