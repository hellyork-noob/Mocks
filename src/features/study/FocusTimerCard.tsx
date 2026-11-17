import { useState } from 'react';
import { Pause, Play, Square, Timer, Coffee } from 'lucide-react';
import type { StudyTask } from '../../data/types';
import { finishFocusTimer, startFocusTimer, toggleFocusPause, useFocusStore } from './focusStore';
import { formatClock, timerElapsed } from './studyMath';

export default function FocusTimerCard({ tasks, selectedTask, onSelectTask, onSaved }: {
  tasks: StudyTask[]; selectedTask: string; onSelectTask: (id: string) => void; onSaved: () => void;
}) {
  const { timer, now, ready, busy, error, notice } = useFocusStore();
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [minutes, setMinutes] = useState('25');
  const [title, setTitle] = useState('');
  const task = tasks.find(task => String(task.id) === selectedTask);
  const elapsed = timer ? timerElapsed(timer, now) : 0;
  const remaining = timer ? timer.durationSeconds - elapsed : Math.max(0, Number(minutes) || 0) * 60;
  const progress = timer ? Math.min(100, elapsed / timer.durationSeconds * 100) : 0;
  const save = async () => { if (await finishFocusTimer()) onSaved(); };

  return <article className="panel study-timer">
    <div className="panelhead"><h3><Timer size={18}/> Focus period</h3></div>
    {!timer && <div className="segmented" aria-label="Timer mode">
      <button type="button" className={mode === 'focus' ? 'selected' : ''} onClick={() => { setMode('focus'); setMinutes('25'); }}><Timer size={14}/> Focus</button>
      <button type="button" className={mode === 'break' ? 'selected' : ''} onClick={() => { setMode('break'); setMinutes('5'); }}><Coffee size={14}/> Break</button>
    </div>}
    <div className="study-clock" role="timer" aria-label={`${timer?.mode ?? mode} time remaining`}>
      {formatClock(remaining)}
    </div>
    <p className="study-timer-status">{timer ? `${timer.runningSince === null ? 'Paused' : timer.mode === 'focus' ? 'Focusing' : 'Taking a break'} · ${timer.title}` : 'Choose a task, settle in, and start.'}</p>
    {!timer && <div className="study-timer-start"><button className="primary" type="submit" form="focus-timer-form" disabled={!ready || busy}><Play size={16}/> {mode === 'focus' ? 'Start focus' : 'Start break'}</button></div>}
    {timer ? <>
      <div className="study-timer-controls">
        <button className="primary" type="button" disabled={busy} onClick={() => void toggleFocusPause()}>{timer.runningSince === null ? <Play size={16}/> : <Pause size={16}/>} {timer.runningSince === null ? 'Resume' : 'Pause'}</button>
        <button className="secondary" type="button" disabled={busy} onClick={() => void save()}><Square size={14}/> {timer.mode === 'focus' ? 'Finish & save' : 'End break'}</button>
      </div>
      <div className="study-progress" aria-hidden="true"><span style={{ width: `${progress}%` }}/></div>
      <button className="study-text-button" type="button" disabled={busy} onClick={() => { if (confirm('Discard this timer without adding study time?')) void finishFocusTimer(true); }}>Discard timer</button>
      <small className="muted">Only active focus time is saved. Paused time and breaks are excluded.</small>
    </> : <form id="focus-timer-form" className="study-timer-form" onSubmit={event => {
      event.preventDefault();
      void startFocusTimer({ mode, minutes: Number(minutes), title: mode === 'break' ? 'Break' : task?.title || title, ...(task?.id !== undefined ? { taskId: task.id } : {}) });
    }}>
      <div className="study-presets">{(mode === 'focus' ? [25, 50, 90] : [5, 10, 15]).map(preset => <button className={Number(minutes) === preset ? 'secondary selected' : 'secondary'} type="button" key={preset} onClick={() => setMinutes(String(preset))}>{preset} min</button>)}</div>
      <label>Duration (minutes)<input aria-label="Focus duration" type="number" required min="1" max="240" value={minutes} onChange={event => setMinutes(event.target.value)}/></label>
      {mode === 'focus' && <>
        <label>Link a task<select aria-label="Focus task" value={selectedTask} onChange={event => onSelectTask(event.target.value)}><option value="">Independent study</option>{tasks.filter(task => !task.completed || String(task.id) === selectedTask).map(task => <option value={task.id} key={task.id}>{task.title}</option>)}</select></label>
        {!task && <label>Session name<input aria-label="Focus session name" maxLength={120} placeholder="e.g. Quant revision" value={title} onChange={event => setTitle(event.target.value)}/></label>}
      </>}
      <small className="muted">Keeps running across pages and reloads. Focus time is added to your totals when saved.</small>
    </form>}
    {error && <p className="error" role="alert">{error}</p>}
    {notice && <p className="study-notice" role="status">{notice}</p>}
  </article>;
}
