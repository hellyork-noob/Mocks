import React, { useEffect, useState } from 'react';
import { countdownBand } from './countdownBands';
import { db, type Exam } from '../../data/db';
function daysUntil(date: string) { const now = new Date(); const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()); return Math.round((Date.parse(date + 'T00:00:00Z') - today) / 86400000); }
export function CountdownBoard({ exams, onChange }: {
    exams: Exam[];
    onChange: () => void;
}) {
    const [, refreshDay] = useState(0);
    useEffect(() => { const interval = window.setInterval(() => refreshDay(value => value + 1), 60000); return () => window.clearInterval(interval); }, []);
    const [showPast, setShowPast] = useState(false);
    const [editing, setEditing] = useState<Exam | null>(null), [name, setName] = useState(''), [date, setDate] = useState(''), [error, setError] = useState('');
    function edit(e?: Exam) { setEditing(e ?? null); setName(e?.name ?? ''); setDate(e?.date ?? ''); setError(''); }
    async function removeExam(exam: Exam) {
        if (exam.id == null || !confirm('Delete this countdown?'))
            return;
        try {
            await db.exams.delete(exam.id);
            if (editing?.id === exam.id)
                edit();
            onChange();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }
    function examTools(exam: Exam) {
        return <div className="v21-countdown-card-tools">
  <button className="v21-countdown-tool" type="button" title={'Edit ' + exam.name} aria-label={'Edit ' + exam.name} onClick={() => edit(exam)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg></button>
  <button className="v21-countdown-tool v21-countdown-tool-danger" type="button" title={'Delete ' + exam.name} aria-label={'Delete ' + exam.name} onClick={() => void removeExam(exam)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7"/></svg></button>
 </div>;
    }
    async function save(e: React.FormEvent) { e.preventDefault(); setError(''); try {
        if (!name.trim() || !date || !Number.isFinite(daysUntil(date)))
            throw new Error('Enter a valid exam name and date');
        if (editing?.id)
            await db.exams.update(editing.id, { name: name.trim(), date });
        else
            await db.exams.add({ name: name.trim(), date });
        edit();
        onChange();
    }
    catch (err) {
        setError(err instanceof Error ? err.message : String(err));
    } }
    const upcoming = [...exams].filter(e => daysUntil(e.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
    const nearest = upcoming[0];
    const remaining = [...exams].filter(e => (showPast || daysUntil(e.date) >= 0) && e.id !== nearest?.id).sort((a, b) => { const da = daysUntil(a.date), dbb = daysUntil(b.date); return (da < 0 ? 1 : 0) - (dbb < 0 ? 1 : 0) || Math.abs(da) - Math.abs(dbb); });
    const urgency = (d: number) => d < 0 ? 'past' : d <= 10 ? 'urgent' : d <= 30 ? 'near' : d <= 100 ? 'soon' : 'far';
    const label = (d: number) => d < 0 ? 'Past exam' : d === 0 ? 'Exam today' : d <= 10 ? 'Very close' : d <= 30 ? 'Approaching' : d <= 100 ? 'Upcoming' : 'Far away';
    return <section className="v21-countdown">
  <div className="v21-countdown-top">
   <article data-countdown-band={nearest ? countdownBand(daysUntil(nearest.date)) : 'far'} className={'panel v21-next-exam ' + (nearest ? 'v21-urgency-' + urgency(daysUntil(nearest.date)) : '')}>
    <div className="v21-next-exam-heading"><div className="v21-countdown-eyebrow">NEXT UPCOMING EXAM</div>{nearest && examTools(nearest)}</div>
    {nearest ? <><h2>{nearest.name}</h2><div className="v21-countdown-date">{nearest.date}</div><div className="v21-countdown-days"><strong>{daysUntil(nearest.date) === 0 ? 'Today' : daysUntil(nearest.date)}</strong><span>{daysUntil(nearest.date) === 0 ? 'Exam day' : 'days remaining'}</span></div>{daysUntil(nearest.date) <= 10 && <div className="v21-countdown-alert">Prepare for exam day</div>}</> : <><h2>No upcoming exam</h2><p>Add your next exam to start the countdown.</p></>}
   </article>
   <form className="panel v21-countdown-add" onSubmit={save}>
    <div className="v21-countdown-eyebrow">{editing ? 'EDIT COUNTDOWN' : 'ADD NEW EXAM'}</div>
    <label>Exam name<input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SSC CGL Tier 1"/></label>
    <label>Exam date<input required type="date" value={date} onChange={e => setDate(e.target.value)}/></label>
    <div className="v21-countdown-actions"><button className="primary" type="submit">{editing ? 'Save changes' : '+ Add exam'}</button>{editing && <button className="secondary" type="button" onClick={() => edit()}>Cancel</button>}</div>
    {error && <p className="error" role="alert">{error}</p>}
   </form>
  </div>
  <div className="v21-countdown-list-head"><strong>{upcoming.length} upcoming exam{upcoming.length === 1 ? '' : 's'}</strong><label><input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)}/> Show past exams</label></div>
  <div className="v21-countdown-grid">{remaining.map(e => {
            const d = daysUntil(e.date);
            const past = d < 0;
            const displayDate = new Date(e.date + 'T00:00:00');
            const formattedDate = Number.isNaN(displayDate.getTime()) ? e.date : displayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            return <article data-countdown-band={countdownBand(d)} className={'panel v21-countdown-card v21-urgency-' + urgency(d)} key={e.id}>
    <div className="v21-countdown-card-main">
     <div className="v21-countdown-card-info">
      <strong className="v21-countdown-card-name" title={e.name}>{e.name}</strong>
      <time dateTime={e.date}>{formattedDate}</time>
     </div>
     <div className={'v21-countdown-card-status' + (past ? ' is-past' : '')}>
      {past ? <span className="v21-countdown-past-pill">Passed</span> : <><strong>{d === 0 ? 'Today' : d}</strong><small>{d === 0 ? 'Exam day' : 'days left'}</small></>}
     </div>
    </div>
    <div className="v21-countdown-card-footer">
     <span className="v21-countdown-card-category">{label(d)}</span>
     {examTools(e)}
    </div>
   </article>;
        })}</div>
  {!remaining.length && <div className="v21-countdown-empty">{nearest ? 'No other exams to display.' : 'No countdowns to display.'}</div>}
 </section>;
}
