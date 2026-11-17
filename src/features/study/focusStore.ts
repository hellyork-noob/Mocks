import { create } from 'zustand';
import { db } from '../../data/db';
import type { FocusTimer } from '../../data/types';
import { timerElapsed } from './studyMath';

type StartOptions = { mode: 'focus' | 'break'; minutes: number; title: string; taskId?: number };
type FocusState = {
  timer: FocusTimer | null;
  now: number;
  ready: boolean;
  busy: boolean;
  error: string;
  notice: string;
};
export const useFocusStore = create<FocusState>(() => ({
  timer: null, now: Date.now(), ready: false, busy: false, error: '', notice: '',
}));

export async function restoreFocusTimer() {
  try {
    const timer = await db.focusTimers.get('active');
    useFocusStore.setState({ timer: timer ?? null, now: Date.now(), ready: true, error: '' });
  } catch (error) {
    useFocusStore.setState({ ready: false, error: String(error) });
  }
}

async function mutate(operation: () => Promise<void>) {
  if (useFocusStore.getState().busy) return;
  useFocusStore.setState({ busy: true, error: '' });
  try { await operation(); }
  catch (error) { useFocusStore.setState({ error: error instanceof Error ? error.message : String(error) }); }
  finally { useFocusStore.setState({ busy: false }); }
}

export async function startFocusTimer({ mode, minutes, title, taskId }: StartOptions) {
  await mutate(async () => {
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) throw new Error('Choose a period between 1 and 240 minutes.');
    const now = Date.now();
    const timer: FocusTimer = {
      id: 'active', token: crypto.randomUUID(), mode, title: title.trim() || (mode === 'focus' ? 'Focus session' : 'Break'),
      ...(mode === 'focus' && taskId !== undefined ? { taskId } : {}),
      durationSeconds: Math.round(minutes * 60), startedAt: now, runningSince: now, segments: [],
    };
    await db.transaction('rw', db.focusTimers, async () => {
      if (await db.focusTimers.get('active')) throw new Error('A timer is already active. Resume or finish it first.');
      await db.focusTimers.add(timer);
    });
    useFocusStore.setState({ timer, now, notice: '' });
  });
}

export async function toggleFocusPause() {
  await mutate(async () => {
    const now = Date.now();
    const updated = await db.transaction('rw', db.focusTimers, async () => {
      const timer = await db.focusTimers.get('active');
      if (!timer) return null;
      if (timer.runningSince === null) timer.runningSince = now;
      else {
        // Cap the final interval at its deadline, even after a suspended tab.
        const remainingMs = Math.max(0, timer.durationSeconds * 1000 - timer.segments.reduce((sum, s) => sum + s.end - s.start, 0));
        timer.segments.push({ start: timer.runningSince, end: Math.max(timer.runningSince, Math.min(now, timer.runningSince + remainingMs)) });
        timer.runningSince = null;
      }
      await db.focusTimers.put(timer);
      return timer;
    });
    useFocusStore.setState({ timer: updated, now });
  });
}

// Saving the session and removing the active timer is atomic. Other tabs or
// repeated completion checks cannot create the same session twice.
export async function finishFocusTimer(discard = false): Promise<boolean> {
  let changed = false;
  await mutate(async () => {
    const now = Date.now();
    let notice = '';
    await db.transaction('rw', [db.focusTimers, db.focusSessions], async () => {
      const timer = await db.focusTimers.get('active');
      if (!timer) return;
      const seconds = timerElapsed(timer, now);
      const completed = seconds >= timer.durationSeconds;
      const closedMs = timer.segments.reduce((sum, segment) => sum + segment.end - segment.start, 0);
      const segments = [...timer.segments];
      if (timer.runningSince !== null) {
        const end = Math.max(timer.runningSince, Math.min(now, timer.runningSince + Math.max(0, timer.durationSeconds * 1000 - closedMs)));
        segments.push({ start: timer.runningSince, end });
      }
      if (!discard && timer.mode === 'focus' && seconds > 0) {
        await db.focusSessions.add({
          token: timer.token, title: timer.title, ...(timer.taskId !== undefined ? { taskId: timer.taskId } : {}),
          startedAt: timer.startedAt, endedAt: segments.at(-1)?.end ?? now, seconds, segments, completed,
        });
        changed = true;
      }
      await db.focusTimers.delete('active');
      notice = discard ? 'Timer discarded. No time was added.' : timer.mode === 'break' ? 'Break finished. Ready for another focus period?' : seconds > 0 ? 'Focus time saved to your study log.' : 'Timer ended. No study time to save yet.';
    });
    useFocusStore.setState({ timer: null, now, notice });
  });
  return changed;
}

export function tickFocusTimer() {
  // Only subscribers to the timer store update each second, not the app shell.
  const { timer } = useFocusStore.getState();
  if (timer && timer.runningSince !== null) useFocusStore.setState({ now: Date.now() });
}
