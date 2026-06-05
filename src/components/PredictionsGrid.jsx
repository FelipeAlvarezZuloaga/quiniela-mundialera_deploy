import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { teamFlag } from '../lib/utils'

// Muestra una cuadricula: filas = jugadores, columnas = partidos.
// Cada celda: prediccion "h-a" y los puntos obtenidos (si ya hay resultado).
export default function PredictionsGrid({ matches }) {
  const [rows, setRows] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const matchIds = matches.map((m) => m.id)

  useEffect(() => {
    if (matchIds.length === 0) {
      setRows([])
      setProfiles([])
      setLoading(false)
      return
    }
    let cancel = false
    setLoading(true)
    Promise.all([
      supabase.from('prediction_results').select('*').in('match_id', matchIds),
      supabase.from('profiles').select('id, username, display_name'),
    ]).then(([pred, prof]) => {
      if (cancel) return
      setRows(pred.data || [])
      setProfiles(prof.data || [])
      setLoading(false)
    })
    return () => {
      cancel = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchIds.join(',')])

  if (loading) return <div className="muted">Cargando predicciones…</div>

  // Indexar predicciones por usuario+partido
  const byUserMatch = {}
  for (const r of rows) byUserMatch[`${r.user_id}:${r.match_id}`] = r

  // Solo mostrar jugadores que hayan participado en alguna jornada
  const playerIds = new Set(rows.map((r) => r.user_id))
  const players = profiles.filter((p) => playerIds.has(p.id))

  if (players.length === 0) {
    return <div className="muted">Nadie hizo predicciones en esta jornada.</div>
  }

  return (
    <div className="grid-scroll">
      <table className="pred-grid">
        <thead>
          <tr>
            <th className="sticky-col">Jugador</th>
            {matches.map((m) => (
              <th key={m.id}>
                <span className="flag-emoji">{teamFlag(m.home_team)}</span> {m.home_team}
                <br />
                <span className="vs-mini">vs</span>
                <br />
                <span className="flag-emoji">{teamFlag(m.away_team)}</span> {m.away_team}
                {m.home_score != null && (
                  <div className="real-score">
                    {m.home_score}-{m.away_score}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id}>
              <td className="sticky-col player-name">{p.display_name}</td>
              {matches.map((m) => {
                const r = byUserMatch[`${p.id}:${m.id}`]
                if (!r) return <td key={m.id} className="cell-empty">—</td>
                const pts = r.points
                const cls =
                  pts === 3 ? 'cell exact' : pts === 1 ? 'cell partial' : pts === 0 ? 'cell miss' : 'cell'
                return (
                  <td key={m.id} className={cls}>
                    <span className="cell-pred">
                      {r.pred_home}-{r.pred_away}
                    </span>
                    {pts != null && <span className="cell-pts">+{pts}</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
