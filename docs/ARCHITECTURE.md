# Project architecture

## Responsibilities

- `app/` connects persisted UI preferences, database loading, layout, and lazy pages.
  Keep form drafts and filters out of the app shell so typing does not rerender
  unrelated pages. `navigation.ts` owns view names and navigation icons.
- `features/` owns user-facing functionality. A feature may import shared components
  and data modules. Keep its specific helpers beside its components.
- `components/` contains reusable UI with no knowledge of a particular page.
  `ModalPortal` mounts overlays directly under `.app`, preserving theme inheritance
  while escaping backdrop-filter containing blocks inside cards. It also locks
  background scrolling, traps keyboard focus, and restores focus when closed.
- `data/types.ts` describes stored records. `data/db.ts` owns the existing Dexie
  schema and JSON backup operations; `data/autoBackup.ts` owns the separate vault.
  Types are re-exported by `db.ts` for feature imports. Changing directories must
  never change database names or schema versions.
- `styles/` owns appearance. `style.css` is the ordered import entry point.
  Historical refinements retain their priority; see its README for the CSS map.

## Data flow

`useWorkspaceData` reads records and exposes a stable `reload` callback. Successful
mutations call `reload`, refreshing records and scheduling a backup. The UI store
holds only navigation, selected exam, theme, and sidebar preferences. Feature-local
React state holds filters, modal selection, and unsaved drafts.

Backups wait briefly after a successful load, then use `requestIdleCallback` with a
bounded timeout (or a timer fallback). A hidden-tab listener also requests a save.
The vault still deduplicates snapshots and never replaces saved data with an empty
workspace. Unchanged workspaces are no longer serialized every twenty seconds.

## Pages and code loading

`App.tsx` lazy-loads all seven pages inside a Suspense boundary. Heavy chart code and
mock editors are separate from the entry shell. `AppErrorBoundary` remains around
the complete app to offer recovery if a page fails to load or render.

Mock history filtering and sorting are pure functions in `features/mocks/history.ts`.
Their results are memoized in `HistoryPage.tsx`; only 50 matching rows render per
page. Search and filters always operate on all records, then pagination slices the
result. Changing a filter returns to the first page; deletion clamps the current
page to the remaining results.

## Scroll performance rules

Glass is primarily translucent color, the app's ambient gradients, a thin border,
and an inset highlight. Avoid `backdrop-filter` on scrolling cards: each live blur
adds compositing work. Only the stationary desktop sidebar has a small blur. Mobile
surfaces do not use it. Avoid blanket `will-change`, forced GPU layers, or filters
on chart rings. Recharts series disable entrance animations to avoid repeated chart
animation work when pages or filters change.

The main column owns desktop scrolling; the document scrolls on narrow screens.
Dialogs own their internal scroll and are bounded by the dynamic viewport height.
Do not move dialog overlays back inside cards or apply transforms/filters to `.app`.

## Validation

Run `npm.cmd run check` after edits. Tests cover local module paths (including lazy
imports), database identity, backup entry points, style imports, and history filter
behavior. TypeScript and Vite validate the complete graph and generate the PWA.

For browser checks, use disposable data in an isolated profile. Check all seven pages,
both themes, desktop and mobile dialogs, focus restoration, history pagination and
search with more than 100 mocks, and saved edits. Compare scroll performance on the
same browser and viewport; frame timings depend on hardware and other running work.

## Study Planner data and timer

The study feature owns date-based tasks, time goals, timer state, and study totals.
Database version 3 adds studyTasks, studyGoals, focusSessions, and focusTimers without
altering the existing stores. Export and automatic snapshots share a consistent
readBackupRecords transaction. New backups include study records; legacy backups
restore the original stores and keep study records intact.

FocusTimerController remains mounted across page changes. Its Zustand store only
updates timer subscribers each second; the app and task list do not rerender on
timer ticks. The persisted timer stores closed active intervals and the timestamp
of the current running interval. Completion is based on timestamps, so throttled
background callbacks do not extend the intended period. Pauses are excluded and
overdue sessions cap at their planned duration. Completion writes the session and
removes the active timer in one transaction, with a unique token preventing double
logging. Breaks never write focus sessions.

studyMath.ts splits active intervals at local date boundaries. The page shows
daily saved focus time, task completion, rolling seven-day totals, and lifetime
hours. Timer state is restored locally, but active timers are not imported/exported.

## Appearance and workflow modules

- app/appearance.ts validates preferences and derives contrast-aware text/accent
  colors. appearanceStore.ts persists preferences and named presets. useResolvedTheme
  follows OS preference changes in System mode. UI theme mode retains the original
  preference key; the app root owns resolved classes, color tokens, and density/glass
  attributes, including portaled dialogs. Scrolling cards remain filter-free.
- analytics/subjectColors.ts maps subject names to stable theme-aware color tokens,
  independent of UI accents and chart ordering. Semantic status colors are separate.
- analytics/practiceModel.ts computes recent full-mock trends and scored-subject
  priorities. DashboardPriorities presents them and can create date-based tasks.
  Qualifying sections are excluded from scored practice priorities. Target gaps
  require matching scored maxima; trends normalize scores to percentage points.
- MockForm keeps draft recovery and remembers successful providers per exam.
  HistoryPage owns live search, subject/provider filters, sorting, and pagination.
  Saved-filter controls, local table-density overrides, comparison, and setup reuse
  have been removed from the UI and their dedicated modules have been retired.

The new workflow features require no further database migration. Existing exam,
mock, study and backup records remain in the version 3 schema.

## Settings organization

navigationItems in app/navigation.ts owns the view/icon/group order together.
Sidebar renders directly from that list; it has no brand header or workspace label.

SettingsPage uses the UI store's settingsSection to select four tab panels. All
panels stay mounted while switching tabs, preserving unfinished form state. Native
hidden panels are excluded from focus navigation, and the tab list supports arrow,
Home, and End keys. Dashboard target links and first-exam actions select the Exams
section before navigating to Settings. BackupSettings owns export/restore feedback;
StorageDiagnostics keeps advanced record/storage checks separate from appearance
and exam configuration.

## Detailed metrics

AnalyticsPage owns provider selection and per-exam disclosure preference.
DetailedMetrics owns type/subject, dates, recent-record window and tab state.
metricsModel projects one consistently filtered dataset before any summaries,
charts, percentiles or insights are calculated. Full answer totals use scored
sections; subject projections explicitly clear inherited full-mock time/percentile
and nested sections. Missing times/denominators stay unavailable. SubjectAnalytics
accepts a view prop so only the active subject/trend/breakdown panel is mounted.
Trends exclude unattempted records from accuracy means and retain zero/negative
score values in the axis domain. Tests cover projection, qualifying rules, temporal
filters, record windows, missing metrics and input immutability.
