# v2.1 UI Polish — Pass 1

- Preserved all original page CSS, component logic, and storage.
- Added consistent spacing, radii, surface elevation, typography, keyboard focus states, button states, compact sidebar/header, mobile density and reduced-motion support.
- Fixed an inaccurate smoke-test assumption: TargetPlanner and SubjectTargets are correctly imported through AnalyticsPlus rather than directly through main.tsx.
- Source smoke tests: 6/6 pass using Node 22.
- Browser screenshots and production Vite build have not been verified in this environment.

## Install
Replace your test project with this complete package (keep your existing project as backup), then run:
`npm.cmd install`
`npm.cmd run check`
`npm.cmd run dev`

If anything looks cramped on a particular page, share a screenshot so the next polish pass can target that page precisely.
