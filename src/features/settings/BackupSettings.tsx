import { useState, type ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../../data/db';
import AutoBackupPanel from './AutoBackupPanel';
import StorageDiagnostics from './StorageDiagnostics';

export default function BackupSettings({ onRestored }: { onRestored: () => void }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setMessage('');
    try {
      const parsed = JSON.parse(await file.text());
      const names = ['mocks', 'exams', 'playlists', 'customExamProfiles', 'studyTasks', 'studyGoals', 'focusSessions'];
      const counts = names.map(name => `${name}: ${Array.isArray(parsed?.[name]) ? parsed[name].length : ['studyTasks', 'studyGoals', 'focusSessions'].includes(name) ? 'current data kept for legacy backups' : 'missing'}`).join('\n');
      if (!confirm(`Restore this backup? Included records will replace current records. Export a fresh backup first.\n\n${counts}`)) return;
      await importBackup(parsed);
      onRestored(); setMessage('Backup restored. Your saved records have been refreshed.');
    } catch (error) { setMessage(`Restore failed: ${error instanceof Error ? error.message : String(error)}`); }
    finally { setBusy(false); }
  }
  return <div className="settings-backups">
    <div className="settings-section-heading"><h3>Backups & storage</h3><p>Download a portable copy, restore saved records, or recover an automatic snapshot.</p></div>
    <div className="settings-backup-actions">
      <article><Download size={21}/><h4>Download your data</h4><p>Export exams, mocks, tasks, goals, and saved focus sessions as JSON.</p><button className="primary" disabled={busy} type="button" onClick={async () => { try { await exportBackup(); setMessage('Backup download started.'); } catch (error) { setMessage(`Export failed: ${String(error)}`); } }}><Download size={15}/> Export JSON</button></article>
      <article><Upload size={21}/><h4>Restore a backup</h4><p>Restore records from a JSON backup. Older backups keep your current study records.</p><label className={`secondary settings-file-button${busy ? ' is-busy' : ''}`}><Upload size={15}/>{busy ? 'Restoring…' : 'Choose backup JSON'}<input aria-label="Restore backup JSON" disabled={busy} type="file" accept=".json,application/json" onChange={event => void restore(event)}/></label></article>
    </div>
    {message && <p className="settings-feedback" role="status">{message}</p>}
    <AutoBackupPanel onRestored={onRestored}/>
    <StorageDiagnostics/>
  </div>;
}
