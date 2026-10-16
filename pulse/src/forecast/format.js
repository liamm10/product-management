// Display helpers for Crowd Forecast. Copy follows the brand voice:
// encouraging, concise, no fitness jargon.

export const TIER_COPY = {
  low: { label: 'Low traffic', short: 'Low', line: 'Plenty of room. A great time to go.' },
  medium: { label: 'Medium traffic', short: 'Medium', line: 'Some equipment in use. Still a good time to go.' },
  high: { label: 'High traffic', short: 'High', line: 'It’s busy right now. Check the quieter times below.' },
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const h12 = (h) => ((h + 11) % 12) + 1;
const ampm = (h) => (h < 12 ? 'AM' : 'PM');

export function hourLabel(date) {
  const h = date.getHours();
  return `${h12(h)} ${ampm(h)}`;
}

export function rangeLabel(start, end) {
  const a = start.getHours();
  const b = end.getHours();
  return ampm(a) === ampm(b) ? `${h12(a)}–${h12(b)} ${ampm(b)}` : `${hourLabel(start)}–${hourLabel(end)}`;
}

export function timeLabel(date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h12(h)}:${m} ${ampm(h)}`;
}

export function dayTimeLabel(date) {
  return `${DAY_NAMES[date.getDay()]} ${timeLabel(date)}`;
}

/** '13:30' → '1:30 PM' */
export function clockLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return m ? `${h12(h)}:${String(m).padStart(2, '0')} ${ampm(h)}` : `${h12(h)} ${ampm(h)}`;
}
