import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { roundLockTime } from '../lib/utils'
import PredictionsGrid from './PredictionsGrid'

export default function TableTab({ profile }) {
  const [board, setBoard] = useState([])
  const [rounds, setRounds] = useState([])
  const [viewRoundId, setViewRoundId] = useState(null)
  const [roundMatches, setRoundMatches] = useState([])
  const [roundLocked, setRoundLocked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancel = false
    Promise.all([
      supabase.from('leaderboard').select('*'),
      supabase.from('rounds').select('*').order('id'),
    ]).then(([lb, rd]) => {
      if (cancel) return
      const rows = (lb.data || []).sort(
        (a, b) => b.total_points - a.total_points || b.exact_hits - a.exact_hits
      )
      setBoard(rows)
      setRounds(rd.data || [])
      setLoading(false)
    })
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (!viewRoundId) {
      setRoundMatches([])
      return
    }
    let cancel = false
    supabase
      .from('matches')
      .select('*')
      .eq('round_id', viewRoundId)
      .order('kickoff')
      .then(({ data }) => {
        if (cancel) return
        const ms = data || []
        setRoundMatches(ms)
        const lt = roundLockTime(ms)
        setRoundLocked(lt ? Date.now() >= lt.getTime() : false)
      })
    return () => {
      cancel = true
    }
  }, [viewRoundId])

  if (loading) return <div className="muted">Cargando tabla…</div>

  return (
    <section>
      <h2 className="block-title">Tabla general</h2>
      {board.length === 0 ? (
        <div className="empty-state">Aún no hay jugadores registrados.</div>
      ) : (
        <div className="board-wrap">
          <table className="board">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Pts</th>
                <th title="Marcadores exactos">Exactos</th>
                <th title="Aciertos de resultado">Result.</th>
              </tr>
            </thead>
            <tbody>
              {board.map((row, i) => (
                <tr
                  key={row.user_id}
                  className={row.user_id === profile.id ? 'me-row' : ''}
                >
                  <td className={'rank rank-' + (i + 1)}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td className="board-name">{row.display_name}</td>
                  <td className="board-pts">{row.total_points}</td>
                  <td>{row.exact_hits}</td>
                  <td>{row.outcome_hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="block-title" style={{ marginTop: '2rem' }}>
        Predicciones por jornada
      </h2>
      <p className="muted section-note">
        Consulta lo que predijo cada quién. Solo se muestran las jornadas que ya
        cerraron.
      </p>
      <select
        className="round-select"
        value={viewRoundId || ''}
        onChange={(e) => setViewRoundId(Number(e.target.value))}
      >
        <option value="">Elige una jornada…</option>
        {rounds.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      {viewRoundId &&
        (roundMatches.length === 0 ? (
          <div className="empty-state">Esta jornada no tiene partidos.</div>
        ) : roundLocked ? (
          <div style={{ marginTop: '1rem' }}>
            <PredictionsGrid matches={roundMatches} />
          </div>
        ) : (
          <div className="empty-state">
            Esta jornada aún no cierra. Las predicciones se harán públicas al
            cerrar.
          </div>
        ))}
    </section>
  )
}
