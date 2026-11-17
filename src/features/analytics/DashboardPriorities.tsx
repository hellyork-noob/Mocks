import { useMemo, useState } from 'react';
import { CalendarDays, Target, TrendingUp, BookOpen } from 'lucide-react';
import { db } from '../../data/db';
import type { Mock, Exam, CustomExamProfile } from '../../data/types';
import { useUI } from '../../app/uiStore';
import { localDateKey } from '../study/studyMath';
import { practicePriorities, recentProgress, targetGap } from './practiceModel';
import { subjectColor } from './subjectColors';

export default function DashboardPriorities({ mocks, exams, exam, profile, onChange }: {
  mocks: Mock[]; exams: Exam[]; exam: string; profile?: CustomExamProfile; onChange: () => void;
}) {
  const setView = useUI(state => state.setView);
  const setSettingsSection = useUI(state => state.setSettingsSection);
  const today = localDateKey();
  const next = [...exams].filter(item => item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const days = next ? Math.round((Date.parse(next.date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000) : null;
  const progress = useMemo(() => recentProgress(mocks.filter(mock => mock.exam === exam)), [mocks, exam]);
  const priorities = useMemo(() => practicePriorities(mocks, exam, profile), [mocks, exam, profile]);
  const ready = priorities.filter(item => item.count >= 2).slice(0, 3);
  const gap = targetGap(progress.latest, profile);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const addPractice = async (item: typeof priorities[number]) => {
    setBusy(true);
    const title = `${item.subject}: ${item.action}`;
    try {
      if (await db.studyTasks.where('date').equals(today).filter(task => task.title === title).count()) setMessage('This practice task is already in today’s plan.');
      else {
        await db.studyTasks.add({ title, date: today, estimatedMinutes: item.minutes, priority: 'high', completed: false, createdAt: Date.now() });
        onChange(); setMessage(`Added ${item.subject} practice to today’s plan.`);
      }
    } catch (error) { setMessage(`Could not add task: ${String(error)}`); }
    finally { setBusy(false); }
  };
  return <section className="dashboard-priorities" aria-label="Dashboard priorities">
    <div className="priority-overview">
      <article className="panel"><CalendarDays size={18}/><small>Next saved exam</small><strong>{next?.name ?? 'No upcoming exam'}</strong><span>{next ? `${days === 0 ? 'Today' : `${days} days away`} · ${next.date}` : 'Add a date to keep your preparation on track.'}</span><button type="button" className="priority-link" onClick={() => setView('Exam Countdown')}>Exam countdown</button></article>
      <article className="panel"><Target size={18}/><small>Gap to your target</small><strong>{gap === null ? '—' : gap <= 0 ? 'Target reached' : `${gap.toFixed(1)} marks`}</strong><span>{gap !== null ? `Latest full mock: ${progress.latest!.score} / ${progress.latest!.maxScore}` : profile?.targetScore === undefined ? 'Set a target score in exam settings.' : progress.latest ? 'Latest mock uses a different score scale.' : 'Record a full mock to measure the gap.'}</span><button type="button" className="priority-link" onClick={() => { setSettingsSection('exams'); setView('Settings'); }}>Exam targets</button></article>
      <article className="panel"><TrendingUp size={18}/><small>Recent full-mock progress</small><strong>{progress.current === null ? '—' : `${progress.current.toFixed(1)}%`}</strong><span>{progress.change === null ? `Average of ${progress.recentCount} recent mocks · ${Math.max(0, 6 - progress.recentCount)} more for a trend` : `${progress.change >= 0 ? '+' : ''}${progress.change.toFixed(1)} percentage points vs prior ${progress.previousCount}`}</span></article>
      <article className="panel"><BookOpen size={18}/><small>Start with these subjects</small><strong>{ready.slice(0, 2).map(item => item.subject).join(', ') || 'Build your baseline'}</strong><span>{ready.length ? 'Lowest recent score rates among subjects with at least two entries.' : 'Add two subject-level results to get a practice priority.'}</span><button type="button" className="priority-link" onClick={() => setView('Study Planner')}>Open today’s plan</button></article>
    </div>
    <div className="priority-heading"><div><h3>What to practise next</h3><p>Based on the latest five recorded entries per scored subject.</p></div></div>
    {ready.length ? <div className="practice-grid">{ready.map(item => <article className="panel practice-card" key={item.subject}>
      <div className="between"><strong style={{ color: subjectColor(item.subject) }}>{item.subject}</strong><span className="pill">{item.minutes} min</span></div>
      <p>{item.action}</p><small>{item.score.toFixed(1)}% score · {item.accuracy === null ? 'No attempts' : `${item.accuracy.toFixed(0)}% accuracy`} · {item.attempts === null ? 'No question totals' : `${item.attempts.toFixed(0)}% attempted`} · {item.count} entries</small>
      <button type="button" className="secondary" disabled={busy} onClick={() => void addPractice(item)}>Add to today’s plan</button>
    </article>)}</div> : <div className="panel"><p>Save more subject results to unlock specific practice tasks. Your existing charts remain available below.</p></div>}
    {message && <p className="muted" role="status">{message}</p>}
  </section>;
}
