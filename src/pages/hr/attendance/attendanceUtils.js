// Attendance times are shown in the company time zone (Settings > Company & Security). It is Africa/Lagos until
// the attendance page has loaded the work schedule and called setAttendanceZone().
const DEFAULT_ZONE = 'Africa/Lagos';
let zone = DEFAULT_ZONE;

export const setAttendanceZone = (timeZone) => { zone = timeZone || DEFAULT_ZONE; };
export const attendanceZone = () => zone;

export const lagosToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(new Date());

export function fmtTime(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: zone });
}

export function fmtDay(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: zone });
}

/** Milliseconds the zone is ahead of UTC at an instant. */
function offsetMs(instant) {
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(instant).forEach((p) => { if (p.type !== 'literal') parts[p.type] = Number(p.value); });
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(instant.getTime() / 1000) * 1000;
}

/** A date (YYYY-MM-DD) and an HH:MM typed in the company time zone, as the instant the server stores. */
export function lagosInstant(date, time) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const first = offsetMs(new Date(wall));
  let instant = wall - first;
  const second = offsetMs(new Date(instant));
  if (second !== first) instant = wall - second;
  return new Date(instant).toISOString();
}

export function longDay(ymd) {
  return new Date(lagosInstant(ymd, '12:00')).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: zone });
}

/** 9.33 hours becomes "9h 20m". */
export function fmtHours(hours) {
  if (hours == null) return '—';
  const total = Math.round(Number(hours) * 60);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}

/** 75 minutes becomes "1h 15m"; under an hour "45m". */
export function fmtMinutes(minutes) {
  const total = Math.round(Number(minutes) || 0);
  if (total < 60) return `${total}m`;
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}

/** "08:00" becomes "8:00 AM". */
export function fmtClock(value) {
  if (!value) return '--:--';
  const [h, m] = value.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Hours between two HH:MM times on the same day (an overnight shift rolls into the next day). */
export function hoursBetween(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  return minutes / 60;
}
