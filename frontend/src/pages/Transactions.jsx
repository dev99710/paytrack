import { useEffect, useState } from 'react'
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
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: '80px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--accent-teal)' : 'var(--warning)',
          borderRadius: '3px', transition: 'width 300ms ease',
        }} />
      </div>
      <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{pct}%</span>
    </div>
  )
}

const CATEGORIES = [
  'Food & Dining', 'Shopping', 'Transport', 'Utilities', 'Entertainment',
  'Health', 'Education', 'Travel', 'Subscriptions', 'Salary', 'Other',
]

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get('/transactions')
      .then((res) => setTransactions(res.data?.transactions ?? res.data ?? []))
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setLoading(false))
  }, [])

  const handleEditCategory = async (id) => {
    try {
      await api.patch(`/transactions/${id}/category`, { category: editValue })
      setTransactions((prev) =>
        prev.map((t) => t.id === id ? { ...t, category: editValue } : t)
      )
      setToast({ msg: 'Category updated successfully', type: 'success' })
    } catch {
      setToast({ msg: 'Failed to update category', type: 'error' })
    } finally {
      setEditingId(null)
    }
  }

  const categories = ['All', ...new Set(transactions.map((t) => t.category).filter(Boolean))]
  const filtered = categoryFilter === 'All'
    ? transactions
    : transactions.filter((t) => t.category === categoryFilter)

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="220px" />
        <div style={{ marginTop: '2rem' }} className="card">
          {[1,2,3,4,5].map(i => <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            <Skeleton h="1rem" w="80px" />
            <Skeleton h="1rem" w="200px" />
            <Skeleton h="1rem" w="100px" />
          </div>)}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Transactions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            {categoryFilter !== 'All' ? ` in ${categoryFilter}` : ''}
          </p>
        </div>
        <select
          id="category-filter"
          className="select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>💳</p>
          <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.5rem' }}>No transactions found</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            {categoryFilter !== 'All' ? `No transactions in "${categoryFilter}" category.` : 'Upload a bank statement to get started.'}
          </p>
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
                  <tr key={txn.id}>
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {txn.date ? new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        {txn.description || txn.merchant || '—'}
                      </p>
                    </td>
                    <td>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: txn.type === 'credit' ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {txn.type === 'credit' ? '+' : '-'}₹{Math.abs(Number(txn.amount)).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${txn.type === 'credit' ? 'badge-green' : 'badge-red'}`}>
                        {txn.type || '—'}
                      </span>
                    </td>
                    <td>
                      {editingId === txn.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <select
                            className="select"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{ padding: '0.3rem 2rem 0.3rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button
                            onClick={() => handleEditCategory(txn.id)}
                            style={{
                              background: 'var(--accent-teal)', border: 'none', borderRadius: '5px',
                              color: '#fff', padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem',
                            }}
                          >✓</button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              background: 'transparent', border: '1px solid var(--border)', borderRadius: '5px',
                              color: 'var(--text-secondary)', padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem',
                            }}
                          >✗</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(txn.id); setEditValue(txn.category || CATEGORIES[0]) }}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer', padding: '0',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}
                          title="Click to edit category"
                        >
                          <span className="badge badge-teal">{txn.category || 'Uncategorized'}</span>
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
