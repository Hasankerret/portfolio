const months = [
  'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'
];

function startDate(entry) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.startDate ?? '')) return entry.startDate;

  // Older records store the start date at the beginning of the display text.
  const label = (entry.dates ?? '').trim();
  const iso = label.match(/^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?\b/);
  if (iso) return [iso[1], iso[2], iso[3] ?? '01'].join('-');
  const named = label.match(/^(?:([0-3]?\d)\s+)?([a-z]+)\.?\s+(?:(\d{1,2}),?\s+)?(\d{4})\b/i);
  if (named) {
    const month = months.indexOf(named[2].slice(0,3).toLowerCase()) + 1;
    if (month) return [named[4], String(month).padStart(2,'0'), (named[1] ?? named[3] ?? '1').padStart(2,'0')].join('-');
  }
  const year = label.match(/^(\d{4})\b/);
  return year ? year[1]+'-01-01' : '';
}

// The saved array retains insertion order, even when entries are edited.
export function orderedExperience(entries) {
  return entries.map((entry,index) => ({entry,index,date:startDate(entry)}))
    .sort((a,b) => b.date.localeCompare(a.date) || b.index-a.index)
    .map(({entry,index}) => ({entry,index}));
}

