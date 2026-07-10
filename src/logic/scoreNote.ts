import { PerfumeNote, SurveyAnswers } from '../types/perfume';
import { SURVEY_QUESTIONS } from '../data/surveyQuestions';

export function scoreNote(
  note: PerfumeNote,
  analysisTags: string[],
  surveyAnswers: SurveyAnswers | undefined,
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

  // 2. Survey answers bonus match
  if (surveyAnswers) {
    const answers = [surveyAnswers.q1, surveyAnswers.q2, surveyAnswers.q3];
    for (let qIdx = 0; qIdx < 3; qIdx++) {
      const qNum = qIdx + 1;
      const answerVal = answers[qIdx];
      const question = SURVEY_QUESTIONS.find(q => q.id === qNum);
      if (question) {
        const option = question.options.find(opt => opt.id === answerVal);
        if (option) {
          // Direct bonus note name match
          if (option.bonusNotes.some(name => name.toLowerCase() === note.nameEn.toLowerCase())) {
            score += 15; // Give significant weight to matching chosen notes
          }
          // Matching tag overlap
          for (const bTag of option.bonusTags) {
            if (note.moodTags.includes(bTag)) {
              score += 6;
            }
            if (note.scentTags.includes(bTag)) {
              score += 3;
            }
          }
        }
      }
    }
  }

  // Add seed-based noise to handle tie-breaking
  score += rand() * 2;
  return score;
}
