import { PerfumeNote } from '../types/perfume';

export function scoreNote(
  note: PerfumeNote,
  analysisTags: string[],
  rand: () => number
): number {
  let score = 0;

  for (const tag of analysisTags) {
    if (note.moodTags.includes(tag)) {
      score += 10;
    }
    if (note.scentTags.includes(tag)) {
      score += 5;
    }
  }

  // Add seed-based noise to handle tie-breaking
  score += rand() * 2;
  return score;
}
