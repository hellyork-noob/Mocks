# Mock Analyzer

A React + TypeScript dashboard for mock exam analytics, exam countdowns, study
playlists, and local backups. Vite builds the app and its offline PWA shell.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

```powershell
npm.cmd run check   # automated tests, TypeScript, production and PWA build
npm.cmd run preview # preview the production build
```

## Where to edit

| Change | Location |
| --- | --- |
| Application layout and page loading | `src/app/App.tsx` |
| Sidebar, selected exam, and theme controls | `src/app/Sidebar.tsx`, `src/app/WorkspaceControls.tsx` |
| Navigation and saved UI preferences | `src/app/navigation.ts`, `src/app/uiStore.ts` |
| Data loading and automatic backup scheduling | `src/app/useWorkspaceData.ts`, `src/app/useAutomaticBackup.ts` |
| Charts and performance analytics | `src/features/analytics/` |
| Mock entry, editing, history, and analysis | `src/features/mocks/` |
| Exam configurations | `src/features/exams/` |
| Countdown cards and their actions | `src/features/countdown/` |
| Playlist library and video synchronization | `src/features/playlists/` |
| Daily tasks, study goals, and focus timer | `src/features/study/` |
| Settings, API key, and backup controls | `src/features/settings/` |
| Shared dialogs and empty/error states | `src/components/` |
| Stored types, database, and backup vault | `src/data/` |
| Colors, transparency, and glass highlights | `src/styles/theme.css` |
| Dialog positioning and scrolling | `src/styles/dialogs.css` |
| Scroll performance and pagination styles | `src/styles/performance.css` |

`src/main.tsx` only mounts the app and imports the stylesheet. Pages load on demand.
See [the architecture guide](docs/ARCHITECTURE.md) and
[the stylesheet guide](src/styles/README.md) before moving modules or CSS rules.

## Local data

Records remain in the existing `advance_analyzer_v2_clean_phase5a` IndexedDB
storage. The backup vault remains `advance_analyzer_v2_backup_vault`. The refactor
preserves existing records and saved preference keys. Backups are scheduled after
loading or saving records, during browser idle time, and when the tab is hidden.
Export JSON backups regularly; browser storage is specific to the browser profile
and site origin. Use a separate browser profile for disposable test data.

## Study Planner

Plan tasks by date with time estimates, priorities, and completion status. Set a
daily study-time goal and use the focus timer to record study periods. Pause,
resume, or finish early to save the time studied; breaks are excluded. The timer
continues across page changes and reloads, with a compact indicator on other pages.
Daily, rolling seven-day, and lifetime totals use saved focus sessions.

Database version 3 adds tasks, goals, saved sessions, and a persisted active timer
without replacing existing exam records. JSON and automatic backups include tasks,
goals, and saved sessions. Older backups retain current study records when restored.
The active timer stays local and is not included in backup files.

## Appearance and daily workflow

Open Settings > Appearance > Make it yours to choose Light, Dark, or System mode, an accent
preset or custom color, primary text colors, glass intensity, and interface density.
Changes preview immediately. Save named appearances or reset to charcoal and blue.
Custom colors are adjusted for readable contrast. Surfaces remain neutral instead
of taking on the accent color. Appearance preferences stay in this
browser; they are separate from record backups.

Analytics starts with the next saved exam, the selected exam's latest full-mock
target gap, recent full-mock progress, and subject practice priorities. A target gap
is shown only when the saved maximum matches the current scored exam maximum.
Practice suggestions use up to five recent entries per scored subject and need at
least two entries. Add a suggestion directly to today's Study Planner tasks.
Detailed metrics open by default below the dashboard and remember your expand/collapse
choice per exam. Use the Detailed metrics shortcut to jump directly to them.

Add Mock remembers the last successfully saved provider per exam and restores
unfinished drafts. Mock History keeps search, subject/provider filters, sorting,
pagination, and the existing view/edit/delete actions. Its spacing follows the
workspace appearance density.

## Navigation and Settings sections

The sidebar starts directly with navigation: Analytics, Study Planner, Add Mock,
Mock History, Exam Countdown, Study Playlist, then Settings. The selected exam and
appearance shortcut remain above the collapse control at the bottom.

Settings is organized into Appearance, Exams & targets, Backups & storage, and
Connections tabs. Tabs keep their contents mounted so unfinished entries survive
section changes. Exam-target shortcuts open the Exams & targets section directly.
Backup export/restore, automatic snapshots, and optional storage diagnostics are
kept together; diagnostics include saved tasks, goals, and focus sessions.

## Detailed performance metrics

The metrics workspace separates Overview, Subjects, Trends, Section breakdown,
Time & percentile, and Insights. Provider, test type, optional date range, and the
latest-record window apply consistently across panels. Subject mode includes saved
sectionals and matching subject results extracted from full mocks. Section breakdown
is available for full mocks. Reset filters recovers the complete selection.

Full-mock answer counts exclude qualifying sections. Subject views use recorded
subject time only; missing section times and whole-mock percentiles are not carried
over to subject results. Accuracy is unavailable when no questions were attempted.
Overview accuracy and attempt rate use weighted question totals. Trends offer an
exact-values table and readable axes; section tables scroll within their card with
the subject column pinned. Only the active tab's charts mount to avoid hidden-chart
layout issues and unnecessary rendering work.
