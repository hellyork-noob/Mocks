import { Timer, X } from 'lucide-react';
import { useUI } from '../../app/uiStore';
import { useFocusStore } from './focusStore';
import { formatClock, timerElapsed } from './studyMath';

export default function FocusTimerIndicator() {
  const { timer, now, notice } = useFocusStore();
  const view = useUI(state => state.view);
  const setView = useUI(state => state.setView);
  if (view === 'Study Planner') return null;
  if (!timer) return notice ? <div className="study-floating-timer" role="status">
    <button type="button" className="study-timer-open" onClick={() => setView('Study Planner')}><Timer size={18}/><span>{notice}</span></button>
    <button className="iconbtn" type="button" aria-label="Dismiss timer notice" onClick={() => useFocusStore.setState({ notice: '' })}><X size={14}/></button>
  </div> : null;
  return <button type="button" className="study-floating-timer" onClick={() => setView('Study Planner')} aria-label="Open active study timer">
    <Timer size={18}/><span>{timer.mode === 'focus' ? 'Focus' : 'Break'}{timer.runningSince === null ? ' · paused' : ''}</span>
    <strong>{formatClock(timer.durationSeconds - timerElapsed(timer, now))}</strong>
  </button>;
}
