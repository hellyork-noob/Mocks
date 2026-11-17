import type { CustomExamProfile, Mock, SectionResult } from '../../data/types';

export const normalizedScore = (record: Pick<Mock, 'score' | 'maxScore'>): number | null => record.maxScore > 0 ? record.score / record.maxScore * 100 : null;
export function recentProgress(records: Mock[]) {
  const ordered = [...records].filter(record => record.subject === 'Full Mock' && record.maxScore > 0).sort((a, b) => b.date.localeCompare(a.date) || (b.id ?? 0) - (a.id ?? 0));
  const recent = ordered.slice(0, 5), preceding = ordered.slice(5, 10);
  const average = (items: Mock[]) => items.length ? items.reduce((sum, item) => sum + normalizedScore(item)!, 0) / items.length : null;
  const current = average(recent), previous = average(preceding);
  return { latest: ordered[0], current, previous, change: current !== null && previous !== null ? current - previous : null, recentCount: recent.length, previousCount: preceding.length };
}
export function practicePriorities(mocks: Mock[], exam: string, profile?: CustomExamProfile) {
  const groups = new Map<string, SectionResult[]>();
  const ordered = mocks.filter(mock => mock.exam === exam).sort((a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0));
  for (const mock of ordered) {
    const sections: SectionResult[] = mock.subject === 'Full Mock' ? mock.sections ?? [] : [{ ...mock, subject: mock.subject }];
    for (const section of sections) {
      const qualifying = (profile?.sections.find(rule => rule.name === section.subject)?.sectionType ?? section.sectionType) === 'qualifying';
      if (section.maxScore <= 0 || qualifying) continue;
      groups.set(section.subject, [...groups.get(section.subject) ?? [], section]);
    }
  }
  return [...groups].map(([subject, rows]) => {
    const recent = rows.slice(-5);
    const correct = recent.reduce((sum, row) => sum + row.correct, 0);
    const wrong = recent.reduce((sum, row) => sum + row.incorrect, 0);
    const skipped = recent.reduce((sum, row) => sum + row.unattempted, 0);
    const accuracy = correct + wrong > 0 ? correct / (correct + wrong) * 100 : null;
    const attempts = correct + wrong + skipped > 0 ? (correct + wrong) / (correct + wrong + skipped) * 100 : null;
    const score = recent.reduce((sum, row) => sum + normalizedScore(row)!, 0) / recent.length;
    const earlier = rows.slice(-10, -5);
    const previous = earlier.length ? earlier.reduce((sum, row) => sum + normalizedScore(row)!, 0) / earlier.length : null;
    const trend = previous === null ? null : score - previous;
    const action = accuracy === null ? 'Solve a short diagnostic set and record your correct and wrong answers.' : accuracy < 75 ?
      'Review 10 wrong answers, note the missed concepts, then solve 15 untimed questions.' : attempts !== null && attempts < 75 ?
      'Try a timed 15-question set. Practise selecting easy questions first, then review what you skipped.' : trend !== null && trend < -5 ?
      'Revisit your latest errors and repeat a short set on those topics before the next mock.' :
      'Solve a mixed 20-question set and review every incorrect or skipped question.';
    return { subject, count: recent.length, score, accuracy, attempts, trend, action, minutes: 25 };
  }).sort((a, b) => a.score - b.score);
}

export function targetGap(latest: Mock | undefined, profile?: CustomExamProfile): number | null {
  if (!latest || profile?.targetScore === undefined) return null;
  const maximum = profile.sections.filter(section => section.sectionType !== 'qualifying').reduce((sum, section) => sum + section.maxMarks, 0);
  return Math.abs(latest.maxScore - maximum) < .01 ? profile.targetScore - latest.score : null;
}
