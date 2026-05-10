import { useEffect, useState } from 'react'
import api from '../api/axios'

function Skeleton({ h = '1rem', w = '100%', mb = '0' }) {
  return <div className="skeleton" style={{ height: h, width: w, marginBottom: mb }} />
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

const EMPTY_FORM = { name: '', conditions: '', actions: '', priority: 1 }

export default function RuleEngine() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchRules = () => {
    api.get('/rules')
      .then((res) => setRules(res.data?.rules ?? res.data ?? []))
      .catch(() => setError('Failed to load rules.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRules() }, [])

  const handleToggle = async (rule) => {
    try {
      await api.patch(`/rules/${rule.id}`, { active: !rule.active })
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r))
      setToast({ msg: `Rule ${!rule.active ? 'activated' : 'deactivated'}`, type: 'success' })
    } catch {
      setToast({ msg: 'Failed to update rule', type: 'error' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/rules/${id}`)
      setRules((prev) => prev.filter((r) => r.id !== id))
      setToast({ msg: 'Rule deleted', type: 'success' })
    } catch {
      setToast({ msg: 'Failed to delete rule', type: 'error' })
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    let conditions, actions
    try {
      conditions = JSON.parse(form.conditions)
    } catch {
      setFormError('Conditions must be valid JSON.')
      return
    }
    try {
      actions = JSON.parse(form.actions)
    } catch {
      setFormError('Actions must be valid JSON.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post('/rules', {
        name: form.name,
        conditions,
        actions,
        priority: Number(form.priority),
      })
      setRules((prev) => [...prev, res.data?.rule ?? res.data])
      setForm(EMPTY_FORM)
      setShowForm(false)
      setToast({ msg: 'Rule created successfully', type: 'success' })
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create rule.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Skeleton h="2rem" w="200px" mb="2rem" />
        <div className="card"><Skeleton h="300px" /></div>
      </div>
    )
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="card" style={{ maxWidth: '360px', width: '90%' }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              Delete Rule
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this rule? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Rule Engine
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Define custom categorisation and alert rules
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? '✕ Cancel' : '+ New Rule'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent-teal)' }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', marginBottom: '1.25rem' }}>
            Create New Rule
          </h2>
          {formError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '500' }}>
                  Rule Name
                </label>
                <input
                  className="input"
                  placeholder='e.g. "Flag large food expenses"'
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '500' }}>
                  Priority
                </label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={100}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '500' }}>
                Conditions <span style={{ color: 'var(--text-dim)' }}>(JSON)</span>
              </label>
              <textarea
                className="input font-mono"
                placeholder='{"category": "Food", "amount_gt": 5000}'
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                rows={3}
                style={{ resize: 'vertical', fontSize: '0.82rem' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '500' }}>
                Actions <span style={{ color: 'var(--text-dim)' }}>(JSON)</span>
              </label>
              <textarea
                className="input font-mono"
                placeholder='{"set_category": "Dining", "flag": "high_spend"}'
                value={form.actions}
                onChange={(e) => setForm({ ...form, actions: e.target.value })}
                rows={3}
                style={{ resize: 'vertical', fontSize: '0.82rem' }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules table */}
      {rules.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚙️</p>
          <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No rules defined</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            Create your first rule to automate categorisation and alerts.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Conditions</th>
                  <th>Actions</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td style={{ fontWeight: '500' }}>{rule.name}</td>
                    <td>
                      <pre
                        className="font-mono"
                        style={{
                          fontSize: '0.75rem', color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated)', borderRadius: '5px',
                          padding: '0.3rem 0.5rem', maxWidth: '200px', overflow: 'auto',
                        }}
                      >
                        {typeof rule.conditions === 'string' ? rule.conditions : JSON.stringify(rule.conditions, null, 1)}
                      </pre>
                    </td>
                    <td>
                      <pre
                        className="font-mono"
                        style={{
                          fontSize: '0.75rem', color: 'var(--text-secondary)',
                          background: 'var(--bg-elevated)', borderRadius: '5px',
                          padding: '0.3rem 0.5rem', maxWidth: '200px', overflow: 'auto',
                        }}
                      >
                        {typeof rule.actions === 'string' ? rule.actions : JSON.stringify(rule.actions, null, 1)}
                      </pre>
                    </td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--accent-gold)' }}>{rule.priority}</span>
                    </td>
                    <td>
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(rule)}
                        style={{
                          width: '44px', height: '24px', borderRadius: '12px',
                          background: rule.active ? 'var(--accent-teal)' : 'var(--border)',
                          border: 'none', cursor: 'pointer', position: 'relative',
                          transition: 'background 200ms ease',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: rule.active ? '22px' : '3px',
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: '#fff', transition: 'left 200ms ease',
                        }} />
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setConfirmDelete(rule.id)}
                        className="btn-danger"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
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
