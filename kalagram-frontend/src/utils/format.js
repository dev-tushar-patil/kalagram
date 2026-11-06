const DAY = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const FULL = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const MONEY = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// Batch dates are plain calendar dates: parse as local time so they can't shift by a day.
const parse = (date) => new Date(`${date}T00:00:00`);

export const formatDate = (date) => (date ? FULL.format(parse(date)) : '');
export const formatDateTime = (instant) => (instant ? DATE_TIME.format(new Date(instant)) : '');

export function formatRange(start, end) {
  if (!start) return '';
  if (!end || start === end) return formatDate(start);
  return `${DAY.format(parse(start))} – ${FULL.format(parse(end))}`;
}

export const formatPrice = (price) => (price === null || price === undefined || price === '' ? null : MONEY.format(price));

export const LEVEL_LABELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All Levels',
};

export const GALLERY_CATEGORIES = {
  MUD_HOUSES: 'Mud Houses',
  WORKSHOPS: 'Workshops',
  MATERIALS: 'Materials',
  SPACES_INTERIORS: 'Spaces & Interiors',
  CAMPUS_NATURE: 'Campus & Nature',
};

export function seatsLabel(batch) {
  if (batch.availableSeats <= 0) return 'Full';
  return `${batch.availableSeats} ${batch.availableSeats === 1 ? 'seat' : 'seats'} left`;
}
