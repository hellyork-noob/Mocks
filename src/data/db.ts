import type { SectionResult, Mock, ExamSectionConfig, CustomExamProfile, Exam, PlaylistVideo, Playlist } from "./types";
export type { SectionResult, Mock, ExamSectionConfig, CustomExamProfile, Exam, PlaylistVideo, Playlist } from "./types";
import Dexie, { type Table } from 'dexie';
import type { StudyTask, StudyGoal, FocusSession, FocusTimer } from './types';
class AnalyzerDB extends Dexie {
    mocks!: Table<Mock, number>;
    exams!: Table<Exam, number>;
    playlists!: Table<Playlist, number>;
    customExamProfiles!: Table<CustomExamProfile, number>;
    studyTasks!: Table<StudyTask, number>;
    studyGoals!: Table<StudyGoal, string>;
    focusSessions!: Table<FocusSession, number>;
    focusTimers!: Table<FocusTimer, string>;
    constructor() {
        super('advance_analyzer_v2_clean_phase5a');
        this.version(1).stores({ mocks: '++id,exam,date,subject', exams: '++id,date', playlists: '++id' });
        this.version(2).stores({ mocks: '++id,exam,date,subject', exams: '++id,date', playlists: '++id', customExamProfiles: '++id,&key' });
        this.version(3).stores({ studyTasks: '++id,date', studyGoals: 'date', focusSessions: '++id,&token,startedAt', focusTimers: 'id' });
    }
}
export const db = new AnalyzerDB();
export async function readBackupRecords() {
    return db.transaction('r', [db.mocks, db.exams, db.playlists, db.customExamProfiles, db.studyTasks, db.studyGoals, db.focusSessions], async () => {
        const [mocks, exams, playlists, customExamProfiles, studyTasks, studyGoals, focusSessions] = await Promise.all([
            db.mocks.toArray(), db.exams.toArray(), db.playlists.toArray(), db.customExamProfiles.toArray(),
            db.studyTasks.toArray(), db.studyGoals.toArray(), db.focusSessions.toArray(),
        ]);
        return { mocks, exams, playlists, customExamProfiles, studyTasks, studyGoals, focusSessions };
    });
}
export async function exportBackup() {
    const payload = { app: 'Advance Analyzer v2', schema: 3, exportedAt: new Date().toISOString(), ...await readBackupRecords() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'advance-analyzer-backup.json'; a.click(); URL.revokeObjectURL(url);
}
/** Restore a complete v2 backup atomically. No database deletion or schema migration. */
export async function importBackup(value: unknown): Promise<void> {
    if (!value || typeof value !== 'object')
        throw new Error('Invalid backup file');
    const data = value as Record<string, unknown>;
    if (data.app !== 'Advance Analyzer v2')
        throw new Error('This is not an Advance Analyzer v2 backup');
    for (const key of ['mocks', 'exams', 'playlists', 'customExamProfiles'])
        if (!Array.isArray(data[key]))
            throw new Error('Backup is missing ' + key);
    const mocks = data.mocks as Mock[], exams = data.exams as Exam[], playlists = data.playlists as Playlist[], profiles = data.customExamProfiles as CustomExamProfile[];
    if (mocks.some(m => !m || typeof m.exam !== 'string' || typeof m.title !== 'string' || typeof m.score !== 'number' || typeof m.maxScore !== 'number'))
        throw new Error('Invalid mock records');
    if (profiles.some(p => !p || typeof p.key !== 'string' || !Array.isArray(p.sections)))
        throw new Error('Invalid exam profiles');
    if (exams.some(e => !e || typeof e.name !== 'string' || typeof e.date !== 'string'))
        throw new Error('Invalid countdown records');
    if (playlists.some(p => !p || typeof p.title !== 'string' || typeof p.url !== 'string'))
        throw new Error('Invalid playlist records');
    const hasStudy = ['studyTasks', 'studyGoals', 'focusSessions'].some(key => key in data) || data.schema === 3;
    if (hasStudy) validateStudyBackup(data);
    await db.transaction('rw', [db.mocks, db.exams, db.playlists, db.customExamProfiles, db.studyTasks, db.studyGoals, db.focusSessions], async () => {
        await Promise.all([db.mocks.clear(), db.exams.clear(), db.playlists.clear(), db.customExamProfiles.clear()]);
        if (mocks.length)
            await db.mocks.bulkAdd(mocks);
        if (exams.length)
            await db.exams.bulkAdd(exams);
        if (playlists.length)
            await db.playlists.bulkAdd(playlists);
        if (profiles.length)
            await db.customExamProfiles.bulkAdd(profiles);
        if (hasStudy) {
            await Promise.all([db.studyTasks.clear(), db.studyGoals.clear(), db.focusSessions.clear()]);
            await db.studyTasks.bulkAdd(data.studyTasks as StudyTask[]);
            await db.studyGoals.bulkAdd(data.studyGoals as StudyGoal[]);
            await db.focusSessions.bulkAdd(data.focusSessions as FocusSession[]);
        }
    });
}

function validateStudyBackup(data: Record<string, unknown>) {
    for (const key of ['studyTasks', 'studyGoals', 'focusSessions']) {
        if (!Array.isArray(data[key])) throw new Error('Backup is missing ' + key);
    }
    const isDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
    if ((data.studyTasks as StudyTask[]).some(task => !task || !isDate(task.date) || typeof task.title !== 'string' ||
        !Number.isFinite(task.estimatedMinutes) || task.estimatedMinutes < 0 || typeof task.completed !== 'boolean' ||
        !['high', 'normal', 'low'].includes(task.priority) || !Number.isFinite(task.createdAt))) throw new Error('Invalid study tasks');
    if ((data.studyGoals as StudyGoal[]).some(goal => !goal || !isDate(goal.date) || !Number.isFinite(goal.targetMinutes) || goal.targetMinutes < 1 || goal.targetMinutes > 1440)) throw new Error('Invalid study goals');
    if ((data.focusSessions as FocusSession[]).some(session => !session || typeof session.token !== 'string' || typeof session.title !== 'string' ||
        !Number.isFinite(session.seconds) || session.seconds < 0 || !Number.isFinite(session.startedAt) || !Number.isFinite(session.endedAt) ||
        session.endedAt < session.startedAt || typeof session.completed !== 'boolean' || !Array.isArray(session.segments) ||
        session.segments.some(segment => !segment || !Number.isFinite(segment.start) || !Number.isFinite(segment.end) || segment.end < segment.start))) throw new Error('Invalid focus sessions');
}
