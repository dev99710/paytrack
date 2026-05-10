import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
      })
      const { token, user } = res.data
      login(token, user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 70% 30%, rgba(20,184,166,0.05) 0%, transparent 50%),
            radial-gradient(circle at 30% 80%, rgba(245,158,11,0.03) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2.5rem',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              background: 'var(--accent-teal)',
              borderRadius: '12px',
              marginBottom: '1rem',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                color: '#fff',
                fontSize: '1.5rem',
              }}
            >
              P
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '1.75rem',
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            PayTrack
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Create your finance intelligence account
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              htmlFor="reg-email"
              style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '500' }}
            >
              Email address
            </label>
            <input
              id="reg-email"
              className="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '500' }}
            >
              Password
            </label>
            <input
              id="reg-password"
              className="input"
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="reg-confirm"
              style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: '500' }}
            >
              Confirm password
            </label>
            <input
              id="reg-confirm"
              className="input"
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            id="reg-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--accent-teal)', textDecoration: 'none', fontWeight: '600' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
