# Emiliano Health Dashboard

Un dashboard personal de salud y fitness construido con React + Vite + Tailwind CSS.

## Features

- 🚴 **Strava OAuth Integration** - Connect your Strava account to automatically sync activities
- 🗺️ **Route Visualization** - View activity routes on interactive maps with Leaflet
- 📊 **Activity Tracking** - Display distance, time, and type for your workouts
- 📈 **Progress Charts** - Visualize body composition and workout data with Recharts
- 🎨 **Modern Dark UI** - Athletic design with Lucide icons and performance-focused typography
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **UI Icons**: Lucide React
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **Routing**: React Router DOM
- **File Parsing**: fit-file-parser (FIT files), pdf-parse (InBody PDFs)
- **Strava Integration**: OAuth 2.0 with @mapbox/polyline decoder

## Installation

```bash
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_CLIENT_SECRET=your_client_secret
VITE_STRAVA_REDIRECT_URI=http://localhost:5173/callback
```

## Project Structure

```
emiliano-health-dashboard/
├── src/
│   ├── components/
│   │   ├── MapComponent.jsx
│   │   └── ProgressChart.jsx
│   ├── hooks/
│   │   └── useStrava.js
│   ├── pages/
│   │   └── Callback.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── config.js
├── .env (not committed)
├── vercel.json
├── tailwind.config.js
└── package.json
```

## Usage

1. **Connect Strava**: Click "Conectar Strava" in the sidebar
2. **View Activities**: Your last 5 activities appear automatically
3. **Explore Routes**: Click any activity to see its route on the map
4. **Upload Files**: Upload GPX routes or InBody PDF reports manually
5. **Track Progress**: Monitor body composition and workout trends

## Deploy to Vercel

1. **Push to GitHub** (never commit `.env` file!)
2. **Connect repo** in [vercel.com](https://vercel.com)
3. **Add Environment Variables** in Vercel dashboard:
   ```
   VITE_STRAVA_CLIENT_ID=233519
   VITE_STRAVA_CLIENT_SECRET=your_secret_here
   VITE_STRAVA_REDIRECT_URI=https://your-app.vercel.app/callback
   ```
4. **Update Strava API Settings**:
   - Go to [strava.com/settings/api](https://www.strava.com/settings/api)
   - Set **Authorization Callback Domain** to: `your-app.vercel.app`
5. **Deploy!** 🚀

The `vercel.json` config ensures React Router works correctly on Vercel.

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

MIT