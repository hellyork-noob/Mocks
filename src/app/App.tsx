import { lazy, Suspense, useEffect, type CSSProperties } from "react";
import { useUI } from "./uiStore";
import { useWorkspaceData } from "./useWorkspaceData";
import Sidebar from "./Sidebar";
import { useAppearance } from "./appearanceStore";
import { appearanceColors } from "./appearance";
import { useResolvedTheme } from "./useResolvedTheme";
import FocusTimerController from "../features/study/FocusTimerController";
import FocusTimerIndicator from "../features/study/FocusTimerIndicator";
const StudyPlannerPage = lazy(() => import("../features/study/StudyPlannerPage"));
const AnalyticsPage = lazy(() => import('../features/analytics/AnalyticsPage'));
const MockForm = lazy(() => import('../features/mocks/MockForm'));
const HistoryPage = lazy(() => import('../features/mocks/HistoryPage'));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const CountdownBoard = lazy(() => import('../features/countdown/CountdownBoard').then(module => ({ default: module.CountdownBoard })));
const PlaylistBoard = lazy(() => import('../features/playlists/PlaylistBoard').then(module => ({ default: module.PlaylistBoard })));
export default function App() {
    const { view, theme, compact, setView, exam, setExam, setSettingsSection, } = useUI();
    const { mocks, exams, playlists, customProfiles, tasks, goals, sessions, reload, dbReady, dbError } = useWorkspaceData();
    useEffect(() => {
        if (!dbReady)
            return;
        if (customProfiles.length && !customProfiles.some((p) => p.key === exam))
            setExam(customProfiles[0].key);
        else if (!customProfiles.length && exam)
            setExam("");
    }, [customProfiles, exam, setExam, dbReady]);
    const resolvedTheme = useResolvedTheme(theme);
    const preferences = useAppearance(state => state.preferences);
    const colors = appearanceColors(preferences, resolvedTheme);
    const appearanceStyle = { "--accent": colors.accent, "--on-accent": colors.onAccent, "--text": colors.text, "--accentbg": `${colors.accent}1c`, "--ui-focus": `${colors.accent}40` } as CSSProperties;
    const availableExams = customProfiles.map((p) => p.key);
    return (<div className={"app " + resolvedTheme + (compact ? " compact" : "")} data-glass={preferences.glass} data-density={preferences.density} style={appearanceStyle}>
      {dbError && (<div role="alert" style={{
                position: "fixed",
                top: 12,
                left: "20%",
                right: 12,
                zIndex: 9999,
                padding: 16,
                background: "#7f1d1d",
                color: "white",
                borderRadius: 10,
            }}>
          Database could not be loaded: {dbError}. Do not add new records. Check
          browser storage and your backup.
        </div>)}
      {!dbReady && !dbError && (<div role="status" style={{
                position: "fixed",
                top: 12,
                right: 12,
                zIndex: 9999,
                padding: 10,
                background: "#1e293b",
                color: "white",
                borderRadius: 8,
            }}>
          Loading saved records…
        </div>)}
      <FocusTimerController onSaved={reload}/>
      <FocusTimerIndicator/>
      <Sidebar availableExams={availableExams}/>
      <main aria-label={view}>
        <section className="content">
    <Suspense fallback={<div className="panel" role="status">Loading page?</div>}>
          {view === "Analytics" &&
            (exam ? (<AnalyticsPage onChange={reload} mocks={mocks} exams={exams} exam={exam} profile={customProfiles.find((p) => p.key === exam)} onAdd={() => setView("Add Mock")}/>) : (<div className="panel p5-empty-start">
                <h3>No exams configured</h3>
                <p>
                  Create your first exam and tier in Settings to begin analyzing
                  mocks.
                </p>
                <button className="primary" onClick={() => { setSettingsSection("exams"); setView("Settings"); }}>
                  Create an exam
                </button>
              </div>))}
          {view === "Add Mock" &&
            (exam ? (<>
                <MockForm key={exam} exam={exam} custom={customProfiles.find((p) => p.key === exam)} onSave={reload} onDone={() => setView("Mock History")}/>
              </>) : (<div className="panel p5-empty-start">
                <h3>Create an exam first</h3>
                <p>
                  Configure sections, questions, marking and duration in
                  Settings.
                </p>
                <button className="primary" onClick={() => setView("Settings")}>
                  Create an exam
                </button>
              </div>))}{" "}
          {view === "Mock History" && (<HistoryPage mocks={mocks} exam={exam} customProfiles={customProfiles} reload={reload}/>)}
          {view === "Exam Countdown" && (<CountdownBoard exams={exams} onChange={reload}/>)}{" "}
          {view === "Study Playlist" && (<PlaylistBoard playlists={playlists} onChange={reload}/>)}
          {view === "Study Planner" && <StudyPlannerPage tasks={tasks} goals={goals} sessions={sessions} onChange={reload}/>}
          {view === "Settings" && (<SettingsPage mocks={mocks} customProfiles={customProfiles} reload={reload}/>)}
    </Suspense>
        </section>
      </main>
    </div>);
}
