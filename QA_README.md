# Advance Analyzer v2.1 — Phase 6 QA

This package adds a dependency-free smoke test suite for source completeness, PWA icons, critical CSS selectors, app error recovery, and data-field compatibility.

## Windows commands
```powershell
npm.cmd run test:smoke
npm.cmd install
npm.cmd run build
npm.cmd run dev
```
After npm install, `npm.cmd run check` runs smoke tests and production build.

## Manual browser checks
1. Open app with fresh test data (separate browser profile recommended).
2. Create a custom exam and subject targets; confirm sum >= overall target is allowed.
3. Add two providers and save two mocks; verify all Analytics KPIs and charts filter by provider.
4. Add a sectional mock with time; verify speed and percentile.
5. Edit a mock, open View Analysis, refresh and confirm persistence.
6. Add/edit/delete countdowns; verify responsive top-card layout.
7. Add playlist and verify completion.
8. Export JSON and import into a separate test browser profile.
9. Test offline PWA startup and light/dark themes.

Smoke tests are source-integrity checks, not browser functional tests. npm dependencies were not available offline in the preparation environment; a complete production build and browser test are still needed.

Existing database name is retained. No automatic reset or deletion occurs.
