import { useEffect, useState, useRef, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import StatCard from '../components/StatCard'

const PIE_COLORS = ['#14B8A6', '#F59E0B', '#60A5FA', '#A78BFA', '#FB923C', '#34D399', '#F87171', '#94A3B8', '#E879F9', '#FCD34D']

function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const n = Number(target) || 0
    if (n === 0) { setCount(0); return }
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * n))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return count
}

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.82rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600' }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill, fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', marginBottom: '2px' }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: `1px solid ${val >= 0 ? 'rgba(20,184,166,0.3)' : 'rgba(239,68,68,0.3)'}`,
      borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700', color: val >= 0 ? 'var(--accent-teal)' : 'var(--danger)' }}>
        {val >= 0 ? '+' : ''}₹{Number(val).toLocaleString('en-IN')}
      </p>
    </div>
  )
}

const AXIS_STYLE = { fontSize: 11, fontFamily: 'DM Sans, sans-serif', fill: 'var(--text-dim)' }

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const s = api.get('/insights/monthly-summary').then(r => setSummary(r.data)).catch(() => {})
    const sc = api.get('/score').then(r => setScore(r.data)).catch(() => {})
    Promise.all([s, sc]).finally(() => setLoading(false))
  }, [])

  const totalIncome = summary?.total_income ?? 0
  const totalExpense = summary?.total_expense ?? 0
  const netSavings = totalIncome - totalExpense
  const healthScore = score?.score ?? null
  const grade = score?.grade ?? '—'

  const animatedIncome = useCountUp(totalIncome)
  const animatedExpense = useCountUp(totalExpense)
  const animatedSavings = useCountUp(Math.abs(netSavings))
  const animatedScore = useCountUp(healthScore ?? 0)

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  const monthlyData = summary?.monthly_breakdown ?? []
  const categoryData = summary?.category_breakdown
    ? Object.entries(summary.category_breakdown)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : []

  const savingsData = monthlyData.map(m => ({
    month: m.month,
    savings: Math.round((m.income || 0) - (m.expense || 0)),
  }))

  const gradeColor = (g) => {
    if (!g || g === '—') return 'var(--text-secondary)'
    if (['A+', 'A', 'A-'].includes(g)) return 'var(--success)'
    if (['B+', 'B', 'B-'].includes(g)) return 'var(--accent-teal)'
    if (['C+', 'C', 'C-'].includes(g)) return 'var(--accent-gold)'
    return 'var(--danger)'
  }

  const topCategory = categoryData[0]?.name ?? null
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : null

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="0.5rem" />
        <Skeleton h="1rem" w="300px" mb="2rem" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="card"><Skeleton h="5rem" /></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card"><Skeleton h="280px" /></div>
          <div className="card"><Skeleton h="280px" /></div>
        </div>
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
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          label="Total Income"
          value={fmt(animatedIncome)}
          color="var(--success)"
          delay={0}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
        />
        <StatCard
          label="Total Expense"
          value={fmt(animatedExpense)}
          color="var(--danger)"
          delay={60}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>}
        />
        <StatCard
          label="Net Savings"
          value={(netSavings < 0 ? '-' : '') + fmt(animatedSavings)}
          subtitle={savingsRate !== null ? `${savingsRate}% savings rate` : undefined}
          color={netSavings >= 0 ? 'var(--accent-teal)' : 'var(--danger)'}
          delay={120}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <StatCard
          label="Health Score"
          value={healthScore !== null ? `${animatedScore}` : '—'}
          subtitle={`Grade: ${grade}`}
          subtitleColor={gradeColor(grade)}
          color="var(--accent-gold)"
          delay={180}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
        />
      </div>

      {/* Quick insight banner */}
      {topCategory && (
        <div style={{
          display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem', fontSize: '0.82rem',
        }}>
          {[
            { label: 'Top spend category', val: topCategory, color: 'var(--accent-teal)' },
            { label: 'Transactions analysed', val: score?.txn_count ?? '—', color: 'var(--text-primary)' },
            { label: 'Anomalies detected', val: score?.anomaly_count ?? '—', color: score?.anomaly_count > 0 ? 'var(--danger)' : 'var(--success)' },
            { label: 'Financial grade', val: grade, color: gradeColor(grade) },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>{label}:</span>
              <span style={{ color, fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Bar chart */}
        <div className="card card-enter" style={{ '--delay': '0ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.05rem' }}>Monthly Income vs Expense</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-teal)', display: 'inline-block' }} />Income
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent-gold)', display: 'inline-block' }} />Expense
              </span>
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <EmptyChart icon="📊" text="No monthly data" sub="Upload a bank statement to see your breakdown." onUpload={() => navigate('/upload')} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={48} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                <Bar dataKey="income" name="Income" radius={[5,5,0,0]} fill="var(--accent-teal)" fillOpacity={0.9} />
                <Bar dataKey="expense" name="Expense" radius={[5,5,0,0]} fill="var(--accent-gold)" fillOpacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut chart */}
        <div className="card card-enter" style={{ '--delay': '80ms' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.05rem', marginBottom: '1.25rem' }}>
            Category Breakdown
          </h2>
          {categoryData.length === 0 ? (
            <EmptyChart icon="🍩" text="No category data" sub="Upload a statement to see spending by category." onUpload={() => navigate('/upload')} />
          ) : (
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="45%" innerRadius={58} outerRadius={90}
                    paddingAngle={3} dataKey="value" animationBegin={100} animationDuration={800}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.82rem' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: '700' }}
                  />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '0.72rem', paddingTop: '8px' }}
                    formatter={v => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', top: '42%', left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Spent</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '1px' }}>
                  ₹{(totalExpense / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Savings trend */}
      {savingsData.length > 0 && (
        <div className="card card-enter" style={{ '--delay': '160ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.05rem' }}>Net Savings Trend</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>Monthly surplus / deficit over time</p>
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: '700', padding: '0.3rem 0.7rem',
              borderRadius: '20px', fontFamily: "'JetBrains Mono', monospace",
              background: netSavings >= 0 ? 'rgba(20,184,166,0.1)' : 'rgba(239,68,68,0.1)',
              color: netSavings >= 0 ? 'var(--accent-teal)' : 'var(--danger)',
              border: `1px solid ${netSavings >= 0 ? 'rgba(20,184,166,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {netSavings >= 0 ? '↑' : '↓'} ₹{Math.abs(netSavings).toLocaleString('en-IN')} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={savingsData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="deficitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={48} />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="var(--accent-teal)"
                strokeWidth={2}
                fill="url(#savingsGrad)"
                dot={{ fill: 'var(--accent-teal)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--accent-teal)', stroke: 'var(--bg-base)', strokeWidth: 2 }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty state CTA */}
      {!summary && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(20,184,166,0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.2rem', marginBottom: '0.5rem' }}>No data yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Upload a bank statement to see your financial overview.
          </p>
          <button className="btn-primary" onClick={() => navigate('/upload')}>Upload Statement</button>
        </div>
      )}
    </div>
  )
}

function EmptyChart({ icon, text, sub, onUpload }) {
  return (
    <div style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-dim)' }}>
      <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{icon}</p>
      <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>{text}</p>
      <p style={{ fontSize: '0.78rem', marginBottom: '1rem' }}>{sub}</p>
      <button className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }} onClick={onUpload}>Upload now</button>
    </div>
  )
}
