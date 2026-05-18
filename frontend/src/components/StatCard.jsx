export default function StatCard({ label, value, delta, color, icon, subtitle, subtitleColor, delay = 0 }) {
  const isPositive = delta !== undefined && delta >= 0
  const isNegative = delta !== undefined && delta < 0

  const iconBg = color === 'var(--accent-gold)' ? '245,158,11'
    : color === 'var(--danger)' ? '239,68,68'
    : color === 'var(--success)' ? '16,185,129'
    : '20,184,166'

  return (
    <div
      className="card card-enter"
      style={{ position: 'relative', overflow: 'hidden', '--delay': `${delay}ms` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color || 'var(--accent-teal)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: color || 'var(--accent-teal)', opacity: 0.8 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>
            {label}
          </p>
          <p className="font-mono stat-value" style={{ fontSize: '1.65rem', fontWeight: '700', color: color || 'var(--text-primary)', lineHeight: 1.1 }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: subtitleColor || 'var(--text-dim)', marginTop: '0.3rem', fontWeight: subtitleColor ? '700' : '400' }}>
              {subtitle}
            </p>
          )}
          {delta !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isPositive ? 'var(--success)' : isNegative ? 'var(--danger)' : 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                {isPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: '42px', height: '42px',
            background: `rgba(${iconBg}, 0.12)`,
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color || 'var(--accent-teal)', flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
