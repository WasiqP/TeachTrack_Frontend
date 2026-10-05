import type { QuestionData } from './QuestionsScreen';

/** Short label for question cards (Edit task, Reorder, etc.) */
export function questionTypeSummary(q: QuestionData): string {
  const t = q.type;
  if (t === 'multipleChoice' && q.options?.length) return `${q.options.length} choices`;
  if (t === 'checkbox' && q.options?.length) return `${q.options.length} options`;
  if (t === 'dropdown' && q.options?.length) return `${q.options.length} dropdown`;
  if (t === 'rating') return `Rating · ${q.maxRating ?? 5} max`;
  if (t === 'number') {
    const bounded = q.min !== undefined || q.max !== undefined;
    return bounded ? 'Number · bounded' : 'Number';
  }
  if (t === 'date') return `Date · ${q.dateFormat || 'MM/DD/YYYY'}`;
  if (t === 'shortText') return q.maxLength ? `Short · ${q.maxLength} chars` : 'Short answer';
  if (t === 'longText') return q.maxLength ? `Long · ${q.maxLength} chars` : 'Long answer';
  if (t === 'email') return 'Email';
  if (t) return t.charAt(0).toUpperCase() + t.slice(1);
  return 'Question';
}
