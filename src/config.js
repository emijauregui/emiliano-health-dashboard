// Set these in .env locally or in Vercel Environment Variables for production
export const config = {
  stravaClientId: import.meta.env.VITE_STRAVA_CLIENT_ID,
  stravaClientSecret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
  stravaRedirectUri: import.meta.env.VITE_STRAVA_REDIRECT_URI || 'http://localhost:5173/callback',
}
