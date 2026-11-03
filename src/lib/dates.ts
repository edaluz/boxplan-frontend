/** Fechas de calendario locales en formato YYYY-MM-DD. */
export function toYmd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = fromYmd(s)
  d.setDate(d.getDate() + n)
  return toYmd(d)
}

/** Lunes de la semana de `s`. */
export function startOfWeek(s: string): string {
  const day = fromYmd(s).getDay() // 0 = domingo
  return addDays(s, day === 0 ? -6 : 1 - day)
}

export const today = () => toYmd(new Date())

export function formatDay(s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' }) {
  return fromYmd(s).toLocaleDateString('es-AR', opts)
}
