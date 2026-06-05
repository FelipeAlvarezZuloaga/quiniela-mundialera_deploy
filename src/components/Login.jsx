import { useState } from 'react'
import { supabase, EMAIL_DOMAIN } from '../supabaseClient'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const email = username.trim().toLowerCase() + EMAIL_DOMAIN
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setError('Usuario o contraseña incorrectos.')
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-badge">★</div>
        <h1 className="login-title">QUINIELA MUNDIALERA</h1>
        <p className="login-sub">Entra con tu usuario y contraseña</p>

        <form onSubmit={handleLogin} className="login-form">
          <label className="field">
            <span>Usuario</span>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="tu_usuario"
              required
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="btn-primary" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="login-help">
          ¿Olvidaste tu contraseña? Pídele al organizador que la restablezca.
        </p>
      </div>
    </div>
  )
}
