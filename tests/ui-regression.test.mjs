import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

function file(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function exists(path) {
  return existsSync(resolve(root, path));
}

function stylesheet() {
  const entry = readFileSync(resolve(root, 'src/style.css'), 'utf8');
  return entry.replace(/@import "(.+?)";/g, (_, path) =>
    readFileSync(resolve(root, 'src', path), 'utf8'));
}

// 1. Vite entry point
test("Vite entry point is valid", () => {
  assert.ok(exists("index.html"));
  assert.ok(exists("src/main.tsx"));

  assert.match(file("index.html"), /src\/main\.tsx/);
});

// 2. Essential application components
test("Essential components exist", () => {
  const components = [
    "features/analytics/AnalyticsPage.tsx",
    "features/mocks/MockDetail.tsx",
    "features/countdown/CountdownBoard.tsx",
    "features/playlists/PlaylistBoard.tsx",
    "features/exams/ExamManager.tsx",
    "features/analytics/TargetPlanner.tsx",
    "features/analytics/SubjectTargets.tsx",
  ];

  for (const component of components) {
    assert.ok(exists(`src/${component}`), `Missing component: ${component}`);
  }
});

// 3. UI stylesheet
test("UI stylesheet exists and contains essential styles", () => {
  const css = stylesheet();

  assert.ok(css.length > 1000);

  const selectors = [
    ".app",
    ".sidebar",
    ".panel",
    ".v21-countdown",
    ".aa-recovery",
  ];

  for (const selector of selectors) {
    assert.ok(css.includes(selector), `Missing CSS selector: ${selector}`);
  }
});

// 4. Database integrity
test("Database configuration is preserved", () => {
  const db = file("src/data/db.ts");

  assert.ok(
    db.includes("advance_analyzer_v2_clean_phase5a"),
    "Database name changed unexpectedly",
  );
});

// 5. Backup and restore functionality
test("Backup functions exist", () => {
  const db = file("src/data/db.ts");

  assert.match(db, /exportBackup/);
  assert.match(db, /importBackup/);
});

// 6. Error recovery
test("React Error Boundary is installed", () => {
  const main = file("src/main.tsx") + file("src/components/AppErrorBoundary.tsx");

  assert.match(main, /AppErrorBoundary/);
  assert.match(main, /getDerivedStateFromError/);
});

// 7. PWA configuration
test("PWA configuration exists", () => {
  assert.ok(exists("vite.config.ts"));

  const config = file("vite.config.ts");

  assert.match(config, /VitePWA/);
});

// 8. Application manifest icons
test("PWA icons exist", () => {
  assert.ok(exists("public/icons/icon-192.png"));
  assert.ok(exists("public/icons/icon-512.png"));
});

// 9. UI polish styling
test("UI polish styling is present", () => {
  const css = stylesheet();

  assert.match(css, /UI POLISH/i);
  assert.match(css, /prefers-reduced-motion/);
});

// 10. Countdown urgency styling
test("Countdown urgency colors are defined", () => {
  const css = stylesheet();

  for (const level of ["urgent", "near", "soon", "far"]) {
    assert.ok(
      css.includes(`v21-urgency-${level}`),
      `Missing urgency style: ${level}`,
    );
  }
});
