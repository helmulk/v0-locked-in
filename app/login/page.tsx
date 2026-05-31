'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const router = useRouter()

  async function handleSubmit() {
    if (!email || !password) return setMessage({ text: 'Fill in all fields', type: 'error' })
    if (mode === 'signup' && !username) return setMessage({ text: 'Choose a username', type: 'error' })
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username }),
        })
        const data = await res.json()
        if (!res.ok) setMessage({ text: data.error || 'Signup failed', type: 'error' })
        else setMessage({ text: 'Check your email to confirm your account!', type: 'success' })
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) setMessage({ text: data.error || 'Login failed', type: 'error' })
        else router.push('/')
      }
    } catch (e) {
      setMessage({ text: 'Something went wrong. Try again.', type: 'error' })
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '12px 14px', fontSize: '14px', color: '#fff',
    marginBottom: '10px', outline: 'none', colorScheme: 'dark',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#111', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '380px', background: '#181818',
        borderRadius: '16px', padding: '36px 32px',
        border: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: '#1a0000', border: '1.5px solid rgba(180,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: '7px', height: '9px', background: '#cc0000', borderRadius: '1px' }} />
            </div>
            <span style={{ color: '#fff', fontSize: '20px', fontWeight: '500', letterSpacing: '-0.5px' }}>Locked In</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px' }}>
            {mode === 'login' ? 'Welcome back. Time to lock in.' : 'Create an account and start grinding.'}
          </p>
        </div>

        <div style={{ display: 'flex', background: '#111', borderRadius: '8px', padding: '3px', marginBottom: '20px' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMessage(null) }} style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: '500',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#111' : 'rgba(255,255,255,0.35)',
            }}>
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {mode === 'signup' && (
          <input type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} style={inputStyle} />
        )}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={inputStyle} />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ ...inputStyle, marginBottom: '16px' }} />

        {message && (
          <div style={{
            padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px',
            background: message.type === 'error' ? 'rgba(180,0,0,0.12)' : 'rgba(0,180,80,0.1)',
            color: message.type === 'error' ? '#cc0000' : '#00c853',
            border: `0.5px solid ${message.type === 'error' ? 'rgba(180,0,0,0.25)' : 'rgba(0,180,80,0.2)'}`,
          }}>{message.text}</div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '13px', borderRadius: '8px', border: 'none',
          background: loading ? 'rgba(255,255,255,0.08)' : '#fff',
          color: loading ? 'rgba(255,255,255,0.3)' : '#111',
          fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer' }}
          onClick={() => router.push('/')}>
          ← Back to app
        </p>
      </div>
    </div>
  )
}
