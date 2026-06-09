import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import WeekTab from './components/WeekTab'
import TableTab from './components/TableTab'
import AdminTab from './components/AdminTab'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [tab, setTab] = useState('week')

  // Escuchar el estado de la sesion
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Cargar el perfil cuando hay sesion
  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    let cancel = false
    setProfileLoading(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancel) return
        if (error) {
          console.error('Error cargando perfil:', error)
        }
        setProfile(data ?? null)
        setProfileLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [session])

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setTab('week')
  }

  if (loading || profileLoading) {
    return <div className="center-screen">Cargando…</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">★</span>
          <span className="brand-name">QUINIELA MUNDIALERA</span>
        </div>
        <div className="userbox">
          <span className="who">
            {profile?.display_name || profile?.username || 'jugador'}
            {profile?.is_admin && <span className="admin-pill">admin</span>}
          </span>
          <button className="btn-ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={tab === 'week' ? 'tab active' : 'tab'}
          onClick={() => setTab('week')}
        >
          Quiniela de la semana
        </button>
        <button
          className={tab === 'table' ? 'tab active' : 'tab'}
          onClick={() => setTab('table')}
        >
          Tabla
        </button>
        {profile?.is_admin && (
          <button
            className={tab === 'admin' ? 'tab active' : 'tab'}
            onClick={() => setTab('admin')}
          >
            Admin
          </button>
        )}
      </nav>

      <main className="content">
        {tab === 'week' && profile && <WeekTab profile={profile} />}
        {tab === 'table' && profile && <TableTab profile={profile} />}
        {tab === 'admin' && profile?.is_admin && <AdminTab />}
      </main>

      <footer className="foot">
        Predicciones que cierran 1 hora antes del primer partido de cada jornada.
      </footer>
    </div>
  )
}
