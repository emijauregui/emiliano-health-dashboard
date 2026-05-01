# OpenCode Agent Instructions

## Development Commands
- `npm run dev`: Vite dev server at http://localhost:5173
- `npm run build`: Production build
- `npm run lint`: ESLint (runs on all .js/.jsx files)

## Key Technologies
- React 19 + Vite + Tailwind CSS v4
- Uses Space Grotesk Google Font (inline import)
- Map: react-leaflet with CartoDB dark basemap
- Charts: recharts
- File parsing: GPX client-side, PDF-parse for InBody (simulated)

## Configuration Notes
- Tailwind v4 with PostCSS config (postcss.config.cjs)
- ESLint: React hooks + refresh plugins
- Vite: Standard React plugin, no special config
- All styling inline in App.jsx (no component separation yet)

## Project Status
- Single App.jsx component (677+ lines)
- No component separation or routing
- File uploads: GPX parsing works, PDF is simulated
- Dark theme enforced via inline styles
- No tests configured

## Important Gotchas
- Image assets in src/assets/
- Leaflet CSS imported in App.jsx
- Font imports inline via style tag
- All state management in App.jsx
- InBody PDF parsing is currently simulated