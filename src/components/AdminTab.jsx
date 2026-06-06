import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { localInputToISO, formatKickoff, teamFlag } from '../lib/utils'

export default function AdminTab() {
  const [rounds, setRounds] = useState([])
  const [matches, setMatches] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [msg, setMsg] = useState('')

  // formularios
  const [newRoundName, setNewRoundName] = useState('')
  const [newRoundMultiplier, setNewRoundMultiplier] = useState(1)
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [kickoffDate, setKickoffDate] = useState('')
  const [kickoffHour, setKickoffHour] = useState('12')
  const [kickoffMin, setKickoffMin] = useState('00')
  const [kickoffAmpm, setKickoffAmpm] = useState('PM')

  async function loadRounds() {
    const { data } = await supabase.from('rounds').select('*').order('id')
    setRounds(data || [])
    if (data && data.length && !activeRound) setActiveRound(data[0].id)
  }

  async function loadMatches(roundId) {
    if (!roundId) return setMatches([])
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('round_id', roundId)
      .order('kickoff')
    setMatches(data || [])
  }

  useEffect(() => {
    loadRounds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadMatches(activeRound)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRound])

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 3000)
  }

  async function createRound() {
    if (!newRoundName.trim()) return
    const { error } = await supabase.from('rounds').insert({
      name: newRoundName.trim(),
      multiplier: newRoundMultiplier,
    })
    if (error) return flash('Error al crear jornada.')
    setNewRoundName('')
    setNewRoundMultiplier(1)
    flash('Jornada creada ✓')
    loadRounds()
  }

  async function updateMultiplier(value) {
    if (!activeRound) return
    const { error } = await supabase
      .from('rounds')
      .update({ multiplier: value })
      .eq('id', activeRound)
    if (error) return flash('Error al actualizar multiplicador.')
    flash(`Multiplicador actualizado a x${value} ✓`)
    loadRounds()
  }

  function buildKickoffISO() {
    if (!kickoffDate) return null
    const h = parseInt(kickoffHour, 10)
    const m = parseInt(kickoffMin, 10)
    let hour24 = h % 12
    if (kickoffAmpm === 'PM') hour24 += 12
    const pad = (n) => String(n).padStart(2, '0')
    return localInputToISO(`${kickoffDate}T${pad(hour24)}:${pad(m)}`)
  }

  async function addMatch() {
    if (!activeRound) return flash('Crea o elige una jornada primero.')
    const iso = buildKickoffISO()
    if (!home.trim() || !away.trim() || !iso) return flash('Completa equipos y fecha.')
    const { error } = await supabase.from('matches').insert({
      round_id: activeRound,
      home_team: home.trim(),
      away_team: away.trim(),
      kickoff: iso,
    })
    if (error) return flash('Error al agregar partido.')
    setHome('')
    setAway('')
    setKickoffDate('')
    setKickoffHour('12')
    setKickoffMin('00')
    setKickoffAmpm('PM')
    flash('Partido agregado ✓')
    loadMatches(activeRound)
  }

  async function saveResult(m, h, a) {
    const hs = h === '' ? null : parseInt(h, 10)
    const as = a === '' ? null : parseInt(a, 10)
    const { error } = await supabase
      .from('matches')
      .update({ home_score: hs, away_score: as })
      .eq('id', m.id)
    if (error) return flash('Error al guardar resultado.')
    flash('Resultado guardado ✓')
    loadMatches(activeRound)
  }

  async function deleteMatch(id) {
    if (!confirm('¿Borrar este partido? Se borran también sus predicciones.')) return
    const { error } = await supabase.from('matches').delete().eq('id', id)
    if (error) return flash('Error al borrar.')
    loadMatches(activeRound)
  }

  return (
    <section className="admin">
      {msg && <div className="flash">{msg}</div>}

      <div className="admin-card">
        <h3>1 · Crear jornada</h3>
        <div className="inline-form">
          <input
            placeholder="Ej. Jornada 1 - Fase de grupos"
            value={newRoundName}
            onChange={(e) => setNewRoundName(e.target.value)}
          />
          <select
            className="multiplier-select"
            value={newRoundMultiplier}
            onChange={(e) => setNewRoundMultiplier(Number(e.target.value))}
            title="Multiplicador de puntos"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n === 1 ? 'x1 (normal)' : `x${n}`}</option>
            ))}
          </select>
          <button className="btn-primary" onClick={createRound}>
            Crear
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h3>2 · Trabajar en la jornada</h3>
        <select
          className="round-select"
          value={activeRound || ''}
          onChange={(e) => setActiveRound(Number(e.target.value))}
        >
          {rounds.length === 0 && <option value="">No hay jornadas</option>}
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}{r.multiplier > 1 ? ` — x${r.multiplier}` : ''}
            </option>
          ))}
        </select>

        {activeRound && (() => {
          const r = rounds.find((r) => r.id === activeRound)
          return r ? (
            <div className="multiplier-row">
              <span className="muted tiny">Multiplicador de puntos:</span>
              <select
                className="multiplier-select"
                value={r.multiplier ?? 1}
                onChange={(e) => updateMultiplier(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n === 1 ? 'x1 (normal)' : `x${n}`}</option>
                ))}
              </select>
            </div>
          ) : null
        })()}

        <h4 className="sub">Agregar partido</h4>
        <div className="match-form">
          <input
            placeholder="Equipo local"
            value={home}
            onChange={(e) => setHome(e.target.value)}
          />
          <input
            placeholder="Equipo visitante"
            value={away}
            onChange={(e) => setAway(e.target.value)}
          />
          <input
            type="date"
            value={kickoffDate}
            onChange={(e) => setKickoffDate(e.target.value)}
          />
          <div className="time-picker">
            <input
              type="number"
              className="hour-input"
              min="1"
              max="12"
              value={kickoffHour}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '')
                if (v === '' || (parseInt(v) >= 1 && parseInt(v) <= 12)) setKickoffHour(v)
              }}
            />
            <span className="time-colon">:</span>
            <select
              className="min-select"
              value={kickoffMin}
              onChange={(e) => setKickoffMin(e.target.value)}
            >
              {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              className="ampm-select"
              value={kickoffAmpm}
              onChange={(e) => setKickoffAmpm(e.target.value)}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            {kickoffHour === '12' && (
              <span className="noon-hint">
                {kickoffAmpm === 'PM' ? 'Mediodía' : 'Medianoche'}
              </span>
            )}
          </div>
          <button className="btn-primary" onClick={addMatch}>
            Agregar
          </button>
        </div>
        <p className="muted tiny">
          La hora se interpreta en tu zona horaria local y se muestra a cada
          jugador en la suya.
        </p>
      </div>

      <div className="admin-card">
        <h3>3 · Capturar resultados</h3>
        {matches.length === 0 ? (
          <p className="muted">Esta jornada no tiene partidos.</p>
        ) : (
          <div className="results-list">
            {matches.map((m) => (
              <ResultRow key={m.id} match={m} onSave={saveResult} onDelete={deleteMatch} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ResultRow({ match, onSave, onDelete }) {
  const [h, setH] = useState(match.home_score ?? '')
  const [a, setA] = useState(match.away_score ?? '')

  return (
    <div className="result-row">
      <div className="result-info">
        <div className="result-teams">
          <span className="flag-emoji">{teamFlag(match.home_team)}</span> {match.home_team} <span className="vs-mini">vs</span> <span className="flag-emoji">{teamFlag(match.away_team)}</span> {match.away_team}
        </div>
        <div className="result-time">{formatKickoff(match.kickoff)}</div>
      </div>
      <div className="result-controls">
        <input
          inputMode="numeric"
          className="score-box small"
          value={h}
          onChange={(e) => /^\d{0,2}$/.test(e.target.value) && setH(e.target.value)}
        />
        <span className="score-dash">–</span>
        <input
          inputMode="numeric"
          className="score-box small"
          value={a}
          onChange={(e) => /^\d{0,2}$/.test(e.target.value) && setA(e.target.value)}
        />
        <button className="btn-small" onClick={() => onSave(match, h, a)}>
          Guardar
        </button>
        <button className="btn-del" onClick={() => onDelete(match.id)} title="Borrar partido">
          ✕
        </button>
      </div>
    </div>
  )
}
