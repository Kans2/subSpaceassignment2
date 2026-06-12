import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  useAuthenticationStatus,
  useSignInEmailPassword,
  useSignUpEmailPassword,
} from '@nhost/react'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuthenticationStatus()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const {
    signInEmailPassword,
    isLoading: signingIn,
    error: signInError,
  } = useSignInEmailPassword()

  const {
    signUpEmailPassword,
    isLoading: signingUp,
    error: signUpError,
    needsEmailVerification,
  } = useSignUpEmailPassword()

  // Already logged in -> straight to the dashboard.
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const busy = signingIn || signingUp
  const error = mode === 'signin' ? signInError : signUpError

  async function handleSubmit(e) {
    e.preventDefault()
    if (mode === 'signin') {
      const res = await signInEmailPassword(email, password)
      if (res.isSuccess) navigate('/dashboard', { replace: true })
    } else {
      const res = await signUpEmailPassword(email, password)
      if (res.isSuccess) navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="center-screen">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{mode === 'signin' ? 'Log in' : 'Sign up'}</h1>
        <p className="muted">Live Speech-to-Text Dashboard</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={9}
            required
          />
        </label>

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Create account'}
        </button>

        {error && <p className="error">{error.message}</p>}
        {needsEmailVerification && (
          <p className="muted">
            Check your inbox to verify your email, then log in.
          </p>
        )}

        <p className="muted switch">
          {mode === 'signin' ? "No account yet?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  )
}
