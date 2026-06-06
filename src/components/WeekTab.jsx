import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { formatKickoff, roundLockTime, countdownText, teamFlag } from '../lib/utils'
import PredictionsGrid from './PredictionsGrid'

export default function WeekTab({ profile }) {
  const [rounds, setRounds] = useState([])
  const [roundId, setRoundId] = useState(null)
  const [matches, setMatches] = useState([])
  const [myPreds, setMyPreds] = useState({}) // matchId -> {home, away}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [now, setNow] = useState(Date.now())

  // Reloj para la cuenta regresiva y para detectar el cierre en vivo
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Cargar jornadas y elegir la "actual" por defecto
  useEffect(() => {
    let cancel = false
    supabase
      .from('rounds')
      .select('*')
      .order('id')
      .then(async ({ data }) => {
        if (cancel || !data) return
        setRounds(data)
        // elegir la jornada con el primer partido futuro mas cercano
        const def = await pickDefaultRound(data)
        setRoundId(def ?? (data.length ? data[data.length - 1].id : null))
      })
    return () => {
      cancel = true
    }
  }, [])

  // Cargar partidos y mis predicciones de la jornada seleccionada
  useEffect(() => {
    if (!roundId) {
      setMatches([])
      setLoading(false)
      return
    }
    let cancel = false
    setLoading(true)
    setMsg('')
    supabase
      .from('matches')
      .select('*')
      .eq('round_id', roundId)
      .order('kickoff')
      .then(async ({ data: ms }) => {
        if (cancel) return
        const matchList = ms || []
        setMatches(matchList)
        const ids = matchList.map((m) => m.id)
        let preds = {}
        if (ids.length) {
          const { data: pr } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', profile.id)
            .in('match_id', ids)
          for (const p of pr || []) {
            preds[p.match_id] = { home: String(p.home_score), away: String(p.away_score) }
          }
        }
        if (!cancel) {
          setMyPreds(preds)
          setLoading(false)
        }
      })
    return () => {
      cancel = true
    }
  }, [roundId, profile.id])

  const lockTime = useMemo(() => roundLockTime(matches), [matches])
  const locked = lockTime ? now >= lockTime.getTime() : false

  function setPred(matchId, side, value) {
    // permitir vacio o enteros 0-99
    if (value !== '' && !/^\d{1,2}$/.test(value)) return
    setMyPreds((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || { home: '', away: '' }), [side]: value },
    }))
  }

  async function saveAll() {
    setSaving(true)
    setMsg('')
    const rows = []
    for (const m of matches) {
      const p = myPreds[m.id]
      if (p && p.home !== '' && p.away !== '') {
        rows.push({
          user_id: profile.id,
          match_id: m.id,
          home_score: parseInt(p.home, 10),
          away_score: parseInt(p.away, 10),
          updated_at: new Date().toISOString(),
        })
      }
    }
    if (rows.length === 0) {
      setSaving(false)
      setMsg('Escribe al menos un marcador antes de guardar.')
      return
    }
    const { error } = await supabase
      .from('predictions')
      .upsert(rows, { onConflict: 'user_id,match_id' })
    setSaving(false)
    setMsg(error ? 'No se pudo guardar (¿ya cerró la jornada?).' : 'Guardado ✓')
  }

  const selectedRound = rounds.find((r) => r.id === roundId)

  return (
    <section>
      <div className="round-header">
        <select
          className="round-select"
          value={roundId || ''}
          onChange={(e) => setRoundId(Number(e.target.value))}
        >
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {selectedRound?.multiplier > 1 && (
          <div className="multiplier-badge">✕{selectedRound.multiplier}</div>
        )}

        {lockTime && (
          <div className={locked ? 'lock-badge closed' : 'lock-badge open'}>
            {locked ? (
              <>Predicciones cerradas</>
            ) : (
              <>Cierra en {countdownText(lockTime)}</>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="muted">Cargando partidos…</div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          {rounds.length === 0
            ? 'Aún no hay jornadas. El administrador debe crear una.'
            : 'Esta jornada todavía no tiene partidos.'}
        </div>
      ) : locked ? (
        <>
          <p className="muted section-note">
            La jornada cerró. Estas son las predicciones de todos los jugadores.
          </p>
          <PredictionsGrid matches={matches} />
        </>
      ) : (
        <>
          <p className="muted section-note">
            Escribe tu marcador para cada partido. Puedes editarlos hasta 1 hora
            antes del primer partido.{' '}
            <strong>{selectedRound?.multiplier > 1 ? selectedRound.multiplier : 1} punto{selectedRound?.multiplier > 1 ? 's' : ''}</strong> por resultado,{' '}
            <strong>{(selectedRound?.multiplier ?? 1) * 3} puntos</strong> por marcador exacto.
          </p>

          <div className="match-list">
            {matches.map((m) => {
              const p = myPreds[m.id] || { home: '', away: '' }
              return (
                <div className="match-card" key={m.id}>
                  <div className="match-time">{formatKickoff(m.kickoff)}</div>
                  <div className="match-row">
                    <span className="team team-home"><span className="flag-emoji">{teamFlag(m.home_team)}</span> {m.home_team}</span>
                    <div className="score-inputs">
                      <input
                        inputMode="numeric"
                        className="score-box"
                        value={p.home}
                        onChange={(e) => setPred(m.id, 'home', e.target.value)}
                      />
                      <span className="score-dash">–</span>
                      <input
                        inputMode="numeric"
                        className="score-box"
                        value={p.away}
                        onChange={(e) => setPred(m.id, 'away', e.target.value)}
                      />
                    </div>
                    <span className="team team-away"><span className="flag-emoji">{teamFlag(m.away_team)}</span> {m.away_team}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="save-bar">
            {msg && <span className="save-msg">{msg}</span>}
            <button className="btn-primary" onClick={saveAll} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar predicciones'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

// Elige la jornada cuyo primer partido futuro es el mas cercano.
async function pickDefaultRound(rounds) {
  if (!rounds.length) return null
  const { data: ms } = await supabase
    .from('matches')
    .select('round_id, kickoff')
    .order('kickoff')
  if (!ms || ms.length === 0) return rounds[0].id
  const nowMs = Date.now()
  const future = ms.find((m) => new Date(m.kickoff).getTime() > nowMs)
  if (future) return future.round_id
  return ms[ms.length - 1].round_id // si todo ya paso, la mas reciente
}
