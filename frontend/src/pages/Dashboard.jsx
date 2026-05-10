import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import api from '../api/axios'
import StatCard from '../components/StatCard'

const PIE_COLORS = ['#14B8A6', '#F59E0B', '#60A5FA', '#A78BFA', '#FB923C', '#34D399', '#F87171', '#94A3B8']

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill, fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>
          {p.name}: ₹{Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch both independently — 404 on score is fine (no data yet)
    const fetchSummary = api.get('/insights/monthly-summary').then((r) => setSummary(r.data)).catch(() => {})
    const fetchScore = api.get('/score').then((r) => setScore(r.data)).catch(() => {})
    Promise.all([fetchSummary, fetchScore]).finally(() => setLoading(false))
  }, [])

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

  const totalIncome = summary?.total_income ?? 0
  const totalExpense = summary?.total_expense ?? 0
  const netSavings = totalIncome - totalExpense
  const healthScore = score?.score ?? null
  const grade = score?.grade ?? '—'

  const monthlyData = summary?.monthly_breakdown ?? []
  const categoryData = summary?.category_breakdown
    ? Object.entries(summary.category_breakdown).map(([name, value]) => ({ name, value }))
    : []

  const gradeColor = (g) => {
    if (!g || g === '—') return 'var(--text-secondary)'
    if (['A+', 'A', 'A-'].includes(g)) return 'var(--success)'
    if (['B+', 'B', 'B-'].includes(g)) return 'var(--accent-teal)'
    if (['C+', 'C', 'C-'].includes(g)) return 'var(--accent-gold)'
    return 'var(--danger)'
  }

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="0.5rem" />
        <Skeleton h="1rem" w="300px" mb="2rem" />
        <div className="grid grid-cols-4 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="card"><Skeleton h="5rem" /></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card"><Skeleton h="280px" /></div>
          <div className="card"><Skeleton h="280px" /></div>
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
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Your financial overview at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard
          label="Total Income"
          value={fmt(totalIncome)}
          color="var(--success)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
        />
        <StatCard
          label="Total Expense"
          value={fmt(totalExpense)}
          color="var(--danger)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          }
        />
        <StatCard
          label="Net Savings"
          value={fmt(netSavings)}
          color={netSavings >= 0 ? 'var(--accent-teal)' : 'var(--danger)'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Health Score"
          value={healthScore != null ? `${healthScore}` : '—'}
          subtitle={`Grade: ${grade}`}
          color="var(--accent-gold)"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Bar chart */}
        <div className="card">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            Monthly Income vs Expense
          </h2>
          {monthlyData.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              <p style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>📊</p>
              <p>No monthly data available yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload a bank statement to see your breakdown.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={4} barCategoryGap="25%">
                <XAxis dataKey="month" stroke="var(--text-dim)" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
                <YAxis stroke="var(--text-dim)" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="income" name="Income" radius={[4, 4, 0, 0]} fill="var(--accent-teal)" />
                <Bar dataKey="expense" name="Expense" radius={[4, 4, 0, 0]} fill="var(--accent-gold)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            Category Breakdown
          </h2>
          {categoryData.length === 0 ? (
            <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-dim)' }}>
              <p style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>🍕</p>
              <p>No category data available yet.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload a bank statement to see category distribution.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
