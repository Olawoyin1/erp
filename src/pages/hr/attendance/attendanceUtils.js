const LAGOS = 'Africa/Lagos';

export const lagosToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: LAGOS }).format(new Date());

export function fmtTime(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: LAGOS });
}

export function fmtDay(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: LAGOS });
}

export function longDay(ymd) {
  return new Date(`${ymd}T12:00:00+01:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: LAGOS });
}

/** 9.33 hours becomes "9h 20m". */
export function fmtHours(hours) {
  if (hours == null) return '—';
  const total = Math.round(Number(hours) * 60);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}

/** A date and an HH:MM typed in Lagos time as the instant the server stores. */
export const lagosInstant = (date, time) => `${date}T${time}:00+01:00`;

/** Hours between two HH:MM times on the same Lagos day (an overnight shift rolls into the next day). */
export function hoursBetween(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes / 60;
}
