import { useState, useEffect } from 'react'

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const STRAVA_API_URL = 'https://www.strava.com/api/v3'

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'strava_access_token',
  REFRESH_TOKEN: 'strava_refresh_token',
  EXPIRES_AT: 'strava_expires_at'
}

export const useStrava = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is already connected
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (accessToken) {
      setIsConnected(true)
    }
  }, [])

  const stravaAuthUrl = () => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID
    const redirectUri = import.meta.env.VITE_STRAVA_REDIRECT_URI
    const scope = 'read,activity:read_all'

    return `${STRAVA_AUTH_URL}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`
  }

  const exchangeToken = async (code) => {
    try {
      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
          client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to exchange token')
      }

      const data = await response.json()

      // Store tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, data.expires_at)

      setIsConnected(true)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
          client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()

      // Update tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token)
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, data.expires_at)

      return data.access_token
    } catch (err) {
      // If refresh fails, clear tokens and disconnect
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
      setIsConnected(false)
      throw err
    }
  }

  const getValidAccessToken = async () => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    const expiresAt = parseInt(localStorage.getItem(STORAGE_KEYS.EXPIRES_AT))
    const now = Math.floor(Date.now() / 1000)

    // If token is expired or about to expire (within 5 minutes), refresh it
    if (!accessToken || expiresAt - now < 300) {
      return await refreshAccessToken()
    }

    return accessToken
  }

  const getActivities = async (limit = 30) => {
    setLoading(true)
    setError(null)

    try {
      const accessToken = await getValidAccessToken()

      const response = await fetch(
        `${STRAVA_API_URL}/athlete/activities?per_page=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }

      const data = await response.json()
      setActivities(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT)
    setIsConnected(false)
    setActivities([])
  }

  return {
    isConnected,
    activities,
    loading,
    error,
    stravaAuthUrl,
    exchangeToken,
    getActivities,
    disconnect
  }
}
