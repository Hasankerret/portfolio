// The saved array keeps insertion order, with new entries appended.
export function orderedExperience(entries) {
  return entries.map((entry,index) => ({entry,index})).reverse();
}
