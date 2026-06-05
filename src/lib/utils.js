// Formatea una fecha UTC al horario local del usuario (para mostrar kickoff)
export function formatKickoff(datetimeUtc) {
  return new Date(datetimeUtc).toLocaleString('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Convierte el valor de un <input type="datetime-local"> (hora local del usuario)
// a una cadena ISO en UTC para guardar en la base de datos
export function localInputToISO(localString) {
  return new Date(localString).toISOString()
}

// Dado el arreglo de partidos de una jornada, devuelve la hora de cierre:
// 1 hora antes del primer partido (o null si no hay partidos)
export function roundLockTime(matches) {
  if (!matches || matches.length === 0) return null
  const earliest = matches.reduce((min, m) =>
    new Date(m.kickoff) < new Date(min.kickoff) ? m : min
  )
  const t = new Date(earliest.kickoff)
  t.setTime(t.getTime() - 60 * 60 * 1000)
  return t
}

// Devuelve un texto de cuenta regresiva hasta la fecha dada, ej. "2 h 30 min"
export function countdownText(lockDate) {
  const diff = lockDate.getTime() - Date.now()
  if (diff <= 0) return 'cerrada'
  const totalMin = Math.floor(diff / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

// Devuelve el emoji de bandera para un nombre de selección (español o inglés).
// Si no se reconoce el nombre devuelve cadena vacía.
const FLAG_MAP = {
  // CONMEBOL
  argentina: '🇦🇷',
  brasil: '🇧🇷', brazil: '🇧🇷',
  colombia: '🇨🇴',
  uruguay: '🇺🇾',
  ecuador: '🇪🇨',
  venezuela: '🇻🇪',
  perú: '🇵🇪', peru: '🇵🇪',
  chile: '🇨🇱',
  bolivia: '🇧🇴',
  paraguay: '🇵🇾',

  // CONCACAF
  'estados unidos': '🇺🇸', usa: '🇺🇸', 'united states': '🇺🇸', eeuu: '🇺🇸',
  méxico: '🇲🇽', mexico: '🇲🇽',
  canadá: '🇨🇦', canada: '🇨🇦',
  panamá: '🇵🇦', panama: '🇵🇦',
  'costa rica': '🇨🇷',
  honduras: '🇭🇳',
  'el salvador': '🇸🇻',
  jamaica: '🇯🇲',
  guatemala: '🇬🇹',
  haití: '🇭🇹', haiti: '🇭🇹',
  cuba: '🇨🇺',
  trinidad: '🇹🇹', 'trinidad y tobago': '🇹🇹', 'trinidad and tobago': '🇹🇹',
  curazao: '🇨🇼', curaçao: '🇨🇼', curacao: '🇨🇼',

  // UEFA
  francia: '🇫🇷', france: '🇫🇷',
  españa: '🇪🇸', espana: '🇪🇸', spain: '🇪🇸',
  alemania: '🇩🇪', germany: '🇩🇪',
  inglaterra: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'reino unido': '🇬🇧', 'gran bretaña': '🇬🇧',
  portugal: '🇵🇹',
  'países bajos': '🇳🇱', holanda: '🇳🇱', netherlands: '🇳🇱', holland: '🇳🇱',
  bélgica: '🇧🇪', belgica: '🇧🇪', belgium: '🇧🇪',
  italia: '🇮🇹', italy: '🇮🇹',
  croacia: '🇭🇷', croatia: '🇭🇷',
  serbia: '🇷🇸',
  bosnia: '🇧🇦', 'bosnia y herzegovina': '🇧🇦', 'bosnia and herzegovina': '🇧🇦',
  polonia: '🇵🇱', poland: '🇵🇱',
  rumanía: '🇷🇴', rumania: '🇷🇴', romania: '🇷🇴',
  suiza: '🇨🇭', switzerland: '🇨🇭',
  austria: '🇦🇹',
  turquía: '🇹🇷', turquia: '🇹🇷', turkey: '🇹🇷', türkiye: '🇹🇷',
  escocia: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', escosia: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  gales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  irlanda: '🇮🇪', ireland: '🇮🇪',
  'república checa': '🇨🇿', chequia: '🇨🇿', 'czech republic': '🇨🇿', czechia: '🇨🇿',
  eslovaquia: '🇸🇰', slovakia: '🇸🇰',
  hungría: '🇭🇺', hungria: '🇭🇺', hungary: '🇭🇺',
  grecia: '🇬🇷', greece: '🇬🇷',
  ucrania: '🇺🇦', ukraine: '🇺🇦',
  dinamarca: '🇩🇰', denmark: '🇩🇰',
  suecia: '🇸🇪', sweden: '🇸🇪',
  noruega: '🇳🇴', norway: '🇳🇴',
  albania: '🇦🇱',
  eslovenia: '🇸🇮', slovenia: '🇸🇮',
  georgia: '🇬🇪',
  islandia: '🇮🇸', iceland: '🇮🇸',
  israel: '🇮🇱',
  kazajistán: '🇰🇿', kazajstan: '🇰🇿', kazakhstan: '🇰🇿',

  // CAF
  marruecos: '🇲🇦', morocco: '🇲🇦',
  senegal: '🇸🇳',
  nigeria: '🇳🇬',
  egipto: '🇪🇬', egypt: '🇪🇬',
  'costa de marfil': '🇨🇮', 'ivory coast': '🇨🇮', 'côte d\'ivoire': '🇨🇮',
  camerún: '🇨🇲', camerun: '🇨🇲', cameroon: '🇨🇲',
  ghana: '🇬🇭',
  mali: '🇲🇱',
  'sudáfrica': '🇿🇦', sudafrica: '🇿🇦', 'south africa': '🇿🇦',
  túnez: '🇹🇳', tunez: '🇹🇳', tunisia: '🇹🇳',
  argelia: '🇩🇿', algeria: '🇩🇿',
  'república democrática del congo': '🇨🇩', 'dr congo': '🇨🇩', rdc: '🇨🇩',
  congo: '🇨🇬',
  guinea: '🇬🇳',
  'cabo verde': '🇨🇻', 'cape verde': '🇨🇻',
  tanzania: '🇹🇿',
  angola: '🇦🇴',
  zimbabue: '🇿🇼', zimbabwe: '🇿🇼',
  zambia: '🇿🇲',
  uganda: '🇺🇬',
  ruanda: '🇷🇼', rwanda: '🇷🇼',

  // AFC
  japón: '🇯🇵', japon: '🇯🇵', japan: '🇯🇵',
  'corea del sur': '🇰🇷', 'south korea': '🇰🇷',
  irán: '🇮🇷', iran: '🇮🇷',
  'arabia saudita': '🇸🇦', 'saudi arabia': '🇸🇦',
  australia: '🇦🇺',
  indonesia: '🇮🇩',
  uzbekistán: '🇺🇿', uzbekistan: '🇺🇿',
  jordania: '🇯🇴', jordan: '🇯🇴',
  qatar: '🇶🇦', catar: '🇶🇦',
  irak: '🇮🇶', iraq: '🇮🇶',
  china: '🇨🇳',
  omán: '🇴🇲', oman: '🇴🇲',
  baréin: '🇧🇭', barein: '🇧🇭', bahrain: '🇧🇭',
  palestina: '🇵🇸', palestine: '🇵🇸',
  siria: '🇸🇾', syria: '🇸🇾',
  tayikistán: '🇹🇯', tajikistan: '🇹🇯',
  kirguistán: '🇰🇬', kyrgyzstan: '🇰🇬',

  // OFC
  'nueva zelanda': '🇳🇿', 'new zealand': '🇳🇿',
  fiji: '🇫🇯',
}

export function teamFlag(name) {
  if (!name) return ''
  const key = name.trim().toLowerCase()
  return FLAG_MAP[key] ?? ''
}
