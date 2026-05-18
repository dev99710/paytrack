import { useEffect, useState, useMemo, useRef } from 'react'
import api from '../api/axios'

function Skeleton({ h = '1rem', w = '100%' }) {
  return <div className="skeleton" style={{ height: h, width: w }} />
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✓' : '✗'}</span>
      {msg}
    </div>
  )
}

function ConfidenceBar({ value }) {
  const pct = Math.round((value ?? 0) * 100)
  const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--accent-teal)' : 'var(--warning)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '64px', height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 400ms ease' }} />
      </div>
      <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{pct}%</span>
    </div>
  )
}

const CATEGORIES = [
  'All', 'Food & Dining', 'Shopping', 'Transport', 'Utilities', 'Entertainment',
  'Health', 'Education', 'Travel', 'Subscriptions', 'Salary', 'Finance', 'Groceries', 'Other',
]

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Highest amount' },
  { value: 'amount-asc', label: 'Lowest amount' },
]

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sort, setSort] = useState('date-desc')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [toast, setToast] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/transactions')
      .then(res => setTransactions(res.data?.transactions ?? res.data ?? []))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false))
  }, [])

  // Ctrl/Cmd+F to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleEditCategory = async (id) => {
    try {
      await api.patch(`/transactions/${id}/category`, { category: editValue })
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, category: editValue } : t))
      setToast({ msg: 'Category updated', type: 'success' })
    } catch {
      setToast({ msg: 'Failed to update category', type: 'error' })
    } finally {
      setEditingId(null)
    }
  }

  const dynamicCategories = useMemo(() =>
    ['All', ...new Set(transactions.map(t => t.category).filter(Boolean))],
    [transactions]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions
      .filter(t => {
        const text = (t.description || t.merchant || '').toLowerCase()
        return (
          (!q || text.includes(q)) &&
          (typeFilter === 'All' || t.type === typeFilter) &&
          (categoryFilter === 'All' || t.category === categoryFilter)
        )
      })
      .sort((a, b) => {
        if (sort === 'date-desc') return new Date(b.date) - new Date(a.date)
        if (sort === 'date-asc') return new Date(a.date) - new Date(b.date)
        if (sort === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount)
        if (sort === 'amount-asc') return Math.abs(a.amount) - Math.abs(b.amount)
        return 0
      })
  }, [transactions, search, typeFilter, categoryFilter, sort])

  const hasFilters = search || typeFilter !== 'All' || categoryFilter !== 'All'

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('All')
    setCategoryFilter('All')
    setSort('date-desc')
  }

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="220px" />
        <div style={{ marginTop: '2rem' }} className="card">
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
              <Skeleton h="1rem" w="80px" />
              <Skeleton h="1rem" w="200px" />
              <Skeleton h="1rem" w="100px" />
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
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Transactions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {transactions.length} total &bull; {' '}
          <span style={{ color: hasFilters ? 'var(--accent-teal)' : 'var(--text-dim)' }}>
            {filtered.length} shown
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              ✕ Clear filters
            </button>
          )}
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            className="input"
            placeholder="Search transactions… (Ctrl+F)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', paddingRight: search ? '2.25rem' : '1rem' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer',
              fontSize: '0.9rem', lineHeight: 1, padding: 0,
            }}>✕</button>
          )}
        </div>

        {/* Type pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['All', 'credit', 'debit'].map(t => (
            <button
              key={t}
              className={`filter-pill${typeFilter === t ? ' active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'credit' ? '↑ Credit' : t === 'debit' ? '↓ Debit' : 'All'}
            </button>
          ))}
        </div>

        {/* Category */}
        <select className="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ minWidth: '140px' }}>
          {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Sort */}
        <select className="select" value={sort} onChange={e => setSort(e.target.value)} style={{ minWidth: '145px' }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</p>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.5rem' }}>No results found</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {hasFilters ? 'Try adjusting your filters.' : 'Upload a bank statement to get started.'}
          </p>
          {hasFilters && (
            <button className="btn-ghost" onClick={clearFilters} style={{ fontSize: '0.85rem' }}>Clear all filters</button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn) => (
                  <tr key={txn.id} className="txn-row">
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {txn.date ? new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '260px' }}>
                      <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        {highlight(txn.description || txn.merchant || '—', search)}
                      </p>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: '700', color: txn.type === 'credit' ? 'var(--success)' : 'var(--danger)' }}>
                        {txn.type === 'credit' ? '+' : '-'}₹{Math.abs(Number(txn.amount)).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${txn.type === 'credit' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.7rem' }}>
                        {txn.type === 'credit' ? '↑ credit' : '↓ debit'}
                      </span>
                    </td>
                    <td>
                      {editingId === txn.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <select className="select" value={editValue} onChange={e => setEditValue(e.target.value)}
                            style={{ padding: '0.3rem 2rem 0.3rem 0.5rem', fontSize: '0.8rem' }}>
                            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button onClick={() => handleEditCategory(txn.id)}
                            style={{ background: 'var(--accent-teal)', border: 'none', borderRadius: '5px', color: '#fff', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.75rem' }}>✓</button>
                          <button onClick={() => setEditingId(null)}
                            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px', color: 'var(--text-secondary)', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.75rem' }}>✗</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingId(txn.id); setEditValue(txn.category || CATEGORIES[1]) }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Edit category">
                          <span className="badge badge-teal" style={{ fontSize: '0.72rem' }}>{txn.category || 'Uncategorized'}</span>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td>
                      <ConfidenceBar value={txn.confidence} />
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

function highlight(text, query) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(20,184,166,0.25)', color: 'var(--accent-teal)', borderRadius: '3px', padding: '0 2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
