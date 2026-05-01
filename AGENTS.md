# OpenCode Agent Instructions

## Development Commands
- `npm run dev`: Vite dev server at http://localhost:5173
- `npm run build`: Production build
- `npm run lint`: ESLint (runs on all .js/.jsx files)

## Key Technologies
- React 19 + Vite + Tailwind CSS v4
- Uses Barlow Condensed/Rajdhani/Inter Google Fonts (inline import)
- Map: react-leaflet with CartoDB dark basemap
- Charts: recharts
- File parsing: GPX client-side, pdf-parse for InBody PDFs
- Strava OAuth integration with @mapbox/polyline decoder
- Supabase for backend/data persistence

## Configuration Notes
- Tailwind v4 with PostCSS config (postcss.config.cjs)
- ESLint: React hooks + refresh plugins
- Vite: Standard React plugin, no special config
- Environment variables: VITE_STRAVA_CLIENT_ID, VITE_STRAVA_CLIENT_SECRET, VITE_STRAVA_REDIRECT_URI

## Project Structure
- Single App.jsx component (1500+ lines)
- Custom hooks: useStrava.js, useSupabase.js
- Client-side GPX parsing with DOMParser
- InBody PDF parsing simulated (needs real pdf-parse implementation)
- Supabase integration for data persistence/storage

## Important Gotchas
- All styling inline in App.jsx (no component separation yet)
- Leaflet CSS imported in App.jsx
- Font imports inline via style tag
- All state management in App.jsx
- Strava tokens stored in localStorage with auto-refresh logic
- PDF parsing currently simulated (not using real pdf-parse)
- Supabase storage buckets needed: gpx-files, inbody-pdfs
- Requires Supabase environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY