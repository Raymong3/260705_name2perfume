import { PerfumeNote } from '../types/perfume';

export function scoreNote(
  note: PerfumeNote,
  analysisTags: string[],
  rand: () => number
): number {
  let score = 0;

  // 1. Name analysis tags match
  for (const tag of analysisTags) {
    if (note.moodTags.includes(tag)) {
      score += 10;
    }
    if (note.scentTags.includes(tag)) {
      score += 5;
    }
  }

  // Add seed-based noise to handle tie-breaking (slightly increased for variety)
  score += rand() * 5;
  return score;
}

